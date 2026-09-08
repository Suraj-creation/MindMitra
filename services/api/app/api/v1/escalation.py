"""Escalation API — evaluate a person, fetch the caregiver card, record feedback.

The caregiver card is a projection, so it is bound to the caller's own role:
the endpoint returns the card *you* are entitled to, never one you named. A CHW
holding a relationship to the same person gets their own view from the
projection endpoints, not this one.

Feedback closes the loop (tech-stack §22.1.5). "Expected, there was a reason"
writes a context annotation that widens this household's baseline tolerance, so
it must be attributable to a real actor — an anonymous caller could otherwise
suppress a household's alerts.
"""

from __future__ import annotations

from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.deps import CareActor, CurrentPrincipal, authorize
from app.core.db import get_session
from app.escalation import service
from app.escalation.models import Alert, AlertFeedback, CaregiverCard
from app.firewall.roles import Role

router = APIRouter(tags=["escalation"])

Session = Annotated[AsyncSession, Depends(get_session)]

# Roles for whom a caregiver card is the right artefact. The person is never
# alerted about themselves (CLAUDE.md invariant, projection budget person=0).
_CARD_ROLES = frozenset({Role.PRIMARY_CAREGIVER, Role.SECONDARY_CAREGIVER})


class EvaluateResponse(BaseModel):
    person_id: str
    alert: Alert | None
    message: str


@router.post("/persons/{person_id}/evaluate", response_model=EvaluateResponse)
async def evaluate(
    actor: CareActor, session: Session, domain: str = "memory"
) -> EvaluateResponse:
    alert = await service.evaluate_person(session, actor.subject_person_id, domain=domain)
    msg = (
        f"Alert {alert.level} raised for {domain}."
        if alert
        else "No alert — within the person's own pattern, or insufficient quality-gated data."
    )
    return EvaluateResponse(person_id=actor.subject_person_id, alert=alert, message=msg)


@router.get("/persons/{person_id}/caregiver-card", response_model=CaregiverCard)
async def caregiver_card(
    actor: CareActor, session: Session, domain: str = "memory"
) -> CaregiverCard:
    if actor.role not in _CARD_ROLES:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No such record is available to you.",
        )
    return await service.build_caregiver_card(session, actor.subject_person_id, domain=domain)


@router.post("/alerts/{alert_id}/feedback", response_model=Alert)
async def alert_feedback(
    alert_id: str,
    body: AlertFeedback,
    principal: CurrentPrincipal,
    session: Session,
) -> Alert:
    """Record how useful an alert was.

    The alert's own person is read first so the caller can be authorized against
    it — an alert id must not be a way to reach a household you have no
    relationship with.
    """
    alert = await service.get_alert(session, alert_id)
    if alert is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Not found.")

    await authorize(session, principal, alert.person_id)

    updated = await service.record_feedback(session, alert_id, body.feedback)
    if updated is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Not found.")
    return updated
