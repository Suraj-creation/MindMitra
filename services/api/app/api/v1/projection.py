"""Projection API — one evidence base, four governed views.

Two endpoints, and the difference between them is the whole point.

`GET /persons/{id}/projections/me` is the product endpoint. It returns **only
the caller's own** projection, derived through the full spine, with the caller's
real role and their live consent. This is what every surface calls.

`GET /persons/{id}/projections` is the transparency and audit view: all four
roles side by side, including what was withheld from whom and why. "One truth,
four projections" is not a claim you can demonstrate by showing four separate
screens — you have to derive them in one pass with the omissions visible.

That second view is restricted to the person themself. Letting a caregiver see
what a clinician receives would be a disclosure in its own right, and the
person's right to know who sees what is exactly the right DESIGN.md E5.3/E5.4
grants them.

Consent is resolved per role **at request time**, never hardcoded, because
consent can be revoked between an insight being generated and being delivered.
"""

from __future__ import annotations

from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.deps import CareActor
from app.behaviour import ContextSignals
from app.core.db import get_session
from app.escalation.service import build_statement
from app.firewall.models import Actor, RequestContext
from app.firewall.roles import Action, Purpose, Role
from app.identity.service import resolve_consent_map, resolve_role
from app.projection import ProjectionOutcome, RoleRequest, project_all, project_for_role

router = APIRouter(tags=["projection"])

Session = Annotated[AsyncSession, Depends(get_session)]

ROLE_PURPOSE: dict[Role, Purpose] = {
    Role.PERSON: Purpose.SELF_ACCESS,
    Role.PRIMARY_CAREGIVER: Purpose.CARE_COORDINATION,
    Role.SECONDARY_CAREGIVER: Purpose.CARE_COORDINATION,
    Role.CHW: Purpose.CARE_COORDINATION,
    Role.CLINICIAN: Purpose.CLINICAL_REVIEW,
}


class ProjectionView(BaseModel):
    """What one role receives — or, precisely, what it did not."""

    role: str
    delivery_class: str
    interrupts: bool
    suppressed: bool
    delivery_reasons: tuple[str, ...]

    headline: str | None = None
    facts: tuple[str, ...] = ()
    hypothesis: str | None = None
    actions: tuple[str, ...] = ()
    measurement_confidence: str | None = None
    escalation_level: str | None = None
    claim_ids: tuple[str, ...] = ()

    withheld_at: str | None = None
    withheld_reasons: tuple[str, ...] = ()


class StatementSummary(BaseModel):
    person_id: str
    domain: str
    change_kind: str
    statement: str
    reversible_causes: tuple[str, ...]
    open_questions: tuple[str, ...]
    measurement_confidence: str
    interpretation_withheld: bool


class ProjectionsResponse(StatementSummary):
    views: tuple[ProjectionView, ...]


class MyProjectionResponse(StatementSummary):
    view: ProjectionView


class ContextQuery(BaseModel):
    """Reported context. The system never infers a reversible cause it was not told."""

    sleep_disrupted: bool = False
    hearing_aid_unused: bool = False
    infection_signs: bool = False
    constipation_reported: bool = False


def _to_view(outcome: ProjectionOutcome) -> ProjectionView:
    base = {
        "role": outcome.role.value,
        "delivery_class": outcome.delivery.delivery_class.value,
        "interrupts": outcome.delivery.interrupts,
        "suppressed": outcome.delivery.suppressed,
        "delivery_reasons": outcome.delivery.reason_codes,
    }
    if outcome.projection is None:
        return ProjectionView(
            **base,
            withheld_at=outcome.withheld.stage if outcome.withheld else None,
            withheld_reasons=outcome.withheld.reason_codes if outcome.withheld else (),
        )

    p = outcome.projection
    return ProjectionView(
        **base,
        headline=p.headline,
        facts=tuple(f.content for f in p.output.facts),
        hypothesis=p.output.hypotheses[0].content if p.output.hypotheses else None,
        actions=tuple(a.content for a in p.output.actions),
        measurement_confidence=p.measurement_confidence,
        escalation_level=p.escalation_level.value if p.escalation_level else None,
        claim_ids=p.claim_ids,
    )


