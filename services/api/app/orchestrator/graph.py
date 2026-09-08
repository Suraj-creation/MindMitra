"""The one orchestrator. A LangGraph state machine with bounded capability nodes.

    Intake -> FirewallScope -> Plan -> Retrieve -> Compose -> Ground
                                 |                              |
                                 +-- denied ---------> END <----+

The boundary condition, which is not negotiable (tech-stack §14):

* The **Safety Gateway and the Memory Firewall are not nodes.** The firewall is
  applied inside retrieval, before any data is loaded, and the gateway wraps the
  graph from outside in `service.py`. Neither is something the graph can route
  around, because neither is on the graph.
* **Emergency and medication never enter the graph at all.** `precheck` handles
  them and `run_turn` returns before the graph is constructed.
* This is one graph with bounded nodes, not a swarm. No node spawns another
  agent, and no node loops back into planning.

The generation node is the only place a language model runs, and it is given the
retrieved facts and told it may use nothing else.
"""

from __future__ import annotations

import logging
import re
import time
import uuid

from langgraph.graph import END, StateGraph
from sqlalchemy.ext.asyncio import AsyncSession

from app.ai import AIUnavailable, get_client
from app.rag import retrieve
from app.rag.models import RetrievedFact

from .prompts import COMPOSE_SYSTEM, build_compose_user
from .state import GroundedClaim, Intent, OrchestratorState, TurnRecord

logger = logging.getLogger(__name__)

# Intents whose answer is drawn from retrieval rather than invented. CHITCHAT is
# the only one allowed to answer with no facts at all, and even then it may not
# state anything about the person.
_NEEDS_RETRIEVAL = frozenset(
    {
        Intent.ORIENTATION,
        Intent.PERSON_LOOKUP,
        Intent.REMINISCENCE,
        Intent.ROUTINE,
        Intent.CLINICAL,
        Intent.ACTIVITY,
    }
)


# A capitalised word that is not sentence-initial is a candidate name. Crude,
# and deliberately so: this is a guard, not a parser, and it only ever causes a
# fallback — never a wrong answer.
_NAME_LIKE = re.compile(r"(?<![.!?]\s)(?<!^)\b([A-Z][a-z]{2,})\b", re.MULTILINE)

# Words that look like names but are not personal claims. Kept short on
# purpose; anything not here that the answer invents costs one fallback.
_NAME_ALLOWLIST = frozenset(
    {
        # Days, months and common openers the model uses to be warm.
        "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday",
        "January", "February", "March", "April", "May", "June", "July",
        "August", "September", "October", "November", "December",
        "Today", "Tomorrow", "Yesterday", "Shall", "Would", "Should", "Could",
        "There", "This", "That", "These", "Those", "Your", "You", "Well",
        "Perhaps", "Maybe", "Sorry", "Thank", "Thanks", "Yes", "Let", "Here",
        "What", "When", "Where", "Which", "How", "Who", "Why",
        "English", "Assamese", "Assam", "India",
    }
)


def _ungrounded_entities(
    answer: str,
    facts: tuple[RetrievedFact, ...],
    question: str,
    display_name: str = "",
) -> set[str]:
    """Names the answer asserts that no retrieved fact supports.

    Three sources count as grounded, and each one was a real false positive
    before it was included:

    * the retrieved facts, obviously;
    * a name the **question** introduced — saying "I do not know who Deepak is"
      has to be allowed to contain "Deepak", or refusing becomes impossible;
    * the **person's own name**, which the prompt supplies so the companion can
      address her naturally. Flagging "Purnima" as a fabrication because it
      appears in the greeting rather than in a fact rejected every correct
      answer the system produced.

    Only names the model brought in on its own are left.
    """
    grounded = " ".join(fact.text for fact in facts).lower()
    asked = question.lower()
    # Split so "Purnima Devi" grounds both "Purnima" and "Devi".
    own = {part.lower() for part in re.split(r"\W+", display_name) if part}

    named = set(_NAME_LIKE.findall(answer))
    return {
        name
        for name in named
        if name not in _NAME_ALLOWLIST
        and name.lower() not in grounded
        and name.lower() not in asked
        and name.lower() not in own
    }


