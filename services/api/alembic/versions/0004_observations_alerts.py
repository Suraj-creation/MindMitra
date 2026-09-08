"""0004: Create observations and alerts tables.

The longitudinal record (observations) and the L0-L5 ladder output (alerts).

Revision ID: 0004
Revises: 0003
Create Date: 2026-09-03
"""

from __future__ import annotations

import sqlalchemy as sa
from alembic import op

revision = "0004"
down_revision = "0003"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "observations",
        sa.Column("observation_id", sa.Uuid(), nullable=False),
        sa.Column("person_id", sa.String(256), nullable=False),
        sa.Column("domain", sa.String(64), nullable=False),
        sa.Column("value", sa.Float(), nullable=False),
        sa.Column("quality", sa.Float(), nullable=False),
        sa.Column("gate", sa.String(24), nullable=False),
        sa.Column("language_mismatch", sa.Boolean(), nullable=False),
        sa.Column("observed_at", sa.DateTime(timezone=True),
                  server_default=sa.text("CURRENT_TIMESTAMP"), nullable=False),
        sa.PrimaryKeyConstraint("observation_id"),
    )
    op.create_index("ix_obs_person", "observations", ["person_id"])
    op.create_index("ix_obs_domain", "observations", ["domain"])
    op.create_index("ix_obs_observed_at", "observations", ["observed_at"])

    op.create_table(
        "alerts",
        sa.Column("alert_id", sa.Uuid(), nullable=False),
        sa.Column("person_id", sa.String(256), nullable=False),
        sa.Column("domain", sa.String(64), nullable=False),
        sa.Column("level", sa.String(4), nullable=False),
        sa.Column("z", sa.Float(), nullable=False),
        sa.Column("persistence_days", sa.Integer(), nullable=False),
        sa.Column("reason_codes", sa.JSON(), nullable=False),
        sa.Column("status", sa.String(16), nullable=False),
        sa.Column("feedback", sa.String(24), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True),
                  server_default=sa.text("CURRENT_TIMESTAMP"), nullable=False),
        sa.PrimaryKeyConstraint("alert_id"),
    )
    op.create_index("ix_alerts_person", "alerts", ["person_id"])
    op.create_index("ix_alerts_created_at", "alerts", ["created_at"])


def downgrade() -> None:
    op.drop_index("ix_alerts_created_at", table_name="alerts")
    op.drop_index("ix_alerts_person", table_name="alerts")
    op.drop_table("alerts")
    op.drop_index("ix_obs_observed_at", table_name="observations")
    op.drop_index("ix_obs_domain", table_name="observations")
    op.drop_index("ix_obs_person", table_name="observations")
    op.drop_table("observations")
