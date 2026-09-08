"""Value objects for the Safety Gateway.

All models are immutable (frozen Pydantic v2). The three-layer output contract
is structurally enforced here: every user-facing output must carry at least one
FACT and at least one ACTION; HYPOTHESIS items are optional but must always carry
the "This is not a diagnosis." label.
"""

from __future__ import annotations

from enum import Enum

from pydantic import BaseModel, ConfigDict, Field, model_validator

from app.firewall.roles import Role


class ThreeLayerFact(BaseModel):
    """A sourced, timestamped, confidence-rated assertion.

    Only verified facts may be placed here; unverified claims must go into
    ThreeLayerHypothesis (check_provenance enforces this).
    """

    model_config = ConfigDict(frozen=True)

    content: str
    source: str
    timestamp: str | None = None  # ISO-8601 string; None when source is real-time
    confidence: float = Field(ge=0.0, le=1.0, default=1.0)
    verification_status: str = "verified"  # "verified" | "reported" | "unverified"


class ThreeLayerHypothesis(BaseModel):
    """A labelled, hedged inference — never a diagnosis.

    The label field MUST contain "This is not a diagnosis." The gateway enforces
    this structurally via check_uncertainty_hedge.
    """

    model_config = ConfigDict(frozen=True)

    content: str
    label: str = "This is not a diagnosis."
    confidence: float = Field(ge=0.0, le=1.0, default=0.5)

    @model_validator(mode="after")
    def _label_must_hedge(self) -> ThreeLayerHypothesis:
        if "not a diagnosis" not in self.label.lower():
            raise ValueError(
                "Hypothesis label must contain 'not a diagnosis' — "
                f"got: {self.label!r}"
            )
        return self


class ThreeLayerAction(BaseModel):
    """A concrete, safe, guideline-aligned action recommendation.

    Actions must require human approval (the system never takes autonomous
    clinical or financial action). The is_safe flag is asserted True by
    construction; any action the caller cannot assert safe must not be included.
    """

    model_config = ConfigDict(frozen=True)

    content: str
    is_safe: bool = True
    requires_human_approval: bool = True

    @model_validator(mode="after")
    def _must_be_safe(self) -> ThreeLayerAction:
        if not self.is_safe:
            raise ValueError("Actions placed in the output contract must be safe.")
        return self


class ThreeLayerOutput(BaseModel):
    """The complete user-facing output. Passes through the Safety Gateway.

    Structural requirements enforced at construction:
    - At least one FACT (the output must be grounded in something)
    - At least one ACTION (there must be a safe next step)
    - All HYPOTHESIS items carry the hedge label
    - raw_text is used only for the forbidden-claim regex scan; it must be
      consistent with the structured FACT/HYPOTHESIS/ACTION decomposition.
    """

    model_config = ConfigDict(frozen=True)

    facts: tuple[ThreeLayerFact, ...] = Field(min_length=1)
    hypotheses: tuple[ThreeLayerHypothesis, ...] = ()
    actions: tuple[ThreeLayerAction, ...] = Field(min_length=1)
    role_target: Role
    raw_text: str | None = None  # full text for regex scanning; None = build from layers


class GatewayCheck(str, Enum):
    """The ten deterministic checks, in evaluation order."""

    ROLE_FIT = "role_fit"
    DIAGNOSIS = "diagnosis"
    MEDICATION = "medication"
    PROVENANCE = "provenance"
    UNCERTAINTY = "uncertainty"
    THREE_LAYER = "three_layer"
    DIGNITY = "dignity"
    CRISIS = "crisis"
    EMERGENCY = "emergency"
    AUDIT = "audit"


class CheckResult(BaseModel):
    """Outcome of a single check. Immutable."""

    model_config = ConfigDict(frozen=True)

    check: GatewayCheck
    passed: bool
    reason: str = ""
    obligations: tuple[str, ...] = ()


class GatewayResult(BaseModel):
    """The final gateway decision — the full set of check outcomes."""

    model_config = ConfigDict(frozen=True)

    passed: bool
    check_results: tuple[CheckResult, ...]
    blocked_by: GatewayCheck | None = None
    crisis_number: str | None = None
    obligations: tuple[str, ...]

    @property
    def should_block(self) -> bool:
        return not self.passed
