"""Value objects for change signals and contextualised statements.

Three artefacts live here, in pipeline order (CLAUDE.md §1.5):

    ChangeSignal            #6  MeaningfulChange | SupportNeed | NoChange | InsufficientData
    ContextSignals              the reversible-cause evidence the triage runs over
    ContextualisedStatement #7  the ONLY thing a RoleProjection may be built from

The load-bearing property is on `ContextualisedStatement.statement`: a model
validator refuses any text that attributes a change to progression or
deterioration. Invariant 3 ("never say dementia is progressing") is therefore
enforced by the type, not by reviewer discipline — a builder that tries to emit
a progression claim raises at construction time and never reaches a human.
"""

from __future__ import annotations

import re
from enum import Enum

from pydantic import BaseModel, ConfigDict, Field, model_validator

from app.firewall.roles import EscalationLevel


class ChangeKind(str, Enum):
    """What the change engine concluded. Three of the four are terminal."""

    NO_CHANGE = "no_change"
    MEANINGFUL_CHANGE = "meaningful_change"
    SUPPORT_NEED = "support_need"
    INSUFFICIENT_DATA = "insufficient_data"


class CauseUrgency(str, Enum):
    """How fast a reversible cause must be checked. Orders the triage output."""

    SAME_DAY = "same_day"  # possible acute medical cause — check today
    SOON = "soon"  # worth checking within days
    ROUTINE = "routine"  # mention at the next visit


class ChangeSignal(BaseModel):
    """Artefact #6. Produced by the change engine from certified observations.

    `NO_CHANGE` and `INSUFFICIENT_DATA` are first-class successful outcomes
    (invariant 14) — they are stored, they are auditable, and they generate no
    projection for any role except (for INSUFFICIENT_DATA) a measurement action.
    """

    model_config = ConfigDict(frozen=True)

    kind: ChangeKind
    person_id: str
    domain: str
    z: float | None = None
    persistence_days: int = 0
    quality: float | None = None  # q of the observation that triggered this
    escalation_level: EscalationLevel | None = None
    reason_codes: tuple[str, ...] = ()

    @property
    def is_terminal(self) -> bool:
        """True when the pipeline stops here and no role projection is built."""
        return self.kind in (ChangeKind.NO_CHANGE, ChangeKind.INSUFFICIENT_DATA)


class ContextSignals(BaseModel):
    """Observable, checkable circumstances that could explain a change.

    Every field is something a human reported or a device measured — nothing
    here is inferred by a model. The triage in `context_engine.contextualise`
    reads these BEFORE any interpretation of the change is formed, which is
    what makes "reversible causes first" a control-flow property rather than a
    stylistic preference.
    """

    model_config = ConfigDict(frozen=True)

    # ── Possible acute medical causes (same-day) ─────────────────────────────
    onset_hours: float | None = None  # hours since the change was first observed
    infection_signs: bool = False  # fever, new cough, burning urination
    new_medication_within_days: int | None = None
    altered_arousal: bool = False
    dehydration_signs: bool = False

    # ── Reversible everyday causes (soon) ────────────────────────────────────
    sleep_disrupted: bool = False
    pain_reported: bool = False
    constipation_reported: bool = False
    hearing_aid_unused: bool = False
    glasses_unused: bool = False

    # ── Life-context causes (routine) ────────────────────────────────────────
    routine_disrupted: bool = False  # travel, festival, visitors, power cut
    bereavement_or_stress: bool = False
    new_environment: bool = False

    # ── Measurement-side confounders ─────────────────────────────────────────
    low_quality_share: float = Field(default=0.0, ge=0.0, le=1.0)
    language_mismatch_share: float = Field(default=0.0, ge=0.0, le=1.0)
    sessions_considered: int = 0


class ReversibleCause(BaseModel):
    """One candidate explanation, with the concrete check that would settle it."""

    model_config = ConfigDict(frozen=True)

    code: str
    urgency: CauseUrgency
    description: str  # plain language, no medical framing
    check_action: str  # what a human can actually do to rule it in or out


class Confounder(BaseModel):
    """A measurement-side reason the evidence is weaker than it looks."""

    model_config = ConfigDict(frozen=True)

    code: str
    detail: str


# Phrasings that attribute an observed change to an underlying trajectory.
# The system must be structurally incapable of producing them (invariant 3).
_PROGRESSION_PATTERNS: tuple[re.Pattern[str], ...] = (
    re.compile(r"\bprogress\w*", re.IGNORECASE),
    re.compile(r"\bdeteriorat\w*", re.IGNORECASE),
    re.compile(r"\bgetting\s+worse\b", re.IGNORECASE),
    re.compile(r"\bworsen\w*", re.IGNORECASE),
    re.compile(r"\b(has|have|has\s+got)\s+dementia\b", re.IGNORECASE),
    re.compile(r"\bdementia\s+is\b", re.IGNORECASE),
    re.compile(r"\bstage\s+\d", re.IGNORECASE),
    re.compile(r"\bdeclining\b", re.IGNORECASE),
)


class ContextualisedStatement(BaseModel):
    """Artefact #7 — the only input a RoleProjection may be built from.

    It describes a change **relative to the person's own recent baseline**,
    lists what could reversibly explain it (urgent causes first), names what
    weakens the evidence, and states what is still unknown. It never says what
    the change means over time; only a clinician converts it to a trajectory,
    which is why `interpretation_withheld` is not a settable field.
    """

    model_config = ConfigDict(frozen=True)

    person_id: str
    domain: str
    change_kind: ChangeKind
    escalation_level: EscalationLevel | None

    statement: str  # neutral, within-person, no trajectory
    reversible_causes: tuple[ReversibleCause, ...] = ()
    confounders: tuple[Confounder, ...] = ()
    open_questions: tuple[str, ...] = ()

    measurement_confidence: str = "moderate"  # good | moderate | low
    evidence_refs: tuple[str, ...] = ()
    engine_version: str = "context_engine/1"

    @property
    def interpretation_withheld(self) -> bool:
        """Always True. The engine describes; it never concludes a trajectory."""
        return True

    @model_validator(mode="after")
    def _no_progression_language(self) -> ContextualisedStatement:
        haystack = " ".join(
            (
                self.statement,
                *(c.description for c in self.reversible_causes),
                *(c.check_action for c in self.reversible_causes),
                *(c.detail for c in self.confounders),
                *self.open_questions,
            )
        )
        for pattern in _PROGRESSION_PATTERNS:
            if pattern.search(haystack):
                raise ValueError(
                    "ContextualisedStatement may not attribute change to a "
                    f"trajectory; matched {pattern.pattern!r}"
                )
        return self
