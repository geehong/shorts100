"""add_creator_and_reaction_skeletons

Revision ID: 9bf8b12e74c5
Revises: 69925a950dc3
Create Date: 2026-05-22 14:02:24.373844

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = '9bf8b12e74c5'
down_revision: Union[str, Sequence[str], None] = '69925a950dc3'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. video_reactions 테이블 생성
    op.create_table('video_reactions',
        sa.Column('id', sa.BigInteger(), autoincrement=True, nullable=False),
        sa.Column('video_id', sa.BigInteger(), nullable=False),
        sa.Column('emoji', sa.String(length=16), nullable=False),
        sa.Column('session_id', sa.String(length=64), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['video_id'], ['videos.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('video_id', 'session_id', name='uq_video_reaction_session')
    )

    # 2. channels 테이블에 크리에이터 인증/알림 컬럼 추가
    op.add_column('channels', sa.Column('owner_email', sa.String(length=255), nullable=True))
    op.add_column('channels', sa.Column('notify_on_rank', sa.Boolean(), server_default='false', nullable=False))
    op.add_column('channels', sa.Column('verification_token', sa.String(length=255), nullable=True))


def downgrade() -> None:
    # 1. channels 테이블 컬럼 제거
    op.drop_column('channels', 'verification_token')
    op.drop_column('channels', 'notify_on_rank')
    op.drop_column('channels', 'owner_email')

    # 2. video_reactions 테이블 제거
    op.drop_table('video_reactions')
