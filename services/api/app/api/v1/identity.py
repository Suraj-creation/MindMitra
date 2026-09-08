"""Identity API — persons, actor accounts, care relationships, consent.

Consent is the sharpest surface here. Before authentication existed, any
anonymous caller could revoke anyone's consent, and any caller could grant
themselves access to any person. Both are now bound to the person: **only the
person, or a primary caregiver acting on their behalf, may change a consent
grant**, and a caregiver can never widen their own scope silently — DESIGN.md
B3.3 forbids self-service scope expansion, and every change is already audited
by the identity service.

Onboarding endpoints (creating persons, actors and relationships) are the
bootstrap path. Outside dev they belong to an invitation flow, so they are
restricted rather than left open.
"""

from __future__ import annotations

from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.deps import CurrentPrincipal, authorize
from app.core.config import get_settings
from app.core.db import get_session
from app.firewall.roles import Purpose, Role
from app.identity import service
from app.identity.models import (
    ActorAccount,
    ActorCreate,
    CareRelationship,
    CareRelationshipCreate,
    ConsentGrantRequest,
    ConsentGrantView,
    ConsentList,
    Person,
    PersonCreate,
)

router = APIRouter(prefix="/identity", tags=["identity"])

Session = Annotated[AsyncSession, Depends(get_session)]

# Who may change what the person shares. The person is always able to; a primary
# caregiver may act on their behalf where the person cannot manage it themselves.
_MAY_MANAGE_CONSENT = frozenset({Role.PERSON, Role.PRIMARY_CAREGIVER})


def _require_dev(action: str) -> None:
    if get_settings().app_env != "dev":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"{action} happens through the invitation flow.",
        )


@router.post("/persons", response_model=Person, status_code=201)
async def create_person(data: PersonCreate, session: Session) -> Person:
    _require_dev("Registering a person")
    return await service.create_person(session, data)


@router.get("/persons/{person_id}", response_model=Person)
async def get_person(
    person_id: str, principal: CurrentPrincipal, session: Session
) -> Person:
    # Resolving the actor first means a stranger gets the same 404 whether or
    # not the person exists.
    actor = await authorize(session, principal, person_id, purpose=Purpose.CARE_COORDINATION)
    person = await service.get_person(session, actor.subject_person_id)
    if person is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Not found.")
    return person


@router.post("/actors", response_model=ActorAccount, status_code=201)
async def create_actor(data: ActorCreate, session: Session) -> ActorAccount:
    _require_dev("Creating an account")
    return await service.create_actor(session, data)


@router.post("/relationships", response_model=CareRelationship, status_code=201)
async def link_relationship(
    data: CareRelationshipCreate, session: Session
) -> CareRelationship:
    """Bind an actor to a person with a role.

    This is the single most privileged write in the system: it is what grants
    anybody access to anybody. It is a bootstrap/seed path, not a runtime one —
    in a real deployment a person or their primary caregiver issues an
    invitation, which is a Phase-2 flow.
    """
    _require_dev("Linking a care relationship")
    return await service.link_care(
        session, actor_id=data.actor_id, person_id=data.person_id, role=data.role
    )


async def _authorize_consent_change(
    session: AsyncSession, principal, person_id: str
) -> None:
    actor = await authorize(session, principal, person_id, purpose=Purpose.SELF_ACCESS)
    if actor.role not in _MAY_MANAGE_CONSENT:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only the person or their primary caregiver can change sharing.",
        )


@router.post("/consent/grant", response_model=ConsentGrantView, status_code=201)
async def grant_consent(
    req: ConsentGrantRequest, principal: CurrentPrincipal, session: Session
) -> ConsentGrantView:
    await _authorize_consent_change(session, principal, req.person_id)
    return await service.grant_consent(
        session,
        person_id=req.person_id,
        grantee_role=req.grantee_role,
        category=req.category,
        purpose=req.purpose,
    )


@router.post("/consent/revoke", response_model=ConsentGrantView)
async def revoke_consent(
    req: ConsentGrantRequest, principal: CurrentPrincipal, session: Session
) -> ConsentGrantView:
    """Revocation is always available and never blocked (DESIGN.md F7)."""
    await _authorize_consent_change(session, principal, req.person_id)
    result = await service.revoke_consent(
        session,
        person_id=req.person_id,
        grantee_role=req.grantee_role,
        category=req.category,
        purpose=req.purpose,
    )
    if result is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="No such sharing setting."
        )
    return result


@router.get("/persons/{person_id}/consent", response_model=ConsentList)
async def list_consent(
    person_id: str, principal: CurrentPrincipal, session: Session
) -> ConsentList:
    """What is shared, and with whom. The person's transparency view (E5.3)."""
    actor = await authorize(session, principal, person_id, purpose=Purpose.SELF_ACCESS)
    if actor.role not in _MAY_MANAGE_CONSENT:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Not found."
        )
    grants = await service.list_consent(session, actor.subject_person_id)
    return ConsentList(person_id=actor.subject_person_id, grants=grants)
