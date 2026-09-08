"""Cognition engines — exhaustive deterministic tests.

Mandatory acceptance tests:
1. test_volume_down_refuses_to_score — audibility=0 → gate="insufficient_data" (THE demo beat)
2. test_language_switch_refuses_to_score — language mismatch → flagged, NOT a cognitive failure
3. test_bad_data_cannot_raise_alert — q < Q_MIN → alert_eligible=False regardless of |z|
4. test_no_progression_claim — delirium result never says "progressing"

All numeric tests include hand-computed reference values to prevent formula drift.
"""

from __future__ import annotations

from datetime import UTC, datetime, timedelta

from app.cognition import (
    Q_MIN,
    AcuteChangeSignals,
    BaselineObservation,
    DomainDeviation,
    ObservationSignals,
    ThetaState,
    check_alert_eligibility,
    compute_composite,
    compute_deviation,
    compute_quality,
    detect_acute_change,
    select_difficulty,
    update_theta,
)
from app.firewall.roles import EscalationLevel

NOW = datetime(2026, 9, 3, 10, 0, tzinfo=UTC)
PERSON_ID = "person:demo"


# ── Helpers ────────────────────────────────────────────────────────────────────

def good_signals(**overrides) -> ObservationSignals:
    """Baseline: high-quality observation."""
    defaults = dict(
        audibility=0.95,
        visibility=0.95,
        language_match=True,
        fatigue_factor=0.90,
        was_assisted=False,
        device_ok=True,
        subject_confirmed=True,
    )
    defaults.update(overrides)
    return ObservationSignals(**defaults)


def make_window(
    n: int = 20,
    base_value: float = 0.75,
    domain: str = "memory",
    start_days_ago: int = 20,
    quality: float = 0.85,
) -> list[BaselineObservation]:
    return [
        BaselineObservation(
            domain=domain,
            value=base_value + (i % 5) * 0.02,
            quality=quality,
            observed_at=NOW - timedelta(days=start_days_ago - i),
            person_id=PERSON_ID,
        )
        for i in range(n)
    ]


# ── MANDATORY: volume down refuses to score ─────────────────────────────────────
def test_volume_down_refuses_to_score() -> None:
    """CLAUDE.md §1.4: volume=0 → q < Q_MIN → gate='insufficient_data'.
    This is the most memorable 20 seconds of the SIH demo.
    """
    result = compute_quality(good_signals(audibility=0.0))
    assert result.q < Q_MIN
    assert result.gate == "insufficient_data"
    assert result.dominant_issue == "audibility"


# ── MANDATORY: language switch refuses to score ─────────────────────────────────
def test_language_switch_refuses_to_score() -> None:
    """Language mismatch is a MEASUREMENT failure, not a cognitive failure."""
    result = compute_quality(good_signals(language_match=False))
    assert result.language_mismatch is True
    assert result.gate == "insufficient_data"
    # Critically: the flag is explicit so callers know NOT to count this cognitively
    assert result.component_scores["language_factor"] == 0.3


def test_language_mismatch_flagged_even_if_other_signals_perfect() -> None:
    result = compute_quality(good_signals(language_match=False))
    assert result.language_mismatch is True


# ── MANDATORY: bad data cannot raise alert ──────────────────────────────────────
def test_bad_data_cannot_raise_alert() -> None:
    """q < Q_MIN blocks alert eligibility REGARDLESS of |z|."""
    # Create a high-z deviation with low quality
    deviations = [
        DomainDeviation(domain="memory", z=5.0, q=0.1, weight=1.0),  # q < Q_MIN
    ]
    result = check_alert_eligibility(
        deviations=deviations,
        persistence_days=5,
        recently_alerted=False,
        actionable=True,
    )
    assert result.eligible is False
    assert any("quality_gate_failed" in r for r in result.reason_codes)


# ── MANDATORY: no progression claim in delirium output ─────────────────────────
def test_no_progression_claim_in_acute_result() -> None:
    """CLAUDE.md §1.3: Never say 'dementia is progressing'."""
    signals = AcuteChangeSignals(
        onset_hours=24,
        n_domains_affected=3,
        fluctuating_course=True,
        new_inattention=True,
        altered_arousal=False,
    )
    result = detect_acute_change(signals)
    assert result.is_acute is True
    assert result.suggested_level is EscalationLevel.L5
    assert "progress" not in result.reason.lower()
    assert "do_not_attribute_to_dementia" in result.reason


# ── MQE: assisted session excluded ─────────────────────────────────────────────
def test_assisted_session_excluded_from_ability_estimate() -> None:
    result = compute_quality(good_signals(was_assisted=True))
    assert result.q == 0.0
    assert result.gate == "insufficient_data"
    assert result.component_scores["assistance_factor"] == 0.0


