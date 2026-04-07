"""job ingest dedup columns + partial unique indexes

Revision ID: 0002
Revises: 0001
Create Date: 2026-04-07

"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "0002"
down_revision: Union[str, Sequence[str], None] = "0001"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "jobs",
        sa.Column("source_url_canonical", sa.String(length=2048), nullable=True),
    )
    op.add_column(
        "jobs",
        sa.Column("ingest_text_fingerprint", sa.String(length=64), nullable=True),
    )
    op.create_index(
        "uq_jobs_user_source_canonical",
        "jobs",
        ["user_id", "source_url_canonical"],
        unique=True,
        postgresql_where=sa.text("source_url_canonical IS NOT NULL"),
    )
    op.create_index(
        "uq_jobs_user_ingest_fingerprint",
        "jobs",
        ["user_id", "ingest_text_fingerprint"],
        unique=True,
        postgresql_where=sa.text("ingest_text_fingerprint IS NOT NULL"),
    )


def downgrade() -> None:
    op.drop_index("uq_jobs_user_ingest_fingerprint", table_name="jobs")
    op.drop_index("uq_jobs_user_source_canonical", table_name="jobs")
    op.drop_column("jobs", "ingest_text_fingerprint")
    op.drop_column("jobs", "source_url_canonical")
