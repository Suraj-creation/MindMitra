"""The Experience-Spec — the structured, validated representation of one activity.

This is the Studio's GAME_OUTPUT. It is **data, not code**: a deterministic
renderer executes it in one of seven pre-built engines. Because it is a closed
Pydantic schema, the LLM cannot smuggle executable logic or an ungrounded person
into the client — the worst it can do is propose a spec the validators reject.

Enforced structurally in this file:
  * dignity constraints can only be constructed in their safe state
    (no "wrong", no red X, no timer shown, no score shown, no comparison);
  * every personal content element must carry a verified PWM fact + provenance;
  * every activity item must reference a declared content source;
  * a success band and an expiry are mandatory.
"""

from __future__ import annotations

from datetime import datetime
from enum import Enum, IntEnum

from pydantic import BaseModel, ConfigDict, Field, model_validator


# ── Vocabulary ───────────────────────────────────────────────────────────────
class EngineType(str, Enum):
    """The 7 deterministic game engines."""

    MATCHING = "matching"
    SEQUENCING = "sequencing"
    SELECTION = "selection"  # odd-one-out / choose
    NAMING = "naming"
    TIMELINE = "timeline"
    GUIDED_TASK = "guided_task"
    CONVERSATION = "conversation"  # reminiscence / story


class PrimitiveFamily(str, Enum):
    """The 8 cognitive primitive families."""

    RECOGNITION_RECALL = "recognition_recall"
    RELATIONSHIP_SOCIAL = "relationship_social"
    AUTOBIOGRAPHICAL_SEQUENCING = "autobiographical_sequencing"
    ORIENTATION = "orientation"
    PROSPECTIVE_FUNCTIONAL = "prospective_functional"
    ATTENTION_DISCRIMINATION = "attention_discrimination"
    LANGUAGE_NAMING = "language_naming"
    REMINISCENCE_ENGAGEMENT = "reminiscence_engagement"


class CognitiveDomain(str, Enum):
    MEMORY = "memory"
    ATTENTION = "attention"
    LANGUAGE = "language"
    EXECUTIVE = "executive"
    SPATIAL = "spatial"
    SOCIAL = "social"
    FUNCTIONAL = "functional"
    PROSPECTIVE = "prospective"
    ORIENTATION = "orientation"


class Modality(str, Enum):
    VISUAL_TOUCH = "visual_touch"
    AUDIO = "audio"
    VOICE = "voice"
    PICTURE = "picture"
    MIXED = "mixed"


class LanguageTier(str, Enum):
    A = "A"  # full voice conversation (Assamese, Bengali, Hindi, English, Nepali)
    B = "B"  # voice out + touch/picture in (Bodo, Meitei, Mizo)
    C = "C"  # human-recorded voice packs + picture-first (Khasi, Garo, ...)


class TemporalFrame(str, Enum):
    PAST = "past"
    PRESENT = "present"
    FUTURE = "future"


class ScaffoldLevel(IntEnum):
    INDEPENDENT = 0
    CONTEXTUAL_CUE = 1
    MODALITY_SHIFT = 2
    NARROWED_CHOICE = 3
    PARTIAL_REVEAL = 4
    FULL_SUPPORT = 5


class VerificationStatus(str, Enum):
    VERIFIED = "verified"
    REPORTED = "reported"
    UNVERIFIED = "unverified"


class ContentKind(str, Enum):
    PERSON = "person"
    PLACE = "place"
    EVENT = "event"
    OBJECT = "object"
    PHOTO = "photo"
    GENERIC = "generic"  # culturally-appropriate non-personal content; no grounding needed


# Personal kinds must resolve to a verified PWM fact (the grounding rule).
_PERSONAL_KINDS: frozenset[ContentKind] = frozenset(
    {ContentKind.PERSON, ContentKind.PLACE, ContentKind.EVENT, ContentKind.OBJECT, ContentKind.PHOTO}
)


