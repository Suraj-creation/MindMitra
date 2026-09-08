"""Pydantic DTOs for alerts and the three-layer caregiver card."""

from __future__ import annotations

from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict


class Alert(BaseModel):
    model_config = ConfigDict(frozen=True)

    alert_id: str
    person_id: str
    domain: str
    level: str
    z: float
    persistence_days: int
    reason_codes: tuple[str, ...]
    status: str
    feedback: str | None
    created_at: datetime


class CardFact(BaseModel):
    content: str
    source: str
    confidence: float


class CardHypothesis(BaseModel):
    content: str
    label: str = "This is not a diagnosis."


class CaregiverCard(BaseModel):
    """A three-layer caregiver card that has passed the Safety Gateway."""

    model_config = ConfigDict(frozen=True)

    person_id: str
    level: str | None  # None → no alert; nothing to show beyond "all normal"
    generated_at: datetime
    facts: tuple[CardFact, ...]
    hypothesis: CardHypothesis | None
    actions: tuple[str, ...]
    what_this_is_not: str
    safety_passed: bool
    measurement_confidence: str  # "good" | "moderate" | "low"


class AlertFeedback(BaseModel):
    alert_id: str
    feedback: Literal["useful", "expected", "not_useful"]
