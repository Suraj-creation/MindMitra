"""The one orchestrator — a LangGraph state machine with bounded nodes.

    precheck        deterministic intent; emergency and medication stop here
    graph           Intake -> FirewallScope -> Retrieve -> Compose -> Ground
    service         wraps the graph with the Safety Gateway, from outside
    prompts         version-pinned, and part of the safety surface

The boundary condition (tech-stack §14): the Safety Gateway and the Memory
Firewall are **not nodes**. The firewall is applied inside retrieval before any
data is loaded; the gateway wraps the graph in `service.run_turn`. Neither is
something a routing decision can skip, because neither is on the graph.

One graph, bounded nodes, no swarm. No node spawns an agent and no node loops
back into planning.

Public API:

    from app.orchestrator import (
        run_turn, CompanionTurn, TurnSource,
        Intent, classify_intent, is_deterministic, PROMPT_VERSION,
    )
"""

from __future__ import annotations

from .precheck import classify_intent, deterministic_response, is_deterministic
from .prompts import PROMPT_VERSION
from .service import CompanionTurn, TurnSource, run_turn
from .state import GroundedClaim, Intent, TurnRecord

__all__ = [
    "PROMPT_VERSION",
    "CompanionTurn",
    "GroundedClaim",
    "Intent",
    "TurnRecord",
    "TurnSource",
    "classify_intent",
    "deterministic_response",
    "is_deterministic",
    "run_turn",
]
