"""Behaviour & Clinical Change Context Engine.

Artefacts #6 and #7 of the Evidence & Projection Pipeline (tech-stack.md §13.2):
a `ChangeSignal` in, a `ContextualisedStatement` out, with reversible causes
triaged *before* the change is described.

Nothing here is user-facing. A statement produced by this module is the ONLY
permitted input to a role projection — which is what closes invariant 13's
chain and makes `game score -> cognitive score -> diagnosis` structurally
unreachable rather than merely discouraged.

No LLM. The engine templates from a closed triage, so its whole output space is
enumerable in tests.
"""

from __future__ import annotations

from .context_engine import ACUTE_ONSET_HOURS, ENGINE_VERSION, contextualise
from .models import (
    CauseUrgency,
    ChangeKind,
    ChangeSignal,
    Confounder,
    ContextSignals,
    ContextualisedStatement,
    ReversibleCause,
)

__all__ = [
    "ACUTE_ONSET_HOURS",
    "ENGINE_VERSION",
    "CauseUrgency",
    "ChangeKind",
    "ChangeSignal",
    "Confounder",
    "ContextSignals",
    "ContextualisedStatement",
    "ReversibleCause",
    "contextualise",
]
