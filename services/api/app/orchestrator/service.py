"""Running one governed turn.

This function is where the boundary condition is enforced, and the order of the
four steps is the safety design:

    1. deterministic pre-check   emergency and medication never reach a model
    2. the graph                 retrieval (firewall-scoped) then generation
    3. the Safety Gateway        10 checks over the generated output
    4. a fallback                when any of the above declined to answer

Step 3 wraps the graph from *outside*. It is not a node, so no routing decision
inside the graph can skip it, and a future edit to the graph cannot accidentally
bypass it. A blocked output is replaced by a safe fallback, never emitted.

Step 4 matters as much as the rest: this is a product used over intermittent
rural connectivity by people who cannot debug an error message. "The model was
unreachable" must degrade into something a person can act on.
"""

from __future__ import annotations

import logging
import uuid

from pydantic import BaseModel, ConfigDict
from sqlalchemy.ext.asyncio import AsyncSession

from app.firewall.models import Actor, RequestContext
from app.firewall.roles import Action, Purpose, Role
from app.safety.gateway import evaluate as safety_evaluate
from app.safety.models import (
    ThreeLayerAction,
    ThreeLayerFact,
    ThreeLayerOutput,
)

from .graph import build_graph
from .precheck import classify_intent, deterministic_response, is_deterministic
from .prompts import PROMPT_VERSION
from .state import GroundedClaim, OrchestratorState, TurnRecord

logger = logging.getLogger(__name__)


class TurnSource(BaseModel):
    """Where one statement in the answer came from."""

    model_config = ConfigDict(frozen=True)

    fact_id: str
    source_type: str
    verified: bool
    text: str


class CompanionTurn(BaseModel):
    """One governed answer, with everything needed to explain it.

    `sources` is what powers "Why am I seeing this?" (DESIGN.md E5.2): an
    evidence summary, never a reasoning transcript.
    """

    model_config = ConfigDict(frozen=True)

    request_id: str
    answer: str
    intent: str
    path: str  # deterministic | generated | fallback

    sources: tuple[TurnSource, ...] = ()
    gaps: tuple[str, ...] = ()
    conflicting: bool = False
    hedged: bool = False

    safety_passed: bool = True
    blocked_by: str | None = None

    lanes_run: tuple[str, ...] = ()
    model: str | None = None
    latency_ms: int | None = None
    prompt_version: str = PROMPT_VERSION

    # Voice availability is a client concern, so the turn carries it.
    speakable: bool = True


# What the person hears when the system cannot answer. Every one of these offers
# a next step, because DESIGN.md C1.2 forbids a dead end.
_FALLBACKS: dict[str, str] = {
    "no_grounded_facts": (
        "I do not know that one. Shall we look at your photographs instead, "
        "or would you like me to call someone?"
    ),
    "llm_unavailable": (
        "I am having trouble hearing myself think just now. "
        "Would you like to look at your photographs, or shall I call someone?"
    ),
    "safety_blocked": (
        "That is not something I should answer. A health worker or your doctor "
        "can help with it. Shall I make a note to ask them?"
    ),
}

_CLINICAL_FALLBACKS: dict[str, str] = {
    "no_grounded_facts": (
        "No evidence is available for that question within this record."
    ),
    "llm_unavailable": (
        "Summary generation is unavailable. The underlying observations remain "
        "available in the evidence view."
    ),
    "safety_blocked": (
        "This output did not pass the safety checks and has been withheld."
    ),
}


def _fallback_for(role: Role, reason: str) -> str:
    table = _CLINICAL_FALLBACKS if role is Role.CLINICIAN else _FALLBACKS
    return table.get(reason, table["no_grounded_facts"])


def _to_three_layer(
    answer: str, claims: list[GroundedClaim], role: Role
) -> ThreeLayerOutput:
    """Wrap a generated answer so the Safety Gateway can check it field by field.

    Every claim becomes a FACT with its source. The answer itself becomes the
    ACTION slot, because in a conversation the thing offered to the human *is*
    the next step. The three-layer contract requires at least one action.
    """
    facts = tuple(
        ThreeLayerFact(
            content=claim.text,
            source=claim.source_type,
            confidence=0.9 if claim.verified else 0.5,
        )
        for claim in claims
    ) or (
        ThreeLayerFact(
            content="No specific information was retrieved for this question.",
            source="system",
            confidence=1.0,
        ),
    )

    return ThreeLayerOutput(
        facts=facts,
        hypotheses=(),
        actions=(ThreeLayerAction(content=answer, is_safe=True),),
        role_target=role,
    )


