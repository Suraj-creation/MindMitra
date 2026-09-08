"""Persistence layer — async SQLAlchemy + audit sink tests.

Uses aiosqlite in-memory database; no Neon connection required.
Tests that:
  1. audit_log rows are written by SQLAlchemyAuditSink
  2. violations are flagged is_violation=True
  3. The append-only discipline is maintained (no rows lost)
"""

from __future__ import annotations

import asyncio

import pytest
import pytest_asyncio
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.core.audit_db import SQLAlchemyAuditSink, enforce_async
from app.core.models import AuditLog, Base
from app.firewall import (
    Action,
    Actor,
    ConsentState,
    DataCategory,
    EscalationLevel,
    FirewallDenied,
    Purpose,
    RequestContext,
    Resource,
    Role,
)

# ── Test DB setup ──────────────────────────────────────────────────────────────
TEST_DB_URL = "sqlite+aiosqlite:///:memory:"

@pytest.fixture(scope="function")
def event_loop():
    loop = asyncio.new_event_loop()
    yield loop
    loop.close()


@pytest_asyncio.fixture
async def db_session():
    engine = create_async_engine(TEST_DB_URL, echo=False)
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    session_factory = async_sessionmaker(engine, expire_on_commit=False)
    async with session_factory() as session:
        yield session
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
    await engine.dispose()


PERSON_ID = "person:001"


def make_actor(role: Role = Role.PERSON) -> Actor:
    return Actor(actor_id="actor:test", role=role, subject_person_id=PERSON_ID)


def make_resource(category: DataCategory = DataCategory.PERSON_PRIVATE_NOTE) -> Resource:
    return Resource(category=category, subject_person_id=PERSON_ID)


def make_context(
    action: Action = Action.READ,
    purpose: Purpose = Purpose.SELF_ACCESS,
    consent: bool = False,
) -> RequestContext:
    return RequestContext(
        action=action,
        purpose=purpose,
        active_escalation=EscalationLevel.L0,
        consent=ConsentState(granted=consent),
    )


# ── Tests ──────────────────────────────────────────────────────────────────────
@pytest.mark.asyncio
async def test_audit_record_written_on_allow(db_session: AsyncSession) -> None:
    sink = SQLAlchemyAuditSink(db_session)
    decision = await enforce_async(
        make_actor(Role.PERSON),
        make_resource(DataCategory.PERSON_PRIVATE_NOTE),
        make_context(Action.READ, Purpose.SELF_ACCESS),
        sink,
    )
    assert decision.allowed

    rows = (await db_session.execute(select(AuditLog))).scalars().all()
    assert len(rows) == 1
    assert rows[0].effect == "allow"
    assert rows[0].subject_person_id == PERSON_ID
    assert rows[0].actor_role == "person"


@pytest.mark.asyncio
async def test_audit_record_written_on_deny(db_session: AsyncSession) -> None:
    sink = SQLAlchemyAuditSink(db_session)
    with pytest.raises(FirewallDenied):
        await enforce_async(
            make_actor(Role.SECONDARY_CAREGIVER),
            make_resource(DataCategory.PERSON_PRIVATE_NOTE),
            make_context(Action.READ, Purpose.CARE_COORDINATION, consent=True),
            sink,
        )

    rows = (await db_session.execute(select(AuditLog))).scalars().all()
    assert len(rows) == 1
    assert rows[0].effect == "deny"
    assert "scope_expansion_attempt" in rows[0].reason_codes


@pytest.mark.asyncio
async def test_violation_flagged_in_db(db_session: AsyncSession) -> None:
    """Requests for never-collected categories are written as violations."""
    sink = SQLAlchemyAuditSink(db_session)
    with pytest.raises(FirewallDenied) as exc_info:
        await enforce_async(
            make_actor(Role.PRIMARY_CAREGIVER),
            make_resource(DataCategory.RAW_AV),
            make_context(Action.READ, Purpose.CARE_COORDINATION, consent=True),
            sink,
        )
    assert exc_info.value.decision.is_violation

    rows = (await db_session.execute(select(AuditLog))).scalars().all()
    assert len(rows) == 1
    assert rows[0].is_violation is True
    assert "never_collected_category" in rows[0].reason_codes


@pytest.mark.asyncio
async def test_multiple_decisions_all_written(db_session: AsyncSession) -> None:
    """Both allow and deny decisions are written; row count is correct."""
    sink = SQLAlchemyAuditSink(db_session)

    # Allow
    await enforce_async(
        make_actor(Role.PERSON),
        make_resource(DataCategory.PERSON_PRIVATE_NOTE),
        make_context(Action.READ, Purpose.SELF_ACCESS),
        sink,
    )
    # Deny
    with pytest.raises(FirewallDenied):
        await enforce_async(
            make_actor(Role.SECONDARY_CAREGIVER),
            make_resource(DataCategory.PERSON_PRIVATE_NOTE),
            make_context(Action.READ, Purpose.CARE_COORDINATION, consent=True),
            sink,
        )

    rows = (await db_session.execute(select(AuditLog))).scalars().all()
    assert len(rows) == 2
    effects = {r.effect for r in rows}
    assert effects == {"allow", "deny"}
