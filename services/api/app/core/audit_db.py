"""SQLAlchemy-backed audit sink — wires the Memory Firewall to the append-only DB table.

Implements the AuditSink protocol from app.firewall.audit using an async
SQLAlchemy session. Every firewall decision (allow AND deny) is persisted
to audit_log; the caller must never UPDATE or DELETE these rows.

Also adds enforce_async() — the async variant of the firewall's enforce()
helper — which threads the DB-backed sink through the call automatically.

Note: the sync AuditSink protocol and InMemoryAuditSink remain in
app.firewall.audit for tests and contexts where no DB session is available.
"""

from __future__ import annotations

import logging

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.models import AuditLog
from app.firewall.audit import FirewallDenied
from app.firewall.models import Actor, Decision, RequestContext, Resource

logger = logging.getLogger(__name__)


class SQLAlchemyAuditSink:
    """Async audit sink that persists firewall decisions to the audit_log table.

    Usage:
        async with AsyncSessionLocal() as session:
            sink = SQLAlchemyAuditSink(session)
            decision = await enforce_async(actor, resource, context, sink)
    """

    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def record(
        self,
        decision: Decision,
        actor: Actor,
        resource: Resource,
        context: RequestContext,
    ) -> None:
        row = AuditLog(
            event_type="firewall_decision",
            actor_id=actor.actor_id,
            actor_role=actor.role.value,
            subject_person_id=resource.subject_person_id,
            category=decision.category.value,
            action=decision.action.value,
            purpose=context.purpose.value,
            effect=decision.effect.value,
            reason_codes=list(decision.reason_codes),
            obligations=list(decision.obligations),
            is_violation=decision.is_violation,
        )
        self._session.add(row)
        await self._session.flush()


async def enforce_async(
    actor: Actor,
    resource: Resource,
    context: RequestContext,
    sink: SQLAlchemyAuditSink,
) -> Decision:
    """Async variant of firewall.audit.enforce — evaluates, audits, raises on deny."""
    from app.firewall.policy import evaluate

    decision = evaluate(actor, resource, context)
    await sink.record(decision, actor, resource, context)
    if not decision.allowed:
        raise FirewallDenied(decision)
    return decision


async def record_audit_independently(
    *,
    event_type: str,
    actor_id: str,
    actor_role: str,
    subject_person_id: str,
    category: str,
    action: str,
    purpose: str,
    effect: str,
    reason_codes: list[str],
    obligations: list[str] | None = None,
    is_violation: bool = False,
) -> None:
    """Write one audit row in its own transaction, independent of the request.

    A denial that raises would otherwise roll back with the request session and
    lose exactly the record the safeguarding queue needs — a refused access
    attempt is the single most important thing to keep. The audit log is
    append-only and conceptually outside the business transaction, so it gets
    its own session and commits on its own.

    Never raises: an audit-sink failure must not convert a clean 404 into a 500.
    """
    from app.core.db import AsyncSessionLocal

    try:
        async with AsyncSessionLocal() as session:
            session.add(
                AuditLog(
                    event_type=event_type,
                    actor_id=actor_id,
                    actor_role=actor_role,
                    subject_person_id=subject_person_id,
                    category=category,
                    action=action,
                    purpose=purpose,
                    effect=effect,
                    reason_codes=reason_codes,
                    obligations=obligations or ["audit"],
                    is_violation=is_violation,
                )
            )
            await session.commit()
    except Exception:  # pragma: no cover - audit must never break a request
        logger.exception("failed to write independent audit record")
