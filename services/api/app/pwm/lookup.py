"""Loading PWM facts for the Studio's grounding validator.

The validator in `app/studio/validators.py` is a **pure, synchronous** function,
and it should stay that way: a deterministic safety check that needs no event
loop and no database is trivially testable and cannot accidentally acquire a
side effect.

So the database work happens here, before validation, not inside it. The caller
resolves every fact a spec references in one query and hands the validator a
plain in-memory lookup.

This replaces an earlier `PostgresPwmLookup` whose `resolve` was `async` while
the `PwmLookup` protocol and its only caller were synchronous. Passing it in
returned an un-awaited coroutine, which is never `None`, so the validator would
sail past its "fact not found" branch and then raise `AttributeError` on the
next line. Nothing called it, so nothing caught it.

The Memory Firewall must gate access before any of this is called; these
functions trust that visibility scope has already been enforced.
"""

from __future__ import annotations

from collections.abc import Iterable

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.models import PWMNode as PWMNodeORM
from app.studio.spec import ExperienceSpec
from app.studio.spec import VerificationStatus as StudioVerificationStatus
from app.studio.validators import ResolvedFact


class InMemoryPwmLookup:
    """A synchronous `PwmLookup` over already-loaded facts."""

    def __init__(self, facts: dict[str, ResolvedFact]) -> None:
        self._facts = facts

    def resolve(self, pwm_fact_id: str) -> ResolvedFact | None:
        return self._facts.get(pwm_fact_id)

    def __len__(self) -> int:
        return len(self._facts)


def _to_resolved(person_id: str, fact_id: str, provenance: dict) -> ResolvedFact:
    try:
        status = StudioVerificationStatus(
            provenance.get("verification_status", "unverified")
        )
    except ValueError:
        # An unrecognised status is treated as unverified, never as verified:
        # the grounding rule fails closed.
        status = StudioVerificationStatus.UNVERIFIED

    visibility_raw = provenance.get("visibility", [])
    visibility = tuple(visibility_raw) if isinstance(visibility_raw, list) else ()

    return ResolvedFact(
        pwm_fact_id=fact_id,
        subject_person_id=person_id,
        verification_status=status,
        visibility=visibility,
    )


async def load_pwm_lookup(
    session: AsyncSession, *, person_id: str, fact_ids: Iterable[str]
) -> InMemoryPwmLookup:
    """Resolve the named facts for one person, in a single query.

    Filtering by `person_id` in SQL is what prevents cross-person leakage even
    if a fact id were guessed. The `fact_id` itself lives inside the JSON
    provenance envelope and is matched in Python, because the JSON path operator
    differs between Postgres and the SQLite used in tests — and a person's world
    model is hundreds of nodes, not millions (tech-stack §9.2).
    """
    wanted = set(fact_ids)
    if not wanted:
        return InMemoryPwmLookup({})

    rows = (
        await session.execute(
            select(PWMNodeORM).where(PWMNodeORM.person_id == person_id)
        )
    ).scalars().all()

    facts: dict[str, ResolvedFact] = {}
    for row in rows:
        provenance = row.provenance
        if not isinstance(provenance, dict):
            continue
        fact_id = provenance.get("fact_id")
        if fact_id in wanted:
            facts[fact_id] = _to_resolved(row.person_id, fact_id, provenance)

    return InMemoryPwmLookup(facts)


async def load_lookup_for_spec(
    session: AsyncSession, spec: ExperienceSpec
) -> InMemoryPwmLookup:
    """Load exactly the facts one spec claims to be grounded in.

    Facts are loaded against `spec.person_id`, so a spec naming another person's
    fact id resolves to nothing and fails grounding — the spec's own claim about
    whose fact it is never gets to decide.
    """
    return await load_pwm_lookup(
        session,
        person_id=spec.person_id,
        fact_ids={
            source.pwm_fact_id
            for source in spec.content_sources
            if source.pwm_fact_id
        },
    )
