"""Identity domain — persons, care relationships, and the consent bridge.

Focuses on resolve_role and resolve_consent, which feed the Memory Firewall.
"""

from __future__ import annotations

import pytest

from app.firewall.roles import DataCategory, Purpose, Role
from app.identity import service
from app.identity.models import ActorCreate, PersonCreate

PERSON_ID = "person:001"


async def _make_person(session) -> str:
    person = await service.create_person(
        session,
        PersonCreate(person_id=PERSON_ID, display_name="Test Person"),
    )
    return person.self_actor_id


@pytest.mark.asyncio
async def test_create_person_makes_self_relationship(db_session):
    self_actor = await _make_person(db_session)
    role = await service.resolve_role(db_session, PERSON_ID, self_actor)
    assert role is Role.PERSON


@pytest.mark.asyncio
async def test_resolve_role_none_for_stranger(db_session):
    await _make_person(db_session)
    role = await service.resolve_role(db_session, PERSON_ID, "actor:stranger")
    assert role is None


@pytest.mark.asyncio
async def test_link_care_and_resolve_role(db_session):
    await _make_person(db_session)
    await service.create_actor(db_session, ActorCreate(actor_id="actor:anu", display_name="Anu"))
    await service.link_care(
        db_session, actor_id="actor:anu", person_id=PERSON_ID, role=Role.PRIMARY_CAREGIVER
    )
    role = await service.resolve_role(db_session, PERSON_ID, "actor:anu")
    assert role is Role.PRIMARY_CAREGIVER


@pytest.mark.asyncio
async def test_grant_then_resolve_consent(db_session):
    await _make_person(db_session)
    await service.grant_consent(
        db_session,
        person_id=PERSON_ID,
        grantee_role=Role.PRIMARY_CAREGIVER,
        category=DataCategory.PWM_FACT,
        purpose=Purpose.PERSONALISATION,
    )
    consent = await service.resolve_consent(
        db_session,
        person_id=PERSON_ID,
        role=Role.PRIMARY_CAREGIVER,
        category=DataCategory.PWM_FACT,
        purpose=Purpose.PERSONALISATION,
    )
    assert consent.granted is True


@pytest.mark.asyncio
async def test_revoke_consent(db_session):
    await _make_person(db_session)
    await service.grant_consent(
        db_session, person_id=PERSON_ID, grantee_role=Role.PRIMARY_CAREGIVER,
        category=DataCategory.PWM_FACT, purpose=Purpose.PERSONALISATION,
    )
    await service.revoke_consent(
        db_session, person_id=PERSON_ID, grantee_role=Role.PRIMARY_CAREGIVER,
        category=DataCategory.PWM_FACT, purpose=Purpose.PERSONALISATION,
    )
    consent = await service.resolve_consent(
        db_session, person_id=PERSON_ID, role=Role.PRIMARY_CAREGIVER,
        category=DataCategory.PWM_FACT, purpose=Purpose.PERSONALISATION,
    )
    assert consent.granted is False


@pytest.mark.asyncio
async def test_person_role_has_implicit_consent(db_session):
    await _make_person(db_session)
    consent = await service.resolve_consent(
        db_session, person_id=PERSON_ID, role=Role.PERSON,
        category=DataCategory.PWM_FACT, purpose=Purpose.SELF_ACCESS,
    )
    assert consent.granted is True


@pytest.mark.asyncio
async def test_consent_is_scoped_to_exact_tuple(db_session):
    await _make_person(db_session)
    # Grant for personalisation only.
    await service.grant_consent(
        db_session, person_id=PERSON_ID, grantee_role=Role.PRIMARY_CAREGIVER,
        category=DataCategory.PWM_FACT, purpose=Purpose.PERSONALISATION,
    )
    # A different purpose is NOT covered.
    consent = await service.resolve_consent(
        db_session, person_id=PERSON_ID, role=Role.PRIMARY_CAREGIVER,
        category=DataCategory.PWM_FACT, purpose=Purpose.CARE_COORDINATION,
    )
    assert consent.granted is False


@pytest.mark.asyncio
async def test_consent_change_writes_audit(db_session):
    from sqlalchemy import select

    from app.core.models import AuditLog

    await _make_person(db_session)
    await service.grant_consent(
        db_session, person_id=PERSON_ID, grantee_role=Role.PRIMARY_CAREGIVER,
        category=DataCategory.PWM_FACT, purpose=Purpose.PERSONALISATION,
    )
    rows = (
        await db_session.execute(
            select(AuditLog).where(AuditLog.event_type == "consent_change")
        )
    ).scalars().all()
    assert len(rows) == 1
    assert rows[0].reason_codes == ["consent_grant:primary_caregiver"]
