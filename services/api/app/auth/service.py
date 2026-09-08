"""Authentication services — registration, login, refresh rotation, device enrolment.

These functions establish *who is calling*. They never decide what the caller may
see; that is the Memory Firewall's job, reached through `app.auth.deps`.

Two properties worth stating because they are easy to lose later:

* Login failures are indistinguishable. An unknown email and a wrong password
  take the same path and return the same error, so the endpoint cannot be used
  to enumerate accounts.
* Refresh tokens rotate, and reuse of a rotated token revokes the whole family.
  A single replay is treated as theft rather than as a retry.
"""

from __future__ import annotations

import uuid
from datetime import UTC, datetime, timedelta

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.audit_db import record_audit_independently
from app.core.models import AuditLog
from app.firewall.roles import Role
from app.identity.db import ActorAccountORM, CareRelationshipORM, PersonORM

from . import passwords, tokens
from .db import PersonDeviceGrantORM, RefreshSessionORM, UserCredentialORM
from .models import (
    DeviceEnrolResponse,
    MeResponse,
    PersonSummary,
    Principal,
    RegisterRequest,
    TokenPair,
)

MAX_FAILED_ATTEMPTS = 8
LOCKOUT = timedelta(minutes=15)


class AuthError(Exception):
    """Authentication failed. The message is safe to show; it never says why."""


def _now() -> datetime:
    return datetime.now(UTC)


def _as_utc(value: datetime | None) -> datetime | None:
    if value is None:
        return None
    return value if value.tzinfo is not None else value.replace(tzinfo=UTC)


# ── Registration ─────────────────────────────────────────────────────────────
async def register(session: AsyncSession, data: RegisterRequest) -> Principal:
    """Create an actor account with a password. Idempotent on actor_id."""
    existing = (
        await session.execute(
            select(UserCredentialORM).where(UserCredentialORM.email == data.email.lower())
        )
    ).scalars().first()
    if existing is not None:
        raise AuthError("That account already exists.")

    actor = await session.get(ActorAccountORM, data.actor_id)
    if actor is None:
        session.add(ActorAccountORM(actor_id=data.actor_id, display_name=data.display_name))

    session.add(
        UserCredentialORM(
            actor_id=data.actor_id,
            email=data.email.lower(),
            password_hash=passwords.hash_password(data.password),
        )
    )
    await session.flush()
    return Principal(actor_id=data.actor_id, subject_kind="human", token_id="registration")


# ── Login ────────────────────────────────────────────────────────────────────
async def login(session: AsyncSession, *, email: str, password: str) -> TokenPair:
    credential = (
        await session.execute(
            select(UserCredentialORM).where(UserCredentialORM.email == email.lower())
        )
    ).scalars().first()

    # Hash even when the account is unknown, so a missing account and a wrong
    # password take comparable time and cannot be told apart by response timing.
    stored = credential.password_hash if credential else passwords.hash_password("decoy")
    supplied_ok = passwords.verify_password(password, stored)

    if credential is None or not credential.is_active:
        raise AuthError("Those sign-in details did not work.")

    locked_until = _as_utc(credential.locked_until)
    if locked_until is not None and locked_until > _now():
        raise AuthError("Too many attempts. Please try again shortly.")

    if not supplied_ok:
        credential.failed_attempts += 1
        if credential.failed_attempts >= MAX_FAILED_ATTEMPTS:
            credential.locked_until = _now() + LOCKOUT
            credential.failed_attempts = 0
        await session.flush()
        raise AuthError("Those sign-in details did not work.")

    credential.failed_attempts = 0
    credential.locked_until = None
    credential.last_login_at = _now()

    if passwords.needs_rehash(credential.password_hash):
        credential.password_hash = passwords.hash_password(password)

    return await _issue_pair(session, actor_id=credential.actor_id, subject_kind="human")


