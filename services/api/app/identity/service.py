"""Identity domain services — persons, accounts, care relationships, consent.

The two functions that matter most are `resolve_role` and `resolve_consent`:
they are the bridge between persisted identity data and the deterministic
Memory Firewall. Every enforced data access resolves the actor's role relative
to the person and the consent state for the (category, purpose), then hands
those to the firewall — which makes the actual allow/deny decision.

All functions are async (they touch the DB). They do not make authZ decisions
themselves — that is the firewall's job.
"""

from __future__ import annotations

from datetime import UTC, datetime

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.models import AuditLog
from app.firewall.models import ConsentState
from app.firewall.roles import NEVER_COLLECTED, DataCategory, Purpose, Role

from .db import ActorAccountORM, CareRelationshipORM, ConsentGrantORM, PersonORM
from .models import (
    ActorAccount,
    ActorCreate,
    CareRelationship,
    ConsentGrantView,
    Person,
    PersonCreate,
)

# Roles whose consent is implicit and needs no grant row.
_IMPLICIT_CONSENT_ROLES: frozenset[Role] = frozenset({Role.PERSON, Role.SYSTEM})


def _utcnow() -> datetime:
    return datetime.now(UTC)


# ── Creation ──────────────────────────────────────────────────────────────────
async def create_person(session: AsyncSession, data: PersonCreate) -> Person:
    """Create a person, their self account, and the self care-relationship."""
    self_actor_id = f"{data.person_id}:self"

    person = PersonORM(
        person_id=data.person_id,
        display_name=data.display_name,
        preferred_language=data.preferred_language,
        language_tier=data.language_tier,
        cultural_context=data.cultural_context,
        self_actor_id=self_actor_id,
    )
    session.add(person)

    session.add(
        ActorAccountORM(actor_id=self_actor_id, display_name=data.display_name)
    )
    session.add(
        CareRelationshipORM(
            actor_id=self_actor_id,
            person_id=data.person_id,
            role=Role.PERSON.value,
        )
    )
    await session.flush()

    return Person(
        person_id=person.person_id,
        display_name=person.display_name,
        preferred_language=person.preferred_language,
        language_tier=person.language_tier,
        cultural_context=person.cultural_context,
        self_actor_id=self_actor_id,
    )


async def create_actor(session: AsyncSession, data: ActorCreate) -> ActorAccount:
    session.add(ActorAccountORM(actor_id=data.actor_id, display_name=data.display_name))
    await session.flush()
    return ActorAccount(actor_id=data.actor_id, display_name=data.display_name)


async def link_care(
    session: AsyncSession, *, actor_id: str, person_id: str, role: Role
) -> CareRelationship:
    session.add(
        CareRelationshipORM(actor_id=actor_id, person_id=person_id, role=role.value)
    )
    await session.flush()
    return CareRelationship(actor_id=actor_id, person_id=person_id, role=role)


# ── Consent ───────────────────────────────────────────────────────────────────
async def grant_consent(
    session: AsyncSession,
    *,
    person_id: str,
    grantee_role: Role,
    category: DataCategory,
    purpose: Purpose,
) -> ConsentGrantView:
    """Grant (or re-grant) consent. Upserts the current-state row and writes an
    append-only audit entry (event_type='consent_change')."""
    existing = await _find_grant(session, person_id, grantee_role, category, purpose)
    now = _utcnow()

    if existing is None:
        row = ConsentGrantORM(
            person_id=person_id,
            grantee_role=grantee_role.value,
            category=category.value,
            purpose=purpose.value,
            granted=True,
            granted_at=now,
            revoked_at=None,
        )
        session.add(row)
    else:
        existing.granted = True
        existing.granted_at = now
        existing.revoked_at = None
        row = existing

    await _audit_consent(session, person_id, grantee_role, category, purpose, "grant")
    await session.flush()
    return _grant_view(row)


async def revoke_consent(
    session: AsyncSession,
    *,
    person_id: str,
    grantee_role: Role,
    category: DataCategory,
    purpose: Purpose,
) -> ConsentGrantView | None:
    existing = await _find_grant(session, person_id, grantee_role, category, purpose)
    if existing is None:
        return None
    existing.granted = False
    existing.revoked_at = _utcnow()
    await _audit_consent(session, person_id, grantee_role, category, purpose, "revoke")
    await session.flush()
    return _grant_view(existing)


async def list_consent(session: AsyncSession, person_id: str) -> list[ConsentGrantView]:
    rows = (
        await session.execute(
            select(ConsentGrantORM).where(ConsentGrantORM.person_id == person_id)
        )
    ).scalars().all()
    return [_grant_view(r) for r in rows]


