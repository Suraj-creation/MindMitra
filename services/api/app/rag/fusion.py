"""Fusion, conflict detection and the completeness critic.

Three pure functions, run in this order, between retrieval and generation:

    fuse        merge the lanes, dedupe, rank — layers stay labelled
    detect_conflicts   find disagreements; never resolve them silently
    assess_completeness   say what is missing, because missingness is content

None of this uses an LLM. Ranking that decided which of two contradictory facts
about a person's medication was "right" is an authorization- and safety-shaped
decision, and it is made by the fixed source-authority order (CLAUDE.md
invariant 6), not by a model's judgement.
"""

from __future__ import annotations

import re
from collections import defaultdict

from .models import (
    Conflict,
    KnowledgeLayer,
    RetrievedFact,
    SourceAuthority,
)

# How much a fact's own authority contributes to its rank, against relevance.
# Authority dominates on purpose: a caregiver's confirmed observation outranks a
# semantically closer sentence from a guideline, because in this product the
# question is "what is true about this person", not "what reads similarly".
_AUTHORITY_WEIGHT = 0.65
_RELEVANCE_WEIGHT = 0.35


def _authority_score(authority: SourceAuthority) -> float:
    """Rank 1 -> 1.0, rank 8 -> 0.0."""
    return (8 - authority.value) / 7.0


def rank_score(fact: RetrievedFact) -> float:
    return (
        _AUTHORITY_WEIGHT * _authority_score(fact.authority)
        + _RELEVANCE_WEIGHT * fact.relevance
    )


def _normalise(text: str) -> str:
    """For dedupe only. Never used to rewrite what a fact says."""
    return re.sub(r"[^a-z0-9 ]+", "", text.lower()).strip()


def fuse(
    lane_results: list[list[RetrievedFact]], *, limit: int = 20
) -> tuple[RetrievedFact, ...]:
    """Merge lanes into one ranked set, keeping every label intact.

    Dedupe is by `(fact_id, layer)` first, then by normalised text within a
    layer. Deduping *across* layers is deliberately not done: the same sentence
    appearing in a clinical guideline and in a caregiver's note is two different
    facts with two different authorities, and collapsing them would erase the
    distinction the whole layer system exists to preserve.
    """
    by_key: dict[tuple[str, KnowledgeLayer], RetrievedFact] = {}
    seen_text: dict[KnowledgeLayer, set[str]] = defaultdict(set)

    for lane in lane_results:
        for fact in lane:
            key = (fact.fact_id, fact.layer)
            existing = by_key.get(key)
            if existing is not None:
                # Same fact found by two lanes: keep the better-scoring sighting.
                if rank_score(fact) > rank_score(existing):
                    by_key[key] = fact
                continue

            normalised = _normalise(fact.text)
            if normalised and normalised in seen_text[fact.layer]:
                continue
            seen_text[fact.layer].add(normalised)
            by_key[key] = fact

    ordered = sorted(by_key.values(), key=rank_score, reverse=True)
    return tuple(ordered[:limit])


# Two facts are candidates for conflict when they concern the same subject.
# For PWM facts that is the predicate; for everything else it is the fact id.
def _conflict_subject(fact: RetrievedFact) -> str | None:
    predicate = fact.payload.get("predicate")
    if predicate:
        return f"{predicate}"
    node_type = fact.payload.get("node_type")
    if node_type:
        return f"{node_type}:{_normalise(fact.text).split(' ')[0] if fact.text else ''}"
    return None


def _disagree(a: RetrievedFact, b: RetrievedFact) -> bool:
    """Two facts about the same subject that assert different things.

    Deliberately crude: normalised-text inequality. A false positive costs a
    clinician one extra "these accounts differ" line; a false negative silently
    merges two versions of a medication, which is the failure this exists to
    prevent. The asymmetry is the point.
    """
    return _normalise(a.text) != _normalise(b.text)


def detect_conflicts(
    facts: tuple[RetrievedFact, ...],
) -> tuple[Conflict, ...]:
    """Find disagreements between sources. Both sides are always retained.

    A lower-ranked source never silently overwrites a higher-ranked one
    (CLAUDE.md invariant 6). Where authority is equal, neither is asserted and
    the fact is treated as unverified — that is the honest outcome when two
    equally trustworthy people say different things.
    """
    grouped: dict[str, list[RetrievedFact]] = defaultdict(list)
    for fact in facts:
        subject = _conflict_subject(fact)
        if subject:
            grouped[subject].append(fact)

    conflicts: list[Conflict] = []
    for subject, members in grouped.items():
        if len(members) < 2:
            continue
        ordered = sorted(members, key=lambda f: f.authority.value)
        for later in ordered[1:]:
            leader = ordered[0]
            if not _disagree(leader, later):
                continue
            conflicts.append(
                Conflict(
                    subject=subject,
                    higher=leader,
                    lower=later,
                    equal_authority=leader.authority is later.authority,
                )
            )
    return tuple(conflicts)


def assertable(
    facts: tuple[RetrievedFact, ...], conflicts: tuple[Conflict, ...]
) -> tuple[RetrievedFact, ...]:
    """The facts that may be stated at all.

    A fact on either side of an **open** conflict is excluded from grounding
    (tech-stack §9.4): an unresolved disagreement must not be used to
    personalise an activity or answer a question, because either answer might be
    the wrong one. It stays retrievable, and it goes on the clinician's
    open-questions list — it just cannot be spoken as fact.
    """
    contested: set[tuple[str, KnowledgeLayer]] = set()
    for conflict in conflicts:
        contested.add((conflict.higher.fact_id, conflict.higher.layer))
        contested.add((conflict.lower.fact_id, conflict.lower.layer))

    return tuple(f for f in facts if (f.fact_id, f.layer) not in contested)


# What each layer is expected to contribute when it was asked for. A layer that
# was planned, permitted and still returned nothing is a gap worth stating.
_LAYER_DESCRIPTION: dict[KnowledgeLayer, str] = {
    KnowledgeLayer.K1_MEDICAL: "clinical guidance",
    KnowledgeLayer.K2_PERSON: "anything recorded about this person's own world",
    KnowledgeLayer.K3_CAREGIVER: "caregiver observations",
    KnowledgeLayer.K4_CULTURAL: "local cultural context",
    KnowledgeLayer.K5_TEMPORAL: "recent recorded activity",
    KnowledgeLayer.K6_RESEARCH: "research literature",
}


def assess_completeness(
    facts: tuple[RetrievedFact, ...],
    *,
    planned_layers: tuple[KnowledgeLayer, ...],
    denied_layers: tuple[KnowledgeLayer, ...] = (),
) -> tuple[str, ...]:
    """State what is missing. An explicit gap beats a confident partial answer.

    Denied layers are **not** listed. Naming them would tell the reader that
    data exists which they are not allowed to see, which is the disclosure
    DESIGN.md B2 forbids — "no list of what is hidden". They are simply absent.
    """
    present = {fact.layer for fact in facts}
    gaps: list[str] = []

    for layer in planned_layers:
        if layer in denied_layers:
            continue
        if layer not in present:
            description = _LAYER_DESCRIPTION.get(layer, layer.value)
            gaps.append(f"No information found for {description}.")

    unverified = [f for f in facts if not f.may_be_asserted_plainly]
    if unverified and len(unverified) == len(facts):
        gaps.append(
            "Nothing found here has been confirmed by the person, a clinician, "
            "a caregiver or a health worker."
        )

    return tuple(gaps)
