"""Escalation services — deterministic alerting, and the entry to the projection spine.

Flow:
    observations → personal baseline deviation (cognition) →
    persistence count → alert eligibility (cognition.change) → Alert row →
    ChangeSignal → ContextualisedStatement (behaviour) →
    Firewall.project → RoleProjection → Safety Gateway → delivery class.

The caregiver card is no longer written here. It is one `RoleProjection` among
four, produced by `app/projection/` from the same evidence the CHW and clinician
views are built from — which is the only way the four can be guaranteed not to
contradict each other (invariant 12). This module's job is to get from stored
observations to a `ChangeSignal`; everything downstream is shared.

No LLM anywhere in this path.
"""

from __future__ import annotations

from datetime import UTC, datetime, timedelta

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.behaviour import ChangeKind, ChangeSignal, ContextSignals, contextualise
from app.behaviour.models import ContextualisedStatement
from app.cognition.baseline import MIN_WINDOW_SIZE
from app.cognition.change import (
    ALERT_THRESHOLDS,
    DomainDeviation,
    check_alert_eligibility,
)
from app.cognition.mq import Q_MIN
from app.firewall.models import Actor, ConsentState, RequestContext
from app.firewall.roles import Action, EscalationLevel, Purpose, Role
from app.observation.service import (
    compute_domain_deviation,
    deviation_series,
    load_window,
)
from app.projection import RoleRequest, project_for_role

from .db import AlertORM
from .models import Alert, CardFact, CardHypothesis, CaregiverCard

_L2_TAU = ALERT_THRESHOLDS[EscalationLevel.L2]  # 1.5 — the "below baseline" threshold


def _utcnow() -> datetime:
    return datetime.now(UTC)


def _as_utc(dt: datetime) -> datetime:
    return dt if dt.tzinfo is not None else dt.replace(tzinfo=UTC)


def _to_alert(row: AlertORM) -> Alert:
    return Alert(
        alert_id=str(row.alert_id),
        person_id=row.person_id,
        domain=row.domain,
        level=row.level,
        z=row.z,
        persistence_days=row.persistence_days,
        reason_codes=tuple(row.reason_codes),
        status=row.status,
        feedback=row.feedback,
        created_at=_as_utc(row.created_at),
    )


async def _recent_open_alert(
    session: AsyncSession, person_id: str, domain: str, now: datetime
) -> AlertORM | None:
    cutoff = now - timedelta(days=7)
    rows = (
        await session.execute(
            select(AlertORM).where(
                AlertORM.person_id == person_id,
                AlertORM.domain == domain,
            )
        )
    ).scalars().all()
    recent = [r for r in rows if _as_utc(r.created_at) >= cutoff]
    return max(recent, key=lambda r: _as_utc(r.created_at)) if recent else None


async def evaluate_person(
    session: AsyncSession,
    person_id: str,
    domain: str = "memory",
    now: datetime | None = None,
) -> Alert | None:
    """Evaluate one domain and create an Alert if eligibility holds.

    Returns the created Alert, an existing recent alert (no duplicate), or None
    when nothing is eligible.
    """
    now = now or _utcnow()
    window = await load_window(session, person_id, domain)
    quality_gated = [o for o in window if o.quality >= Q_MIN]
    if len(quality_gated) < MIN_WINDOW_SIZE:
        return None

    latest_dev = await compute_domain_deviation(session, person_id, domain, now=now)
    if latest_dev.gate != "scored" or latest_dev.z is None:
        return None

    # Persistence: trailing run of recent observations below the personal baseline.
    series = await deviation_series(session, person_id, domain, now=now)
    persistence = 0
    for _, z in series:
        if z is not None and z <= -_L2_TAU:
            persistence += 1
        else:
            break

    existing = await _recent_open_alert(session, person_id, domain, now)

    latest_q = max(window, key=lambda o: o.observed_at).quality
    dd = DomainDeviation(domain=domain, z=latest_dev.z, q=latest_q, weight=1.0)
    result = check_alert_eligibility(
        deviations=[dd],
        persistence_days=persistence,
        recently_alerted=existing is not None,
        actionable=True,
    )

    if not result.eligible or result.suggested_level is None:
        return _to_alert(existing) if existing else None

    if existing is not None:
        return _to_alert(existing)

    row = AlertORM(
        person_id=person_id,
        domain=domain,
        level=result.suggested_level.value,
        z=latest_dev.z,
        persistence_days=persistence,
        reason_codes=list(result.reason_codes) or ["deviation_persistent"],
        status="open",
    )
    session.add(row)
    await session.flush()
    return _to_alert(row)


