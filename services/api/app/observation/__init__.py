"""Observation persistence — the longitudinal record that feeds the baseline.

Each observation is quality-scored by the MQE at write time. Only quality-gated
observations (q ≥ Q_MIN) enter the baseline window; low-quality observations are
stored (for the audit trail) but never contribute to a deviation or an alert.
"""

from __future__ import annotations

from .models import ObservationRecord
from .service import (
    compute_domain_deviation,
    deviation_series,
    load_window,
    record_observation,
)

__all__ = [
    "ObservationRecord",
    "compute_domain_deviation",
    "deviation_series",
    "load_window",
    "record_observation",
]
