"""Value objects for a firewall decision: Actor, Resource, RequestContext, Decision.

All immutable. `evaluate()` is a pure function of these; the caller performs any
side effects (audit write, URL minting) based on the returned Decision.
"""

from __future__ import annotations

from enum import Enum

from pydantic import BaseModel, ConfigDict, Field

from .roles import Action, DataCategory, EscalationLevel, Purpose, Role


class Effect(str, Enum):
    ALLOW = "allow"
    DENY = "deny"


class Actor(BaseModel):
    """Who is asking. `role` is relative to `subject_person_id`."""

    model_config = ConfigDict(frozen=True)

    actor_id: str
    role: Role
    subject_person_id: str  # the person whose data is being accessed


class Resource(BaseModel):
    """What is being accessed."""

    model_config = ConfigDict(frozen=True)

    category: DataCategory
    subject_person_id: str
    resource_id: str | None = None
    # For PWM_FACT: the fact's own visibility list from its provenance envelope.
    visibility: tuple[str, ...] = ()
    clinical_relevance: bool = False


class ConsentState(BaseModel):
    """Whether the subject has granted consent for (category, purpose) to this role.

    Absent/false means *not granted*. Consent is revocable; a revoked grant is
    simply `granted=False`.
    """

    model_config = ConfigDict(frozen=True)

    granted: bool = False


class RequestContext(BaseModel):
    """The circumstances of the request."""

    model_config = ConfigDict(frozen=True)

    action: Action
    purpose: Purpose
    active_escalation: EscalationLevel = EscalationLevel.L0
    care_relevant: bool = False  # e.g. continence surfaced to a CHW only when care-relevant
    consent: ConsentState = Field(default_factory=ConsentState)
    into_shared_family_view: bool = False  # SHARE target is a view visible to the whole family


class Decision(BaseModel):
    """The outcome. Pure data — no side effects performed here."""

    model_config = ConfigDict(frozen=True)

    effect: Effect
    category: DataCategory
    action: Action
    actor_role: Role
    subject_person_id: str
    reason_codes: tuple[str, ...] = ()
    obligations: tuple[str, ...] = ()  # e.g. "audit", "emergency_override", "redact:coarse"
    is_violation: bool = False  # true when the request itself signals a bug/abuse attempt

    @property
    def allowed(self) -> bool:
        return self.effect is Effect.ALLOW