async def login_device(
    session: AsyncSession, *, person_id: str, device_secret: str
) -> TokenPair:
    """Sign in a shared family device. The person never types anything secret."""
    grants = (
        await session.execute(
            select(PersonDeviceGrantORM).where(
                PersonDeviceGrantORM.person_id == person_id,
                PersonDeviceGrantORM.revoked.is_(False),
            )
        )
    ).scalars().all()

    match = next(
        (g for g in grants if passwords.verify_password(device_secret, g.secret_hash)), None
    )
    if match is None:
        raise AuthError("This device is not set up for that person.")

    match.last_seen_at = _now()
    return await _issue_pair(
        session,
        actor_id=match.actor_id,
        subject_kind="person_device",
        bound_person_id=person_id,
    )


# ── Refresh rotation ─────────────────────────────────────────────────────────
async def refresh(session: AsyncSession, refresh_token: str) -> TokenPair:
    try:
        claims = tokens.decode(refresh_token, expect="refresh")
    except tokens.TokenError as exc:
        raise AuthError("Please sign in again.") from exc

    row = (
        await session.execute(
            select(RefreshSessionORM).where(RefreshSessionORM.jti == claims.jti)
        )
    ).scalars().first()

    if row is None:
        raise AuthError("Please sign in again.")

    if row.revoked:
        # A rotated token being presented again is the signature of theft, not
        # of a retry. Revoke every live session in the family and force re-auth.
        #
        # This has to survive the rejection it is about to cause: the request
        # session rolls back when the AuthError becomes a 401, which would undo
        # exactly the revocation that matters. So it commits on its own.
        await _revoke_family_independently(row.family_id, reason="reuse_detected")
        await record_audit_independently(
            event_type="auth",
            actor_id=row.actor_id,
            actor_role=Role.SYSTEM.value,
            subject_person_id=row.actor_id,
            category="identity",
            action="read",
            purpose="self_access",
            effect="deny",
            reason_codes=["refresh_reuse_detected"],
            is_violation=True,
        )
        raise AuthError("Please sign in again.")

    if _as_utc(row.expires_at) <= _now():
        row.revoked = True
        row.revoked_reason = "expired"
        raise AuthError("Please sign in again.")

    row.revoked = True
    row.revoked_reason = "rotated"

    return await _issue_pair(
        session,
        actor_id=row.actor_id,
        subject_kind=row.subject_kind,
        bound_person_id=row.bound_person_id,
        family_id=row.family_id,
    )


async def logout(session: AsyncSession, refresh_token: str) -> None:
    try:
        claims = tokens.decode(refresh_token, expect="refresh")
    except tokens.TokenError:
        return  # Nothing to revoke; logging out is never an error.
    row = (
        await session.execute(
            select(RefreshSessionORM).where(RefreshSessionORM.jti == claims.jti)
        )
    ).scalars().first()
    if row is not None and not row.revoked:
        await _revoke_family(session, row.family_id, reason="logout")


# ── Device enrolment ─────────────────────────────────────────────────────────
async def enrol_device(
    session: AsyncSession,
    *,
    person_id: str,
    device_label: str,
    enrolled_by: str,
    device_secret: str | None = None,
) -> DeviceEnrolResponse:
    person = await session.get(PersonORM, person_id)
    if person is None:
        raise AuthError("Unknown person.")

    secret = device_secret or passwords.generate_device_secret()
    grant = PersonDeviceGrantORM(
        person_id=person_id,
        actor_id=person.self_actor_id,
        device_label=device_label,
        secret_hash=passwords.hash_password(secret),
        enrolled_by_actor_id=enrolled_by,
    )
    session.add(grant)
    await session.flush()

    # Enrolling a device widens who can reach this person's surface, so it is
    # attributable in the same log as every firewall decision.
    await _audit_auth(
        session,
        actor_id=enrolled_by,
        effect="allow",
        reason=f"device_enrolled:{device_label}",
        subject_person_id=person_id,
    )
    return DeviceEnrolResponse(
        device_id=str(grant.device_id),
        person_id=person_id,
        device_label=device_label,
        device_secret=secret,
    )


