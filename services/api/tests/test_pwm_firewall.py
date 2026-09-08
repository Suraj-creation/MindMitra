"""End-to-end: reading a PWM fact through the Memory Firewall.

This is the keystone integration test — it exercises the full safety spine:
    resolve role → resolve consent → firewall decision → audit → fact-or-withheld.
"""

from __future__ import annotations

from datetime import UTC, date, datetime

import pytest
from sqlalchemy import select

from app.core.models import AuditLog
from app.firewall.roles import DataCategory, Purpose, Role
from app.identity import service as identity
from app.identity.models import ActorCreate, PersonCreate
from app.pwm.models import ProvenanceEnvelope, PWMNode, VerificationStatus
from app.pwm.service import attempt_read_pwm_fact, create_node

PERSON_ID = "person:purnima"
ANU = "actor:anu"          # primary caregiver — consented, in visibility
BIKASH = "actor:bikash"    # secondary caregiver — NOT in visibility
FACT_ID = "f_rina"


async def _seed(session) -> str:
    person = await identity.create_person(
        session, PersonCreate(person_id=PERSON_ID, display_name="Purnima Devi")
    )
    await identity.create_actor(session, ActorCreate(actor_id=ANU, display_name="Anu"))
    await identity.create_actor(session, ActorCreate(actor_id=BIKASH, display_name="Bikash"))
    await identity.link_care(session, actor_id=ANU, person_id=PERSON_ID, role=Role.PRIMARY_CAREGIVER)
    await identity.link_care(session, actor_id=BIKASH, person_id=PERSON_ID, role=Role.SECONDARY_CAREGIVER)
    await identity.grant_consent(
        session, person_id=PERSON_ID, grantee_role=Role.PRIMARY_CAREGIVER,
        category=DataCategory.PWM_FACT, purpose=Purpose.PERSONALISATION,
    )

    prov = ProvenanceEnvelope(
        fact_id=FACT_ID,
        subject=PERSON_ID,
        predicate="RELATED_TO",
        object="person:rina",
        value={"kinship_type": "granddaughter"},
        source={"type": "caregiver", "actor": ANU, "channel": "onboarding"},
        created_at=datetime.now(UTC),
        valid_from=date(2026, 7, 2),
        verification_status=VerificationStatus.VERIFIED,
        visibility=("person", "primary_caregiver"),
    )
    await create_node(
        session,
        PWMNode(
            node_id="node:rina", person_id=PERSON_ID, node_type="person",
            temporal_partition="present", label="Rina", provenance=prov,
        ),
    )
    return person.self_actor_id


@pytest.mark.asyncio
async def test_primary_caregiver_with_consent_allowed(db_session):
    await _seed(db_session)
    outcome = await attempt_read_pwm_fact(
        db_session, actor_id=ANU, person_id=PERSON_ID, fact_id=FACT_ID,
        purpose=Purpose.PERSONALISATION,
    )
    assert outcome.allowed is True
    assert outcome.fact is not None
    assert outcome.fact.value["kinship_type"] == "granddaughter"


@pytest.mark.asyncio
async def test_secondary_caregiver_out_of_visibility_denied(db_session):
    await _seed(db_session)
    outcome = await attempt_read_pwm_fact(
        db_session, actor_id=BIKASH, person_id=PERSON_ID, fact_id=FACT_ID,
        purpose=Purpose.PERSONALISATION,
    )
    assert outcome.allowed is False
    assert outcome.fact is None
    assert "scope_expansion_attempt" in outcome.reason_codes


@pytest.mark.asyncio
async def test_person_self_access_allowed(db_session):
    self_actor = await _seed(db_session)
    outcome = await attempt_read_pwm_fact(
        db_session, actor_id=self_actor, person_id=PERSON_ID, fact_id=FACT_ID,
        purpose=Purpose.SELF_ACCESS,
    )
    assert outcome.allowed is True
    assert outcome.fact is not None


@pytest.mark.asyncio
async def test_research_purpose_denied(db_session):
    await _seed(db_session)
    outcome = await attempt_read_pwm_fact(
        db_session, actor_id=ANU, person_id=PERSON_ID, fact_id=FACT_ID,
        purpose=Purpose.RESEARCH,
    )
    assert outcome.allowed is False
    assert "purpose_not_permitted" in outcome.reason_codes


@pytest.mark.asyncio
async def test_consent_revoked_denies_read(db_session):
    await _seed(db_session)
    await identity.revoke_consent(
        db_session, person_id=PERSON_ID, grantee_role=Role.PRIMARY_CAREGIVER,
        category=DataCategory.PWM_FACT, purpose=Purpose.PERSONALISATION,
    )
    outcome = await attempt_read_pwm_fact(
        db_session, actor_id=ANU, person_id=PERSON_ID, fact_id=FACT_ID,
        purpose=Purpose.PERSONALISATION,
    )
    assert outcome.allowed is False
    assert "consent_absent" in outcome.reason_codes


@pytest.mark.asyncio
async def test_unknown_actor_denied(db_session):
    await _seed(db_session)
    outcome = await attempt_read_pwm_fact(
        db_session, actor_id="actor:stranger", person_id=PERSON_ID, fact_id=FACT_ID,
        purpose=Purpose.PERSONALISATION,
    )
    assert outcome.allowed is False
    assert "no_care_relationship" in outcome.reason_codes


