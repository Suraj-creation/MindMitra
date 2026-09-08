"""Voice tools and session instructions.

The realtime model is not given the person's life story in its prompt. It is
given **tools**, and every tool call comes back through this server, where the
Memory Firewall runs before anything is read. That is the difference between a
companion that retrieves and a companion that remembers: a model holding facts
in its context has no firewall between it and the microphone.

So the shape is:

    browser  --audio-->  Azure Realtime  --tool call-->  browser
    browser  --relay-->  POST /voice/tool  --firewall--> retrieval
    browser  <--result--  this server     --relay-->     Azure Realtime

The instructions carry only orientation — today's date and the person's name and
language. Everything else is a lookup.
"""

from __future__ import annotations

import logging
from datetime import UTC, datetime

from sqlalchemy.ext.asyncio import AsyncSession

from app.ai.realtime import VoiceTool
from app.firewall.models import Actor
from app.firewall.roles import Purpose
from app.rag import retrieve

logger = logging.getLogger(__name__)

# ── The tool register. Bounded, named, and each one maps to a governed read. ──

WHO_IS = VoiceTool(
    name="who_is",
    description=(
        "Look up a person in the speaker's own family and life. Use this "
        "whenever a name comes up, instead of assuming who someone is."
    ),
    parameters={
        "type": "object",
        "properties": {
            "name": {
                "type": "string",
                "description": "The name as it was spoken.",
            }
        },
        "required": ["name"],
    },
)

WHATS_NEXT = VoiceTool(
    name="whats_next",
    description=(
        "What is happening today and next for the speaker. Use this for any "
        "question about the day, the time, or who is coming."
    ),
    parameters={"type": "object", "properties": {}, "required": []},
)

REMEMBER_WITH_ME = VoiceTool(
    name="remember_with_me",
    description=(
        "Find something from the speaker's own recorded life to talk about — a "
        "place, a festival, an occupation, a song. Use this for reminiscence."
    ),
    parameters={
        "type": "object",
        "properties": {
            "about": {
                "type": "string",
                "description": "What the conversation is about.",
            }
        },
        "required": ["about"],
    },
)

CALL_SOMEONE = VoiceTool(
    name="call_someone",
    description=(
        "Offer to place a call to a named family member. Returns whether that "
        "person is reachable. Never claim a call was made unless this says so."
    ),
    parameters={
        "type": "object",
        "properties": {
            "name": {"type": "string", "description": "Who to call."}
        },
        "required": ["name"],
    },
)

PERSON_TOOLS: tuple[VoiceTool, ...] = (
    WHO_IS,
    WHATS_NEXT,
    REMEMBER_WITH_ME,
    CALL_SOMEONE,
)

TOOL_NAMES = frozenset(tool.name for tool in PERSON_TOOLS)


def build_instructions(
    *,
    display_name: str,
    language: str,
    language_tier: str,
    honorific: str = "",
) -> str:
    """Session instructions. Orientation only — never the person's facts.

    Orientation is woven rather than quizzed (DESIGN.md C1.5): the date is in
    the model's context so it can mention it naturally, and there is an explicit
    ban on asking the person what day it is.
    """
    today = datetime.now(UTC)
    address = honorific or display_name or "her"

    return f"""You are a warm, unhurried companion speaking with {address}, an older \
person in North East India. You are talking out loud, so keep it short and \
natural.

TODAY is {today:%A, %d %B %Y}.

THE ONE RULE: you know nothing about this person except what your tools return. \
Call a tool before saying anything about a person, a place, an event or a time. \
If a tool returns nothing, say you are not sure and offer something else. Never \
invent a name, a relationship, a visit or a time. Never say a call has been made \
unless call_someone told you it was.

HOW TO SPEAK:
- Two or three short sentences at a time. Then stop and listen.
- Speak in {language}. Code-mixing with English is normal; match how she speaks.
- Numbers as words: "four o'clock", not "sixteen hundred".
- Mention the day or what is next as part of the conversation, never as a question. \
Never ask her what day it is, where she is, or who you are. That is a test, and \
this is not a test.
- If she asks the same thing again, answer it again as if for the first time. \
Never say "you already asked" or "as I said". Repeating is not a mistake.
- If she says no, or does not want to continue, accept it at once and offer to \
sit quietly or talk later. Do not ask again in this conversation.
- If she seems upset, stop the activity and be with her. Offer to call family.

NEVER:
- Never mention scores, tests, measurements, tracking, progress or memory exercises.
- Never use medical words, name a condition, or say anything is getting better or worse.
- Never give advice about medicines.
- Never correct her about her own life. If she tells you something different from \
what a tool said, thank her — she is the authority on her own life.

You are company, not a service. If she wants to talk about nothing, talk about \
nothing."""