# ── Who am I ─────────────────────────────────────────────────────────────────
async def describe_me(session: AsyncSession, principal: Principal) -> MeResponse:
    """The actor plus every person they hold an active relationship with.

    A person-device token is clamped to its bound person even if the underlying
    actor somehow held other relationships.
    """
    actor = await session.get(ActorAccountORM, principal.actor_id)
    display_name = actor.display_name if actor else principal.actor_id

    now = _now()
    rows = (
        await session.execute(
            select(CareRelationshipORM).where(
                CareRelationshipORM.actor_id == principal.actor_id
            )
        )
    ).scalars().all()

    active = [r for r in rows if (_as_utc(r.valid_to) or None) is None or _as_utc(r.valid_to) > now]
    if principal.bound_person_id:
        active = [r for r in active if r.person_id == principal.bound_person_id]

    summaries: list[PersonSummary] = []
    for rel in active:
        person = await session.get(PersonORM, rel.person_id)
        if person is None:
            continue
        summaries.append(
            PersonSummary(
                person_id=person.person_id,
                display_name=person.display_name,
                role=Role(rel.role),
                preferred_language=person.preferred_language,
                language_tier=person.language_tier,
            )
        )

    return MeResponse(
        actor_id=principal.actor_id,
        display_name=display_name,
        subject_kind=principal.subject_kind,
        persons=tuple(summaries),
    )


# ── Internals ────────────────────────────────────────────────────────────────
async def _issue_pair(
    session: AsyncSession,
    *,
    actor_id: str,
    subject_kind: str,
    bound_person_id: str | None = None,
    family_id: str | None = None,
) -> TokenPair:
    access, access_claims = tokens.issue_access(
        actor_id, subject_kind=subject_kind, bound_person_id=bound_person_id
    )
    refresh_token, refresh_claims = tokens.issue_refresh(
        actor_id, subject_kind=subject_kind, bound_person_id=bound_person_id
    )

    session.add(
        RefreshSessionORM(
            actor_id=actor_id,
            jti=refresh_claims.jti,
            family_id=family_id or uuid.uuid4().hex,
            subject_kind=subject_kind,
            bound_person_id=bound_person_id,
            expires_at=refresh_claims.expires_at,
        )
    )
    await session.flush()

    return TokenPair(
        access_token=access,
        refresh_token=refresh_token,
        expires_at=access_claims.expires_at,
    )


async def _revoke_family(session: AsyncSession, family_id: str, *, reason: str) -> None:
    rows = (
        await session.execute(
            select(RefreshSessionORM).where(
                RefreshSessionORM.family_id == family_id,
                RefreshSessionORM.revoked.is_(False),
            )
        )
    ).scalars().all()
    for row in rows:
        row.revoked = True
        row.revoked_reason = reason
    await session.flush()


async def _revoke_family_independently(family_id: str, *, reason: str) -> None:
    """Revoke a token family in its own transaction.

    Used only on theft detection, where the caller is about to raise and the
    request transaction is about to be discarded.
    """
    from app.core.db import AsyncSessionLocal

    async with AsyncSessionLocal() as independent:
        await _revoke_family(independent, family_id, reason=reason)
        await independent.commit()


async def _audit_auth(
    session: AsyncSession,
    *,
    actor_id: str,
    effect: str,
    reason: str,
    subject_person_id: str | None = None,
    is_violation: bool = False,
) -> None:
    session.add(
        AuditLog(
            event_type="auth",
            actor_id=actor_id,
            actor_role=Role.SYSTEM.value,
            subject_person_id=subject_person_id or actor_id,
            category="identity",
            action="read",
            purpose="self_access",
            effect=effect,
            reason_codes=[reason],
            obligations=["audit"],
            is_violation=is_violation,
        )
    )