async def run_turn(
    session: AsyncSession,
    *,
    actor: Actor,
    question: str,
    display_name: str = "",
    language: str = "en",
    purpose: Purpose = Purpose.PERSONALISATION,
    speakable: bool = True,
) -> CompanionTurn:
    """One governed turn: pre-check, graph, safety gateway, fallback."""
    request_id = uuid.uuid4().hex[:12]
    intent = classify_intent(question)

    # ── 1. Deterministic path. The graph is never constructed. ────────────────
    if is_deterministic(intent):
        response = deterministic_response(intent, question, display_name=display_name)
        logger.info(
            "turn deterministic req=%s intent=%s role=%s",
            request_id,
            intent.value,
            actor.role.value,
        )
        return CompanionTurn(
            request_id=request_id,
            answer=response or "",
            intent=intent.value,
            path="deterministic",
            speakable=speakable,
        )

    # ── 2. The graph. Retrieval is firewall-scoped inside it. ─────────────────
    graph = build_graph(session)
    initial: OrchestratorState = {
        "actor": actor,
        "question": question,
        "purpose": purpose,
        "language": language,
        "display_name": display_name,
        "intent": intent,
        "record": TurnRecord(request_id=request_id, intent=intent),
        "nodes_visited": [],
    }
    final: OrchestratorState = await graph.ainvoke(initial)

    record: TurnRecord = final.get("record") or TurnRecord(request_id=request_id)
    retrieval = final.get("retrieval")
    claims: list[GroundedClaim] = final.get("claims") or []
    answer = final.get("answer") or ""

    sources = tuple(
        TurnSource(
            fact_id=claim.fact_id,
            source_type=claim.source_type,
            verified=claim.verified,
            text=claim.text,
        )
        for claim in claims
    )
    gaps = retrieval.gaps if retrieval else ()
    conflicting = bool(retrieval and retrieval.conflicts)

    # The graph declined to answer. That is a valid outcome, not an error.
    if final.get("terminated_at"):
        reason = final.get("termination_reason") or "no_grounded_facts"
        logger.info(
            "turn fallback req=%s intent=%s reason=%s", request_id, intent.value, reason
        )
        return CompanionTurn(
            request_id=request_id,
            answer=_fallback_for(actor.role, reason),
            intent=intent.value,
            path="fallback",
            gaps=gaps,
            conflicting=conflicting,
            lanes_run=record.lanes_run,
            speakable=speakable,
        )

    # ── 3. The Safety Gateway, from outside the graph. ────────────────────────
    verdict = safety_evaluate(
        _to_three_layer(answer, claims, actor.role),
        RequestContext(action=Action.READ, purpose=purpose),
    )
    if not verdict.passed:
        blocked_by = verdict.blocked_by.value if verdict.blocked_by else "unknown"
        logger.warning(
            "turn blocked req=%s intent=%s check=%s", request_id, intent.value, blocked_by
        )
        return CompanionTurn(
            request_id=request_id,
            answer=_fallback_for(actor.role, "safety_blocked"),
            intent=intent.value,
            path="fallback",
            gaps=gaps,
            conflicting=conflicting,
            safety_passed=False,
            blocked_by=blocked_by,
            lanes_run=record.lanes_run,
            speakable=speakable,
        )

    logger.info(
        "turn ok req=%s intent=%s role=%s lanes=%s facts=%d model=%s",
        request_id,
        intent.value,
        actor.role.value,
        list(record.lanes_run),
        len(sources),
        record.model,
    )

    return CompanionTurn(
        request_id=request_id,
        answer=answer,
        intent=intent.value,
        path="generated",
        sources=sources,
        gaps=gaps,
        conflicting=conflicting,
        hedged=bool(final.get("hedged")),
        lanes_run=record.lanes_run,
        model=record.model,
        latency_ms=record.latency_ms,
        speakable=speakable,
    )