@pytest.mark.asyncio
async def test_missing_fact_returns_not_found(db_session):
    await _seed(db_session)
    outcome = await attempt_read_pwm_fact(
        db_session, actor_id=ANU, person_id=PERSON_ID, fact_id="f_does_not_exist",
        purpose=Purpose.PERSONALISATION,
    )
    assert outcome.found is False
    assert outcome.allowed is False


@pytest.mark.asyncio
async def test_every_read_attempt_is_audited(db_session):
    await _seed(db_session)
    # One allowed, one denied.
    await attempt_read_pwm_fact(
        db_session, actor_id=ANU, person_id=PERSON_ID, fact_id=FACT_ID,
        purpose=Purpose.PERSONALISATION,
    )
    await attempt_read_pwm_fact(
        db_session, actor_id=BIKASH, person_id=PERSON_ID, fact_id=FACT_ID,
        purpose=Purpose.PERSONALISATION,
    )
    rows = (
        await db_session.execute(
            select(AuditLog).where(AuditLog.event_type == "firewall_decision")
        )
    ).scalars().all()
    effects = sorted(r.effect for r in rows)
    assert "allow" in effects
    assert "deny" in effects


# ══ Grounding lookup — loaded async, validated pure ══════════════════════════

@pytest.mark.asyncio
async def test_grounding_lookup_resolves_a_verified_fact(db_session) -> None:
    """The loader is async; what it hands the validator is plain and synchronous.

    The previous implementation had an `async def resolve` behind a synchronous
    protocol, so the validator received an un-awaited coroutine, skipped its
    "not found" branch because a coroutine is not None, and then raised
    AttributeError. Nothing called it, so nothing noticed.
    """
    from app.pwm.lookup import load_pwm_lookup
    from app.studio.spec import VerificationStatus

    await _seed(db_session)

    lookup = await load_pwm_lookup(
        db_session, person_id=PERSON_ID, fact_ids=[FACT_ID]
    )
    fact = lookup.resolve(FACT_ID)

    assert fact is not None, "a plain object, not a coroutine"
    assert fact.subject_person_id == PERSON_ID
    assert fact.verification_status is VerificationStatus.VERIFIED


@pytest.mark.asyncio
async def test_grounding_lookup_returns_none_for_an_unknown_fact(db_session) -> None:
    from app.pwm.lookup import load_pwm_lookup

    await _seed(db_session)
    lookup = await load_pwm_lookup(
        db_session, person_id=PERSON_ID, fact_ids=["f_does_not_exist"]
    )
    assert lookup.resolve("f_does_not_exist") is None


@pytest.mark.asyncio
async def test_grounding_lookup_cannot_reach_another_persons_fact(db_session) -> None:
    """Filtering by person in SQL is what stops a guessed fact id leaking."""
    from app.pwm.lookup import load_pwm_lookup

    await _seed(db_session)
    lookup = await load_pwm_lookup(
        db_session, person_id="person:someone_else", fact_ids=[FACT_ID]
    )
    assert lookup.resolve(FACT_ID) is None


@pytest.mark.asyncio
async def test_grounding_validator_rejects_a_spec_whose_fact_does_not_resolve(
    db_session,
) -> None:
    """The end-to-end property: an ungrounded personal element blocks the spec."""
    from app.pwm.lookup import load_pwm_lookup
    from app.studio.validators import grounding_validator

    await _seed(db_session)
    missing = "f_not_in_the_database"
    spec = _spec_referencing(missing)

    lookup = await load_pwm_lookup(
        db_session, person_id=PERSON_ID, fact_ids=[missing]
    )
    result = grounding_validator(spec, lookup)

    assert result.passed is False
    assert any(v.code == "unresolved_fact" for v in result.violations)


def _spec_referencing(fact_id: str):
    """A minimal valid spec whose one personal element names `fact_id`."""
    from datetime import timedelta

    from app.studio.spec import (
        ActivityDefinition,
        ActivityItem,
        CognitiveDomain,
        ContentKind,
        ContentSource,
        EngineType,
        ExperienceSpec,
        GenerationProvenance,
        LanguageTier,
        Modality,
        ObservationType,
        PrimitiveFamily,
        TemporalFrame,
    )
    from app.studio.spec import VerificationStatus as SpecVerification

    now = datetime.now(UTC)
    return ExperienceSpec(
        spec_id="spec:grounding",
        person_id=PERSON_ID,
        engine=EngineType.MATCHING,
        primitive_family=PrimitiveFamily.RECOGNITION_RECALL,
        cognitive_target=(CognitiveDomain.MEMORY,),
        temporal_frame=TemporalFrame.PAST,
        difficulty=0.8,
        modality=Modality.PICTURE,
        language_tier=LanguageTier.A,
        preferred_language="as",
        cultural_context="assamese_v1",
        activity=ActivityDefinition(
            engine=EngineType.MATCHING,
            instruction_key="match.person.v1",
            items=(ActivityItem(item_id="i1", content_element_id="c_rina"),),
        ),
        content_sources=(
            ContentSource(
                element_id="c_rina",
                kind=ContentKind.PERSON,
                label="Rina",
                pwm_fact_id=fact_id,
                provenance_ref="log:seed",
                verification_status=SpecVerification.VERIFIED,
            ),
        ),
        expected_observation_types=(ObservationType.RECOGNITION_SUCCESS,),
        provenance=GenerationProvenance(model="test", generated_at=now),
        expiry=now + timedelta(days=1),
    )
