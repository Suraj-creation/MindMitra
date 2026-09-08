"""Measurement-Quality Engine (MQE).

Computes a per-observation quality weight q ∈ [0, 1] that gates every downstream
inference. A low-q observation is tagged `insufficient_data` and NEVER feeds the
personal baseline or raises an alert. This is the most important safety property
in the cognitive pipeline and the primary SIH demo beat.

Formula:
    q = geometric_mean(audibility, visibility, fatigue_factor)
        * assistance_factor        # 0.0 if was_assisted (excluded from ability estimate)
        * device_factor            # 0.0 if device_ok is False
        * subject_factor           # 0.0 if subject_confirmed is False

    language penalty: if language_match is False, q *= 0.3
        → language_mismatch is flagged True
        → this is NEVER counted as a cognitive failure

Q_MIN = 0.40 — the minimum q to enter the reasoning pipeline.
Any observation with q < Q_MIN is tagged gate="insufficient_data".

Reference: MindMitra_PS26003_PartII.md §6.2 (Measurement Integrity Engine)
"""

from __future__ import annotations

import math
from dataclasses import dataclass
from typing import Literal

Q_MIN: float = 0.40  # Minimum quality weight to enter reasoning


@dataclass(frozen=True)
class ObservationSignals:
    """Raw signals collected alongside a single cognitive observation.

    All float signals ∈ [0.0, 1.0]. Boolean signals are explicit flags.
    The caller is responsible for normalising device-level inputs to this range.
    """

    audibility: float  # Volume level × ASR confidence; 0.0 = inaudible
    visibility: float  # Display quality (brightness × contrast × font-size factor)
    language_match: bool  # True iff session language == person's preferred language
    fatigue_factor: float  # 1.0 = fully rested; 0.0 = extreme fatigue
    was_assisted: bool  # True iff anomalous latency-accuracy pattern detected
    device_ok: bool  # True iff no data gaps or device integrity failures
    subject_confirmed: bool  # True iff shared-device identity check passed

    def __post_init__(self) -> None:
        for field, value in [
            ("audibility", self.audibility),
            ("visibility", self.visibility),
            ("fatigue_factor", self.fatigue_factor),
        ]:
            if not (0.0 <= value <= 1.0):
                raise ValueError(f"{field} must be in [0, 1]; got {value}")


@dataclass(frozen=True)
class MQEResult:
    """The outcome of a single MQE computation.

    Attributes:
        q               Overall quality weight ∈ [0, 1].
        dominant_issue  The signal that most lowered q, or None.
        language_mismatch  True iff language_match was False.
                           This is NEVER treated as a cognitive failure.
        gate            "sufficient" if q >= Q_MIN, else "insufficient_data".
        component_scores  Raw component values before multiplication.
    """

    q: float
    dominant_issue: str | None
    language_mismatch: bool
    gate: Literal["sufficient", "insufficient_data"]
    component_scores: dict[str, float]


def _geometric_mean(*values: float) -> float:
    """Geometric mean of n values ∈ [0, 1]. Returns 0.0 if any value is 0."""
    if any(v == 0.0 for v in values):
        return 0.0
    log_sum = sum(math.log(v) for v in values)
    return math.exp(log_sum / len(values))


def compute_quality(signals: ObservationSignals) -> MQEResult:
    """Compute the quality weight q for a single observation.

    This is a pure function. The structural guarantee — bad data cannot raise
    an alarm — is enforced by the gate field: the caller must check
    result.gate == "sufficient" before using this observation in any inference.

    Language mismatch is handled specially: it reduces q severely but is flagged
    explicitly as language_mismatch=True, because a session in the wrong language
    is a *measurement* failure, not a *cognitive* failure for the person.
    """
    components: dict[str, float] = {
        "audibility": signals.audibility,
        "visibility": signals.visibility,
        "fatigue_factor": signals.fatigue_factor,
        "assistance_factor": 0.0 if signals.was_assisted else 1.0,
        "device_factor": 0.0 if not signals.device_ok else 1.0,
        "subject_factor": 0.0 if not signals.subject_confirmed else 1.0,
        "language_factor": 0.3 if not signals.language_match else 1.0,
    }

    # Step 1: geometric mean of the continuous signals (audibility, visibility, fatigue).
    base_q = _geometric_mean(
        components["audibility"],
        components["visibility"],
        components["fatigue_factor"],
    )

    # Step 2: multiply by binary/categorical factors.
    q = (
        base_q
        * components["assistance_factor"]
        * components["device_factor"]
        * components["subject_factor"]
        * components["language_factor"]
    )

    # Clamp to [0, 1] (floating-point safety).
    q = max(0.0, min(1.0, q))

    # Identify the dominant issue: the component with the lowest value.
    dominant_issue: str | None = None
    min_val = min(components.values())
    if min_val < 1.0:
        # Find the first component with the minimum value.
        dominant_issue = next(
            k for k, v in components.items() if v == min_val
        )

    language_mismatch = not signals.language_match
    gate: Literal["sufficient", "insufficient_data"] = (
        "sufficient" if q >= Q_MIN else "insufficient_data"
    )

    return MQEResult(
        q=q,
        dominant_issue=dominant_issue,
        language_mismatch=language_mismatch,
        gate=gate,
        component_scores=components,
    )
