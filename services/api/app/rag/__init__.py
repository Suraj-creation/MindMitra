"""Governed hybrid retrieval — six labelled layers, five lanes, one firewall.

What this is not: a vector store with a top-k lookup. Retrieval here is planned
per question, scoped by the Memory Firewall before any lane runs, fused with its
layer labels intact, checked for source disagreement, and reported together with
what it could not find.

    planner.plan       which lanes and layers this question needs (pure)
    service.retrieve   firewall scope -> run lanes -> fuse -> conflicts -> gaps
    lanes              graph · temporal · structured · lexical · vector
    fusion             merge, rank by authority, detect conflicts, state gaps
    models             RetrievedFact and the fixed source-authority order

No LLM decides which lanes run or which of two contradictory facts wins. Lane
selection determines which firewall categories are touched, and conflict
resolution is a safety decision — both are deterministic.

Public API:

    from app.rag import (
        retrieve, RetrievalResult, RetrievedFact, Conflict,
        KnowledgeLayer, Lane, SourceAuthority,
        plan, fuse, detect_conflicts, assess_completeness, permitted_layers,
    )
"""

from __future__ import annotations

from .fusion import assertable, assess_completeness, detect_conflicts, fuse, rank_score
from .models import (
    LAYER_CATEGORY,
    Conflict,
    KnowledgeLayer,
    Lane,
    RetrievalPlan,
    RetrievalResult,
    RetrievedFact,
    SourceAuthority,
    authority_for,
)
from .planner import QueryShape, classify, plan
from .service import permitted_layers, retrieve

__all__ = [
    "LAYER_CATEGORY",
    "Conflict",
    "KnowledgeLayer",
    "Lane",
    "QueryShape",
    "RetrievalPlan",
    "RetrievalResult",
    "RetrievedFact",
    "SourceAuthority",
    "assertable",
    "assess_completeness",
    "authority_for",
    "classify",
    "detect_conflicts",
    "fuse",
    "permitted_layers",
    "plan",
    "rank_score",
    "retrieve",
]
