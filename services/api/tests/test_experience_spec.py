"""Experience-Spec — schema-enforced safety + the two Studio validators.

These prove the structural guarantees: an ungrounded person cannot be encoded,
dignity constraints cannot be turned off, and the grounding validator re-checks
against the PWM source of truth rather than trusting the spec's self-report.
"""

from __future__ import annotations

from datetime import UTC, datetime, timedelta

import pytest
from pydantic import ValidationError

from app.studio import (
    ActivityDefinition,
    ActivityItem,
    CognitiveDomain,
    ContentKind,
    ContentSource,
    DignityConstraints,
    EngineType,
    ExperienceSpec,
    LanguageTier,
    Modality,
    PrimitiveFamily,
    ResolvedFact,
    SafetyMetadata,
    TargetBand,
    TemporalFrame,
    VerificationStatus,
    dignity_validator,
    grounding_validator,
    validate_spec,
)
from app.studio.spec import (
    GenerationProvenance,
    InterpretationRules,
    MeasurementPlan,
    ObservationType,
    StopBehaviour,
)

NOW = datetime(2026, 9, 2, 10, 0, tzinfo=UTC)
PERSON_ID = "person:001"
RINA_FACT = "f_rina"


class DictPwmLookup:
    """Test PWM source of truth."""

    def __init__(self, facts: dict[str, ResolvedFact]) -> None:
        self._facts = facts

    def resolve(self, pwm_fact_id: str):
        return self._facts.get(pwm_fact_id)


def verified_lookup() -> DictPwmLookup:
    return DictPwmLookup(
        {
            RINA_FACT: ResolvedFact(
                pwm_fact_id=RINA_FACT,
                subject_person_id=PERSON_ID,
                verification_status=VerificationStatus.VERIFIED,
                visibility=("person", "primary_caregiver"),
            )
        }
    )


def personal_source() -> ContentSource:
    return ContentSource(
        element_id="c_rina",
        kind=ContentKind.PERSON,
        label="Rina",
        pwm_fact_id=RINA_FACT,
        provenance_ref="log:2026-07-02:0143",
        verification_status=VerificationStatus.VERIFIED,
    )


def generic_source() -> ContentSource:
    return ContentSource(element_id="c_generic", kind=ContentKind.GENERIC, label="a teapot")


def make_spec(
    *,
    content=None,
    target_band: TargetBand | None = None,
    safety: SafetyMetadata | None = None,
    expected_observation_types: tuple[ObservationType, ...] | None = None,
    measurement_plan: MeasurementPlan | None = None,
    stop_decline_behaviour: tuple[StopBehaviour, ...] | None = None,
    interpretation: InterpretationRules | None = None,
) -> ExperienceSpec:
    sources = content if content is not None else (personal_source(), generic_source())
    return ExperienceSpec(
        spec_id="spec:1",
        person_id=PERSON_ID,
        engine=EngineType.MATCHING,
        primitive_family=PrimitiveFamily.RECOGNITION_RECALL,
        cognitive_target=(CognitiveDomain.MEMORY,),
        temporal_frame=TemporalFrame.PAST,
        difficulty=0.8,
        target_band=target_band or TargetBand(),
        modality=Modality.PICTURE,
        language_tier=LanguageTier.A,
        preferred_language="as",
        cultural_context="khasi_v1",
        activity=ActivityDefinition(
            engine=EngineType.MATCHING,
            instruction_key="match.person.v1",
            items=(
                ActivityItem(item_id="i1", content_element_id="c_rina", role_in_item="target"),
                ActivityItem(
                    item_id="i2", content_element_id="c_generic", role_in_item="distractor"
                ),
            ),
        ),
        content_sources=tuple(sources),
        safety=safety or SafetyMetadata(),
        expected_observation_types=(
            expected_observation_types
            if expected_observation_types is not None
            else (
                ObservationType.RECOGNITION_SUCCESS,
                ObservationType.RECALL_LATENCY,
            )
        ),
        measurement_plan=measurement_plan
        or MeasurementPlan(
            may_update_capability=True,
            capability_updating=(ObservationType.RECOGNITION_SUCCESS,),
            tagged_conditions=("with_photo_cue",),
        ),
        stop_decline_behaviour=(
            stop_decline_behaviour
            if stop_decline_behaviour is not None
            else (
                StopBehaviour.GRACEFUL_EXIT,
                StopBehaviour.END_ON_SUCCESS,
                StopBehaviour.HONOUR_REFUSAL,
            )
        ),
        post_experience_interpretation_rules=interpretation or InterpretationRules(),
        provenance=GenerationProvenance(model="test", generated_at=NOW),
        expiry=NOW + timedelta(days=1),
    )


