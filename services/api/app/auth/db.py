"""ORM tables for authentication.

Authentication is deliberately separate from identity. `actor_accounts` says
who exists and `care_relationships` says what they are to a person; these two
tables say only how someone proves they are that actor. Keeping credentials out
of the identity domain means the Memory Firewall never has a reason to read them.

`person_device_grants` exists because the person must never type a password
(DESIGN.md B3.2). A shared family tablet is enrolled once by a caregiver, holds
a long-lived secret, and the person signs in by tapping their own photograph.
"""

from __future__ import annotations

import uuid
from datetime import datetime

from sqlalchemy import Boolean, DateTime, Index, String, func
from sqlalchemy.orm import Mapped, mapped_column

from app.core.models import Base


class UserCredentialORM(Base):
    """How a human actor authenticates. One row per actor that has a password."""

    __tablename__ = "user_credentials"

    credential_id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    actor_id: Mapped[str] = mapped_column(String(256), nullable=False, unique=True, index=True)
    email: Mapped[str] = mapped_column(String(320), nullable=False, unique=True, index=True)
    password_hash: Mapped[str] = mapped_column(String(512), nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    failed_attempts: Mapped[int] = mapped_column(nullable=False, default=0)
    locked_until: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    last_login_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )


class RefreshSessionORM(Base):
    """One live refresh token. Rotated on use; revoked rows are kept, not deleted.

    Keeping revoked rows means a replayed refresh token is *detectable* rather
    than merely rejected — reuse of an already-rotated jti is the signature of a
    stolen token, and it revokes the whole family.
    """

    __tablename__ = "refresh_sessions"

    session_id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    actor_id: Mapped[str] = mapped_column(String(256), nullable=False, index=True)
    jti: Mapped[str] = mapped_column(String(64), nullable=False, unique=True, index=True)
    family_id: Mapped[str] = mapped_column(String(64), nullable=False, index=True)
    subject_kind: Mapped[str] = mapped_column(String(32), nullable=False, default="human")
    bound_person_id: Mapped[str | None] = mapped_column(String(256), nullable=True)
    revoked: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    revoked_reason: Mapped[str | None] = mapped_column(String(64), nullable=True)
    user_agent: Mapped[str | None] = mapped_column(String(256), nullable=True)
    issued_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)

    __table_args__ = (Index("ix_refresh_sessions_actor_revoked", "actor_id", "revoked"),)


class PersonDeviceGrantORM(Base):
    """A shared family device enrolled for one person, so she never types a password.

    The secret is stored hashed exactly like a password. `enrolled_by_actor_id`
    records which caregiver enrolled the device, because enrolling a device is
    itself a scope change and must be attributable.
    """

    __tablename__ = "person_device_grants"

    device_id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    person_id: Mapped[str] = mapped_column(String(256), nullable=False, index=True)
    actor_id: Mapped[str] = mapped_column(String(256), nullable=False)  # the person's self actor
    device_label: Mapped[str] = mapped_column(String(128), nullable=False)
    secret_hash: Mapped[str] = mapped_column(String(512), nullable=False)
    enrolled_by_actor_id: Mapped[str] = mapped_column(String(256), nullable=False)
    revoked: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )
    last_seen_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