def test_device_failure_gates_out() -> None:
    result = compute_quality(good_signals(device_ok=False))
    assert result.q == 0.0
    assert result.gate == "insufficient_data"


def test_subject_not_confirmed_gates_out() -> None:
    result = compute_quality(good_signals(subject_confirmed=False))
    assert result.q == 0.0
    assert result.gate == "insufficient_data"


def test_good_signals_pass_quality_gate() -> None:
    result = compute_quality(good_signals())
    assert result.q >= Q_MIN
    assert result.gate == "sufficient"
    assert result.language_mismatch is False


# ── MQE: geometric mean formula verification ────────────────────────────────────
def test_mq_formula_hand_computed() -> None:
    """Verify q formula against a hand-computed reference.

    With audibility=0.8, visibility=0.9, fatigue=0.85, all booleans True:
    base_q = geometric_mean(0.8, 0.9, 0.85) = (0.8 * 0.9 * 0.85)^(1/3)
           = 0.612^(1/3) ≈ 0.8493
    q = 0.8493 * 1.0 * 1.0 * 1.0 * 1.0 ≈ 0.8493
    """
    result = compute_quality(good_signals(audibility=0.8, visibility=0.9, fatigue_factor=0.85))
    expected = (0.8 * 0.9 * 0.85) ** (1 / 3)
    assert abs(result.q - expected) < 1e-6
    assert result.gate == "sufficient"


# ── Baseline: z/MAD formula verification ───────────────────────────────────────
def test_baseline_z_hand_computed() -> None:
    """Verify z = (x - median) / (1.4826 * MAD) against known values.

    Window: 10 observations at [0.70, 0.72, 0.74, 0.76, 0.78, 0.70, 0.72, 0.74, 0.76, 0.78]
    median = 0.74
    deviations = [|0.70-0.74|, ...] = [0.04, 0.02, 0.00, 0.02, 0.04, ...]
    MAD = median([0.04, 0.02, 0.00, 0.02, 0.04, 0.04, 0.02, 0.00, 0.02, 0.04]) = 0.02
    For x = 0.85:
      z = (0.85 - 0.74) / (1.4826 * 0.02) = 0.11 / 0.029652 ≈ 3.7097
    """
    values = [0.70, 0.72, 0.74, 0.76, 0.78, 0.70, 0.72, 0.74, 0.76, 0.78]
    # Spread over 16 days so cold-start (< 14 days) doesn't gate out.
    window = [
        BaselineObservation(
            domain="memory",
            value=v,
            quality=0.85,
            observed_at=NOW - timedelta(days=16 - i),
            person_id=PERSON_ID,
        )
        for i, v in enumerate(values)
    ]
    obs = BaselineObservation(
        domain="memory",
        value=0.85,
        quality=0.85,
        observed_at=NOW,
        person_id=PERSON_ID,
    )
    result = compute_deviation(obs, window, now=NOW)
    assert result.gate == "scored"
    assert result.z is not None
    expected_z = (0.85 - 0.74) / (1.4826 * 0.02)
    assert abs(result.z - expected_z) < 1e-4


def test_bad_quality_observations_excluded_from_window() -> None:
    """Observations with q < Q_MIN must not enter the baseline window."""
    window = make_window(n=20, quality=0.2)  # All below Q_MIN=0.40
    obs = BaselineObservation(
        domain="memory", value=0.5, quality=0.9, observed_at=NOW, person_id=PERSON_ID
    )
    result = compute_deviation(obs, window, now=NOW)
    assert result.gate == "insufficient_data"
    assert result.n_quality_gated == 0


def test_cold_start_gates_at_l2() -> None:
    """Day < 14 → cold_start gate; calibration period active."""
    window = make_window(n=5, start_days_ago=5)  # Only 5 days of data
    obs = BaselineObservation(
        domain="memory", value=0.5, quality=0.9, observed_at=NOW, person_id=PERSON_ID
    )
    result = compute_deviation(obs, window, now=NOW)
    assert result.gate == "cold_start"


# ── θ tracking: formula verification ────────────────────────────────────────────
def test_theta_update_hand_computed() -> None:
    """Verify θ update formula against a hand-computed reference.

    θ=0.0, b_i=0.0, observed=1.0, q=1.0, n_obs=0 → K=K_INITIAL=0.30
    expected = sigmoid(0.0 - 0.0) = 0.5
    delta = 0.30 * 1.0 * (1.0 - 0.5) = 0.15
    θ_new = 0.0 + 0.15 = 0.15
    """
    state = ThetaState.initial("memory", PERSON_ID)
    new_state, details = update_theta(state, observed=1.0, item_difficulty=0.0, quality_weight=1.0)
    assert abs(details.expected - 0.5) < 1e-9
    assert abs(details.k_used - 0.30) < 1e-9
    assert abs(new_state.theta - 0.15) < 1e-9
    assert new_state.n_observations == 1


