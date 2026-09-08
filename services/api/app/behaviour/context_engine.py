"""Clinical Change Context Engine — reversible causes before interpretation.

One pure function, `contextualise()`. It turns a `ChangeSignal` into a
`ContextualisedStatement` by running a fixed triage over observable context
BEFORE any sentence about the change is composed:

    same-day medical causes -> everyday reversible causes -> life context
    -> measurement confounders -> open questions

No LLM participates. The output text is templated from the triage result, so
the set of sentences the engine can produce is closed and testable — which is
what makes the "never progression" guarantee in `models.py` meaningful rather
than aspirational.

The engine deliberately produces the SAME statement regardless of who will
read it. Role differences are responsibility differences (invariant 12); they
are applied downstream in `app/projection/builders.py`, never here.
"""

from __future__ import annotations

from app.firewall.roles import EscalationLevel

from .models import (
    CauseUrgency,
    ChangeKind,
    ChangeSignal,
    Confounder,
    ContextSignals,
    ContextualisedStatement,
    ReversibleCause,
)

ENGINE_VERSION = "context_engine/1"

# Onset inside this window makes an acute medical cause plausible enough to
# check the same day. Matches the delirium rule in app/cognition/change.py.
ACUTE_ONSET_HOURS = 72.0

# A recent medication start is a same-day check inside this window.
NEW_MEDICATION_DAYS = 14


def _same_day_causes(ctx: ContextSignals) -> list[ReversibleCause]:
    """Causes that could be acute and are cheap to rule out today."""
    causes: list[ReversibleCause] = []
    acute_window = ctx.onset_hours is not None and ctx.onset_hours <= ACUTE_ONSET_HOURS

    if ctx.infection_signs:
        causes.append(
            ReversibleCause(
                code="possible_infection",
                urgency=CauseUrgency.SAME_DAY,
                description="Signs of a possible infection were reported.",
                check_action=(
                    "Check temperature and whether passing urine is uncomfortable, "
                    "and contact the CHW or clinic today."
                ),
            )
        )
    if ctx.new_medication_within_days is not None and (
        ctx.new_medication_within_days <= NEW_MEDICATION_DAYS
    ):
        causes.append(
            ReversibleCause(
                code="recent_medication_change",
                urgency=CauseUrgency.SAME_DAY,
                description=(
                    "A medicine was started or changed "
                    f"{ctx.new_medication_within_days} days ago."
                ),
                check_action=(
                    "Mention the new medicine to the clinician or pharmacist. "
                    "Do not change any dose yourself."
                ),
            )
        )
    if ctx.altered_arousal:
        causes.append(
            ReversibleCause(
                code="altered_alertness",
                urgency=CauseUrgency.SAME_DAY,
                description="Alertness was noted to be unusually high or low.",
                check_action="Seek medical assessment today.",
            )
        )
    if ctx.dehydration_signs:
        causes.append(
            ReversibleCause(
                code="possible_dehydration",
                urgency=CauseUrgency.SAME_DAY,
                description="Reduced drinking or dry mouth was reported.",
                check_action="Offer fluids regularly and mention this to the CHW.",
            )
        )
    if acute_window and causes:
        # Onset is recent AND something checkable is present: keep the same-day
        # framing but make the timing explicit for whoever acts on it.
        causes.insert(
            0,
            ReversibleCause(
                code="recent_onset",
                urgency=CauseUrgency.SAME_DAY,
                description=(
                    f"The change was first noticed about {ctx.onset_hours:.0f} hours ago."
                ),
                check_action="Treat a sudden change as needing medical review today.",
            ),
        )
    return causes


def _soon_causes(ctx: ContextSignals) -> list[ReversibleCause]:
    """Everyday, reversible, and very often the real explanation."""
    causes: list[ReversibleCause] = []
    if ctx.sleep_disrupted:
        causes.append(
            ReversibleCause(
                code="sleep_disruption",
                urgency=CauseUrgency.SOON,
                description="Sleep has been disrupted.",
                check_action="Ask how she has been sleeping and keep evenings calm.",
            )
        )
    if ctx.pain_reported:
        causes.append(
            ReversibleCause(
                code="pain",
                urgency=CauseUrgency.SOON,
                description="Discomfort or pain was reported.",
                check_action="Ask whether anything hurts, and mention it at the next visit.",
            )
        )
    if ctx.constipation_reported:
        causes.append(
            ReversibleCause(
                code="constipation",
                urgency=CauseUrgency.SOON,
                description="Bowel discomfort was reported.",
                check_action="Mention this to the CHW; it is common and treatable.",
            )
        )
    if ctx.hearing_aid_unused:
        causes.append(
            ReversibleCause(
                code="hearing_aid_unused",
                urgency=CauseUrgency.SOON,
                description="The hearing aid appears not to have been in use.",
                check_action="Check that the hearing aid is charged and being worn.",
            )
        )
    if ctx.glasses_unused:
        causes.append(
            ReversibleCause(
                code="glasses_unused",
                urgency=CauseUrgency.SOON,
                description="Glasses appear not to have been in use.",
                check_action="Check that her glasses are to hand and clean.",
            )
        )
    return causes


