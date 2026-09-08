"""0002: Create pwm_nodes and pwm_edges tables.

The Personal World Model graph, stored as edge tables in Postgres (not a
separate graph database — see tech-stack.md ADR-002). JSON/JSONB for the
provenance envelope (JSONB on Postgres; JSON on SQLite for tests).

Revision ID: 0002
Revises: 0001
Create Date: 2026-09-03
"""

from __future__ import annotations

import sqlalchemy as sa
from alembic import op

revision = "0002"
down_revision = "0001"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "pwm_nodes",
        sa.Column("node_id", sa.String(256), nullable=False),
        sa.Column("person_id", sa.String(256), nullable=False),
        sa.Column("node_type", sa.String(64), nullable=False),
        sa.Column("temporal_partition", sa.String(16), nullable=False),
        sa.Column("label", sa.Text(), nullable=False),
        sa.Column("provenance", sa.JSON(), nullable=False),
        sa.PrimaryKeyConstraint("node_id"),
    )
    op.create_index("ix_pwm_nodes_person_id", "pwm_nodes", ["person_id"])

    op.create_table(
        "pwm_edges",
        sa.Column("edge_id", sa.String(256), nullable=False),
        sa.Column("subject_node_id", sa.String(256), nullable=False),
        sa.Column("predicate", sa.String(64), nullable=False),
        sa.Column("object_node_id", sa.String(256), nullable=False),
        sa.Column("provenance", sa.JSON(), nullable=False),
        sa.PrimaryKeyConstraint("edge_id"),
    )
    op.create_index("ix_pwm_edges_subject", "pwm_edges", ["subject_node_id"])
    op.create_index("ix_pwm_edges_object", "pwm_edges", ["object_node_id"])


def downgrade() -> None:
    op.drop_index("ix_pwm_edges_object", table_name="pwm_edges")
    op.drop_index("ix_pwm_edges_subject", table_name="pwm_edges")
    op.drop_table("pwm_edges")
    op.drop_index("ix_pwm_nodes_person_id", table_name="pwm_nodes")
    op.drop_table("pwm_nodes")
