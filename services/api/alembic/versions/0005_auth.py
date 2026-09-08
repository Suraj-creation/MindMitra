"""0005: Authentication — credentials, refresh sessions, person device grants.

Credentials live apart from identity on purpose. `actor_accounts` says who
exists and `care_relationships` says what they are to a person; these tables say
only how someone proves they are that actor, so the Memory Firewall never has a
reason to read them.

`person_device_grants` exists because the person must never type a password
(DESIGN.md B3.2). A shared family tablet is enrolled once by a caregiver and the
person signs in by tapping her own photograph.

Revision ID: 0005
Revises: 0004
Create Date: 2026-09-06
"""

from __future__ import annotations

import sqlalchemy as sa
from alembic import op

revision = "0005"
down_revision = "0004"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "user_credentials",
        sa.Column("credential_id", sa.Uuid(), primary_key=True),
        sa.Column("actor_id", sa.String(256), nullable=False),
        sa.Column("email", sa.String(320), nullable=False),
        sa.Column("password_hash", sa.String(512), nullable=False),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.true()),
        sa.Column("failed_attempts", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("locked_until", sa.DateTime(timezone=True), nullable=True),
        sa.Column("last_login_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.func.now(),
        ),
    )
    op.create_index(
        "ix_user_credentials_actor_id", "user_credentials", ["actor_id"], unique=True
    )
    op.create_index(
        "ix_user_credentials_email", "user_credentials", ["email"], unique=True
    )

    op.create_table(
        "refresh_sessions",
        sa.Column("session_id", sa.Uuid(), primary_key=True),
        sa.Column("actor_id", sa.String(256), nullable=False),
        sa.Column("jti", sa.String(64), nullable=False),
        sa.Column("family_id", sa.String(64), nullable=False),
        sa.Column(
            "subject_kind", sa.String(32), nullable=False, server_default="human"
        ),
        sa.Column("bound_person_id", sa.String(256), nullable=True),
        sa.Column("revoked", sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column("revoked_reason", sa.String(64), nullable=True),
        sa.Column("user_agent", sa.String(256), nullable=True),
        sa.Column(
            "issued_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.func.now(),
        ),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index("ix_refresh_sessions_actor_id", "refresh_sessions", ["actor_id"])
    op.create_index("ix_refresh_sessions_jti", "refresh_sessions", ["jti"], unique=True)
    op.create_index("ix_refresh_sessions_family_id", "refresh_sessions", ["family_id"])
    # Revoked rows are kept, not deleted: reuse of a rotated jti is the signature
    # of a stolen token, and detecting it requires the history.
    op.create_index(
        "ix_refresh_sessions_actor_revoked", "refresh_sessions", ["actor_id", "revoked"]
    )

    op.create_table(
        "person_device_grants",
        sa.Column("device_id", sa.Uuid(), primary_key=True),
        sa.Column("person_id", sa.String(256), nullable=False),
        sa.Column("actor_id", sa.String(256), nullable=False),
        sa.Column("device_label", sa.String(128), nullable=False),
        sa.Column("secret_hash", sa.String(512), nullable=False),
        sa.Column("enrolled_by_actor_id", sa.String(256), nullable=False),
        sa.Column("revoked", sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.func.now(),
        ),
        sa.Column("last_seen_at", sa.DateTime(timezone=True), nullable=True),
    )
    op.create_index(
        "ix_person_device_grants_person_id", "person_device_grants", ["person_id"]
    )


def downgrade() -> None:
    op.drop_index("ix_person_device_grants_person_id", table_name="person_device_grants")
    op.drop_table("person_device_grants")

    op.drop_index("ix_refresh_sessions_actor_revoked", table_name="refresh_sessions")
    op.drop_index("ix_refresh_sessions_family_id", table_name="refresh_sessions")
    op.drop_index("ix_refresh_sessions_jti", table_name="refresh_sessions")
    op.drop_index("ix_refresh_sessions_actor_id", table_name="refresh_sessions")
    op.drop_table("refresh_sessions")

    op.drop_index("ix_user_credentials_email", table_name="user_credentials")
    op.drop_index("ix_user_credentials_actor_id", table_name="user_credentials")
    op.drop_table("user_credentials")
