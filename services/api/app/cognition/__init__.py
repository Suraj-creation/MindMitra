"""Cognition engines — classical statistical ML, no LLM.

This package contains the four deterministic, numeric intelligence components
of MindMitra. All functions are pure (no side effects) and unit-tested against
hand-computed reference values.

Modules:
    mq       — Measurement-Quality Engine: per-observation quality gate q ∈ [0,1]
    baseline — Personal Baseline Engine: z/MAD within-person deviation
    theta    — Ability Tracking: θ update rule + difficulty selection
    change   — Deviation composite, alert eligibility, delirium/acute-change rule

THE structural guarantee (CLAUDE.md §1.4):
    A low-q observation is tagged `insufficient_data` and can never feed a
    baseline or fire an alert. "Refuse to score bad data" is enforced here
    as a code invariant, not a policy hope.
"""

from __future__ import annotations

from .baseline import (
    COLD_START_DAYS,
    Q_MIN,
    WINDOW_DAYS,
    BaselineObservation,
    DeviationResult,
    compute_deviation,
)
from .change import (
    ALERT_THRESHOLDS,
    PERSISTENCE_DAYS,
    AcuteChangeResult,
    AcuteChangeSignals,
    AlertEligibilityResult,
    DeviationComposite,
    DomainDeviation,
    check_alert_eligibility,
    compute_composite,
    detect_acute_change,
)
from .mq import (
    MQEResult,
    ObservationSignals,
    compute_quality,
)
from .theta import (
    K_DECAY,
    K_INITIAL,
    TARGET_BAND_HIGH,
    TARGET_BAND_LOW,
    ThetaState,
    ThetaUpdateResult,
    select_difficulty,
    update_theta,
)

__all__ = [
    # MQE
    "ObservationSignals",
    "MQEResult",
    "compute_quality",
    # Baseline
    "BaselineObservation",
    "DeviationResult",
    "compute_deviation",
    "Q_MIN",
    "WINDOW_DAYS",
    "COLD_START_DAYS",
    # Theta
    "ThetaState",
    "ThetaUpdateResult",
    "update_theta",
    "select_difficulty",
    "K_INITIAL",
    "K_DECAY",
    "TARGET_BAND_LOW",
    "TARGET_BAND_HIGH",
    # Change
    "DomainDeviation",
    "DeviationComposite",
    "AlertEligibilityResult",
    "AcuteChangeSignals",
    "AcuteChangeResult",
    "compute_composite",
    "check_alert_eligibility",
    "detect_acute_change",
    "ALERT_THRESHOLDS",
    "PERSISTENCE_DAYS",
]
