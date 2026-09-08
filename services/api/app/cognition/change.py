"""Deviation composite, alert eligibility, and the delirium safety rule.

Three deterministic components:

1. DeviationComposite — weighted sum of quality-gated z-scores across domains.
   D(t) = Σ_s  ω_s * clip(|z_s(t)|, 4.0) * q_s(t)

2. AlertEligibility — all six conditions must hold to fire an alert. Critically:
   q < Q_MIN → eligible=False, regardless of |z|.
   "Bad data CANNOT raise an alarm." (CLAUDE.md §1.4)

3. AcuteChangeDetector — delirium/acute-change safety rule (L5 always fires):
   IF onset_hours <= 72 AND n_domains >= 2 AND (fluctuation OR inattention OR arousal)
   THEN L5 — and the reason NEVER says "dementia is progressing".

Reference: Blueprint §15.5–15.6, MindMitra_PS26003_PartII.md §5.3.
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import Sequence

from app.firewall.roles import EscalationLevel

from .mq import Q_MIN

# ── Alert level thresholds ────────────────────────────────────────────────────
ALERT_THRESHOLDS: dict[EscalationLevel, float] = {
    EscalationLevel.L2: 1.5,
    EscalationLevel.L3: 2.0,
    EscalationLevel.L4: 2.5,
    EscalationLevel.L5: 3.0,
}

PERSISTENCE_DAYS: dict[EscalationLevel, int] = {
    EscalationLevel.L2: 3,
    EscalationLevel.L3: 2,
    EscalationLevel.L4: 14,
    EscalationLevel.L5: 0,  # L5 always fires; no persistence requirement
}

Z_CLIP: float = 4.0  # Clip extreme z-scores to prevent single outliers dominating
ACUTE_ONSET_HOURS: float = 72.0  # Delirium rule threshold
ACUTE_MIN_DOMAINS: int = 2  # Minimum domains affected for the acute path


@dataclass(frozen=True)
class DomainDeviation:
    """One domain's quality-weighted deviation, for use in the composite."""

    domain: str
    z: float  # From baseline.compute_deviation (only valid if gate="scored")
    q: float  # From MQE
    weight: float  # Domain importance weight ω_s (caller-specified; default equal)


@dataclass(frozen=True)
class DeviationComposite:
    """The composite deviation across all domains for one person at one time."""

    D: float  # Σ ω_s * clip(|z_s|, Z_CLIP) * q_s
    domain_deviations: tuple[DomainDeviation, ...]


@dataclass(frozen=True)
class AlertEligibilityResult:
    """Whether an alert may fire, and at which escalation level."""

    eligible: bool
    suggested_level: EscalationLevel | None
    reason_codes: tuple[str, ...]


@dataclass(frozen=True)
class AcuteChangeSignals:
    """Signals for the delirium / acute-change safety rule."""

    onset_hours: float  # Symptom onset window in hours
    n_domains_affected: int  # Number of cognitive domains affected
    fluctuating_course: bool  # Fluctuating course observed
    new_inattention: bool  # New inattention present
    altered_arousal: bool  # Altered level of arousal


@dataclass(frozen=True)
class AcuteChangeResult:
    """Outcome of the acute change detector."""

    is_acute: bool
    suggested_level: EscalationLevel | None
    reason: str  # NEVER contains "dementia is progressing"


def compute_composite(deviations: Sequence[DomainDeviation]) -> DeviationComposite:
    """D(t) = Σ ω_s * clip(|z_s(t)|, Z_CLIP) * q_s(t)

    Domain deviations with q < Q_MIN are excluded (enforced by the caller having
    quality-gated before calling this function). Any domain where z is None
    (cold_start or insufficient_data) must not be passed here.
    """
    if not deviations:
        return DeviationComposite(D=0.0, domain_deviations=())

    total_weight = sum(d.weight for d in deviations)
    if total_weight == 0.0:
        return DeviationComposite(D=0.0, domain_deviations=tuple(deviations))

    D = sum(
        (d.weight / total_weight) * min(abs(d.z), Z_CLIP) * d.q
        for d in deviations
    )
    return DeviationComposite(D=D, domain_deviations=tuple(deviations))


