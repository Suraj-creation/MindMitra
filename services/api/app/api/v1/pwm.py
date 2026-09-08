"""PWM API — create facts, and read a fact under Memory-Firewall control.

The read endpoint is the live demonstration of the safety spine: it returns the
firewall decision either way (allowed + reason_codes), and includes the fact
content only when the firewall allowed the read.
"""

from __future__ import annotations

from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.deps import CurrentPrincipal, authorize
from app.core.db import get_session
from app.firewall.roles import EscalationLevel, Purpose, Role
from app.pwm import ProvenanceEnvelope, PWMEdge, PWMNode, attempt_read_pwm_fact
from app.pwm.service import create_edge, create_node

router = APIRouter(prefix="/pwm", tags=["pwm"])

Session = Annotated[AsyncSession, Depends(get_session)]

# Who may add to a person's world model. The person is authoritative about her
# own life; a caregiver or CHW may contribute during onboarding. A clinician
# annotates the clinical record, not the life story.
_MAY_WRITE_PWM = frozenset(
    {Role.PERSON, Role.PRIMARY_CAREGIVER, Role.SECONDARY_CAREGIVER, Role.CHW}
)


async def _authorize_pwm_write(
    session: AsyncSession, principal, person_id: str
):
    actor = await authorize(session, principal, person_id, purpose=Purpose.ONBOARDING)
    if actor.role not in _MAY_WRITE_PWM:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="This role cannot add to a person's world model.",
        )
    return actor


@router.post("/nodes", response_model=PWMNode, status_code=201)
async def post_node(
    node: PWMNode, principal: CurrentPrincipal, session: Session
) -> PWMNode:
    await _authorize_pwm_write(session, principal, node.person_id)
    return await create_node(session, node)


@router.post("/edges", response_model=PWMEdge, status_code=201)
async def post_edge(
    edge: PWMEdge, principal: CurrentPrincipal, session: Session
) -> PWMEdge:
    # An edge's subject node carries the person; derive rather than trust a body
    # field, so an edge cannot be attached to somebody else's graph.
    person_id = await _person_for_node(session, edge.subject_node_id)
    if person_id is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Unknown subject node."
        )
    await _authorize_pwm_write(session, principal, person_id)
    return await create_edge(session, edge)


async def _person_for_node(session: AsyncSession, node_id: str) -> str | None:
    from app.core.models import PWMNode as PWMNodeORM

    row = await session.get(PWMNodeORM, node_id)
    return row.person_id if row else None


class PwmReadRequest(BaseModel):
    """A fact read request.

    There is deliberately **no `actor_id` field**. It used to be here, and it
    meant the Memory Firewall was evaluating an identity the caller had simply
    typed. The actor now comes from the bearer token plus a care relationship
    read from the database, and nothing in this body can influence it.
    """

    person_id: str
    fact_id: str
    purpose: Purpose = Purpose.PERSONALISATION
    escalation: EscalationLevel = EscalationLevel.L0


class PwmReadResponse(BaseModel):
    found: bool
    allowed: bool
    reason_codes: list[str]
    obligations: list[str]
    fact: ProvenanceEnvelope | None = None
    explanation: str


@router.post("/read", response_model=PwmReadResponse)
async def read_fact(
    req: PwmReadRequest, principal: CurrentPrincipal, session: Session
) -> PwmReadResponse:
    """Attempt to read a PWM fact through the Memory Firewall.

    `authorize` establishes the caller's role for this person from the database
    and raises 404 if they have none, so a stranger never reaches the firewall
    at all. Beyond that boundary, every attempt — allowed or denied — is audited,
    and the response carries the decision reason so the UI can explain *why*
    access was granted or refused (DESIGN.md E5.2).
    """
    actor = await authorize(
        session, principal, req.person_id, purpose=req.purpose
    )

    outcome = await attempt_read_pwm_fact(
        session,
        actor_id=actor.actor_id,
        person_id=actor.subject_person_id,
        fact_id=req.fact_id,
        purpose=req.purpose,
        escalation=req.escalation,
    )

    if not outcome.found:
        explanation = f"No fact '{req.fact_id}' exists for {req.person_id}."
    elif outcome.allowed:
        explanation = (
            "The Memory Firewall ALLOWED this read: the actor's role is in the "
            "fact's visibility scope, the purpose is permitted, and consent is present."
        )
    else:
        explanation = (
            "The Memory Firewall DENIED this read. The fact content is withheld. "
            f"Reason(s): {', '.join(outcome.reason_codes)}."
        )

    return PwmReadResponse(
        found=outcome.found,
        allowed=outcome.allowed,
        reason_codes=list(outcome.reason_codes),
        obligations=list(outcome.obligations),
        fact=outcome.fact,
        explanation=explanation,
    )