# ── Content ──────────────────────────────────────────────────────────────────
class ContentSource(BaseModel):
    """One element the activity may display, with its grounding.

    A personal element carries the PWM fact id and provenance ref it resolves to;
    a GENERIC element (a culturally-appropriate stock item) carries neither.
    """

    model_config = ConfigDict(frozen=True)

    element_id: str
    kind: ContentKind
    label: str  # display label (localised upstream)
    pwm_fact_id: str | None = None
    provenance_ref: str | None = None
    verification_status: VerificationStatus | None = None
    media_ref: str | None = None  # B2 object key for an image, if any

    @model_validator(mode="after")
    def _check_grounding(self) -> ContentSource:
        if self.kind in _PERSONAL_KINDS:
            if not self.pwm_fact_id or not self.provenance_ref:
                raise ValueError(
                    f"personal content '{self.element_id}' ({self.kind.value}) must carry "
                    "a pwm_fact_id and provenance_ref"
                )
            if self.verification_status is not VerificationStatus.VERIFIED:
                raise ValueError(
                    f"personal content '{self.element_id}' must be verified "
                    f"(got {self.verification_status})"
                )
        return self


class ActivityItem(BaseModel):
    model_config = ConfigDict(frozen=True)

    item_id: str
    content_element_id: str  # references a ContentSource.element_id
    role_in_item: str = "target"  # target | distractor | step | prompt
    position: int | None = None  # for sequencing / timeline ordering


class ActivityDefinition(BaseModel):
    """Engine-agnostic activity body. Items reference declared content sources."""

    model_config = ConfigDict(frozen=True)

    engine: EngineType
    instruction_key: str  # localisation key; never a raw model-authored string of code
    items: tuple[ActivityItem, ...] = Field(min_length=1)
    choice_count: int | None = None  # for selection/matching engines


# ── Safety / dignity ─────────────────────────────────────────────────────────
class DignityConstraints(BaseModel):
    """The never-list, encoded. Can only be constructed in the safe state."""

    model_config = ConfigDict(frozen=True)

    no_wrong: bool = True
    no_red_x: bool = True
    no_timer_shown: bool = True
    no_score_shown: bool = True
    no_comparison_to_others: bool = True

    @model_validator(mode="after")
    def _all_safe(self) -> DignityConstraints:
        unsafe = [k for k, v in self.__dict__.items() if v is not True]
        if unsafe:
            raise ValueError(f"dignity constraints must all hold; violated: {unsafe}")
        return self


class SensoryAdaptation(BaseModel):
    model_config = ConfigDict(frozen=True)

    font_scale: float = 1.0
    high_contrast: bool = False
    audio_first: bool = False


class SafetyMetadata(BaseModel):
    model_config = ConfigDict(frozen=True)

    dignity: DignityConstraints = Field(default_factory=DignityConstraints)
    sensory: SensoryAdaptation = Field(default_factory=SensoryAdaptation)
    max_duration_seconds: int = Field(default=900, gt=0, le=3600)
    comfort_first: bool = False  # if an agitation episode was logged, reduce stimulation


class ScaffoldingPolicy(BaseModel):
    model_config = ConfigDict(frozen=True)

    start_level: ScaffoldLevel = ScaffoldLevel.INDEPENDENT
    max_level: ScaffoldLevel = ScaffoldLevel.FULL_SUPPORT
    advance_after_consecutive_struggles: int = Field(default=1, ge=1)

    @model_validator(mode="after")
    def _ordered(self) -> ScaffoldingPolicy:
        if int(self.start_level) > int(self.max_level):
            raise ValueError("start_level cannot exceed max_level")
        return self


class TargetBand(BaseModel):
    """Success band. Default 0.75–0.85 (dignity + stimulation + usable signal)."""

    model_config = ConfigDict(frozen=True)

    low: float = Field(default=0.75, gt=0.0, lt=1.0)
    high: float = Field(default=0.85, gt=0.0, le=1.0)

    @model_validator(mode="after")
    def _ordered(self) -> TargetBand:
        if self.low >= self.high:
            raise ValueError("target band low must be < high")
        return self


class GenerationProvenance(BaseModel):
    model_config = ConfigDict(frozen=True)

    generated_by: str = "studio.compiler"
    model: str | None = None
    generated_at: datetime