# ── Structural guarantees (construction-time) ────────────────────────────────
def test_valid_spec_constructs_and_validates():
    spec = make_spec()
    result = validate_spec(spec, verified_lookup())
    assert result.passed


def test_personal_content_without_provenance_is_rejected_at_construction():
    with pytest.raises(ValidationError):
        ContentSource(
            element_id="c_bad",
            kind=ContentKind.PERSON,
            label="Someone",
            # missing pwm_fact_id / provenance_ref
            verification_status=VerificationStatus.VERIFIED,
        )


def test_personal_content_must_be_verified():
    with pytest.raises(ValidationError):
        ContentSource(
            element_id="c_bad",
            kind=ContentKind.PERSON,
            label="Someone",
            pwm_fact_id="f_x",
            provenance_ref="log:x",
            verification_status=VerificationStatus.REPORTED,  # not verified
        )


def test_dignity_constraints_cannot_be_turned_off():
    with pytest.raises(ValidationError):
        DignityConstraints(no_wrong=False)
    with pytest.raises(ValidationError):
        DignityConstraints(no_score_shown=False)


def test_target_band_low_must_be_below_high():
    with pytest.raises(ValidationError):
        TargetBand(low=0.9, high=0.8)


def test_activity_item_must_reference_declared_content():
    with pytest.raises(ValidationError):
        ExperienceSpec(
            spec_id="spec:2",
            person_id=PERSON_ID,
            engine=EngineType.MATCHING,
            primitive_family=PrimitiveFamily.RECOGNITION_RECALL,
            cognitive_target=(CognitiveDomain.MEMORY,),
            temporal_frame=TemporalFrame.PAST,
            difficulty=0.8,
            modality=Modality.PICTURE,
            language_tier=LanguageTier.A,
            preferred_language="as",
            cultural_context="khasi_v1",
            activity=ActivityDefinition(
                engine=EngineType.MATCHING,
                instruction_key="match.person.v1",
                items=(
                    ActivityItem(item_id="i1", content_element_id="does_not_exist"),
                ),
            ),
            content_sources=(generic_source(),),
            provenance=GenerationProvenance(model="test", generated_at=NOW),
            expiry=NOW + timedelta(days=1),
        )


# ── Grounding validator re-checks against the source of truth ────────────────
def test_grounding_fails_when_fact_unresolved():
    spec = make_spec()
    empty = DictPwmLookup({})
    result = grounding_validator(spec, empty)
    assert not result.passed
    assert any(v.code == "unresolved_fact" for v in result.violations)


def test_grounding_fails_when_source_of_truth_says_unverified():
    spec = make_spec()
    lookup = DictPwmLookup(
        {
            RINA_FACT: ResolvedFact(
                pwm_fact_id=RINA_FACT,
                subject_person_id=PERSON_ID,
                verification_status=VerificationStatus.UNVERIFIED,
            )
        }
    )
    result = grounding_validator(spec, lookup)
    assert not result.passed
    assert any(v.code == "unverified_fact" for v in result.violations)


def test_grounding_fails_when_fact_belongs_to_another_person():
    spec = make_spec()
    lookup = DictPwmLookup(
        {
            RINA_FACT: ResolvedFact(
                pwm_fact_id=RINA_FACT,
                subject_person_id="person:999",
                verification_status=VerificationStatus.VERIFIED,
            )
        }
    )
    result = grounding_validator(spec, lookup)
    assert not result.passed
    assert any(v.code == "wrong_subject" for v in result.violations)


def test_generic_only_spec_needs_no_grounding():
    # A spec built entirely from generic content requires no PWM grounding at all,
    # so it validates even against an empty source of truth.
    spec = ExperienceSpec(
        spec_id="spec:generic",
        person_id=PERSON_ID,
        engine=EngineType.MATCHING,
        primitive_family=PrimitiveFamily.RECOGNITION_RECALL,
        cognitive_target=(CognitiveDomain.MEMORY,),
        temporal_frame=TemporalFrame.PRESENT,
        difficulty=0.8,
        modality=Modality.PICTURE,
        language_tier=LanguageTier.A,
        preferred_language="as",
        cultural_context="khasi_v1",
        activity=ActivityDefinition(
            engine=EngineType.MATCHING,
            instruction_key="match.generic.v1",
            items=(ActivityItem(item_id="i1", content_element_id="c_generic"),),
        ),
        content_sources=(generic_source(),),
        expected_observation_types=(ObservationType.SELECTION_ACCURACY,),
        provenance=GenerationProvenance(model="test", generated_at=NOW),
        expiry=NOW + timedelta(days=1),
    )
    result = validate_spec(spec, DictPwmLookup({}))
    assert result.passed


