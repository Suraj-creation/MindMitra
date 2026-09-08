"""Observation services — persist, load window, compute per-person deviation.

Bridges the persisted `observations` table to the pure cognition math
(app.cognition.mq and app.cognition.baseline). No LLM here — just persistence
and classical statistics.
"""

from __future__ import annotations

from datetime import UTC, datetime

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.cognition.baseline import BaselineObservation, DeviationResult, compute_deviation
from app.cognition.mq import MQEResult, ObservationSignals, compute_quality

from .db import ObservationORM
from .models import ObservationRecord


def _utcnow() -> datetime:
    return datetime.now(UTC)


def _as_utc(dt: datetime) -> datetime:
    return dt if dt.tzinfo is not None else dt.replace(tzinfo=UTC)


async def record_observation(
    session: AsyncSession,
    *,
    person_id: str,
    domain: str,
    value: float,
    signals: ObservationSignals,
    observed_at: datetime | None = None,
) -> tuple[ObservationRecord, MQEResult]:
    """Quality-score and persist a single observation.

    The observation is stored regardless of quality (for the audit trail), but
    its `gate` records whether it may enter the baseline. Bad data is kept but
    never counted.
    """
    mqe = compute_quality(signals)
    ts = _as_utc(observed_at) if observed_at else _utcnow()

    row = ObservationORM(
        person_id=person_id,
        domain=domain,
        value=value,
        quality=mqe.q,
        gate=mqe.gate,
        language_mismatch=mqe.language_mismatch,
        observed_at=ts,
    )
    session.add(row)
    await session.flush()

    record = ObservationRecord(
        observation_id=str(row.observation_id),
        person_id=person_id,
        domain=domain,
        value=value,
        quality=mqe.q,
        gate=mqe.gate,
        language_mismatch=mqe.language_mismatch,
        observed_at=ts,
    )
    return record, mqe


async def load_window(
    session: AsyncSession, person_id: str, domain: str
) -> list[BaselineObservation]:
    """Load all observations for (person, domain) as BaselineObservation values."""
    rows = (
        await session.execute(
            select(ObservationORM).where(
                ObservationORM.person_id == person_id,
                ObservationORM.domain == domain,
            )
        )
    ).scalars().all()

    return [
        BaselineObservation(
            domain=r.domain,
            value=r.value,
            quality=r.quality,
            observed_at=_as_utc(r.observed_at),
            person_id=r.person_id,
        )
        for r in rows
    ]


async def compute_domain_deviation(
    session: AsyncSession,
    person_id: str,
    domain: str,
    now: datetime | None = None,
) -> DeviationResult:
    """Deviation of the latest observation against the person's own baseline."""
    window = await load_window(session, person_id, domain)
    if not window:
        return DeviationResult(
            z=None, median=None, mad=None, n_quality_gated=0,
            gate="insufficient_data", reason="no_observations",
        )
    now = now or _utcnow()
    latest = max(window, key=lambda o: o.observed_at)
    return compute_deviation(latest, window, now=now)


async def deviation_series(
    session: AsyncSession,
    person_id: str,
    domain: str,
    now: datetime | None = None,
) -> list[tuple[datetime, float | None]]:
    """Per-observation z for every observation, newest first.

    Used to count persistence — how many consecutive recent observations sit
    below the person's own baseline.
    """
    window = await load_window(session, person_id, domain)
    now = now or _utcnow()
    ordered = sorted(window, key=lambda o: o.observed_at, reverse=True)
    series: list[tuple[datetime, float | None]] = []
    for obs in ordered:
        dev = compute_deviation(obs, window, now=now)
        series.append((obs.observed_at, dev.z))
    return series