# ── Measurement (Part II §14) ────────────────────────────────────────────────
class ObservationType(str, Enum):
    """What an experience may observe, declared before the person interacts.

    Part II §14 calls these fields "what make an activity a Cognitive Experience
    rather than a game", and the first link in the game-to-clinical firewall.
    Declaring them up front is what makes measurement *designed* rather than
    reverse-engineered from whatever telemetry happened to arrive.
    """

    RECOGNITION_SUCCESS = "recognition_success"
    CUED_RECALL_SUCCESS = "cued_recall_success"
    FREE_RECALL_SUCCESS = "free_recall_success"
    RECALL_LATENCY = "recall_latency"
    CUE_EFFECTIVENESS = "cue_effectiveness"
    SEQUENCE_ACCURACY = "sequence_accuracy"
    STEPS_UNAIDED = "steps_unaided"
    NAMING_SUCCESS = "naming_success"
    SELECTION_ACCURACY = "selection_accuracy"
    SUSTAINED_ATTENTION = "sustained_attention"
    INITIATION = "initiation"
    ENGAGEMENT = "engagement"
    AFFECT = "affect"
    SELF_CORRECTION = "self_correction"


class StopBehaviour(str, Enum):
    """What happens when the person stops, declines, or struggles.

    `DECLINE` and `REST` are agency working, not failure. Part II §14 and
    tech-stack §18.2 both require that they produce no engagement penalty, no
    compliance score, no caregiver alert and no change signal.
    """

    GRACEFUL_EXIT = "graceful_exit"        # always available, never penalised
    END_ON_SUCCESS = "end_on_success"      # add one she will get, then close
    OFFER_REST = "offer_rest"
    HONOUR_REFUSAL = "honour_refusal"      # no re-ask in the same session


class MeasurementPlan(BaseModel):
    """How this experience's observations may be used — decided in advance.

    `q_min` is per-spec because a rhythm task in a noisy room needs a higher bar
    than a photograph task. `may_update_capability` is the switch that keeps a
    purely social experience out of the measurement path entirely.
    """

    model_config = ConfigDict(frozen=True)

    q_min: float = Field(default=0.40, gt=0.0, lt=1.0)
    # Which of the declared observation types may move a capability estimate.
    # A subset, never the whole set: latency and affect are recorded and are
    # not capability.
    capability_updating: tuple[ObservationType, ...] = ()
    # Deny by default, like everything else here. An experience measures
    # nothing that moves a capability estimate until it says which observations
    # do — so a purely social experience needs no argument to stay out of the
    # measurement path, and a measuring one has to be explicit.
    may_update_capability: bool = False
    # Conditions that must be tagged onto every observation this produces, so a
    # later reader knows a score was achieved *with a photo cue* and not alone.
    tagged_conditions: tuple[str, ...] = ()

    @model_validator(mode="after")
    def _capability_requires_types(self) -> MeasurementPlan:
        if self.may_update_capability and not self.capability_updating:
            raise ValueError(
                "a plan that may update capability must name which observation "
                "types do so; an unnamed subset is measurement by accident"
            )
        if not self.may_update_capability and self.capability_updating:
            raise ValueError(
                "capability_updating is set on a plan that may not update "
                "capability — one of the two is wrong"
            )
        return self


class InterpretationRules(BaseModel):
    """How the resulting episode may and may **not** be read.

    These travel with the episode so a reader downstream cannot forget them.
    The canonical example from Part II §14: "a miss in the wrong language is
    never anomia". Without the rule attached, a language mismatch becomes a
    naming deficit two hops later.
    """

    model_config = ConfigDict(frozen=True)

    # Always true, and unconstructable otherwise: an episode updates capability
    # estimates only. It is never itself a clinical fact.
    updates_capability_only: bool = True
    never_a_clinical_fact: bool = True
    # Free-text cautions, e.g. "a miss in the wrong language is never anomia".
    cautions: tuple[str, ...] = ()
    # Observation types that must be discarded when a named condition held.
    invalid_if: tuple[str, ...] = ()

    @model_validator(mode="after")
    def _invariants_hold(self) -> InterpretationRules:
        if not self.updates_capability_only or not self.never_a_clinical_fact:
            raise ValueError(
                "an episode may only update capability and is never a clinical "
                "fact; these are invariants 13 and 5, not options"
            )
        return self


