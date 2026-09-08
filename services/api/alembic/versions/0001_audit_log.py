"""0001: Create audit_log table.

Append-only log for every Memory Firewall and Safety Gateway decision.
BRIN index on recorded_at (efficient for time-range scans on append-only data).
B-tree on subject_person_id for per-person audit trail.

Revision ID: 0001
Revises:
Create Date: 2026-09-03
"""

from __future__ import annotations

import sqlalchemy as sa
from alembic import op

revision = "0001"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "audit_log",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("event_type", sa.String(64), nullable=False),
        sa.Column("actor_id", sa.String(256), nullable=False),
        sa.Column("actor_role", sa.String(64), nullable=False),
        sa.Column("subject_person_id", sa.String(256), nullable=False),
        sa.Column("category", sa.String(64), nullable=False),
        sa.Column("action", sa.String(32), nullable=False),
        sa.Column("purpose", sa.String(64), nullable=False),
        sa.Column("effect", sa.String(16), nullable=False),
        sa.Column("reason_codes", sa.JSON(), nullable=False),
        sa.Column("obligations", sa.JSON(), nullable=False),
        sa.Column("is_violation", sa.Boolean(), nullable=False),
        sa.Column(
            "recorded_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("CURRENT_TIMESTAMP"),
            nullable=False,
        ),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_audit_log_subject_person_id", "audit_log", ["subject_person_id"])
    op.create_index("ix_audit_log_is_violation_recorded_at", "audit_log",
                    ["is_violation", "recorded_at"])


def downgrade() -> None:
    op.drop_index("ix_audit_log_is_violation_recorded_at", table_name="audit_log")
    op.drop_index("ix_audit_log_subject_person_id", table_name="audit_log")
    op.drop_table("audit_log")