def _routine_causes(ctx: ContextSignals) -> list[ReversibleCause]:
    """Life context. Almost never needs action — but it explains a lot."""
    causes: list[ReversibleCause] = []
    if ctx.routine_disrupted:
        causes.append(
            ReversibleCause(
                code="routine_disruption",
                urgency=CauseUrgency.ROUTINE,
                description="The usual daily routine was interrupted.",
                check_action="No action needed if the routine has already returned to normal.",
            )
        )
    if ctx.bereavement_or_stress:
        causes.append(
            ReversibleCause(
                code="grief_or_stress",
                urgency=CauseUrgency.ROUTINE,
                description="A loss or a stressful event was reported.",
                check_action="Allow time and company; mention it at the next visit.",
            )
        )
    if ctx.new_environment:
        causes.append(
            ReversibleCause(
                code="new_environment",
                urgency=CauseUrgency.ROUTINE,
                description="She has been in an unfamiliar place.",
                check_action="Familiar surroundings and objects usually help.",
            )
        )
    return causes


def _confounders(ctx: ContextSignals) -> list[Confounder]:
    """Reasons the measurement itself is weaker than the numbers suggest."""
    out: list[Confounder] = []
    if ctx.low_quality_share > 0.0:
        out.append(
            Confounder(
                code="reduced_measurement_quality",
                detail=(
                    f"{ctx.low_quality_share:.0%} of the sessions considered were "
                    "recorded under poor conditions and carry less weight."
                ),
            )
        )
    if ctx.language_mismatch_share > 0.0:
        out.append(
            Confounder(
                code="language_mismatch",
                detail=(
                    f"{ctx.language_mismatch_share:.0%} of the sessions were not in her "
                    "preferred language. This affects the measurement, not her ability."
                ),
            )
        )
    if 0 < ctx.sessions_considered < 3:
        out.append(
            Confounder(
                code="few_sessions",
                detail=f"Only {ctx.sessions_considered} comparable sessions were available.",
            )
        )
    return out


def _measurement_confidence(ctx: ContextSignals) -> str:
    """good | moderate | low, from the measurement-side signals only."""
    penalty = ctx.low_quality_share + ctx.language_mismatch_share
    if ctx.sessions_considered and ctx.sessions_considered < 3:
        penalty += 0.34
    if penalty >= 0.5:
        return "low"
    if penalty >= 0.2:
        return "moderate"
    return "good"


def _statement_text(signal: ChangeSignal, ctx: ContextSignals) -> str:
    """Template the neutral, within-person description.

    Every branch is phrased against *her own* recent pattern, never against a
    population norm and never as a trajectory. `models.py` re-checks the result.
    """
    if signal.kind is ChangeKind.INSUFFICIENT_DATA:
        return (
            f"Recent {signal.domain} sessions could not be measured reliably, so "
            "no conclusion is available. This is a measurement result, not a "
            "result about her."
        )
    if signal.kind is ChangeKind.NO_CHANGE:
        return (
            f"Recent {signal.domain} sessions are within her own usual range. "
            "Nothing stands out."
        )
    if signal.kind is ChangeKind.SUPPORT_NEED:
        return (
            f"She has been using more help than usual during {signal.domain} "
            "activities over the last few days."
        )

    days = signal.persistence_days
    day_word = "day" if days == 1 else "days"
    return (
        f"On {days} of the recent {day_word}, her {signal.domain} sessions sat "
        "below her own usual range for the past few weeks."
    )


def _open_questions(
    signal: ChangeSignal, causes: list[ReversibleCause], ctx: ContextSignals
) -> list[str]:
    """What the system does not know. Stating this is part of the evidence."""
    questions: list[str] = []
    if not causes:
        questions.append("No reversible cause has been reported or checked yet.")
    if ctx.onset_hours is None and signal.kind is ChangeKind.MEANINGFUL_CHANGE:
        questions.append("When the change was first noticed is not recorded.")
    if ctx.sessions_considered == 0:
        questions.append("The number of comparable sessions was not supplied.")
    if any(c.urgency is CauseUrgency.SAME_DAY for c in causes):
        questions.append("Whether the same-day checks have been done is not yet known.")
    return questions


def contextualise(
    signal: ChangeSignal,
    ctx: ContextSignals | None = None,
    *,
    evidence_refs: tuple[str, ...] = (),
) -> ContextualisedStatement:
    """Turn a ChangeSignal into a ContextualisedStatement. Pure.

    Reversible-cause triage runs first and is ordered same-day -> soon ->
    routine, so whoever reads the result meets the checkable explanations
    before the description of the change. An escalation level present on the
    signal is carried through unchanged; this engine never raises or lowers it,
    except to mark an uncategorised meaningful change that has a same-day cause
    as L4 — something a human should look at today.
    """
    ctx = ctx or ContextSignals()

    causes = [*_same_day_causes(ctx), *_soon_causes(ctx), *_routine_causes(ctx)]
    confounders = _confounders(ctx)

    level = signal.escalation_level
    if (
        level is None
        and signal.kind is ChangeKind.MEANINGFUL_CHANGE
        and any(c.urgency is CauseUrgency.SAME_DAY for c in causes)
    ):
        level = EscalationLevel.L4

    return ContextualisedStatement(
        person_id=signal.person_id,
        domain=signal.domain,
        change_kind=signal.kind,
        escalation_level=level,
        statement=_statement_text(signal, ctx),
        reversible_causes=tuple(causes),
        confounders=tuple(confounders),
        open_questions=tuple(_open_questions(signal, causes, ctx)),
        measurement_confidence=_measurement_confidence(ctx),
        evidence_refs=evidence_refs,
        engine_version=ENGINE_VERSION,
    )