# ── The spec ─────────────────────────────────────────────────────────────────
class SpecValidationStatus(str, Enum):
    PROPOSED = "proposed"  # LLM output, not yet validated
    VALIDATED = "validated"  # passed grounding + dignity
    REJECTED = "rejected"


class ExperienceSpec(BaseModel):
    """The full GAME_OUTPUT. Structured, groundable, renderable — never code."""

    model_config = ConfigDict(frozen=True)

    spec_id: str
    person_id: str

    engine: EngineType
    primitive_family: PrimitiveFamily
    cognitive_target: tuple[CognitiveDomain, ...] = Field(min_length=1)
    functional_target: str | None = None
    temporal_frame: TemporalFrame

    difficulty: float = Field(gt=0.0, lt=1.0)
    target_band: TargetBand = Field(default_factory=TargetBand)

    modality: Modality
    language_tier: LanguageTier
    preferred_language: str
    cultural_context: str  # cultural ontology id, e.g. "khasi_v1"

    scaffolding: ScaffoldingPolicy = Field(default_factory=ScaffoldingPolicy)
    activity: ActivityDefinition
    content_sources: tuple[ContentSource, ...] = Field(min_length=1)
    safety: SafetyMetadata = Field(default_factory=SafetyMetadata)

    # ── Measurement, declared before the person interacts (Part II §14) ──────
    expected_observation_types: tuple[ObservationType, ...] = Field(min_length=1)
    measurement_plan: MeasurementPlan = Field(default_factory=MeasurementPlan)
    stop_decline_behaviour: tuple[StopBehaviour, ...] = (
        StopBehaviour.GRACEFUL_EXIT,
        StopBehaviour.END_ON_SUCCESS,
        StopBehaviour.HONOUR_REFUSAL,
    )
    post_experience_interpretation_rules: InterpretationRules = Field(
        default_factory=InterpretationRules
    )

    consent_scope: tuple[str, ...] = ()
    provenance: GenerationProvenance
    expiry: datetime

    validation_status: SpecValidationStatus = SpecValidationStatus.PROPOSED

    @model_validator(mode="after")
    def _items_reference_declared_content(self) -> ExperienceSpec:
        declared = {c.element_id for c in self.content_sources}
        if self.activity.engine is not self.engine:
            raise ValueError("activity.engine must match spec.engine")
        for item in self.activity.items:
            if item.content_element_id not in declared:
                raise ValueError(
                    f"activity item '{item.item_id}' references undeclared content "
                    f"'{item.content_element_id}'"
                )
        return self

    @model_validator(mode="after")
    def _measurement_covers_what_it_claims(self) -> ExperienceSpec:
        """A capability-updating type must be one this experience observes.

        Without this, a spec could declare that it updates a memory estimate
        from an observation type it never collects — measurement by assertion.
        """
        declared = set(self.expected_observation_types)
        undeclared = [
            t.value
            for t in self.measurement_plan.capability_updating
            if t not in declared
        ]
        if undeclared:
            raise ValueError(
                "measurement_plan names capability-updating observation types "
                f"this experience does not observe: {undeclared}"
            )
        return self

    @model_validator(mode="after")
    def _refusal_is_always_honoured(self) -> ExperienceSpec:
        """Refusal cannot be designed out of an experience.

        `HONOUR_REFUSAL` and `GRACEFUL_EXIT` are mandatory: "no" must be
        honoured immediately with no re-ask in the same session, and skipping
        must be available at all times (DESIGN.md C1.2, C1.3).
        """
        required = {StopBehaviour.GRACEFUL_EXIT, StopBehaviour.HONOUR_REFUSAL}
        missing = required - set(self.stop_decline_behaviour)
        if missing:
            raise ValueError(
                "every experience must offer a graceful exit and honour a "
                f"refusal; missing: {sorted(b.value for b in missing)}"
            )
        return self
