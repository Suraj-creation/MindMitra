"""Memory Firewall — deterministic, deny-by-default authorization for person data.

Public API:

    from app.firewall import (
        Actor, Resource, RequestContext, ConsentState, Decision, Effect,
        Role, Action, DataCategory, Purpose, EscalationLevel,
        evaluate, enforce, FirewallDenied, InMemoryAuditSink,
    )

`evaluate` is a pure function; `enforce` adds auditing and raises on deny.
"""

from __future__ import annotations

from .audit import AuditRecord, AuditSink, FirewallDenied, InMemoryAuditSink, enforce
from .models import Actor, ConsentState, Decision, Effect, RequestContext, Resource
from .policy import evaluate
from .roles import Action, DataCategory, EscalationLevel, Purpose, Role

__all__ = [
    "Action",
    "Actor",
    "AuditRecord",
    "AuditSink",
    "ConsentState",
    "DataCategory",
    "Decision",
    "Effect",
    "EscalationLevel",
    "FirewallDenied",
    "InMemoryAuditSink",
    "Purpose",
    "RequestContext",
    "Resource",
    "Role",
    "enforce",
    "evaluate",
]
