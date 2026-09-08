"""0003: Create identity tables — persons, actor_accounts, care_relationships, consent_grants.

Loosely-coupled (no hard FKs), matching the pwm edge-table style. Integrity is
enforced in the service layer.

Revision ID: 0003
Revises: 0002
Create Date: 2026-09-03
"""

from __future__ import annotations

import sqlalchemy as sa
from alembic import op

revision = "0003"
down_revision = "0002"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "persons",
        sa.Column("person_id", sa.String(256), nullable=False),
        sa.Column("display_name", sa.String(256), nullable=False),
        sa.Column("preferred_language", sa.String(32), nullable=False),
        sa.Column("language_tier", sa.String(4), nullable=False),
        sa.Column("cultural_context", sa.String(64), nullable=False),
        sa.Column("self_actor_id", sa.String(256), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True),
                  server_default=sa.text("CURRENT_TIMESTAMP"), nullable=False),
        sa.PrimaryKeyConstraint("person_id"),
    )

    op.create_table(
        "actor_accounts",
        sa.Column("actor_id", sa.String(256), nullable=False),
        sa.Column("display_name", sa.String(256), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True),
                  server_default=sa.text("CURRENT_TIMESTAMP"), nullable=False),
        sa.PrimaryKeyConstraint("actor_id"),
    )

    op.create_table(
        "care_relationships",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("actor_id", sa.String(256), nullable=False),
        sa.Column("person_id", sa.String(256), nullable=False),
        sa.Column("role", sa.String(64), nullable=False),
        sa.Column("valid_from", sa.DateTime(timezone=True),
                  server_default=sa.text("CURRENT_TIMESTAMP"), nullable=False),
        sa.Column("valid_to", sa.DateTime(timezone=True), nullable=True),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_care_rel_actor", "care_relationships", ["actor_id"])
    op.create_index("ix_care_rel_person", "care_relationships", ["person_id"])

    op.create_table(
        "consent_grants",
        sa.Column("grant_id", sa.Uuid(), nullable=False),
        sa.Column("person_id", sa.String(256), nullable=False),
        sa.Column("grantee_role", sa.String(64), nullable=False),
        sa.Column("category", sa.String(64), nullable=False),
        sa.Column("purpose", sa.String(64), nullable=False),
        sa.Column("granted", sa.Boolean(), nullable=False),
        sa.Column("granted_at", sa.DateTime(timezone=True),
                  server_default=sa.text("CURRENT_TIMESTAMP"), nullable=False),
        sa.Column("revoked_at", sa.DateTime(timezone=True), nullable=True),
        sa.PrimaryKeyConstraint("grant_id"),
    )
    op.create_index("ix_consent_person", "consent_grants", ["person_id"])


def downgrade() -> None:
    op.drop_index("ix_consent_person", table_name="consent_grants")
    op.drop_table("consent_grants")
    op.drop_index("ix_care_rel_person", table_name="care_relationships")
    op.drop_index("ix_care_rel_actor", table_name="care_relationships")
    op.drop_table("care_relationships")
    op.drop_table("actor_accounts")
    op.drop_table("persons")
