"""The retrieval planner — different knowledge needs different lanes.

Vector search is not the default. "Who is Rina?" is a graph traversal over the
Personal World Model; "what happened last week" is a time-windowed query;
"when do I take the blue tablet" is structured and clinician-owned. Embedding
all four and hoping cosine similarity sorts it out is how a retrieval layer ends
up confidently wrong about a medication.

This module is **pure and deterministic**. No LLM decides which lanes to run,
because lane selection also decides which firewall categories are touched, and
that is an authorization-shaped decision.

The classification is intentionally shallow keyword-and-shape matching. It is
honest about being a heuristic, it is inspectable, and it fails toward running
*more* lanes rather than the wrong one.
"""

from __future__ import annotations

import re
from dataclasses import dataclass

from .models import KnowledgeLayer, Lane, RetrievalPlan


@dataclass(frozen=True)
class QueryShape:
    """What the question is asking for, structurally."""

    kind: str
    entities: tuple[str, ...] = ()
    time_window_days: int | None = None


# Question shapes, in priority order. The first match wins, so the more specific
# patterns come first.
_RELATIONSHIP = re.compile(
    r"\b(who\s+is|who's|who\s+are|whose|related|relation|daughter|son|grand"
    r"|husband|wife|sister|brother|mother|father|family)\b",
    re.I,
)
_TEMPORAL = re.compile(
    r"\b(when|what\s+time|today|tomorrow|yesterday|tonight|this\s+(morning|afternoon|evening|week)"
    r"|last\s+(week|night|month)|coming|visiting|appointment|next)\b",
    re.I,
)
_ROUTINE = re.compile(
    r"\b(routine|schedule|usual|every\s+day|daily|what\s+do\s+i\s+do|breakfast"
    r"|lunch|dinner|tea|bath|walk)\b",
    re.I,
)
_MEDICATION = re.compile(
    r"\b(medicine|medication|tablet|pill|dose|dosage|drug|prescription|mg)\b", re.I
)
_PLACE = re.compile(r"\b(where|place|village|town|house|home|market|clinic|hospital)\b", re.I)
_REMINISCENCE = re.compile(
    r"\b(remember|memory|story|used\s+to|when\s+i\s+was|photo|picture|song|music"
    r"|festival|bihu|childhood)\b",
    re.I,
)
_CLINICAL = re.compile(
    r"\b(guideline|evidence|study|research|recommend|nice\s+ng|who\s+guidance)\b", re.I
)

# Rough time windows implied by common phrasings.
_WINDOWS: tuple[tuple[re.Pattern[str], int], ...] = (
    (re.compile(r"\btoday|tonight|this\s+(morning|afternoon|evening)\b", re.I), 1),
    (re.compile(r"\byesterday|last\s+night\b", re.I), 2),
    (re.compile(r"\btomorrow\b", re.I), 2),
    (re.compile(r"\bthis\s+week|last\s+week|past\s+few\s+days\b", re.I), 7),
    (re.compile(r"\blast\s+month|past\s+month\b", re.I), 31),
)

# Capitalised words that are not sentence-initial are treated as candidate
# entity mentions. Crude, but it only ever *adds* a graph lookup, and a lookup
# that finds nothing costs one indexed query.
_CANDIDATE_ENTITY = re.compile(r"(?<!^)(?<![.?!]\s)\b([A-Z][a-z]{2,})\b")


def _time_window(question: str) -> int | None:
    for pattern, days in _WINDOWS:
        if pattern.search(question):
            return days
    return None


def _entities(question: str) -> tuple[str, ...]:
    found = _CANDIDATE_ENTITY.findall(question)
    seen: list[str] = []
    for name in found:
        if name not in seen:
            seen.append(name)
    return tuple(seen[:5])