# ── Dignity validator (defence in depth) ─────────────────────────────────────
def test_dignity_flags_success_band_too_low():
    spec = make_spec(target_band=TargetBand(low=0.5, high=0.6))
    result = dignity_validator(spec)
    assert not result.passed
    assert any(v.code == "success_band_too_low" for v in result.violations)


def test_dignity_flags_comfort_first_with_long_duration():
    spec = make_spec(safety=SafetyMetadata(comfort_first=True, max_duration_seconds=900))
    result = dignity_validator(spec)
    assert not result.passed
    assert any(v.code == "comfort_first_duration_too_long" for v in result.violations)


def test_default_spec_passes_dignity():
    assert dignity_validator(make_spec()).passed


# ══ Measurement is declared before the person interacts (Part II §14) ════════

def test_a_spec_must_declare_what_it_observes():
    """No observation types means measurement by accident."""
    with pytest.raises(ValidationError):
        make_spec_without_observations()


def make_spec_without_observations():
    return ExperienceSpec(
        spec_id="spec:no-obs",
        person_id=PERSON_ID,
        engine=EngineType.MATCHING,
        primitive_family=PrimitiveFamily.RECOGNITION_RECALL,
        cognitive_target=(CognitiveDomain.MEMORY,),
        temporal_frame=TemporalFrame.PAST,
        difficulty=0.8,
        modality=Modality.PICTURE,
        language_tier=LanguageTier.A,
        preferred_language="as",
        cultural_context="assamese_v1",
        activity=ActivityDefinition(
            engine=EngineType.MATCHING,
            instruction_key="match.person.v1",
            items=(ActivityItem(item_id="i1", content_element_id="c_generic"),),
        ),
        content_sources=(generic_source(),),
        expected_observation_types=(),
        provenance=GenerationProvenance(model="test", generated_at=NOW),
        expiry=NOW + timedelta(days=1),
    )


def test_capability_cannot_be_updated_from_an_observation_never_collected():
    """Measurement by assertion: claiming to measure what you do not observe."""
    with pytest.raises(ValidationError) as exc:
        make_spec(
            expected_observation_types=(ObservationType.ENGAGEMENT,),
            measurement_plan=MeasurementPlan(
                may_update_capability=True,
                capability_updating=(ObservationType.FREE_RECALL_SUCCESS,),
            ),
        )
    assert "does not observe" in str(exc.value)


def test_a_measurement_plan_defaults_to_updating_nothing():
    """Deny by default here too: an experience measures nothing until it says so."""
    plan = MeasurementPlan()
    assert plan.may_update_capability is False
    assert plan.capability_updating == ()


def test_a_plan_that_updates_capability_must_name_the_types():
    with pytest.raises(ValidationError):
        MeasurementPlan(may_update_capability=True)


def test_naming_capability_types_without_enabling_updates_is_rejected():
    """One of the two is wrong, and guessing which would be worse."""
    with pytest.raises(ValidationError):
        MeasurementPlan(
            may_update_capability=False,
            capability_updating=(ObservationType.RECOGNITION_SUCCESS,),
        )


def test_refusal_cannot_be_designed_out_of_an_experience():
    """"No" must be honoured immediately, and skipping must always be available."""
    with pytest.raises(ValidationError) as exc:
        make_spec(stop_decline_behaviour=(StopBehaviour.END_ON_SUCCESS,))
    assert "graceful exit" in str(exc.value)


def test_an_episode_can_never_be_declared_a_clinical_fact():
    """Invariants 13 and 5 are unconstructable-otherwise, not configuration."""
    with pytest.raises(ValidationError):
        InterpretationRules(never_a_clinical_fact=False)
    with pytest.raises(ValidationError):
        InterpretationRules(updates_capability_only=False)


def test_interpretation_cautions_travel_with_the_spec():
    """"A miss in the wrong language is never anomia" has to be attached.

    Without the rule travelling with the episode, a language mismatch becomes a
    naming deficit two hops downstream.
    """
    spec = make_spec(
        interpretation=InterpretationRules(
            cautions=("a miss in the wrong language is never anomia",),
            invalid_if=("language_mismatch",),
        )
    )
    assert spec.post_experience_interpretation_rules.cautions
    assert "language_mismatch" in spec.post_experience_interpretation_rules.invalid_if
