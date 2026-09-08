"""The orchestrator's typed state.

One state object flows through the graph. Every node reads and adds to it, and
nothing is hidden in closures — so a completed turn is a full record of what was
retrieved, what was generated, and which gate stopped it.

Two fields carry the safety design rather than data:

* `terminated_at` / `termination_reason` — any node may end the turn. A turn
  that stopped at the firewall and a turn that stopped at the safety gateway are
  different outcomes and both are recorded.
* `deterministic_response` — set by the pre-check for emergency and medication
  intents. When it is set, the graph is never entered. That is invariant 1
  expressed as control flow: the LLM is not consulted, not overridden.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from enum import Enum
from typing import Annotated, TypedDict

from app.firewall.models import Actor
from app.firewall.roles import Purpose
from app.rag.models import RetrievalResult


class Intent(str, Enum):
    """What the person or caregiver is asking for.

    Classified deterministically. Two of these never reach a model at all.
    """

    EMERGENCY = "emergency"          # deterministic path only
    MEDICATION = "medication"        # deterministic path only
    ORIENTATION = "orientation"      # what day is it, where am I, who is coming
    PERSON_LOOKUP = "person_lookup"  # who is X
    REMINISCENCE = "reminiscence"    # tell me about, I remember
    ROUTINE = "routine"              # what do I usually do
    ACTIVITY = "activity"            # let's do something
    CHITCHAT = "chitchat"            # companionship, no retrieval target
    CLINICAL = "clinical"            # clinician asking about evidence


@dataclass(frozen=True)
class GroundedClaim:
    """One assertion in an answer, with the retrieved fact it came from.

    An answer is a list of these, not a paragraph. The paragraph is rendered
    from them; it is never the source of truth. That is what makes "every
    retrieved fact carries its provenance into the answer" checkable.
    """

    text: str
    fact_id: str
    source_type: str
    verified: bool


@dataclass
class TurnRecord:
    """The observability trail for one orchestrated turn."""

    request_id: str
    intent: Intent | None = None
    lanes_run: tuple[str, ...] = ()
    facts_retrieved: int = 0
    facts_usable: int = 0
    conflicts: int = 0
    model: str | None = None
    latency_ms: int | None = None
    nodes_visited: list[str] = field(default_factory=list)


def _merge_nodes(left: list[str], right: list[str]) -> list[str]:
    return [*left, *right]


class OrchestratorState(TypedDict, total=False):
    """The graph's state. LangGraph merges per-key across node returns."""

    # Inputs, set before the graph runs. `actor` was produced by
    # app.auth.deps from an authenticated principal plus a care relationship;
    # no node may replace it.
    actor: Actor
    question: str
    purpose: Purpose
    language: str
    display_name: str

    # Deterministic pre-check.
    intent: Intent
    deterministic_response: str | None

    # Retrieval.
    retrieval: RetrievalResult | None

    # Generation.
    claims: list[GroundedClaim]
    answer: str
    hedged: bool

    # Termination. Set by whichever gate stopped the turn.
    terminated_at: str | None
    termination_reason: str | None

    # Trail.
    record: TurnRecord
    nodes_visited: Annotated[list[str], _merge_nodes]