async def build_change_signal(
    session: AsyncSession,
    person_id: str,
    domain: str = "memory",
    now: datetime | None = None,
) -> ChangeSignal:
    """Turn stored observations into artefact #6 — the typed change conclusion.

    Four outcomes, three of which are terminal and all of which are equally
    valid results (invariant 14):

        INSUFFICIENT_DATA  the quality gate could not be cleared. Never a
                           cognitive signal; at most a measurement action.
        NO_CHANGE          within her own range. Stored, nobody interrupted.
        MEANINGFUL_CHANGE  a persistent deviation with an open alert.
        SUPPORT_NEED       (reserved for the assistance-policy path)

    Note the ordering: quality is checked before deviation, so a low-quality
    window can never be reported as a change no matter how large its z.
    """
    now = now or _utcnow()
    window = await load_window(session, person_id, domain)
    quality_gated = [o for o in window if o.quality >= Q_MIN]

    if len(quality_gated) < MIN_WINDOW_SIZE:
        return ChangeSignal(
            kind=ChangeKind.INSUFFICIENT_DATA,
            person_id=person_id,
            domain=domain,
            reason_codes=(
                f"insufficient_quality_gated:{len(quality_gated)}_of_{MIN_WINDOW_SIZE}",
            ),
        )

    deviation = await compute_domain_deviation(session, person_id, domain, now=now)
    if deviation.gate != "scored" or deviation.z is None:
        return ChangeSignal(
            kind=ChangeKind.INSUFFICIENT_DATA,
            person_id=person_id,
            domain=domain,
            reason_codes=(deviation.reason,),
        )

    alert = await _recent_open_alert(session, person_id, domain, now)
    if alert is None:
        return ChangeSignal(
            kind=ChangeKind.NO_CHANGE,
            person_id=person_id,
            domain=domain,
            z=deviation.z,
            quality=max(window, key=lambda o: o.observed_at).quality,
            reason_codes=("within_personal_range",),
        )

    return ChangeSignal(
        kind=ChangeKind.MEANINGFUL_CHANGE,
        person_id=person_id,
        domain=domain,
        z=alert.z,
        persistence_days=alert.persistence_days,
        quality=max(window, key=lambda o: o.observed_at).quality,
        escalation_level=EscalationLevel(alert.level),
        reason_codes=tuple(alert.reason_codes or ()),
    )


async def build_context_signals(
    session: AsyncSession,
    person_id: str,
    domain: str = "memory",
    reported: ContextSignals | None = None,
) -> ContextSignals:
    """Fill the measurement-side context from telemetry; keep human reports intact.

    Only the measurement fields are derivable from stored data. Sleep, pain,
    hearing-aid use and the rest come from a human — a caregiver note or a CHW
    visit record — and are passed in as `reported`. The system never infers a
    reversible cause it was not told about; an unreported cause surfaces as an
    open question instead, which is the honest representation.
    """
    window = await load_window(session, person_id, domain)
    if not window:
        return reported or ContextSignals()

    total = len(window)
    low_quality = sum(1 for o in window if o.quality < Q_MIN)
    updates = {
        "low_quality_share": low_quality / total,
        "sessions_considered": total,
    }
    return (reported or ContextSignals()).model_copy(update=updates)


async def build_statement(
    session: AsyncSession,
    person_id: str,
    domain: str = "memory",
    now: datetime | None = None,
    reported: ContextSignals | None = None,
) -> ContextualisedStatement:
    """observations → ChangeSignal → ContextualisedStatement (artefacts #6, #7)."""
    signal = await build_change_signal(session, person_id, domain, now=now)
    context = await build_context_signals(session, person_id, domain, reported=reported)
    return contextualise(signal, context)


async def build_caregiver_card(
    session: AsyncSession,
    person_id: str,
    domain: str = "memory",
    now: datetime | None = None,
    reported: ContextSignals | None = None,
) -> CaregiverCard:
    """The caregiver's view — now one projection among four, not a bespoke card.

    Runs the full spine for the primary caregiver: statement → Firewall.project
    → builder → Safety Gateway → delivery class. If any gate withholds, the card
    comes back with `safety_passed=False` and no detail rather than raw text.
    """
    now = now or _utcnow()
    statement = await build_statement(session, person_id, domain, now=now, reported=reported)

    outcome = project_for_role(
        statement,
        RoleRequest(
            actor=Actor(
                actor_id=f"{person_id}:primary_caregiver",
                role=Role.PRIMARY_CAREGIVER,
                subject_person_id=person_id,
            ),
            context=RequestContext(
                action=Action.READ,
                purpose=Purpose.CARE_COORDINATION,
                consent=ConsentState(granted=True),
            ),
        ),
    )

    if outcome.projection is None:
        withheld = outcome.withheld
        return CaregiverCard(
            person_id=person_id,
            level=None,
            generated_at=now,
            facts=(),
            hypothesis=None,
            actions=("A change was noted; please contact the care team.",),
            what_this_is_not="This is not a diagnosis.",
            safety_passed=withheld is not None and withheld.stage == "no_content",
            measurement_confidence=statement.measurement_confidence,
        )

    projection = outcome.projection
    hypothesis = projection.output.hypotheses[0] if projection.output.hypotheses else None

    return CaregiverCard(
        person_id=person_id,
        level=projection.escalation_level.value if projection.escalation_level else None,
        generated_at=now,
        facts=tuple(
            CardFact(content=f.content, source=f.source, confidence=f.confidence)
            for f in projection.output.facts
        ),
        hypothesis=(
            CardHypothesis(content=hypothesis.content, label=hypothesis.label)
            if hypothesis
            else None
        ),
        actions=tuple(a.content for a in projection.output.actions),
        what_this_is_not=(
            "This is not a diagnosis. The system cannot say her condition is "
            "changing over time — only a clinician can interpret a trend. Sudden "
            "changes are handled separately as urgent."
        ),
        safety_passed=True,
        measurement_confidence=projection.measurement_confidence,
    )


async def get_alert(session: AsyncSession, alert_id: str) -> Alert | None:
    """Fetch one alert by id.

    Exists so a caller can be authorized against the alert's *person* before
    anything is read or written. Without it, an alert id would be a way to reach
    a household you hold no relationship with.
    """
    import uuid as _uuid

    try:
        pk = _uuid.UUID(alert_id)
    except ValueError:
        return None
    row = await session.get(AlertORM, pk)
    return _to_alert(row) if row is not None else None


async def record_feedback(
    session: AsyncSession, alert_id: str, feedback: str
) -> Alert | None:
    import uuid as _uuid

    try:
        pk = _uuid.UUID(alert_id)
    except ValueError:
        return None
    row = await session.get(AlertORM, pk)
    if row is None:
        return None
    row.feedback = feedback
    await session.flush()
    return _to_alert(row)
