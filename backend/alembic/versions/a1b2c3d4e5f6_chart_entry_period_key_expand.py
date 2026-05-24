"""chart_entry period_key expand + real chart_type support

Revision ID: a1b2c3d4e5f6
Revises: 9bf8b12e74c5
Create Date: 2026-05-22 15:00:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = 'a1b2c3d4e5f6'
down_revision: Union[str, Sequence[str], None] = '9bf8b12e74c5'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # period_key: VARCHAR(12) → VARCHAR(20)
    # 'real'/'daily' 실시간 차트는 '2026-05-22T14' 형식(13자) 사용
    op.alter_column(
        'chart_entries',
        'period_key',
        existing_type=sa.String(length=12),
        type_=sa.String(length=20),
        existing_nullable=False,
    )


def downgrade() -> None:
    op.alter_column(
        'chart_entries',
        'period_key',
        existing_type=sa.String(length=20),
        type_=sa.String(length=12),
        existing_nullable=False,
    )
