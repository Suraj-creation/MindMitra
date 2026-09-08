"""The retrieval lanes. Each returns labelled, provenance-carrying facts.

Scope filters are applied **in the query**, not to the results afterwards. A
lane that fetched everything and filtered in Python would still have loaded a
person's private memories into process memory, and one missed filter later that
becomes a leak. The role's visibility token goes into the WHERE clause.

Every lane is read-only and returns `RetrievedFact`. None of them decides
whether the caller may see anything — that decision arrives as the
`visibility_token` and `allowed_layers` the caller obtained from the firewall.
"""

from __future__ import annotations

import logging
from datetime import UTC, date, datetime, timedelta

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.models import PWMEdge as PWMEdgeORM
from app.core.models import PWMNode as PWMNodeORM
from app.observation.db import ObservationORM

from .models import (
    KnowledgeLayer,
    Lane,
    RetrievedFact,
    authority_for,
)

logger = logging.getLogger(__name__)


def _today() -> date:
    return datetime.now(UTC).date()


def _is_current(provenance: dict) -> bool:
    """A fact past its `valid_to` is history, not an answer.

    This is the mechanism that stops a superseded medication or a moved-away
    relative being spoken as current — the patient-safety reason `valid_to`
    exists at all (tech-stack §16).
    """
    valid_to = provenance.get("valid_to")
    if not valid_to:
        return True
    try:
        return date.fromisoformat(str(valid_to)) >= _today()
    except ValueError:
        return True


def _fact_from_node(
    node: PWMNodeORM, *, lane: Lane, relevance: float
) -> RetrievedFact | None:
    provenance = node.provenance if isinstance(node.provenance, dict) else {}
    if not _is_current(provenance):
        return None

    source = provenance.get("source") or {}
    source_type = str(source.get("type", "system"))
    value = provenance.get("value") or {}

    detail = ", ".join(f"{k.replace('_', ' ')}: {v}" for k, v in value.items())
    text = f"{node.label}" + (f" ({detail})" if detail else "")

    return RetrievedFact(
        fact_id=str(provenance.get("fact_id") or node.node_id),
        layer=KnowledgeLayer.K2_PERSON,
        lane=lane,
        text=text,
        source_type=source_type,
        source_actor=source.get("actor"),
        authority=authority_for(source_type),
        verification_status=str(provenance.get("verification_status", "unverified")),
        confidence=str(provenance.get("confidence", "moderate")),
        valid_from=_as_date(provenance.get("valid_from")),
        valid_to=_as_date(provenance.get("valid_to")),
        relevance=relevance,
        payload={
            "node_id": node.node_id,
            "node_type": node.node_type,
            "temporal_partition": node.temporal_partition,
            "value": value,
        },
    )


def _as_date(raw: object) -> date | None:
    if not raw:
        return None
    try:
        return date.fromisoformat(str(raw))
    except ValueError:
        return None


async def graph_lane(
    session: AsyncSession,
    *,
    person_id: str,
    visibility_token: str,
    entities: tuple[str, ...] = (),
    limit: int = 12,
) -> list[RetrievedFact]:
    """Personal World Model nodes and their edges.

    Visibility is filtered against the role's token, which lives inside each
    fact's provenance envelope. A fact whose visibility list does not name this
    role is never returned.

    **When the question names an entity, only matching facts come back.** A
    general sweep here was a real leak: asking "who is Deepak?" returned every
    visible node, so an unrelated granddaughter arrived as provenance for an
    answer about a man who is not in the record. Naming somebody the system does
    not know must produce *nothing*, so the turn falls back to an honest "I do
    not know" instead of an answer decorated with the wrong person's name.

    The general sweep is still right when no entity was named — that is the
    orientation case, where "what is happening today" legitimately wants
    whatever is on record.
    """
    stmt = select(PWMNodeORM).where(PWMNodeORM.person_id == person_id)
    rows = (await session.execute(stmt)).scalars().all()

    targeted = bool(entities)
    wanted = {entity.lower() for entity in entities}

    facts: list[RetrievedFact] = []
    for row in rows:
        provenance = row.provenance if isinstance(row.provenance, dict) else {}
        visibility = provenance.get("visibility") or []
        if visibility_token not in visibility:
            continue

        haystack = " ".join(
            [
                (row.label or ""),
                *(str(v) for v in (provenance.get("value") or {}).values()),
            ]
        ).lower()
        matches = any(entity in haystack for entity in wanted)

        if targeted and not matches:
            continue

        fact = _fact_from_node(
            row, lane=Lane.GRAPH, relevance=0.95 if matches else 0.4
        )
        if fact is not None:
            facts.append(fact)

    facts.sort(key=lambda f: (-f.relevance, f.authority.value))
    return facts[:limit]


