"""Escalation — the L0–L5 ladder that turns deviations into alerts and cards.

Takes persisted observations → personal baseline deviation → deterministic
alert eligibility → an Alert record → a three-layer caregiver card that MUST
pass the Safety Gateway before it can be shown.

No LLM anywhere in this pipeline. Alerting is arithmetic; the card is templated
and safety-validated.
"""

from __future__ import annotations

from .models import Alert, CaregiverCard
from .service import build_caregiver_card, evaluate_person, record_feedback

__all__ = [
    "Alert",
    "CaregiverCard",
    "build_caregiver_card",
    "evaluate_person",
    "record_feedback",
]