def classify(question: str) -> QueryShape:
    """Work out what kind of question this is. Pure, inspectable, no model."""
    text = question.strip()
    window = _time_window(text)
    entities = _entities(text)

    if _MEDICATION.search(text):
        return QueryShape("medication", entities, window)
    if _RELATIONSHIP.search(text):
        return QueryShape("relationship", entities, window)
    if _TEMPORAL.search(text):
        return QueryShape("temporal", entities, window or 7)
    if _ROUTINE.search(text):
        return QueryShape("routine", entities, window)
    if _PLACE.search(text):
        return QueryShape("place", entities, window)
    if _REMINISCENCE.search(text):
        return QueryShape("reminiscence", entities, window)
    if _CLINICAL.search(text):
        return QueryShape("clinical", entities, window)
    return QueryShape("general", entities, window)


# What each question shape actually needs. Written out rather than computed, so
# the mapping is reviewable by someone who is not reading code.
_PLANS: dict[str, tuple[tuple[Lane, ...], tuple[KnowledgeLayer, ...], str]] = {
    "medication": (
        (Lane.STRUCTURED,),
        (KnowledgeLayer.K1_MEDICAL,),
        "medication is clinician-authored structured data; never inferred and "
        "never retrieved semantically",
    ),
    "relationship": (
        (Lane.GRAPH,),
        (KnowledgeLayer.K2_PERSON,),
        "a relationship is a graph edge with provenance, not a similar sentence",
    ),
    "temporal": (
        (Lane.TEMPORAL, Lane.GRAPH),
        (KnowledgeLayer.K5_TEMPORAL, KnowledgeLayer.K2_PERSON),
        "events in a time window, plus the people they involve",
    ),
    "routine": (
        (Lane.STRUCTURED, Lane.TEMPORAL),
        (KnowledgeLayer.K3_CAREGIVER, KnowledgeLayer.K5_TEMPORAL),
        "the routine as recorded, and what actually happened against it",
    ),
    "place": (
        (Lane.GRAPH, Lane.LEXICAL),
        (KnowledgeLayer.K2_PERSON, KnowledgeLayer.K4_CULTURAL),
        "places are graph nodes; cultural context fills in what they mean",
    ),
    "reminiscence": (
        (Lane.GRAPH, Lane.LEXICAL, Lane.VECTOR),
        (KnowledgeLayer.K2_PERSON, KnowledgeLayer.K4_CULTURAL),
        "life story and cultural memory, where semantic reach genuinely helps",
    ),
    "clinical": (
        (Lane.LEXICAL, Lane.VECTOR),
        (KnowledgeLayer.K1_MEDICAL, KnowledgeLayer.K6_RESEARCH),
        "guidance documents, retrieved as text and kept tier-labelled",
    ),
    "general": (
        (Lane.GRAPH, Lane.LEXICAL),
        (KnowledgeLayer.K2_PERSON, KnowledgeLayer.K4_CULTURAL),
        "unclassified: prefer the person's own world over a semantic guess",
    ),
}


def plan(question: str, *, vector_available: bool = False) -> RetrievalPlan:
    """Decide which lanes and layers this question needs.

    `vector_available` drops the vector lane when no embedder exists rather than
    planning a lane that would return nothing. The plan then truthfully reports
    what it ran.
    """
    shape = classify(question)
    lanes, layers, reason = _PLANS[shape.kind]

    if not vector_available:
        lanes = tuple(lane for lane in lanes if lane is not Lane.VECTOR)
        if Lane.VECTOR in _PLANS[shape.kind][0]:
            reason += "; vector lane skipped (no embeddings deployment)"

    if shape.entities and Lane.GRAPH not in lanes:
        # A named person or place is worth a graph lookup whatever else runs.
        lanes = (*lanes, Lane.GRAPH)
        reason += "; named entity present, adding graph lookup"

    return RetrievalPlan(
        lanes=lanes,
        layers=layers,
        reason=f"{shape.kind}: {reason}",
        entities=shape.entities,
        time_window_days=shape.time_window_days,
    )
