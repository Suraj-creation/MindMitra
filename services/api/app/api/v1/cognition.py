"""Cognition API — observations in, measurement quality and baseline out.

`POST /v1/persons/{id}/observations` is the entry to the evidence pipeline. It scores the
observation with the Measurement-Quality Engine and **persists it**, tagged with
its gate. A low-quality observation is stored for the audit trail and can never
enter the baseline: bad data terminates the pipeline at the gate rather than
being silently down-weighted.

`GET /v1/persons/{id}/baseline/{domain}` reads the person's real, persisted
window. It previously fabricated a synthetic 20-point window inside the handler,
which made a person with no history look like a person with a stable baseline —
the exact failure mode the product exists to prevent. With no observations it
now says so.
"""

from __future__ import annotations

from typing import Annotated

from fastapi import APIRouter, Depends
from pydantic import BaseModel, Field
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.deps import CareActor
from app.cognition.baseline import DeviationResult
from app.cognition.mq import ObservationSignals
from app.core.db import get_session
from app.observation import compute_domain_deviation, record_observation

# The person is in the path, not the body. `CareActor` binds to it and resolves
# the caller's role against the database before the handler runs.
router = APIRouter(prefix="/persons/{person_id}/observations", tags=["cognition"])
baseline_router = APIRouter(prefix="/persons/{person_id}/baseline", tags=["cognition"])

Session = Annotated[AsyncSession, Depends(get_session)]


class ObservationSignalsIn(BaseModel):
    """API input for observation signals — mirrors ObservationSignals with defaults."""

    audibility: float = Field(default=1.0, ge=0.0, le=1.0)
    visibility: float = Field(default=1.0, ge=0.0, le=1.0)
    language_match: bool = True
    fatigue_factor: float = Field(default=1.0, ge=0.0, le=1.0)
    was_assisted: bool = False
    device_ok: bool = True
    subject_confirmed: bool = True

    def to_domain(self) -> ObservationSignals:
        return ObservationSignals(
            audibility=self.audibility,
            visibility=self.visibility,
            language_match=self.language_match,
            fatigue_factor=self.fatigue_factor,
            was_assisted=self.was_assisted,
            device_ok=self.device_ok,
            subject_confirmed=self.subject_confirmed,
        )


class ObservationRequest(BaseModel):
    domain: str
    value: float = Field(ge=0.0, le=1.0, description="Normalised performance ∈ [0,1]")
    signals: ObservationSignalsIn = Field(default_factory=ObservationSignalsIn)


class ObservationResponse(BaseModel):
    observation_id: str
    person_id: str
    domain: str
    q: float
    gate: str  # "sufficient" | "insufficient_data"
    language_mismatch: bool
    dominant_issue: str | None
    component_scores: dict[str, float]
    message: str


@router.post("", response_model=ObservationResponse)
async def submit_observation(
    req: ObservationRequest,
    actor: CareActor,
    session: Session,
) -> ObservationResponse:
    """Record one observation and return the measurement-quality decision.

    An observation with audibility near zero, or a language mismatch, returns
    `gate="insufficient_data"`: the system refuses to score it. That refusal is
    a measurement finding, never a cognitive one.
    """
    record, mqe = await record_observation(
        session,
        person_id=actor.subject_person_id,
        domain=req.domain,
        value=req.value,
        signals=req.signals.to_domain(),
    )

    if mqe.gate == "insufficient_data":
        message = (
            "We are not able to measure this reliably, so it has not been scored. "
            f"Main reason: {mqe.dominant_issue}. "
            "It will not contribute to the personal baseline or to any alert. "
            "This is not a sign of decline."
        )
        if mqe.language_mismatch:
            message += (
                " The activity was not in this person's preferred language, "
                "which is a measurement problem, not a cognitive one."
            )
    else:
        message = f"Observation recorded (quality {mqe.q:.2f})."

    return ObservationResponse(
        observation_id=record.observation_id,
        person_id=record.person_id,
        domain=record.domain,
        q=mqe.q,
        gate=mqe.gate,
        language_mismatch=mqe.language_mismatch,
        dominant_issue=mqe.dominant_issue,
        component_scores=mqe.component_scores,
        message=message,
    )


class BaselineResponse(BaseModel):
    person_id: str
    domain: str
    z: float | None
    median: float | None
    mad: float | None
    n_quality_gated: int
    gate: str
    reason: str


@baseline_router.get("/{domain}", response_model=BaselineResponse)
async def get_baseline(
    domain: str,
    actor: CareActor,
    session: Session,
) -> BaselineResponse:
    """Deviation of the latest observation against this person's own baseline.

    Always the person's own history — never a population norm, and never a
    synthetic stand-in. A person with no observations gets
    `gate="insufficient_data"`, which is a truthful answer.
    """
    result: DeviationResult = await compute_domain_deviation(
        session, actor.subject_person_id, domain
    )
    return BaselineResponse(
        person_id=actor.subject_person_id,
        domain=domain,
        z=result.z,
        median=result.median,
        mad=result.mad,
        n_quality_gated=result.n_quality_gated,
        gate=result.gate,
        reason=result.reason,
    )
