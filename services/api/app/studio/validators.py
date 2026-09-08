"""The two deterministic Studio validators: grounding and safety/dignity.

An ExperienceSpec is only allowed to render after BOTH pass. These are pure,
deterministic functions — no LLM, no ML — matching `CLAUDE.md` invariants 8 & 9.

  * grounding_validator — every personal content element resolves to an in-scope,
    verified PWM fact (re-checked against the source of truth, not just trusted).
  * dignity_validator  — the never-list holds, the success band and scaffolding
    are safe, and modality respects sensory constraints.

On failure the caller sets the spec's status to REJECTED and falls back
(generic culturally-appropriate activity, request missing info, or defer).
"""

from __future__ import annotations

from typing import Protocol

from pydantic import BaseModel

from .spec import (
    ContentKind,
    ExperienceSpec,
    ScaffoldLevel,
    VerificationStatus,
)

_PERSONAL_KINDS: frozenset[ContentKind] = frozenset(
    {ContentKind.PERSON, ContentKind.PLACE, ContentKind.EVENT, ContentKind.OBJECT, ContentKind.PHOTO}
)


class ResolvedFact(BaseModel):
    """What the PWM source of truth returns for a fact id."""

    pwm_fact_id: str
    subject_person_id: str
    verification_status: VerificationStatus
    visibility: tuple[str, ...] = ()


class PwmLookup(Protocol):
    """The grounding validator's window into the Personal World Model."""

    def resolve(self, pwm_fact_id: str) -> ResolvedFact | None: ...


class Violation(BaseModel):
    code: str
    element_id: str | None = None
    detail: str = ""


class ValidationResult(BaseModel):
    passed: bool
    violations: tuple[Violation, ...] = ()

    @classmethod
    def ok(cls) -> ValidationResult:
        return cls(passed=True)

    @classmethod
    def fail(cls, violations: list[Violation]) -> ValidationResult:
        return cls(passed=False, violations=tuple(violations))


def grounding_validator(spec: ExperienceSpec, lookup: PwmLookup) -> ValidationResult:
    """Every personal element must resolve to an in-scope, verified PWM fact for
    this person. Generic elements are exempt. Any failure → the spec is not
    groundable and must fall back."""
    violations: list[Violation] = []

    for source in spec.content_sources:
        if source.kind not in _PERSONAL_KINDS:
            continue

        # The schema already guarantees these are present + verified, but we do
        # not trust the spec's self-report: re-resolve against the source of truth.
        if not source.pwm_fact_id:
            violations.append(
                Violation(code="missing_pwm_fact_id", element_id=source.element_id)
            )
            continue

        fact = lookup.resolve(source.pwm_fact_id)
        if fact is None:
            violations.append(
                Violation(
                    code="unresolved_fact",
                    element_id=source.element_id,
                    detail=f"pwm_fact_id '{source.pwm_fact_id}' not found",
                )
            )
            continue
        if fact.subject_person_id != spec.person_id:
            violations.append(
                Violation(
                    code="wrong_subject",
                    element_id=source.element_id,
                    detail="fact belongs to a different person",
                )
            )
        if fact.verification_status is not VerificationStatus.VERIFIED:
            violations.append(
                Violation(
                    code="unverified_fact",
                    element_id=source.element_id,
                    detail=f"source-of-truth status is {fact.verification_status.value}",
                )
            )

    return ValidationResult.ok() if not violations else ValidationResult.fail(violations)


def dignity_validator(spec: ExperienceSpec) -> ValidationResult:
    """The never-list and dignity envelope. Defence in depth over the schema's
    construction-time guarantees."""
    violations: list[Violation] = []
    d = spec.safety.dignity

    for flag_name in (
        "no_wrong",
        "no_red_x",
        "no_timer_shown",
        "no_score_shown",
        "no_comparison_to_others",
    ):
        if getattr(d, flag_name) is not True:
            violations.append(Violation(code=f"dignity_flag_off:{flag_name}"))

    # Success band must sit in the dignity range: high enough for success, not so
    # low it manufactures failure.
    if spec.target_band.low < 0.70:
        violations.append(
            Violation(code="success_band_too_low", detail=f"low={spec.target_band.low}")
        )
    if spec.target_band.high > 0.95:
        violations.append(
            Violation(code="success_band_too_high", detail=f"high={spec.target_band.high}")
        )

    if int(spec.scaffolding.start_level) < int(ScaffoldLevel.INDEPENDENT) or int(
        spec.scaffolding.start_level
    ) > int(ScaffoldLevel.FULL_SUPPORT):
        violations.append(Violation(code="scaffold_start_out_of_range"))

    # If comfort-first is set (recent agitation), duration must be bounded down.
    if spec.safety.comfort_first and spec.safety.max_duration_seconds > 600:
        violations.append(
            Violation(
                code="comfort_first_duration_too_long",
                detail=f"max_duration_seconds={spec.safety.max_duration_seconds}",
            )
        )

    return ValidationResult.ok() if not violations else ValidationResult.fail(violations)


def validate_spec(spec: ExperienceSpec, lookup: PwmLookup) -> ValidationResult:
    """Run both validators; a spec renders only if both pass."""
    grounding = grounding_validator(spec, lookup)
    dignity = dignity_validator(spec)
    if grounding.passed and dignity.passed:
        return ValidationResult.ok()
    return ValidationResult.fail([*grounding.violations, *dignity.violations])
