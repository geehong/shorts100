"""add_prev_position_to_rankings

Revision ID: 98619b790064
Revises: 1b44494a4038
Create Date: 2026-06-02 09:01:05.774983

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = '98619b790064'
down_revision: Union[str, Sequence[str], None] = '1b44494a4038'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('rankings', sa.Column('prev_position', sa.Integer(), nullable=True))


def downgrade() -> None:
    op.drop_column('rankings', 'prev_position')
