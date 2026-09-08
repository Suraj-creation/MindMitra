"""The deterministic pre-check. Runs *before* the graph, never inside it.

Two intents never reach a language model:

**Emergency.** A person saying "I've fallen and I can't get up" gets a fixed
response and a human contacted. A model deciding whether that was an emergency
is a model deciding whether someone gets help, which is invariant 1's exact
prohibition.

**Medication.** "Should I take another one?" gets the clinician-authored
schedule read back, or an explicit refusal — never a generated answer. A
plausible-sounding dose from a language model is the most dangerous single
output this product could emit.

Both paths are keyword-driven and deliberately over-trigger. A false positive
costs one unnecessary "let's get someone to help you"; a false negative is the
harm. The asymmetry is intentional and must not be tuned away for tidiness.
"""

from __future__ import annotations

import re

from app.core.config import get_settings

from .state import Intent

# Emergency phrasings, across the code-mixed registers this population actually
# uses. Kept broad on purpose.
_EMERGENCY = re.compile(
    r"\b(help\s*me|help!|emergency|ambulance|i(?:'ve| have)?\s*fallen|i\s*fell"
    r"|can'?t\s*(get\s*up|breathe|move)|bleeding|bleed"
    # Chest, breathing and head symptoms in any phrasing, not just the textbook
    # "chest pain". Someone saying "my chest hurts" must not be routed to a
    # medication refusal because they also mentioned a tablet.
    r"|chest\s*(pain|hurts?|hurting|tight|tightness|pressure)"
    r"|(pain|tight(ness)?|pressure)\s*in\s*(my\s*)?chest"
    r"|(can'?t|cannot|trouble)\s*breath"
    r"|(worst|sudden|terrible)\s*headache"
    r"|call\s*(a\s*)?(doctor|ambulance|hospital)|dying|i\s*am\s*lost"
    r"|i\s*don'?t\s*know\s*where\s*i\s*am|police|fire)\b",
    re.I,
)

# Self-harm and crisis phrasings route to the crisis line, not to a companion
# conversation. Safety Gateway check 8 owns the number.
_CRISIS = re.compile(
    r"\b(kill\s*myself|end\s*(it|my\s*life)|suicide|want\s*to\s*die"
    r"|no\s*reason\s*to\s*live|harm\s*myself)\b",
    re.I,
)

# Anything that could become a dose decision.
_MEDICATION = re.compile(
    r"\b(medicine|medication|tablet|tablets|pill|pills|dose|doses|dosage|mg"
    r"|prescription|prescribed|should\s*i\s*take|take\s*(another|more|two)"
    r"|skip\s*(my|a)\s*(dose|tablet|pill)|stop\s*taking|double\s*(the\s*)?dose)\b",
    re.I,
)

_CLINICAL = re.compile(
    r"\b(evidence|provenance|since\s*last\s*review|measurement\s*quality"
    r"|confounder|longitudinal|baseline)\b",
    re.I,
)

_ORIENTATION = re.compile(
    r"\b(what\s*day|what\s*date|what\s*time|where\s*am\s*i|who\s*is\s*coming"
    r"|is\s*(someone|anyone)\s*coming|what(?:'s| is)\s*(next|happening))\b",
    re.I,
)

_PERSON_LOOKUP = re.compile(
    r"\b(who\s*is|who'?s|who\s*are|whose|remind\s*me\s*who)\b", re.I
)

_REMINISCENCE = re.compile(
    r"\b(tell\s*me\s*about|do\s*you\s*remember|i\s*remember|used\s*to"
    r"|when\s*i\s*was|show\s*me\s*(a\s*)?(photo|picture)|song|music)\b",
    re.I,
)

_ROUTINE = re.compile(
    r"\b(routine|what\s*do\s*i\s*(usually|normally)|every\s*day|my\s*day)\b", re.I
)

_ACTIVITY = re.compile(
    r"\b(let'?s\s*(do|play)|something\s*to\s*do|play\s*(a\s*)?game"
    r"|an?\s*activity|keep\s*me\s*busy)\b",
    re.I,
)


def classify_intent(question: str) -> Intent:
    """Deterministic intent classification. No model, ever.

    Ordered by consequence: the two intents that must never reach a model are
    tested first, so an utterance that is both ("my chest hurts, should I take
    another tablet?") routes to the safer of the two.
    """
    if _EMERGENCY.search(question) or _CRISIS.search(question):
        return Intent.EMERGENCY
    if _MEDICATION.search(question):
        return Intent.MEDICATION
    if _CLINICAL.search(question):
        return Intent.CLINICAL
    if _ORIENTATION.search(question):
        return Intent.ORIENTATION
    if _PERSON_LOOKUP.search(question):
        return Intent.PERSON_LOOKUP
    if _ACTIVITY.search(question):
        return Intent.ACTIVITY
    if _REMINISCENCE.search(question):
        return Intent.REMINISCENCE
    if _ROUTINE.search(question):
        return Intent.ROUTINE
    return Intent.CHITCHAT


def deterministic_response(intent: Intent, question: str, *, display_name: str) -> str | None:
    """The fixed response for an intent that must not be generated.

    Returns None for every intent the graph is allowed to handle.
    """
    settings = get_settings()

    if intent is Intent.EMERGENCY:
        if _CRISIS.search(question):
            # Crisis support is a named human service, not a conversation.
            return (
                "I am glad you told me. You deserve support from someone who can "
                f"really help. Tele-MANAS is on {settings.tele_manas_number} and "
                "someone is there now. I am calling your family as well."
            )
        return (
            "I am getting help for you now. Stay where you are. "
            "I am calling your family, and the emergency number is on the screen."
        )

    if intent is Intent.MEDICATION:
        return (
            "I am not able to give advice about medicines. Your medicine list "
            "comes from your doctor, and it is on the screen for you to look at. "
            "For anything about doses, please ask your doctor or a health worker."
        )

    return None


def is_deterministic(intent: Intent) -> bool:
    """True for intents that must never enter the graph."""
    return intent in (Intent.EMERGENCY, Intent.MEDICATION)
