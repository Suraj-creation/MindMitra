"""Audit sink + the `enforce` helper.

Every firewall decision — allow OR deny — is recorded. Denials, violations, and
scope-expansion attempts are exactly the safeguarding signals the design wants
surfaced (Metric Dictionary: scope-expansion attempts). The sink here is an
interface; production wires it to the append-only audit table.
"""

from __future__ import annotations

from typing import Protocol

from pydantic import BaseModel, ConfigDict

from .models import Actor, Decision, RequestContext, Resource


class FirewallDenied(Exception):
    """Raised by `enforce` when access is denied. Carries the Decision so the
    caller (and the audit trail) has the full reason set."""

    def __init__(self, decision: Decision) -> None:
        self.decision = decision
        super().__init__(
            f"firewall denied: {decision.category.value}/{decision.action.value} "
            f"for {decision.actor_role.value} — {', '.join(decision.reason_codes)}"
        )


class AuditRecord(BaseModel):
    model_config = ConfigDict(frozen=True)

    actor_id: str
    actor_role: str
    subject_person_id: str
    category: str
    action: str
    purpose: str
    effect: str
    reason_codes: tuple[str, ...]
    obligations: tuple[str, ...]
    is_violation: bool


class AuditSink(Protocol):
    def record(
        self, decision: Decision, actor: Actor, resource: Resource, context: RequestContext
    ) -> None: ...


class InMemoryAuditSink:
    """Test/dev sink. Production replaces this with the append-only audit table."""

    def __init__(self) -> None:
        self.records: list[AuditRecord] = []

    def record(
        self, decision: Decision, actor: Actor, resource: Resource, context: RequestContext
    ) -> None:
        self.records.append(
            AuditRecord(
                actor_id=actor.actor_id,
                actor_role=actor.role.value,
                subject_person_id=resource.subject_person_id,
                category=decision.category.value,
                action=decision.action.value,
                purpose=context.purpose.value,
                effect=decision.effect.value,
                reason_codes=decision.reason_codes,
                obligations=decision.obligations,
                is_violation=decision.is_violation,
            )
        )


def enforce(
    actor: Actor, resource: Resource, context: RequestContext, sink: AuditSink
) -> Decision:
    """Evaluate, always audit, and raise `FirewallDenied` on deny.

    Import `evaluate` lazily to keep this module free of policy internals.
    """
    from .policy import evaluate

    decision = evaluate(actor, resource, context)
    sink.record(decision, actor, resource, context)  # allow AND deny are both audited
    if not decision.allowed:
        raise FirewallDenied(decision)
    return decision
