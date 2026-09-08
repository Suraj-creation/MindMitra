"""The whole loop, end to end, over real persisted observations.

This is the MVP north star as a test: person interacts -> observation ->
measurement-quality gate -> baseline update -> meaningful change ->
contextualised statement -> four governed projections -> delivery decisions.

If this file passes, the chain in invariant 13 is closed and there is no
shorter path from a session to a human.
"""

from __future__ import annotations

from datetime import UTC, datetime, timedelta

import pytest

from app.behaviour import ChangeKind, ContextSignals
from app.cognition.mq import ObservationSignals
from app.escalation.service import build_change_signal, build_statement, evaluate_person
from app.firewall.models import Actor, ConsentState, RequestContext
from app.firewall.roles import Action, DataCategory, Purpose, Role
from app.identity.models import PersonCreate
from app.identity.service import create_person
from app.observation.service import record_observation
from app.projection import DeliveryClass, RoleRequest, project_all

PERSON_ID = "person:e2e"
DOMAIN = "memory"
NOW = datetime(2026, 3, 1, 12, 0, tzinfo=UTC)

GOOD = ObservationSignals(
    audibility=0.95, visibility=0.95, language_match=True, fatigue_factor=0.9,
    was_assisted=False, device_ok=True, subject_confirmed=True,
)
BAD = ObservationSignals(  # volume down + wrong language — the demo refusal
    audibility=0.15, visibility=0.9, language_match=False, fatigue_factor=0.8,
    was_assisted=False, device_ok=True, subject_confirmed=True,
)
BASELINE_CYCLE = [0.82, 0.86, 0.80, 0.84]

_ROLE_PURPOSE = {
    Role.PERSON: Purpose.SELF_ACCESS,
    Role.PRIMARY_CAREGIVER: Purpose.CARE_COORDINATION,
    Role.CHW: Purpose.CARE_COORDINATION,
    Role.CLINICIAN: Purpose.CLINICAL_REVIEW,
}


async def _seed(session, *, decline_days: int, decline_signals=GOOD) -> None:
    await create_person(session, PersonCreate(person_id=PERSON_ID, display_name="Sunita Das"))
    for i in range(20):
        await record_observation(
            session, person_id=PERSON_ID, domain=DOMAIN,
            value=BASELINE_CYCLE[i % 4], signals=GOOD,
            observed_at=NOW - timedelta(days=25 - i),
        )
    for j in range(decline_days):
        await record_observation(
            session, person_id=PERSON_ID, domain=DOMAIN,
            value=round(0.55 - 0.03 * j, 3), signals=decline_signals,
            observed_at=NOW - timedelta(days=decline_days - 1 - j),
        )


def _requests(**ctx_kw) -> list[RoleRequest]:
    return [
        RoleRequest(
            actor=Actor(actor_id=f"a:{r.value}", role=r, subject_person_id=PERSON_ID),
            context=RequestContext(
                action=Action.READ, purpose=p, consent=ConsentState(granted=True), **ctx_kw
            ),
        )
        for r, p in _ROLE_PURPOSE.items()
    ]


@pytest.mark.asyncio
async def test_full_loop_one_change_four_governed_projections(db_session):
    await _seed(db_session, decline_days=3)
    alert = await evaluate_person(db_session, PERSON_ID, domain=DOMAIN, now=NOW)
    assert alert is not None

    statement = await build_statement(
        db_session, PERSON_ID, DOMAIN, now=NOW,
        reported=ContextSignals(sleep_disrupted=True, hearing_aid_unused=True),
    )
    assert statement.change_kind is ChangeKind.MEANINGFUL_CHANGE
    assert statement.interpretation_withheld
    assert [c.code for c in statement.reversible_causes] == [
        "sleep_disruption", "hearing_aid_unused",
    ]

    outcomes = {o.role: o for o in project_all(statement, _requests())}
    assert set(outcomes) == set(_ROLE_PURPOSE)

    # Every role got something, and no two got the same amount.
    fact_counts = {r: len(o.projection.output.facts) for r, o in outcomes.items()}
    assert all(v >= 1 for v in fact_counts.values())
    assert len(set(fact_counts.values())) > 1

    # This fixture is a severe deviation (z is far outside her own range), so it
    # lands at L5 and every care role is notified simultaneously. The person is
    # not among them: `project_person` never carries an escalation level, so the
    # person branch of the classifier is always the one that runs for them.
    interrupted = {r for r, o in outcomes.items() if o.delivery.interrupts}
    assert interrupted == {Role.PRIMARY_CAREGIVER, Role.CHW, Role.CLINICIAN}
    assert Role.PERSON not in interrupted
    assert all(
        outcomes[r].delivery.bypassed_budget
        for r in (Role.PRIMARY_CAREGIVER, Role.CHW, Role.CLINICIAN)
    )
    # (Role-differentiated delivery at lower levels is covered by
    #  tests/test_projection.py::test_one_l3_statement_delivers_differently_to_each_role.)

    # And the person is not told they were measured.
    person_text = " ".join(
        f.content for f in outcomes[Role.PERSON].projection.output.facts
    ).lower()
    assert "below" not in person_text and "range" not in person_text