# ── Resolution (the firewall bridge) ─────────────────────────────────────────
async def resolve_role(
    session: AsyncSession, person_id: str, actor_id: str
) -> Role | None:
    """Return the actor's active role relative to the person, or None.

    An actor with no active care relationship to the person is a stranger and
    has no role — the caller must treat this as a hard deny.
    """
    now = _utcnow()
    rows = (
        await session.execute(
            select(CareRelationshipORM).where(
                CareRelationshipORM.person_id == person_id,
                CareRelationshipORM.actor_id == actor_id,
            )
        )
    ).scalars().all()

    active = [
        r for r in rows if r.valid_to is None or _as_utc(r.valid_to) > now
    ]
    if not active:
        return None

    # If multiple, prefer the most privileged / self role deterministically.
    priority = {
        Role.PERSON: 0,
        Role.PRIMARY_CAREGIVER: 1,
        Role.CLINICIAN: 2,
        Role.CHW: 3,
        Role.SECONDARY_CAREGIVER: 4,
    }
    best = min(active, key=lambda r: priority.get(Role(r.role), 99))
    return Role(best.role)


async def resolve_consent(
    session: AsyncSession,
    *,
    person_id: str,
    role: Role,
    category: DataCategory,
    purpose: Purpose,
) -> ConsentState:
    """Return the consent state the firewall should evaluate.

    Person self-access and internal system pipelines have implicit consent.
    Everyone else needs an active, non-revoked grant for exactly this
    (role, category, purpose).
    """
    if role in _IMPLICIT_CONSENT_ROLES:
        return ConsentState(granted=True)

    grant = await _find_grant(session, person_id, role, category, purpose)
    granted = bool(grant and grant.granted and grant.revoked_at is None)
    return ConsentState(granted=granted)


async def resolve_consent_map(
    session: AsyncSession,
    *,
    person_id: str,
    role: Role,
    purpose: Purpose,
) -> dict[DataCategory, ConsentState]:
    """Live consent for every collected category, for one (role, purpose).

    The Memory Firewall's `project()` re-runs `evaluate()` per source category to
    compute a derived artefact's sensitivity union, so it needs consent per
    category rather than one boolean. Resolving the whole map in one call keeps
    consent evaluated **at delivery** (tech-stack §19.1.2 rule 2) instead of
    being decided once and cached — consent can be revoked between generation
    and delivery, and the later decision is the one that counts.

    Never-collected categories are omitted: the firewall hard-denies them, and
    a consent row for them should not exist in the first place.
    """
    categories = [c for c in DataCategory if c not in NEVER_COLLECTED]

    if role in _IMPLICIT_CONSENT_ROLES:
        return {c: ConsentState(granted=True) for c in categories}

    rows = (
        await session.execute(
            select(ConsentGrantORM).where(
                ConsentGrantORM.person_id == person_id,
                ConsentGrantORM.grantee_role == role.value,
                ConsentGrantORM.purpose == purpose.value,
            )
        )
    ).scalars().all()

    granted = {
        row.category for row in rows if row.granted and row.revoked_at is None
    }
    return {c: ConsentState(granted=c.value in granted) for c in categories}


async def get_person(session: AsyncSession, person_id: str) -> Person | None:
    row = await session.get(PersonORM, person_id)
    if row is None:
        return None
    return Person(
        person_id=row.person_id,
        display_name=row.display_name,
        preferred_language=row.preferred_language,
        language_tier=row.language_tier,
        cultural_context=row.cultural_context,
        self_actor_id=row.self_actor_id,
        created_at=row.created_at,
    )


# ── Internals ─────────────────────────────────────────────────────────────────
def _as_utc(dt: datetime) -> datetime:
    return dt if dt.tzinfo is not None else dt.replace(tzinfo=UTC)


async def _find_grant(
    session: AsyncSession,
    person_id: str,
    role: Role,
    category: DataCategory,
    purpose: Purpose,
) -> ConsentGrantORM | None:
    return (
        await session.execute(
            select(ConsentGrantORM).where(
                ConsentGrantORM.person_id == person_id,
                ConsentGrantORM.grantee_role == role.value,
                ConsentGrantORM.category == category.value,
                ConsentGrantORM.purpose == purpose.value,
            )
        )
    ).scalars().first()


def _grant_view(row: ConsentGrantORM) -> ConsentGrantView:
    return ConsentGrantView(
        person_id=row.person_id,
        grantee_role=Role(row.grantee_role),
        category=DataCategory(row.category),
        purpose=Purpose(row.purpose),
        granted=row.granted,
        granted_at=row.granted_at,
        revoked_at=row.revoked_at,
    )


async def _audit_consent(
    session: AsyncSession,
    person_id: str,
    role: Role,
    category: DataCategory,
    purpose: Purpose,
    change: str,
) -> None:
    session.add(
        AuditLog(
            event_type="consent_change",
            actor_id=person_id,  # the person is the grantor
            actor_role=Role.PERSON.value,
            subject_person_id=person_id,
            category=category.value,
            action="share" if change == "grant" else "revoke",
            purpose=purpose.value,
            effect="allow" if change == "grant" else "deny",
            reason_codes=[f"consent_{change}:{role.value}"],
            obligations=["audit"],
            is_violation=False,
        )
    )
