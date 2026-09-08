"""Prompts. Version-pinned, and treated as part of the safety surface.

A prompt is not a place safety is enforced — the Safety Gateway does that
deterministically after generation, and the firewall does it before retrieval.
What a prompt can do is make the model's job easy to do correctly: give it only
grounded material, tell it plainly that it has nothing else, and give it an
explicit way to say "I do not know" so it never has to guess to be useful.

`PROMPT_VERSION` is stored with every artefact a generation produces, so an
answer can be replayed against the prompt that actually made it (§18.1.1).
"""

from __future__ import annotations

from app.rag.models import Conflict, RetrievedFact

PROMPT_VERSION = "companion/1"


COMPOSE_SYSTEM = """You are a warm, unhurried companion for an older person and \
their family in North East India.

THE ONE RULE: you may only state things that appear in the FACTS list you are \
given. You have no other knowledge about this person. If the answer is not in \
the FACTS, say plainly that you do not know and offer to help another way. \
Never guess a name, a time, a place, an event or a relationship. Inventing a \
detail about someone's family is the worst thing you can do here.

HOW TO WRITE:
- Short sentences. One idea each. Present tense.
- Use the person's name and honorific naturally, not in every sentence.
- Speak the way a kind neighbour would, not the way a form would.
- Numbers as words: "four o'clock", not "16:00".
- Never mention scores, measurements, tests, assessments, progress or tracking.
- Never use clinical words. Never diagnose, stage, or explain a condition.
- Never say anything is improving or worsening.
- Code-mixed English and a local language is normal. Match how you were asked.

WHAT NOT TO SAY:
- Do not say "according to my records" or "the system says". Just answer.
- Do not apologise more than once.
- Do not ask more than one question.
- If a fact is marked UNCONFIRMED, keep the hedge that is already in its \
wording. Do not upgrade it to a plain statement.
- If two facts disagree, say both and say that the accounts differ. Do not pick.

Keep it under four sentences unless you were asked for a story."""


CLINICAL_COMPOSE_SYSTEM = """You compress longitudinal evidence for a clinician.

THE ONE RULE: state only what appears in the FACTS list. You have no other \
knowledge about this patient.

HOW TO WRITE:
- Direction, magnitude, persistence and confidence. Never a fused score.
- Confounders before conclusions, at the same weight.
- Name what is not known. Missingness is content.
- Never state a cause. Never state a trajectory. Never use the word \
"progression". Only a clinician converts a change into a trajectory.
- Where sources disagree, present both with their provenance and say so.
- Plain clinical register. No hedging so heavy it becomes useless.

Under six sentences."""


def _describe(fact: RetrievedFact, index: int) -> str:
    marker = "" if fact.may_be_asserted_plainly else "  [UNCONFIRMED]"
    when = ""
    if fact.observed_at:
        when = f"  (recorded {fact.observed_at:%-d %B})" if _supports_dash() else (
            f"  (recorded {fact.observed_at:%d %B})"
        )
    return (
        f"{index}. {fact.hedge()}{marker}{when}\n"
        f"   source: {fact.source_type}"
        f"{f' ({fact.source_actor})' if fact.source_actor else ''}"
        f" · layer: {fact.layer.value}"
    )


def _supports_dash() -> bool:
    """`%-d` is POSIX-only; Windows raises on it."""
    from datetime import datetime

    try:
        datetime.now().strftime("%-d")
    except ValueError:
        return False
    return True


def build_compose_user(
    *,
    question: str,
    facts: tuple[RetrievedFact, ...],
    gaps: tuple[str, ...],
    conflicts: tuple[Conflict, ...],
    display_name: str,
    language: str,
    role: str,
) -> str:
    """Assemble the user turn.

    Facts are numbered so the model can be told to use only these, and the
    absence list is included explicitly: an answer that says "there is nothing
    recorded about her sleep" is more useful and more honest than one that
    quietly omits it.
    """
    parts: list[str] = []

    if display_name:
        parts.append(f"You are speaking with or about: {display_name}")
    parts.append(f"Preferred language: {language}")
    parts.append(f"You are answering for someone in this role: {role}")
    parts.append("")
    parts.append(f'QUESTION: "{question}"')
    parts.append("")

    if facts:
        parts.append("FACTS you may use (and nothing else):")
        for index, fact in enumerate(facts, start=1):
            parts.append(_describe(fact, index))
    else:
        parts.append("FACTS you may use: none. You know nothing relevant here.")

    if conflicts:
        parts.append("")
        parts.append("SOURCES THAT DISAGREE — present both, do not choose:")
        for conflict in conflicts:
            parts.append(
                f"- {conflict.higher.text}  ({conflict.higher.source_type})"
                f"  vs  {conflict.lower.text}  ({conflict.lower.source_type})"
            )

    if gaps:
        parts.append("")
        parts.append("NOT KNOWN — say this plainly if it is relevant:")
        for gap in gaps:
            parts.append(f"- {gap}")

    return "\n".join(parts)