def check_alert_eligibility(
    deviations: Sequence[DomainDeviation],
    persistence_days: int,
    recently_alerted: bool,
    actionable: bool,
    q_min: float = Q_MIN,
) -> AlertEligibilityResult:
    """Evaluate all six alert eligibility conditions.

    Conditions (ALL must hold to be eligible, except L5 safety override):
    1. |z| >= tau_level (for any domain or composite)
    2. persistence >= p_level (not required for L5)
    3. q >= q_min  ← BAD DATA CANNOT RAISE AN ALARM
    4. Not substantially duplicative in the last 7 days
    5. A concrete safe caregiver action exists (actionable)
    6. Safety-rule override: L5 always fires regardless of conditions 2–5

    Returns AlertEligibilityResult with eligible=False and an explanatory
    reason_codes tuple when any condition fails.
    """
    reasons: list[str] = []

    # Quality gate — this is the structural guarantee.
    low_quality_domains = [d.domain for d in deviations if d.q < q_min]
    if low_quality_domains:
        reasons.append(f"quality_gate_failed:domains={low_quality_domains}")

    quality_gated = [d for d in deviations if d.q >= q_min]

    # Eligibility is decided on **per-domain** |z|, never on the composite.
    #
    # `compute_composite` exists and is tested, but deliberately does not feed
    # this decision: a composite fuses modalities into one number, and a single
    # fused cognitive score is exactly what CLAUDE.md invariant 5 and DESIGN.md
    # C4.3 forbid. Alerting on it would let a mild deviation across several
    # domains masquerade as one clinical signal. The composite is a descriptive
    # statistic for research, not an alerting input.

    # Determine the highest eligible level based on per-domain |z|.
    max_abs_z = max((abs(d.z) for d in quality_gated), default=0.0)
    suggested_level: EscalationLevel | None = None

    for level in (EscalationLevel.L5, EscalationLevel.L4, EscalationLevel.L3, EscalationLevel.L2):
        tau = ALERT_THRESHOLDS[level]
        if max_abs_z >= tau:
            suggested_level = level
            break

    if suggested_level is None:
        reasons.append(f"deviation_below_threshold:max_z={max_abs_z:.2f}")

    # L5 safety override: always fires if deviation is extreme.
    if suggested_level is EscalationLevel.L5:
        return AlertEligibilityResult(
            eligible=True,
            suggested_level=EscalationLevel.L5,
            reason_codes=("l5_safety_override",),
        )

    # At this point, if quality gate failed we stop.
    if low_quality_domains:
        return AlertEligibilityResult(
            eligible=False,
            suggested_level=None,
            reason_codes=tuple(reasons),
        )

    # Persistence check.
    required_days = PERSISTENCE_DAYS.get(suggested_level or EscalationLevel.L2, 3)
    if persistence_days < required_days:
        reasons.append(
            f"persistence_insufficient:{persistence_days}_of_{required_days}_days"
        )

    # Novelty check (not substantially duplicative).
    if recently_alerted:
        reasons.append("recently_alerted:suppressed")

    # Actionability check.
    if not actionable:
        reasons.append("no_actionable_intervention")

    if reasons:
        return AlertEligibilityResult(
            eligible=False,
            suggested_level=suggested_level,
            reason_codes=tuple(reasons),
        )

    return AlertEligibilityResult(
        eligible=True,
        suggested_level=suggested_level,
        reason_codes=(),
    )


def detect_acute_change(signals: AcuteChangeSignals) -> AcuteChangeResult:
    """The delirium / acute-change safety rule (CLAUDE.md §1.3).

    IF onset_hours <= 72
    AND n_domains_affected >= ACUTE_MIN_DOMAINS
    AND (fluctuating_course OR new_inattention OR altered_arousal)
    THEN L5.

    The reason field NEVER attributes change to dementia progression. The correct
    clinical interpretation ("rule out delirium, infection, medication effect") is
    for the clinician — the platform only flags and routes.
    """
    acute_onset = signals.onset_hours <= ACUTE_ONSET_HOURS
    enough_domains = signals.n_domains_affected >= ACUTE_MIN_DOMAINS
    clinical_feature = (
        signals.fluctuating_course
        or signals.new_inattention
        or signals.altered_arousal
    )

    if acute_onset and enough_domains and clinical_feature:
        features = []
        if signals.fluctuating_course:
            features.append("fluctuating_course")
        if signals.new_inattention:
            features.append("new_inattention")
        if signals.altered_arousal:
            features.append("altered_arousal")

        reason = (
            f"sudden_multi_domain_change:onset={signals.onset_hours:.0f}h,"
            f"domains={signals.n_domains_affected},"
            f"features={'+'.join(features)};"
            " seek_urgent_medical_assessment;"
            " possible_causes:delirium,infection,medication_effect,dehydration;"
            " do_not_attribute_to_dementia"
        )
        return AcuteChangeResult(
            is_acute=True,
            suggested_level=EscalationLevel.L5,
            reason=reason,
        )

    return AcuteChangeResult(
        is_acute=False,
        suggested_level=None,
        reason="no_acute_change_criteria_met",
    )
