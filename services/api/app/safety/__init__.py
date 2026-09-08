"""Safety Gateway — the un-bypassable wrapper around every user-facing output.

Every generated output passes the 10 deterministic checks and must decompose into
the three-layer contract: FACT / HYPOTHESIS / ACTION. Output that fails any check
is blocked, hedged, or withheld — never emitted raw.

This module contains no ML and no LLM. It is the outermost deterministic safety
layer mandated by CLAUDE.md §1 invariants 2 and 3.

Public API:

    from app.safety import (
        ThreeLayerFact, ThreeLayerHypothesis, ThreeLayerAction, ThreeLayerOutput,
        GatewayCheck, CheckResult, GatewayResult,
        SafetyBlocked,
        evaluate, enforce,
    )
"""

from __future__ import annotations

from .gateway import SafetyBlocked, enforce, evaluate
from .models import (
    CheckResult,
    GatewayCheck,
    GatewayResult,
    ThreeLayerAction,
    ThreeLayerFact,
    ThreeLayerHypothesis,
    ThreeLayerOutput,
)

__all__ = [
    "CheckResult",
    "GatewayCheck",
    "GatewayResult",
    "SafetyBlocked",
    "ThreeLayerAction",
    "ThreeLayerFact",
    "ThreeLayerHypothesis",
    "ThreeLayerOutput",
    "enforce",
    "evaluate",
]