def _summary(statement, domain: str) -> dict:
    return {
        "person_id": statement.person_id,
        "domain": domain,
        "change_kind": statement.change_kind.value,
        "statement": statement.statement,
        "reversible_causes": tuple(
            f"[{c.urgency.value}] {c.description} -> {c.check_action}"
            for c in statement.reversible_causes
        ),
        "open_questions": statement.open_questions,
        "measurement_confidence": statement.measurement_confidence,
        "interpretation_withheld": statement.interpretation_withheld,
    }


@router.get("/persons/{person_id}/projections/me", response_model=MyProjectionResponse)
async def my_projection(
    actor: CareActor,
    session: Session,
    domain: str = "memory",
    sleep_disrupted: bool = False,
    hearing_aid_unused: bool = False,
    infection_signs: bool = False,
    constipation_reported: bool = False,
    into_shared_family_view: bool = False,
    care_relevant: bool = True,
) -> MyProjectionResponse:
    """The caller's own projection, and nothing else.

    `actor` was resolved from the authenticated principal plus a care
    relationship read from the database. A role cannot be requested.
    """
    statement = await build_statement(
        session,
        actor.subject_person_id,
        domain,
        reported=ContextSignals(
            sleep_disrupted=sleep_disrupted,
            hearing_aid_unused=hearing_aid_unused,
            infection_signs=infection_signs,
            constipation_reported=constipation_reported,
        ),
    )

    purpose = ROLE_PURPOSE.get(actor.role, Purpose.CARE_COORDINATION)
    consent = await resolve_consent_map(
        session, person_id=actor.subject_person_id, role=actor.role, purpose=purpose
    )

    outcome = project_for_role(
        statement,
        RoleRequest(
            actor=actor,
            context=RequestContext(
                action=Action.READ,
                purpose=purpose,
                into_shared_family_view=into_shared_family_view,
                care_relevant=care_relevant,
            ),
            consent_by_category=consent,
        ),
    )

    return MyProjectionResponse(**_summary(statement, domain), view=_to_view(outcome))


@router.get("/persons/{person_id}/projections", response_model=ProjectionsResponse)
async def projections(
    actor: CareActor,
    session: Session,
    domain: str = "memory",
    sleep_disrupted: bool = False,
    hearing_aid_unused: bool = False,
    infection_signs: bool = False,
    constipation_reported: bool = False,
    into_shared_family_view: bool = False,
    care_relevant: bool = True,
) -> ProjectionsResponse:
    """All four role views of one statement, derived in a single pass.

    Restricted to the person themself. This is their "who can see my things?"
    answer (DESIGN.md E5.3), not a window a caregiver gets into the clinician's
    record.
    """
    if actor.role is not Role.PERSON:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No such record is available to you.",
        )

    person_id = actor.subject_person_id
    statement = await build_statement(
        session,
        person_id,
        domain,
        reported=ContextSignals(
            sleep_disrupted=sleep_disrupted,
            hearing_aid_unused=hearing_aid_unused,
            infection_signs=infection_signs,
            constipation_reported=constipation_reported,
        ),
    )

    requests: list[RoleRequest] = []
    for role, purpose in ROLE_PURPOSE.items():
        # Only roles somebody actually holds for this person are projected. A
        # household with no clinician does not get a hypothetical clinician view.
        holder = await _any_actor_with_role(session, person_id, role)
        if holder is None:
            continue
        consent = await resolve_consent_map(
            session, person_id=person_id, role=role, purpose=purpose
        )
        requests.append(
            RoleRequest(
                actor=Actor(actor_id=holder, role=role, subject_person_id=person_id),
                context=RequestContext(
                    action=Action.READ,
                    purpose=purpose,
                    into_shared_family_view=into_shared_family_view,
                    care_relevant=care_relevant,
                ),
                consent_by_category=consent,
            )
        )

    views = tuple(_to_view(o) for o in project_all(statement, requests))
    return ProjectionsResponse(**_summary(statement, domain), views=views)


async def _any_actor_with_role(
    session: AsyncSession, person_id: str, role: Role
) -> str | None:
    """The id of one actor holding this role for this person, if any."""
    from sqlalchemy import select

    from app.identity.db import CareRelationshipORM

    rows = (
        await session.execute(
            select(CareRelationshipORM).where(
                CareRelationshipORM.person_id == person_id,
                CareRelationshipORM.role == role.value,
            )
        )
    ).scalars().all()
    for row in rows:
        if await resolve_role(session, person_id, row.actor_id) is role:
            return row.actor_id
    return None
