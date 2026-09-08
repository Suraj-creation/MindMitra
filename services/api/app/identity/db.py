"""SQLAlchemy ORM tables for the identity domain.

Defined on the same declarative Base as app.core.models so a single
Base.metadata sees every table (dev create_all + Alembic migrations).

Design notes:
  * No hard foreign-key constraints — the platform uses loosely-coupled edge
    tables (matches pwm_nodes/pwm_edges). Integrity is enforced in the service
    layer. This keeps the demo seed order-independent and SQLite-friendly.
  * `care_relationships` carries the firewall Role value as a string. A person
    always has a self-relationship (actor_id == self_actor_id, role="person").
  * `consent_grants` is current-state (mutable): grant sets granted=True and
    clears revoked_at; revoke sets granted=False and stamps revoked_at. Every
    change is additionally written to the append-only audit_log
    (event_type="consent_change").
"""

from __future__ import annotations

import uuid
from datetime import datetime

from sqlalchemy import Boolean, DateTime, String, func
from sqlalchemy.orm import Mapped, mapped_column

from app.core.models import Base


class PersonORM(Base):
    """The data subject."""

    __tablename__ = "persons"

    person_id: Mapped[str] = mapped_column(String(256), primary_key=True)
    display_name: Mapped[str] = mapped_column(String(256), nullable=False)
    preferred_language: Mapped[str] = mapped_column(String(32), nullable=False, default="as")
    language_tier: Mapped[str] = mapped_column(String(4), nullable=False, default="A")  # A|B|C
    cultural_context: Mapped[str] = mapped_column(String(64), nullable=False, default="assamese_v1")
    self_actor_id: Mapped[str] = mapped_column(String(256), nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )


class ActorAccountORM(Base):
    """An account that can act — a person's own account, a caregiver, a CHW, etc.

    An account's *role* is never global; it is always relative to a person, via
    the care_relationships table.
    """

    __tablename__ = "actor_accounts"

    actor_id: Mapped[str] = mapped_column(String(256), primary_key=True)
    display_name: Mapped[str] = mapped_column(String(256), nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )


class CareRelationshipORM(Base):
    """An actor's role relative to a person, with a validity interval."""

    __tablename__ = "care_relationships"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    actor_id: Mapped[str] = mapped_column(String(256), nullable=False, index=True)
    person_id: Mapped[str] = mapped_column(String(256), nullable=False, index=True)
    role: Mapped[str] = mapped_column(String(64), nullable=False)  # firewall Role value
    valid_from: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )
    valid_to: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)


class ConsentGrantORM(Base):
    """Current-state consent for a (person, grantee_role, category, purpose)."""

    __tablename__ = "consent_grants"

    grant_id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    person_id: Mapped[str] = mapped_column(String(256), nullable=False, index=True)
    grantee_role: Mapped[str] = mapped_column(String(64), nullable=False)  # firewall Role value
    category: Mapped[str] = mapped_column(String(64), nullable=False)  # DataCategory value
    purpose: Mapped[str] = mapped_column(String(64), nullable=False)  # Purpose value
    granted: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    granted_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )
    revoked_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
