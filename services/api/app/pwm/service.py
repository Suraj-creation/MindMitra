"""PWM services — create nodes/edges and read a fact under Memory-Firewall control.

`attempt_read_pwm_fact` is the end-to-end demonstration of the safety spine:

    resolve role (identity) → resolve consent (identity) →
    build Actor/Resource/RequestContext → firewall.enforce_async (audits) →
    return the fact only if the firewall allowed it.

The read is deliberately non-raising for the demo surface: it returns a
ReadOutcome carrying the decision either way, so the UI can show *why* a read
was denied. A production data endpoint would translate a deny into HTTP 403.
"""

from __future__ import annotations

from dataclasses import dataclass

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.audit_db import SQLAlchemyAuditSink, enforce_async
from app.core.models import AuditLog
from app.core.models import PWMEdge as PWMEdgeORM
from app.core.models import PWMNode as PWMNodeORM
from app.firewall.audit import FirewallDenied
from app.firewall.models import Actor, RequestContext, Resource
from app.firewall.roles import Action, DataCategory, EscalationLevel, Purpose
from app.identity.service import resolve_consent, resolve_role

from .models import ProvenanceEnvelope, PWMEdge, PWMNode


@dataclass(frozen=True)
class ReadOutcome:
    """The result of an attempted PWM fact read."""

    found: bool
    allowed: bool
    reason_codes: tuple[str, ...]
    obligations: tuple[str, ...]
    fact: ProvenanceEnvelope | None


# ── Writes ────────────────────────────────────────────────────────────────────
async def create_node(session: AsyncSession, node: PWMNode) -> PWMNode:
    session.add(
        PWMNodeORM(
            node_id=node.node_id,
            person_id=node.person_id,
            node_type=node.node_type,
            temporal_partition=node.temporal_partition,
            label=node.label,
            provenance=node.provenance.model_dump(mode="json"),
        )
    )
    await session.flush()
    return node


async def create_edge(session: AsyncSession, edge: PWMEdge) -> PWMEdge:
    session.add(
        PWMEdgeORM(
            edge_id=edge.edge_id,
            subject_node_id=edge.subject_node_id,
            predicate=edge.predicate,
            object_node_id=edge.object_node_id,
            provenance=edge.provenance.model_dump(mode="json"),
        )
    )
    await session.flush()
    return edge


# ── Firewall-enforced read ───────────────────────────────────────────────────
async def attempt_read_pwm_fact(
    session: AsyncSession,
    *,
    actor_id: str,
    person_id: str,
    fact_id: str,
    purpose: Purpose,
    escalation: EscalationLevel = EscalationLevel.L0,
) -> ReadOutcome:
    """Attempt to read a PWM fact. The Memory Firewall makes the decision."""
    prov_dict = await _find_provenance_by_fact_id(session, person_id, fact_id)
    if prov_dict is None:
        return ReadOutcome(
            found=False,
            allowed=False,
            reason_codes=("fact_not_found",),
            obligations=(),
            fact=None,
        )

    visibility = tuple(prov_dict.get("visibility", ()) or ())
    clinical_relevance = bool(prov_dict.get("clinical_relevance", False))

    role = await resolve_role(session, person_id, actor_id)
    if role is None:
        # Stranger — no care relationship. Deny and audit directly (no firewall
        # Role exists for an unknown actor).
        await _audit_unknown_actor(session, actor_id, person_id, fact_id, purpose)
        return ReadOutcome(
            found=True,
            allowed=False,
            reason_codes=("no_care_relationship",),
            obligations=("audit",),
            fact=None,
        )

    consent = await resolve_consent(
        session,
        person_id=person_id,
        role=role,
        category=DataCategory.PWM_FACT,
        purpose=purpose,
    )

    actor = Actor(actor_id=actor_id, role=role, subject_person_id=person_id)
    resource = Resource(
        category=DataCategory.PWM_FACT,
        subject_person_id=person_id,
        resource_id=fact_id,
        visibility=visibility,
        clinical_relevance=clinical_relevance,
    )
    context = RequestContext(
        action=Action.READ,
        purpose=purpose,
        active_escalation=escalation,
        consent=consent,
    )

    sink = SQLAlchemyAuditSink(session)
    try:
        decision = await enforce_async(actor, resource, context, sink)
    except FirewallDenied as exc:
        return ReadOutcome(
            found=True,
            allowed=False,
            reason_codes=exc.decision.reason_codes,
            obligations=exc.decision.obligations,
            fact=None,
        )

    return ReadOutcome(
        found=True,
        allowed=True,
        reason_codes=decision.reason_codes,
        obligations=decision.obligations,
        fact=ProvenanceEnvelope.model_validate(prov_dict),
    )


# ── Internals ─────────────────────────────────────────────────────────────────
async def _find_provenance_by_fact_id(
    session: AsyncSession, person_id: str, fact_id: str
) -> dict | None:
    """Find a node or edge for this person whose provenance carries the fact_id.

    Filters the fact_id in Python to stay portable across SQLite/Postgres JSON.
    """
    nodes = (
        await session.execute(
            select(PWMNodeORM).where(PWMNodeORM.person_id == person_id)
        )
    ).scalars().all()
    for n in nodes:
        prov = n.provenance
        if isinstance(prov, dict) and prov.get("fact_id") == fact_id:
            return prov

    edges = (await session.execute(select(PWMEdgeORM))).scalars().all()
    for e in edges:
        prov = e.provenance
        if (
            isinstance(prov, dict)
            and prov.get("fact_id") == fact_id
            and prov.get("subject", "").endswith(person_id)
        ):
            return prov

    return None


async def _audit_unknown_actor(
    session: AsyncSession,
    actor_id: str,
    person_id: str,
    fact_id: str,
    purpose: Purpose,
) -> None:
    session.add(
        AuditLog(
            event_type="firewall_decision",
            actor_id=actor_id,
            actor_role="unknown",
            subject_person_id=person_id,
            category=DataCategory.PWM_FACT.value,
            action=Action.READ.value,
            purpose=purpose.value,
            effect="deny",
            reason_codes=["no_care_relationship"],
            obligations=["audit"],
            is_violation=False,
        )
    )
    await session.flush()