@pytest.mark.asyncio
async def test_bad_measurement_produces_no_cognitive_signal_for_anybody(db_session):
    """The signature behaviour: refuse to score bad data.

    Volume down and the wrong language. The pipeline terminates at the gate, so
    no role receives a change claim — only the caregiver and CHW get a
    measurement action, and it never interrupts anyone.
    """
    await _seed(db_session, decline_days=4, decline_signals=BAD)

    assert await evaluate_person(db_session, PERSON_ID, domain=DOMAIN, now=NOW) is None

    signal = await build_change_signal(db_session, PERSON_ID, DOMAIN, now=NOW)
    # The low-quality decline never reaches the baseline, so the certified
    # window still reads as within-range rather than as a decline.
    assert signal.kind is not ChangeKind.MEANINGFUL_CHANGE

    statement = await build_statement(db_session, PERSON_ID, DOMAIN, now=NOW)
    outcomes = project_all(statement, _requests())
    assert not any(o.delivery.interrupts for o in outcomes)
    for outcome in outcomes:
        if outcome.projection is None:
            continue
        text = " ".join(f.content for f in outcome.projection.output.facts).lower()
        assert "progress" not in text and "decline" not in text


@pytest.mark.asyncio
async def test_quiet_week_reassures_the_caregiver_and_troubles_nobody(db_session):
    await _seed(db_session, decline_days=0)
    statement = await build_statement(db_session, PERSON_ID, DOMAIN, now=NOW)
    assert statement.change_kind is ChangeKind.NO_CHANGE

    outcomes = {o.role: o for o in project_all(statement, _requests())}
    assert outcomes[Role.PRIMARY_CAREGIVER].projection.headline == (
        "Nothing needs your attention today."
    )
    assert outcomes[Role.CHW].projection is None
    assert outcomes[Role.CLINICIAN].projection is None
    assert not any(o.delivery.interrupts for o in outcomes.values())


@pytest.mark.asyncio
async def test_revoking_consent_stops_delivery_at_the_firewall(db_session):
    await _seed(db_session, decline_days=3)
    await evaluate_person(db_session, PERSON_ID, domain=DOMAIN, now=NOW)
    statement = await build_statement(db_session, PERSON_ID, DOMAIN, now=NOW)

    revoked = [
        RoleRequest(
            actor=Actor(
                actor_id="cg", role=Role.PRIMARY_CAREGIVER, subject_person_id=PERSON_ID
            ),
            context=RequestContext(
                action=Action.READ,
                purpose=Purpose.CARE_COORDINATION,
                consent=ConsentState(granted=False),
            ),
            consent_by_category={DataCategory.COGNITIVE_STATE: ConsentState(granted=False)},
        )
    ]
    outcome = project_all(statement, revoked)[0]
    assert outcome.projection is None
    assert outcome.withheld.stage == "firewall"
    assert outcome.delivery.delivery_class is DeliveryClass.NO_NOTIFICATION


@pytest.mark.asyncio
async def test_caregiver_card_and_projection_tell_the_same_story(db_session):
    """The legacy card endpoint is now a view of the same projection, not a
    second opinion. Its facts must be a subset of what the spine produced."""
    from app.escalation.service import build_caregiver_card

    await _seed(db_session, decline_days=3)
    await evaluate_person(db_session, PERSON_ID, domain=DOMAIN, now=NOW)

    card = await build_caregiver_card(db_session, PERSON_ID, domain=DOMAIN, now=NOW)
    statement = await build_statement(db_session, PERSON_ID, DOMAIN, now=NOW)
    projection = next(
        o.projection
        for o in project_all(statement, _requests())
        if o.role is Role.PRIMARY_CAREGIVER
    )

    assert {f.content for f in card.facts} == {f.content for f in projection.output.facts}
    assert card.safety_passed
