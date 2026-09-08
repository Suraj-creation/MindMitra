"""End-to-end: observation -> baseline -> alert -> three-layer caregiver card.

Verifies the full escalation pipeline with real persisted observations, plus
the two structural guarantees: bad-quality observations never contribute, and
the caregiver card always passes the Safety Gateway.
"""

from __future__ import annotations

from datetime import UTC, datetime, timedelta

import pytest

from app.cognition.mq import ObservationSignals
from app.escalation.service import build_caregiver_card, evaluate_person, record_feedback
from app.identity import service as identity
from app.identity.models import PersonCreate
from app.observation.service import record_observation

PERSON_ID = "person:test"
DOMAIN = "memory"
NOW = datetime(2026, 9, 3, 12, 0, tzinfo=UTC)

GOOD = ObservationSignals(
    audibility=0.95, visibility=0.95, language_match=True, fatigue_factor=0.9,
    was_assisted=False, device_ok=True, subject_confirmed=True,
)
BAD = ObservationSignals(
    audibility=0.0, visibility=0.95, language_match=True, fatigue_factor=0.9,
    was_assisted=False, device_ok=True, subject_confirmed=True,
)
BASELINE_CYCLE = (0.74, 0.78, 0.82, 0.86)


async def _seed_person(session) -> None:
    await identity.create_person(
        session, PersonCreate(person_id=PERSON_ID, display_name="Test Person")
    )


async def _inject(session, *, decline_days: int, signals=GOOD, decline_signals=GOOD):
    # 24-day baseline (days -31..-8)
    for i in range(24):
        await record_observation(
            session, person_id=PERSON_ID, domain=DOMAIN,
            value=BASELINE_CYCLE[i % 4], signals=signals,
            observed_at=NOW - timedelta(days=31 - i),
        )
    # recent decline to ~0.64 (latest z ~ -2.3 → L3)
    hi, lo = 0.69, 0.64
    for j in range(decline_days):
        frac = j / max(1, decline_days - 1)
        value = hi - (hi - lo) * frac if decline_days > 1 else lo
        await record_observation(
            session, person_id=PERSON_ID, domain=DOMAIN, value=round(value, 3),
            signals=decline_signals, observed_at=NOW - timedelta(days=decline_days - 1 - j),
        )


@pytest.mark.asyncio
async def test_decline_raises_alert_and_card(db_session):
    await _seed_person(db_session)
    await _inject(db_session, decline_days=3)

    alert = await evaluate_person(db_session, PERSON_ID, domain=DOMAIN, now=NOW)
    assert alert is not None
    assert alert.level in ("L2", "L3", "L4")
    assert alert.z < 0  # below the person's own baseline
    assert alert.persistence_days >= 2

    card = await build_caregiver_card(db_session, PERSON_ID, domain=DOMAIN, now=NOW)
    assert card.level == alert.level
    assert card.safety_passed is True
    assert len(card.facts) >= 1
    assert card.hypothesis is not None
    assert "not a diagnosis" in card.hypothesis.label.lower()
    assert len(card.actions) >= 1


@pytest.mark.asyncio
async def test_card_never_contains_forbidden_claims(db_session):
    await _seed_person(db_session)
    await _inject(db_session, decline_days=4)
    await evaluate_person(db_session, PERSON_ID, domain=DOMAIN, now=NOW)
    card = await build_caregiver_card(db_session, PERSON_ID, domain=DOMAIN, now=NOW)

    # The claims (facts, hypothesis body, actions) must carry no forbidden claim.
    # The disclaimer legitimately contains "diagnosis" — it is the required hedge.
    claims = " ".join(
        [f.content for f in card.facts]
        + ([card.hypothesis.content] if card.hypothesis else [])
        + list(card.actions)
    ).lower()
    for forbidden in ("progressing", "diagnoses", "wrong", "failure", "heals", "reverses"):
        assert forbidden not in claims

    # And the required hedge IS present.
    assert card.hypothesis is not None
    assert "not a diagnosis" in card.hypothesis.label.lower()
    # The card itself passed the real Safety Gateway.
    assert card.safety_passed is True


@pytest.mark.asyncio
async def test_no_decline_no_alert(db_session):
    await _seed_person(db_session)
    # Baseline only, no decline (1 recent point at baseline level).
    for i in range(20):
        await record_observation(
            db_session, person_id=PERSON_ID, domain=DOMAIN,
            value=BASELINE_CYCLE[i % 4], signals=GOOD,
            observed_at=NOW - timedelta(days=25 - i),
        )
    alert = await evaluate_person(db_session, PERSON_ID, domain=DOMAIN, now=NOW)
    assert alert is None

    card = await build_caregiver_card(db_session, PERSON_ID, domain=DOMAIN, now=NOW)
    assert card.level is None
    assert card.safety_passed is True


@pytest.mark.asyncio
async def test_bad_quality_decline_does_not_alert(db_session):
    """A decline observed under bad measurement quality must NOT raise an alert."""
    await _seed_person(db_session)
    await _inject(db_session, decline_days=4, decline_signals=BAD)  # decline is low-quality
    alert = await evaluate_person(db_session, PERSON_ID, domain=DOMAIN, now=NOW)
    # The low-quality decline observations are excluded from the baseline, so the
    # latest quality-gated point is a baseline value → no deviation → no alert.
    assert alert is None


@pytest.mark.asyncio
async def test_no_duplicate_alert_within_7_days(db_session):
    await _seed_person(db_session)
    await _inject(db_session, decline_days=3)
    first = await evaluate_person(db_session, PERSON_ID, domain=DOMAIN, now=NOW)
    second = await evaluate_person(db_session, PERSON_ID, domain=DOMAIN, now=NOW)
    assert first is not None
    assert second is not None
    assert first.alert_id == second.alert_id  # same alert, not a duplicate


@pytest.mark.asyncio
async def test_feedback_recorded(db_session):
    await _seed_person(db_session)
    await _inject(db_session, decline_days=3)
    alert = await evaluate_person(db_session, PERSON_ID, domain=DOMAIN, now=NOW)
    assert alert is not None
    updated = await record_feedback(db_session, alert.alert_id, "useful")
    assert updated is not None
    assert updated.feedback == "useful"
