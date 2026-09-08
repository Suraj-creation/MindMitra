"""Ability Tracking — θ update rule and difficulty selection.

Implements a simple item-response-theory-inspired online update:

    expected = sigmoid(θ_d(t) - b_i)      # b_i = calibrated difficulty of item i
    θ_d(t+1) = θ_d(t) + K * q * (observed - expected)

    K decays with the number of observations: K_n = K_INITIAL * K_DECAY^n

Quality weight q (from MQE) multiplies the update: a low-quality session
contributes nothing to the ability estimate. If quality_weight=0.0, the θ state
is unchanged (no update applied).

Target success band: 75%–85%.
The difficulty selector picks the item closest to σ(θ - b_i) = 0.80 (midpoint),
preserving both dignity (success) and a usable longitudinal signal.

Reference: Blueprint §21.3, MindMitra_PS26003_PartII.md §6.3.
"""

from __future__ import annotations

import math
from dataclasses import dataclass, replace
from typing import Sequence

K_INITIAL: float = 0.30  # Starting learning rate
K_DECAY: float = 0.95  # Multiplicative decay per observation
TARGET_BAND_LOW: float = 0.75  # Lower bound of success band
TARGET_BAND_HIGH: float = 0.85  # Upper bound of success band
TARGET_SUCCESS: float = 0.80  # Midpoint; used for difficulty selection


def _sigmoid(x: float) -> float:
    """Numerically stable sigmoid."""
    if x >= 0:
        return 1.0 / (1.0 + math.exp(-x))
    exp_x = math.exp(x)
    return exp_x / (1.0 + exp_x)


@dataclass(frozen=True)
class ThetaState:
    """Ability estimate for one person in one cognitive domain.

    theta starts at 0.0 (representing 50% success probability on a difficulty-0 item).
    n_observations tracks how many quality-gated updates have been applied.
    """

    theta: float  # Ability estimate; unbounded but typically ∈ (-5, +5)
    n_observations: int  # Quality-gated updates applied so far
    domain: str
    person_id: str

    @classmethod
    def initial(cls, domain: str, person_id: str) -> ThetaState:
        return cls(theta=0.0, n_observations=0, domain=domain, person_id=person_id)


@dataclass(frozen=True)
class ThetaUpdateResult:
    """Details of a single θ update step, for logging and audit."""

    old_theta: float
    new_theta: float
    expected: float  # sigmoid(old_theta - item_difficulty)
    k_used: float  # Effective learning rate
    quality_weight: float
    item_difficulty: float
    observed: float


def _effective_k(n_observations: int) -> float:
    """Learning rate for step n: K_n = K_INITIAL * K_DECAY^n."""
    return K_INITIAL * (K_DECAY**n_observations)


def update_theta(
    state: ThetaState,
    observed: float,
    item_difficulty: float,
    quality_weight: float,
) -> tuple[ThetaState, ThetaUpdateResult]:
    """Apply one quality-weighted θ update step.

    Args:
        state:           Current ability state.
        observed:        Observed performance ∈ [0, 1] (e.g. 1=correct, 0=incorrect,
                         or a continuous accuracy measure).
        item_difficulty: Calibrated difficulty of the presented item (on the θ scale).
        quality_weight:  q from MQE. If 0.0, no update is applied.

    Returns:
        (new_state, update_details) — both immutable.
    """
    expected = _sigmoid(state.theta - item_difficulty)
    k = _effective_k(state.n_observations)

    if quality_weight == 0.0:
        # Low-quality session: no update. Return unchanged state.
        return state, ThetaUpdateResult(
            old_theta=state.theta,
            new_theta=state.theta,
            expected=expected,
            k_used=k,
            quality_weight=quality_weight,
            item_difficulty=item_difficulty,
            observed=observed,
        )

    delta = k * quality_weight * (observed - expected)
    new_theta = state.theta + delta

    new_state = replace(
        state,
        theta=new_theta,
        n_observations=state.n_observations + 1,
    )
    return new_state, ThetaUpdateResult(
        old_theta=state.theta,
        new_theta=new_theta,
        expected=expected,
        k_used=k,
        quality_weight=quality_weight,
        item_difficulty=item_difficulty,
        observed=observed,
    )


def select_difficulty(theta: float, item_bank: Sequence[float]) -> float:
    """Select the item difficulty that targets the success band midpoint.

    Given the current ability estimate θ and a set of calibrated item
    difficulties, return the difficulty b_i such that:
        σ(θ - b_i) is closest to TARGET_SUCCESS (0.80)

    For a 0.80 success probability: θ - b_i = logit(0.80) ≈ 1.386.
    So the ideal item difficulty is: b_ideal = θ - logit(TARGET_SUCCESS).
    """
    if not item_bank:
        raise ValueError("item_bank must not be empty")

    target_logit = math.log(TARGET_SUCCESS / (1 - TARGET_SUCCESS))
    ideal_difficulty = theta - target_logit

    return min(item_bank, key=lambda b: abs(b - ideal_difficulty))
