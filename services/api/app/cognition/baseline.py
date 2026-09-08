"""Personal Baseline Engine.

Computes within-person deviation z using robust statistics (median/MAD) over a
28-day rolling window. NEVER uses population norms. NEVER produces a single
cognitive score.

Formula:
    z_s(t) = (x_s(t) - median_s(w)) / (1.4826 * MAD_s(w))

    where:
        w = observations in the last WINDOW_DAYS days with q >= Q_MIN
        MAD_s(w) = median(|x_i - median_s(w)|)

    1.4826 is the consistency factor that makes MAD a consistent estimator
    of the standard deviation for normally distributed data.

Quality gate:
    Only observations with q >= Q_MIN (from MQE) enter the window.
    If fewer than MIN_WINDOW_SIZE quality-gated observations are available,
    the result is gate="insufficient_data".

Cold start:
    Days 0–COLD_START_DAYS: gate="cold_start". No cognitive alerts above L2
    during calibration. Observations still accumulate to build the baseline.

Reference: Blueprint §15 (Personal Baseline & Change Engine), §21.4.
"""

from __future__ import annotations

import statistics
from dataclasses import dataclass
from datetime import datetime, timedelta
from typing import Literal, Sequence

from .mq import Q_MIN

WINDOW_DAYS: int = 28
COLD_START_DAYS: int = 14
MIN_WINDOW_SIZE: int = 5  # Minimum observations required to compute a stable z
MAD_CONSISTENCY_FACTOR: float = 1.4826


@dataclass(frozen=True)
class BaselineObservation:
    """A single quality-gated observation for one cognitive domain."""

    domain: str
    value: float  # Raw performance measure (e.g. accuracy, response time normalised)
    quality: float  # q from MQE; must be >= Q_MIN to enter the window
    observed_at: datetime
    person_id: str


@dataclass(frozen=True)
class DeviationResult:
    """The outcome of a single baseline deviation computation.

    z is None when the quality gate fails or there is insufficient data.
    The gate field tells the caller precisely why.
    """

    z: float | None
    median: float | None
    mad: float | None
    n_quality_gated: int  # Observations that passed q >= Q_MIN in the window
    gate: Literal["scored", "insufficient_data", "cold_start"]
    reason: str


def _days_since_first(
    window: Sequence[BaselineObservation],
    now: datetime,
) -> float:
    """Days between the earliest observation and now."""
    if not window:
        return 0.0
    earliest = min(obs.observed_at for obs in window)
    return (now - earliest).total_seconds() / 86400.0


def compute_deviation(
    obs: BaselineObservation,
    window: Sequence[BaselineObservation],
    now: datetime | None = None,
) -> DeviationResult:
    """Compute within-person z deviation for one observation against its window.

    Args:
        obs:    The observation to score.
        window: All historical observations for (person_id, domain) — the function
                filters to the 28-day window and quality-gates internally.
        now:    Reference timestamp (default: obs.observed_at).

    Returns:
        DeviationResult with z, median, mad, n_quality_gated, gate, reason.
    """
    now = now or obs.observed_at
    cutoff = now - timedelta(days=WINDOW_DAYS)

    # Quality-gate + window filter.
    quality_gated: list[float] = [
        h.value
        for h in window
        if (
            h.quality >= Q_MIN
            and h.observed_at >= cutoff
            and h.person_id == obs.person_id
            and h.domain == obs.domain
        )
    ]

    # Cold-start check (based on data age, not calendar).
    days_of_data = _days_since_first(window, now)
    if days_of_data < COLD_START_DAYS:
        return DeviationResult(
            z=None,
            median=None,
            mad=None,
            n_quality_gated=len(quality_gated),
            gate="cold_start",
            reason=f"cold_start:only_{days_of_data:.1f}_days_of_data",
        )

    if len(quality_gated) < MIN_WINDOW_SIZE:
        return DeviationResult(
            z=None,
            median=None,
            mad=None,
            n_quality_gated=len(quality_gated),
            gate="insufficient_data",
            reason=f"insufficient_window:{len(quality_gated)}_of_{MIN_WINDOW_SIZE}_required",
        )

    # Compute robust statistics.
    median_val = statistics.median(quality_gated)
    mad_val = statistics.median([abs(x - median_val) for x in quality_gated])

    # Handle degenerate case (all identical values → MAD == 0).
    if mad_val == 0.0:
        z = 0.0
        reason = "mad_zero:all_observations_identical"
    else:
        z = (obs.value - median_val) / (MAD_CONSISTENCY_FACTOR * mad_val)
        reason = "scored"

    return DeviationResult(
        z=z,
        median=median_val,
        mad=mad_val,
        n_quality_gated=len(quality_gated),
        gate="scored",
        reason=reason,
    )