def build_graph(session: AsyncSession):
    """Compile the orchestration graph for one request.

    The session is closed over rather than stored in state, so the graph stays
    checkpointable and the state stays plain data.
    """

    async def intake(state: OrchestratorState) -> dict:
        record = state.get("record") or TurnRecord(request_id=uuid.uuid4().hex[:12])
        record.intent = state.get("intent")
        return {"record": record, "nodes_visited": ["intake"]}

    async def plan_and_retrieve(state: OrchestratorState) -> dict:
        """Retrieval, with the firewall applied inside it, per layer.

        `app.rag.retrieve` scopes before it queries: a layer this actor may not
        see is never asked. Nothing here can widen that.
        """
        actor = state["actor"]
        question = state["question"]
        record = state["record"]

        result = await retrieve(
            session,
            actor=actor,
            question=question,
            purpose=state["purpose"],
            vector_available=False,
        )

        record.lanes_run = tuple(lane.value for lane in result.plan.lanes)
        record.facts_retrieved = len(result.facts)
        record.facts_usable = len(
            [f for f in result.facts if f.may_be_asserted_plainly]
        )
        record.conflicts = len(result.conflicts)

        return {
            "retrieval": result,
            "record": record,
            "nodes_visited": ["retrieve"],
        }

    async def compose(state: OrchestratorState) -> dict:
        """Generate language over the retrieved facts, and nothing else.

        The model receives the facts as a numbered list and is instructed that
        anything not on that list must be answered with "I do not know". It
        cannot reach the database, so it has no other material available.
        """
        retrieval = state.get("retrieval")
        facts: tuple[RetrievedFact, ...] = retrieval.facts if retrieval else ()
        record = state["record"]

        if not facts and state.get("intent") is not Intent.CHITCHAT:
            # Nothing to ground an answer in. Say so rather than fill the gap.
            return {
                "answer": "",
                "claims": [],
                "terminated_at": "compose",
                "termination_reason": "no_grounded_facts",
                "nodes_visited": ["compose"],
            }

        client = get_client()
        if not client.is_configured():
            return {
                "answer": "",
                "claims": [],
                "terminated_at": "compose",
                "termination_reason": "llm_unavailable",
                "nodes_visited": ["compose"],
            }

        started = time.monotonic()
        try:
            text, usage = await client.complete(
                messages=[
                    {"role": "system", "content": COMPOSE_SYSTEM},
                    {
                        "role": "user",
                        "content": build_compose_user(
                            question=state["question"],
                            facts=facts,
                            gaps=retrieval.gaps if retrieval else (),
                            conflicts=retrieval.conflicts if retrieval else (),
                            display_name=state.get("display_name", ""),
                            language=state.get("language", "en"),
                            role=state["actor"].role.value,
                        ),
                    },
                ],
                temperature=0.3,
                max_tokens=400,
                purpose=f"companion:{(state.get('intent') or Intent.CHITCHAT).value}",
            )
            record.model = usage.model
            record.latency_ms = usage.latency_ms
        except AIUnavailable as exc:
            logger.warning("compose unavailable: %s", exc)
            return {
                "answer": "",
                "claims": [],
                "terminated_at": "compose",
                "termination_reason": "llm_unavailable",
                "record": record,
                "nodes_visited": ["compose"],
            }

        record.latency_ms = int((time.monotonic() - started) * 1000)
        return {
            "answer": text.strip(),
            "record": record,
            "nodes_visited": ["compose"],
        }

    async def ground(state: OrchestratorState) -> dict:
        """Attach provenance, and check the answer against what was retrieved.

        The claims list is built from the *retrieved* facts, not parsed out of
        the model's prose. A claim exists because a fact was retrieved; the
        prose is a rendering of those claims and can never add one.

        The grounding check exists because the prompt is not the control. Told
        "use only these facts", the model will still sometimes answer from its
        own world knowledge — observed live, answering "tell me about Bihu" with
        a general description of the festival that appeared in no retrieved
        fact. That is not catastrophic for a festival and it is unacceptable for
        a person, so the check is scoped to **personal** claims: if the answer
        names a person, place or event that no retrieved fact mentions, the turn
        is terminated and falls back.
        """
        retrieval = state.get("retrieval")
        facts: tuple[RetrievedFact, ...] = retrieval.facts if retrieval else ()
        answer = state.get("answer") or ""

        claims = [
            GroundedClaim(
                text=fact.hedge(),
                fact_id=fact.fact_id,
                source_type=fact.source_type,
                verified=fact.may_be_asserted_plainly,
            )
            for fact in facts
        ]

        ungrounded = _ungrounded_entities(
            answer,
            facts,
            state.get("question", ""),
            state.get("display_name", ""),
        )
        if ungrounded:
            logger.warning(
                "grounding rejected: answer named %s with no retrieved fact",
                sorted(ungrounded),
            )
            return {
                "claims": claims,
                "terminated_at": "ground",
                "termination_reason": "ungrounded_entity",
                "nodes_visited": ["ground"],
            }

        return {
            "claims": claims,
            "hedged": any(not claim.verified for claim in claims),
            "nodes_visited": ["ground"],
        }

    def needs_retrieval(state: OrchestratorState) -> str:
        intent = state.get("intent") or Intent.CHITCHAT
        return "retrieve" if intent in _NEEDS_RETRIEVAL else "compose"

    def composed_ok(state: OrchestratorState) -> str:
        return END if state.get("terminated_at") else "ground"

    builder: StateGraph = StateGraph(OrchestratorState)
    builder.add_node("intake", intake)
    builder.add_node("retrieve", plan_and_retrieve)
    builder.add_node("compose", compose)
    builder.add_node("ground", ground)

    builder.set_entry_point("intake")
    builder.add_conditional_edges(
        "intake", needs_retrieval, {"retrieve": "retrieve", "compose": "compose"}
    )
    builder.add_edge("retrieve", "compose")
    builder.add_conditional_edges("compose", composed_ok, {END: END, "ground": "ground"})
    builder.add_edge("ground", END)

    return builder.compile()
