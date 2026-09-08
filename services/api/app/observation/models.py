"""Pydantic DTOs for observations."""

from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, ConfigDict


class ObservationRecord(BaseModel):
    model_config = ConfigDict(frozen=True)

    observation_id: str
    person_id: str
    domain: str
    value: float
    quality: float
    gate: str
    language_mismatch: bool
    observed_at: datetime
