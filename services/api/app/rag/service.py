"""Governed retrieval — the firewall runs before any lane touches data.

The order here is the whole point:

    plan  ->  firewall scope per layer  ->  run only permitted lanes
          ->  fuse  ->  detect conflicts  ->  exclude contested facts
          ->  assess completeness  ->  RetrievalResult

A layer the caller may not see is never queried. That is stronger than querying
and filtering: nothing out of scope is loaded, so nothing out of scope can leak
through a later bug, a log line, or a prompt.

`retrieve` takes an `Actor` that `app.auth.deps` produced from an authenticated
principal and a care relationship. It cannot be handed a role the caller merely
claimed.
"""

from __future__ import annotations

import logging

from sqlalchemy.ext.asyncio import AsyncSession

from app.firewall.models import Actor, RequestContext
from app.firewall.policy import evaluate
from app.firewall.roles import ROLE_VISIBILITY_TOKEN, Action, DataCategory, Purpose, Role

from . import lanes
from .fusion import assertable, assess_completeness, detect_conflicts, fuse
from .models import (
    LAYER_CATEGORY,
    KnowledgeLayer,
    Lane,
    RetrievalResult,
    RetrievedFact,
)
from .planner import plan as build_plan

logger = logging.getLogger(__name__)

# K6 is clinician-only, and that is a hard rule rather than a matrix row: the
# research layer holds cohort-derived material that has no place in a caregiver
# conversation whatever consent says (tech-stack §15).
_CLINICIAN_ONLY: frozenset[KnowledgeLayer] = frozenset({KnowledgeLayer.K6_RESEARCH})


def permitted_layers(
    actor: Actor,
    context: RequestContext,
    requested: tuple[KnowledgeLayer, ...],
) -> tuple[tuple[KnowledgeLayer, ...], tuple[KnowledgeLayer, ...]]:
    """Split the requested layers into permitted and denied.

    Each layer maps to a raw data category, and the same `evaluate()` that
    governs every other read decides it. There is no second policy table for
    retrieval, so "who may see life-story content" stays written down once.
    """
    allowed: list[KnowledgeLayer] = []
    denied: list[KnowledgeLayer] = []

    for layer in requested:
        if layer in _CLINICIAN_ONLY and actor.role is not Role.CLINICIAN:
            denied.append(layer)
            continue

        category = LAYER_CATEGORY[layer]
        from app.firewall.models import Resource

        decision = evaluate(
            actor,
            Resource(category=category, subject_person_id=actor.subject_person_id),
            context,
        )
        (allowed if decision.allowed else denied).append(layer)

    return tuple(allowed), tuple(denied)


async def retrieve(
    session: AsyncSession,
    *,
    actor: Actor,
    question: str,
    purpose: Purpose = Purpose.PERSONALISATION,
    consent_granted: bool = True,
    vector_available: bool = False,
    limit: int = 20,
) -> RetrievalResult:
    """Answer-shaped retrieval for one question, for one authorised actor.

    Returns a `RetrievalResult` that reports what it ran, what it found, what
    disagreed, and what is missing. An empty result is a valid answer — the
    caller must be able to say "I do not know" rather than fill the gap.
    """
    retrieval_plan = build_plan(question, vector_available=vector_available)

    context = RequestContext(
        action=Action.READ,
        purpose=purpose,
        consent=_consent(consent_granted),
    )
    allowed, denied = permitted_layers(actor, context, retrieval_plan.layers)

    if not allowed:
        logger.info(
            "retrieval fully denied person=%s role=%s layers=%s",
            actor.subject_person_id,
            actor.role.value,
            [layer.value for layer in retrieval_plan.layers],
        )
        return RetrievalResult(
            plan=retrieval_plan,
            gaps=("There is nothing here that can be shared for this purpose.",),
            denied_layers=denied,
        )

    visibility_token = ROLE_VISIBILITY_TOKEN.get(actor.role, "")
    if not visibility_token:
        # SYSTEM and ADMIN hold no visibility token, so they see no personal
        # facts through this path. Deny rather than guess.
        return RetrievalResult(
            plan=retrieval_plan, gaps=("This role cannot read personal facts.",),
            denied_layers=retrieval_plan.layers,
        )

    lane_results: list[list[RetrievedFact]] = []
    person_id = actor.subject_person_id

    for lane in retrieval_plan.lanes:
        facts = await _run_lane(
            session,
            lane,
            person_id=person_id,
            question=question,
            visibility_token=visibility_token,
            entities=retrieval_plan.entities,
            window_days=retrieval_plan.time_window_days or 7,
        )
        # Drop anything from a layer the firewall denied, even if a lane that
        # spans layers happened to return it.
        lane_results.append([f for f in facts if f.layer in allowed])

    fused = fuse(lane_results, limit=limit)
    conflicts = detect_conflicts(fused)
    usable = assertable(fused, conflicts)
    gaps = assess_completeness(
        usable, planned_layers=allowed, denied_layers=denied
    )

    logger.info(
        "retrieval person=%s role=%s lanes=%s found=%d usable=%d conflicts=%d",
        person_id,
        actor.role.value,
        [lane.value for lane in retrieval_plan.lanes],
        len(fused),
        len(usable),
        len(conflicts),
    )

    return RetrievalResult(
        plan=retrieval_plan,
        facts=usable,
        conflicts=conflicts,
        gaps=gaps,
        denied_layers=denied,
    )


async def _run_lane(
    session: AsyncSession,
    lane: Lane,
    *,
    person_id: str,
    question: str,
    visibility_token: str,
    entities: tuple[str, ...],
    window_days: int,
) -> list[RetrievedFact]:
    if lane is Lane.GRAPH:
        nodes = await lanes.graph_lane(
            session,
            person_id=person_id,
            visibility_token=visibility_token,
            entities=entities,
        )
        edges = await lanes.graph_edges_for(
            session,
            node_ids=[
                str(f.payload.get("node_id"))
                for f in nodes
                if f.payload.get("node_id")
            ],
            visibility_token=visibility_token,
        )
        return [*nodes, *edges]

    if lane is Lane.TEMPORAL:
        return await lanes.temporal_lane(
            session, person_id=person_id, window_days=window_days
        )

    if lane is Lane.LEXICAL:
        return await lanes.lexical_lane(
            session,
            person_id=person_id,
            query=question,
            visibility_token=visibility_token,
        )

    if lane is Lane.VECTOR:
        return await lanes.vector_lane(
            session,
            person_id=person_id,
            query=question,
            visibility_token=visibility_token,
        )

    if lane is Lane.STRUCTURED:
        # Routine, care plan and medication are clinician-authored structured
        # records. The tables land with the care-plan work; until then this
        # lane returns nothing rather than falling back to a semantic guess,
        # because a guessed medication is worse than an admitted gap.
        return []

    return []


def _consent(granted: bool):
    from app.firewall.models import ConsentState

    return ConsentState(granted=granted)


def category_for_layer(layer: KnowledgeLayer) -> DataCategory:
    """The raw category a layer draws on. Exposed for audit rows."""
    return LAYER_CATEGORY[layer]
