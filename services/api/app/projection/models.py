"""Value objects for role projections and delivery decisions.

Artefacts #9, #10 and #11 of the Evidence & Projection Pipeline.

The type that carries invariant 12 is `EvidenceClaim`. Every FACT any role sees
is one of these, drawn verbatim from a single claim set derived from one
`ContextualisedStatement`. A builder chooses *which* claims its role receives;
it cannot reword one. Two projections of the same statement can therefore
differ in completeness, register, hypothesis and action — and are structurally
incapable of asserting contradictory facts. "May omit, never differ" is a
property of the type, and `tests/test_projection.py` asserts it directly.
"""

from __future__ import annotations

from datetime import datetime
from enum import Enum

from pydantic import BaseModel, ConfigDict

from app.firewall.projection_policy import ArtefactClass
from app.firewall.roles import DataCategory, EscalationLevel, Role
from app.safety.models import ThreeLayerOutput


class ClaimKind(str, Enum):
    """What a claim is about. Used by builders to decide inclusion, not wording."""

    PARTICIPATION = "participation"  # what the person did — the only kind they see
    CHANGE = "change"  # the observed change itself
    CAUSE = "cause"  # a reversible cause that was reported
    CONFOUNDER = "confounder"  # a reason the measurement is weaker
    GAP = "gap"  # something not known
    CONFIDENCE = "confidence"  # measurement confidence statement


class EvidenceClaim(BaseModel):
    """One assertion, worded once, shared by every role that receives it.

    `person_text` is the same assertion addressed to the person in the second
    person. It is declared here rather than invented by a builder, so grammar
    can vary while the assertion cannot.
    """

    model_config = ConfigDict(frozen=True)

    claim_id: str
    kind: ClaimKind
    text: str
    person_text: str | None = None
    source: str = "system:certified_observation"
    confidence: float = 1.0

    def render_for(self, role: Role) -> str:
        if role is Role.PERSON and self.person_text:
            return self.person_text
        return self.text


class DeliveryClass(str, Enum):
    """How a projection reaches a human. Orthogonal to the L0-L5 ladder.

    L0-L5 says what the evidence *means*; this says how it *travels*. The same
    L3 event is ACTION_REQUIRED for a caregiver, REVIEW_WHEN_CONVENIENT for a
    CHW and NO_NOTIFICATION for a clinician.
    """

    EMERGENCY = "emergency"
    URGENT = "urgent"
    ACTION_REQUIRED = "action_required"
    REVIEW_WHEN_CONVENIENT = "review_when_convenient"
    INFORMATIONAL = "informational"
    NO_NOTIFICATION = "no_notification"


# Classes that must reach a human regardless of the attention budget.
BUDGET_BYPASSING: frozenset[DeliveryClass] = frozenset(
    {DeliveryClass.EMERGENCY, DeliveryClass.URGENT}
)

# Classes that actually interrupt somebody. Everything else is pull or silent.
INTERRUPTING: frozenset[DeliveryClass] = frozenset(
    {DeliveryClass.EMERGENCY, DeliveryClass.URGENT, DeliveryClass.ACTION_REQUIRED}
)


class RoleProjection(BaseModel):
    """A purpose-specific rendering of shared evidence for one authorised role.

    `output` is the Safety-Gateway-validatable three-layer body. `claim_ids`
    records which shared claims were used, which is what makes "Why am I seeing
    this?" answerable and the consistency test possible.
    """

    model_config = ConfigDict(frozen=True)

    person_id: str
    role: Role
    artefact_class: ArtefactClass
    report_type: str
    escalation_level: EscalationLevel | None

    headline: str  # role register lives here, not in the facts
    output: ThreeLayerOutput
    claim_ids: tuple[str, ...] = ()

    measurement_confidence: str = "moderate"
    source_categories: frozenset[DataCategory] = frozenset()
    evidence_refs: tuple[str, ...] = ()
    evidence_as_of: datetime | None = None
    builder_version: str = "projection/1"


class Withheld(BaseModel):
    """A projection that was not produced, and precisely why.

    A first-class outcome, not an error. It is stored and audited so that
    "why was I *not* told?" is answerable (invariant 14).
    """

    model_config = ConfigDict(frozen=True)

    person_id: str
    role: Role
    stage: str  # firewall | safety_gateway | no_content
    reason_codes: tuple[str, ...] = ()


class DeliveryDecision(BaseModel):
    """How (and whether) a projection reaches this role."""

    model_config = ConfigDict(frozen=True)

    role: Role
    delivery_class: DeliveryClass
    reason_codes: tuple[str, ...] = ()
    bypassed_budget: bool = False
    suppressed: bool = False  # true when a real signal was deliberately not pushed

    @property
    def interrupts(self) -> bool:
        return self.delivery_class in INTERRUPTING


class ProjectionOutcome(BaseModel):
    """The complete per-role result of running the pipeline once.

    Exactly one of `projection` / `withheld` is set.
    """

    model_config = ConfigDict(frozen=True)

    role: Role
    projection: RoleProjection | None = None
    withheld: Withheld | None = None
    delivery: DeliveryDecision

    @property
    def delivered(self) -> bool:
        return (
            self.projection is not None
            and self.delivery.delivery_class is not DeliveryClass.NO_NOTIFICATION
        )