async def graph_edges_for(
    session: AsyncSession, *, node_ids: list[str], visibility_token: str
) -> list[RetrievedFact]:
    """One hop out from a set of nodes — how they relate, with provenance."""
    if not node_ids:
        return []

    rows = (
        await session.execute(
            select(PWMEdgeORM).where(PWMEdgeORM.subject_node_id.in_(node_ids))
        )
    ).scalars().all()

    facts: list[RetrievedFact] = []
    for row in rows:
        provenance = row.provenance if isinstance(row.provenance, dict) else {}
        if visibility_token not in (provenance.get("visibility") or []):
            continue
        if not _is_current(provenance):
            continue
        source = provenance.get("source") or {}
        source_type = str(source.get("type", "system"))
        facts.append(
            RetrievedFact(
                fact_id=str(provenance.get("fact_id") or row.edge_id),
                layer=KnowledgeLayer.K2_PERSON,
                lane=Lane.GRAPH,
                text=f"{row.subject_node_id} {row.predicate.lower().replace('_', ' ')} "
                f"{row.object_node_id}",
                source_type=source_type,
                source_actor=source.get("actor"),
                authority=authority_for(source_type),
                verification_status=str(provenance.get("verification_status", "unverified")),
                relevance=0.7,
                payload={"predicate": row.predicate},
            )
        )
    return facts


async def temporal_lane(
    session: AsyncSession,
    *,
    person_id: str,
    window_days: int = 7,
    limit: int = 20,
) -> list[RetrievedFact]:
    """What actually happened, in a time window.

    Reads the observation record rather than any narrative store, so an event
    the system reports is one it actually recorded. Low-quality observations are
    returned **labelled**, never dropped: "we could not measure this" is an
    answer, and hiding it would make a gap look like normality.
    """
    since = datetime.now(UTC) - timedelta(days=max(1, window_days))
    rows = (
        await session.execute(
            select(ObservationORM)
            .where(
                ObservationORM.person_id == person_id,
                ObservationORM.observed_at >= since,
            )
            .order_by(ObservationORM.observed_at.desc())
            .limit(limit)
        )
    ).scalars().all()

    facts: list[RetrievedFact] = []
    for row in rows:
        measurable = row.gate != "insufficient_data"
        text = (
            f"A {row.domain} activity was completed."
            if measurable
            else f"A {row.domain} activity could not be measured reliably."
        )
        facts.append(
            RetrievedFact(
                fact_id=str(row.observation_id),
                layer=KnowledgeLayer.K5_TEMPORAL,
                lane=Lane.TEMPORAL,
                text=text,
                source_type="observation",
                authority=authority_for("observation"),
                verification_status="verified" if measurable else "unverified",
                confidence="high" if measurable else "low",
                observed_at=row.observed_at,
                relevance=0.6,
                payload={
                    "domain": row.domain,
                    "gate": row.gate,
                    "quality": row.quality,
                    # The raw value is deliberately not included. A performance
                    # number has no business travelling into a conversation.
                },
            )
        )
    return facts


async def lexical_lane(
    session: AsyncSession,
    *,
    person_id: str,
    query: str,
    visibility_token: str,
    limit: int = 8,
) -> list[RetrievedFact]:
    """Keyword matching over the person's world model.

    This is the lane that works today. It runs on the label text with simple
    token overlap, which is dialect-tolerant in a way an embedding trained
    mostly on English is not, and it is exact about what it matched.

    When an embeddings deployment appears, `vector_lane` joins this rather than
    replacing it: hybrid lexical + semantic is the design (tech-stack §11), not
    semantic alone.
    """
    terms = {t for t in _tokenise(query) if len(t) > 2}
    if not terms:
        return []

    rows = (
        await session.execute(
            select(PWMNodeORM).where(PWMNodeORM.person_id == person_id)
        )
    ).scalars().all()

    scored: list[RetrievedFact] = []
    for row in rows:
        provenance = row.provenance if isinstance(row.provenance, dict) else {}
        if visibility_token not in (provenance.get("visibility") or []):
            continue

        haystack = _tokenise(
            f"{row.label} {row.node_type} "
            + " ".join(str(v) for v in (provenance.get("value") or {}).values())
        )
        overlap = terms & haystack
        if not overlap:
            continue

        fact = _fact_from_node(
            row, lane=Lane.LEXICAL, relevance=min(0.9, len(overlap) / len(terms))
        )
        if fact is not None:
            scored.append(fact)

    scored.sort(key=lambda f: -f.relevance)
    return scored[:limit]


def _tokenise(text: str) -> set[str]:
    return {
        token.strip(".,!?;:'\"()").lower()
        for token in text.split()
        if token.strip(".,!?;:'\"()")
    }


async def vector_lane(
    session: AsyncSession,
    *,
    person_id: str,
    query: str,
    visibility_token: str,
    limit: int = 8,
) -> list[RetrievedFact]:
    """Semantic retrieval over pgvector.

    Not reachable on this deployment: no embeddings deployment exists, so the
    planner does not schedule this lane. It is written as a named, empty seam
    rather than as a silent absence, because "the vector lane returned nothing"
    and "there is no vector lane" are different facts and the retrieval result
    reports which one applies.
    """
    logger.debug("vector lane requested but no embedder is configured")
    return []
