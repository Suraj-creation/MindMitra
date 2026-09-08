"""Personal World Model (PWM) — entities, relationships, and provenance.

The PWM stores what exists in the person's world: people, places, events,
cultural entities. Every fact carries a provenance envelope (source, confidence,
verification_status, visibility). Only verified facts may be asserted plainly.

Public API:

    from app.pwm import ProvenanceEnvelope, PWMNode, PWMEdge, load_pwm_lookup
"""

from __future__ import annotations

from .lookup import InMemoryPwmLookup, load_lookup_for_spec, load_pwm_lookup
from .models import ProvenanceEnvelope, PWMEdge, PWMNode, VerificationStatus
from .service import ReadOutcome, attempt_read_pwm_fact, create_edge, create_node

__all__ = [
    "ProvenanceEnvelope",
    "PWMEdge",
    "PWMNode",
    "InMemoryPwmLookup",
    "load_lookup_for_spec",
    "load_pwm_lookup",
    "ReadOutcome",
    "VerificationStatus",
    "attempt_read_pwm_fact",
    "create_edge",
    "create_node",
]