async def execute_tool(
    session: AsyncSession,
    *,
    actor: Actor,
    tool_name: str,
    arguments: dict,
) -> dict:
    """Run one tool call under the firewall, and return a result for the model.

    The result is deliberately shaped as data, not prose: `found`, the facts,
    and whether each may be stated plainly. The model does the wording; this
    decides what it is allowed to know.

    An unknown tool returns `found: false` rather than raising, because a model
    hallucinating a tool name must not become an error the person hears.
    """
    if tool_name not in TOOL_NAMES:
        logger.warning("unknown voice tool requested: %s", tool_name)
        return {"found": False, "reason": "unknown_tool"}

    question = _tool_question(tool_name, arguments)
    purpose = (
        Purpose.SELF_ACCESS
        if actor.role.value == "person"
        else Purpose.PERSONALISATION
    )

    result = await retrieve(
        session,
        actor=actor,
        question=question,
        purpose=purpose,
        vector_available=False,
        limit=6,
    )

    if tool_name == CALL_SOMEONE.name:
        return _call_result(result, arguments.get("name", ""))

    facts = [
        {
            "statement": fact.hedge(),
            "may_state_plainly": fact.may_be_asserted_plainly,
            "source": fact.source_type,
        }
        for fact in result.facts
    ]

    logger.info(
        "voice tool=%s person=%s role=%s found=%d",
        tool_name,
        actor.subject_person_id,
        actor.role.value,
        len(facts),
    )

    return {
        "found": bool(facts),
        "facts": facts,
        "not_known": list(result.gaps),
        "sources_disagree": bool(result.conflicts),
    }


def _tool_question(tool_name: str, arguments: dict) -> str:
    """Turn a tool call into the question the planner understands.

    Phrasing matters: it is what routes the call to the right lane. `who_is`
    must produce a relationship-shaped question so it reaches the graph lane
    rather than a text search.
    """
    if tool_name == WHO_IS.name:
        return f"Who is {arguments.get('name', '')}?"
    if tool_name == WHATS_NEXT.name:
        return "What is happening today and who is coming?"
    if tool_name == REMEMBER_WITH_ME.name:
        return f"Tell me about {arguments.get('about', 'my life')}"
    if tool_name == CALL_SOMEONE.name:
        return f"Who is {arguments.get('name', '')}?"
    return arguments.get("query", "")


def _call_result(result, name: str) -> dict:
    """Whether a named person is reachable.

    Placing the call is a client action — the browser dials, this server never
    does. So the honest answer is "this person is in her family and the button
    is there", not "calling now".
    """
    known = [
        fact
        for fact in result.facts
        if name and name.lower() in fact.text.lower()
    ]
    if not known:
        return {
            "found": False,
            "reason": "not_in_family",
            "say": (
                f"I could not find {name} among her family. "
                "Offer to call someone she has named before, or to make a note."
            ),
        }
    return {
        "found": True,
        "who": name,
        "say": (
            f"Offer to call {name}. A call button is now on her screen. "
            "Do not say the call has started — she has to press it."
        ),
    }
