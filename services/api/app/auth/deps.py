"""The authorization boundary. This is the file that makes the firewall real.

Before this module existed, every endpoint took `person_id` — and in one case
`actor_id` — as a client-supplied string, so the Memory Firewall was faithfully
answering "may a primary caregiver read this?" about an identity the caller had
simply asserted. The policy was correct and the input was forged.

The rule enforced here: **an `Actor` can only be constructed from an
authenticated principal plus a care relationship read from the database.** No
request body, query string or path segment can produce one. Handlers receive an
`Actor` or they receive nothing.

Two deliberate choices:

* A caller with no relationship to a person gets **404, not 403**. A 403 would
  confirm that the person exists, which is itself a disclosure — the same
  "absent, not disabled" rule DESIGN.md B2 applies to navigation.
* Every refused attempt is written to the audit log in its own transaction, so
  the record survives the rejection. A refused access attempt is precisely what
  the safeguarding queue is looking for.
"""

from __future__ import annotations

from typing import Annotated

from fastapi import Depends, HTTPException, Request, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.audit_db import record_audit_independently
from app.core.db import get_session
from app.firewall.models import Actor
from app.firewall.roles import Purpose, Role
from app.identity.service import resolve_role

from . import tokens
from .models import Principal

_bearer = HTTPBearer(auto_error=False, description="Bearer access token")

Session = Annotated[AsyncSession, Depends(get_session)]

# A neutral message. It says nothing about whether the person exists, whether a
# relationship once existed, or what would have been visible.
_NOT_FOUND = "No such record is available to you."


async def current_principal(
    credentials: Annotated[HTTPAuthorizationCredentials | None, Depends(_bearer)],
) -> Principal:
    """Decode the bearer access token. Identity only — never a role."""
    if credentials is None or not credentials.credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Sign in to continue.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    try:
        claims = tokens.decode(credentials.credentials, expect="access")
    except tokens.TokenError as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Your session has expired. Please sign in again.",
            headers={"WWW-Authenticate": "Bearer"},
        ) from exc

    return Principal(
        actor_id=claims.actor_id,
        subject_kind=claims.subject_kind,  # type: ignore[arg-type]
        bound_person_id=claims.bound_person_id,
        token_id=claims.jti,
    )


CurrentPrincipal = Annotated[Principal, Depends(current_principal)]


async def authorize(
    session: AsyncSession,
    principal: Principal,
    person_id: str,
    *,
    purpose: Purpose = Purpose.CARE_COORDINATION,
) -> Actor:
    """Resolve this principal's role for this person, server-side.

    Raises 404 when no active care relationship exists. The returned `Actor` is
    the only value the Memory Firewall should ever be handed.
    """
    # A device token is bound to exactly one person. Even if the underlying
    # actor holds other relationships, the tablet in the living room may not
    # reach them.
    if principal.bound_person_id and principal.bound_person_id != person_id:
        await _audit_refusal(
            principal, person_id, purpose, reason="device_token_person_mismatch", violation=True
        )
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=_NOT_FOUND)

    role = await resolve_role(session, person_id, principal.actor_id)
    if role is None:
        await _audit_refusal(
            principal, person_id, purpose, reason="no_care_relationship", violation=True
        )
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=_NOT_FOUND)

    # ADMIN is a platform role, not a care role. It never reaches person data.
    if role is Role.ADMIN:
        await _audit_refusal(
            principal, person_id, purpose, reason="admin_is_not_a_care_role", violation=True
        )
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=_NOT_FOUND)

    return Actor(actor_id=principal.actor_id, role=role, subject_person_id=person_id)


def actor_for(purpose: Purpose):
    """Build a dependency that authorizes the `person_id` path parameter.

    Usage:
        CaregiverActor = Annotated[Actor, Depends(actor_for(Purpose.CARE_COORDINATION))]

        @router.get("/persons/{person_id}/today")
        async def today(actor: CaregiverActor) -> ...:
            ...

    `person_id` is bound by FastAPI from the path, then immediately checked
    against the database. The handler never sees an unauthorized identifier.
    """

    async def _dependency(
        person_id: str,
        principal: CurrentPrincipal,
        session: Session,
    ) -> Actor:
        return await authorize(session, principal, person_id, purpose=purpose)

    return _dependency


def require_role(*allowed: Role):
    """Narrow an authorized actor to specific roles.

    Used where a whole surface belongs to one role — the clinical drill-down is
    not something a caregiver should reach even for a person they care for.
    """

    async def _dependency(
        person_id: str,
        principal: CurrentPrincipal,
        session: Session,
    ) -> Actor:
        actor = await authorize(session, principal, person_id)
        if actor.role not in allowed:
            await _audit_refusal(
                principal,
                person_id,
                Purpose.CARE_COORDINATION,
                reason=f"role_not_permitted:{actor.role.value}",
                violation=False,
            )
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=_NOT_FOUND)
        return actor

    return _dependency


# Ready-made annotations for the common purposes.
SelfActor = Annotated[Actor, Depends(actor_for(Purpose.SELF_ACCESS))]
CareActor = Annotated[Actor, Depends(actor_for(Purpose.CARE_COORDINATION))]
PersonalisationActor = Annotated[Actor, Depends(actor_for(Purpose.PERSONALISATION))]
ClinicalActor = Annotated[Actor, Depends(require_role(Role.CLINICIAN))]


async def _audit_refusal(
    principal: Principal,
    person_id: str,
    purpose: Purpose,
    *,
    reason: str,
    violation: bool,
) -> None:
    await record_audit_independently(
        event_type="authorization_refused",
        actor_id=principal.actor_id,
        actor_role=Role.SYSTEM.value,  # no role was established — that is the point
        subject_person_id=person_id,
        category="identity",
        action="read",
        purpose=purpose.value,
        effect="deny",
        reason_codes=[reason],
        is_violation=violation,
    )


def client_fingerprint(request: Request) -> str:
    """A coarse client descriptor for session rows. Never an identifier."""
    agent = request.headers.get("user-agent", "")
    return agent[:256]
