"""SQLAlchemy 2.0 ORM models — the database schema.

All tables are append-only by convention (enforced by discipline and application-level
restrictions; production adds a trigger to block UPDATE/DELETE on audit_log). The
audit_log table is the foundation for both the Memory Firewall audit trail and the
future Horizon B event-sourcing sync model (one structure, two jobs).

Reference: tech-stack.md §9, CLAUDE.md §4.
"""

from __future__ import annotations

import uuid
from datetime import datetime
from typing import Any

from sqlalchemy import JSON, Boolean, DateTime, String, Text, func
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column


class Base(DeclarativeBase):
    pass


class AuditLog(Base):
    """Append-only audit log for every Memory Firewall decision.

    Every access attempt — allowed or denied — is recorded here. This table
    is NEVER updated or deleted. It is also the event-log foundation for the
    Horizon B offline sync model.

    Indexes:
        - BRIN on recorded_at (range scans for time-range queries)
        - B-tree on subject_person_id (per-person audit trail)
        - B-tree on (is_violation, recorded_at) (fast violation queries)
    """

    __tablename__ = "audit_log"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    event_type: Mapped[str] = mapped_column(String(64), nullable=False)
    actor_id: Mapped[str] = mapped_column(String(256), nullable=False)
    actor_role: Mapped[str] = mapped_column(String(64), nullable=False)
    subject_person_id: Mapped[str] = mapped_column(String(256), nullable=False, index=True)
    category: Mapped[str] = mapped_column(String(64), nullable=False)
    action: Mapped[str] = mapped_column(String(32), nullable=False)
    purpose: Mapped[str] = mapped_column(String(64), nullable=False)
    effect: Mapped[str] = mapped_column(String(16), nullable=False)
    reason_codes: Mapped[list[str]] = mapped_column(JSON, nullable=False, default=list)
    obligations: Mapped[list[str]] = mapped_column(JSON, nullable=False, default=list)
    is_violation: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False, index=True)
    recorded_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )


class PWMNode(Base):
    """A node in the Personal World Model graph.

    Each node represents a person, place, event, or cultural entity in the
    subject's world. The provenance envelope is stored as JSONB (on Postgres)
    or JSON (on SQLite for tests) — it carries the full ProvenanceEnvelope
    including visibility, verification_status, and audit_ref.

    Reads are gated by the Memory Firewall's visibility-list check BEFORE
    the query reaches this table.
    """

    __tablename__ = "pwm_nodes"

    node_id: Mapped[str] = mapped_column(String(256), primary_key=True)
    person_id: Mapped[str] = mapped_column(String(256), nullable=False, index=True)
    node_type: Mapped[str] = mapped_column(String(64), nullable=False)  # person|place|event|object|cultural
    temporal_partition: Mapped[str] = mapped_column(String(16), nullable=False)  # past|present|future
    label: Mapped[str] = mapped_column(Text, nullable=False)
    provenance: Mapped[dict[str, Any]] = mapped_column(JSON, nullable=False)


class PWMEdge(Base):
    """A typed relationship edge between two PWM nodes.

    The provenance envelope on each edge carries fact_id, visibility, and
    verification_status — used by the grounding validator and the Firewall.
    """

    __tablename__ = "pwm_edges"

    edge_id: Mapped[str] = mapped_column(String(256), primary_key=True)
    subject_node_id: Mapped[str] = mapped_column(String(256), nullable=False, index=True)
    predicate: Mapped[str] = mapped_column(String(64), nullable=False)
    object_node_id: Mapped[str] = mapped_column(String(256), nullable=False, index=True)
    provenance: Mapped[dict[str, Any]] = mapped_column(JSON, nullable=False)