def test_theta_update_skipped_on_zero_quality() -> None:
    """quality_weight=0.0 → no update; state unchanged."""
    state = ThetaState.initial("memory", PERSON_ID)
    new_state, details = update_theta(state, observed=1.0, item_difficulty=0.0, quality_weight=0.0)
    assert new_state.theta == state.theta
    assert new_state.n_observations == state.n_observations


def test_theta_k_decays_with_observations() -> None:
    state = ThetaState(theta=0.0, n_observations=10, domain="memory", person_id=PERSON_ID)
    _, details = update_theta(state, observed=1.0, item_difficulty=0.0, quality_weight=1.0)
    expected_k = 0.30 * (0.95**10)
    assert abs(details.k_used - expected_k) < 1e-9


def test_difficulty_selection_targets_80_percent() -> None:
    """select_difficulty picks item closest to 80% success probability."""
    import math

    theta = 1.0
    # ideal b = theta - logit(0.80) = 1.0 - log(0.80/0.20) = 1.0 - 1.3863 = -0.3863
    ideal = theta - math.log(0.80 / 0.20)
    item_bank = [-1.0, -0.5, -0.4, 0.0, 0.5, 1.0]
    selected = select_difficulty(theta, item_bank)
    assert selected == min(item_bank, key=lambda b: abs(b - ideal))


# ── Change detection ────────────────────────────────────────────────────────────
def test_composite_deviation_formula_hand_computed() -> None:
    """D = Σ ω_s * clip(|z_s|, 4.0) * q_s with equal weights.

    domain A: z=2.0, q=0.8, weight=1.0  → 1/2 * min(2.0,4.0) * 0.8 = 0.8
    domain B: z=3.0, q=0.7, weight=1.0  → 1/2 * min(3.0,4.0) * 0.7 = 1.05
    D = 0.8 + 1.05 = 1.85
    """
    deviations = [
        DomainDeviation(domain="memory", z=2.0, q=0.8, weight=1.0),
        DomainDeviation(domain="attention", z=3.0, q=0.7, weight=1.0),
    ]
    result = compute_composite(deviations)
    expected = 0.5 * min(2.0, 4.0) * 0.8 + 0.5 * min(3.0, 4.0) * 0.7
    assert abs(result.D - expected) < 1e-9


def test_l5_always_fires_regardless_of_other_conditions() -> None:
    """L5 is a safety override — it fires even with persistence=0."""
    deviations = [DomainDeviation(domain="memory", z=4.0, q=0.9, weight=1.0)]
    result = check_alert_eligibility(
        deviations=deviations,
        persistence_days=0,
        recently_alerted=True,
        actionable=False,
    )
    assert result.eligible is True
    assert result.suggested_level is EscalationLevel.L5


def test_delirium_rule_fires_on_acute_multi_domain_onset() -> None:
    signals = AcuteChangeSignals(
        onset_hours=24,
        n_domains_affected=2,
        fluctuating_course=True,
        new_inattention=False,
        altered_arousal=False,
    )
    result = detect_acute_change(signals)
    assert result.is_acute is True
    assert result.suggested_level is EscalationLevel.L5


def test_delirium_rule_does_not_fire_without_clinical_features() -> None:
    signals = AcuteChangeSignals(
        onset_hours=24,
        n_domains_affected=3,
        fluctuating_course=False,
        new_inattention=False,
        altered_arousal=False,
    )
    result = detect_acute_change(signals)
    assert result.is_acute is False


def test_delirium_rule_does_not_fire_beyond_72h() -> None:
    signals = AcuteChangeSignals(
        onset_hours=120,
        n_domains_affected=3,
        fluctuating_course=True,
        new_inattention=True,
        altered_arousal=True,
    )
    result = detect_acute_change(signals)
    assert result.is_acute is False


def test_alert_eligibility_blocked_by_insufficient_persistence() -> None:
    deviations = [DomainDeviation(domain="memory", z=2.0, q=0.9, weight=1.0)]
    result = check_alert_eligibility(
        deviations=deviations,
        persistence_days=0,  # Needs ≥3 for L2
        recently_alerted=False,
        actionable=True,
    )
    assert result.eligible is False
    assert any("persistence" in r for r in result.reason_codes)


def test_alert_eligibility_blocked_by_novelty() -> None:
    deviations = [DomainDeviation(domain="memory", z=2.0, q=0.9, weight=1.0)]
    result = check_alert_eligibility(
        deviations=deviations,
        persistence_days=5,
        recently_alerted=True,  # Already alerted this week
        actionable=True,
    )
    assert result.eligible is False
    assert any("recently_alerted" in r for r in result.reason_codes)
