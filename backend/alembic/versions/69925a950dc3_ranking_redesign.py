"""ranking_redesign

Revision ID: 69925a950dc3
Revises: 41c5444bd4d6
Create Date: 2026-05-22 11:17:15.244906

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '69925a950dc3'
down_revision: Union[str, Sequence[str], None] = '41c5444bd4d6'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. videos 테이블 컬럼 추가
    op.add_column('videos', sa.Column('status', sa.String(length=16), server_default='active', nullable=False))
    op.add_column('videos', sa.Column('trending_regions', sa.ARRAY(sa.String(length=8)), server_default='{}', nullable=False))
    
    # 2. GIN 인덱스 생성 (videos.trending_regions)
    op.create_index('idx_videos_trending_regions', 'videos', ['trending_regions'], postgresql_using='gin')

    # 3. video_trending_history 테이블 생성
    op.create_table(
        'video_trending_history',
        sa.Column('id', sa.BigInteger(), primary_key=True, autoincrement=True),
        sa.Column('video_id', sa.BigInteger(), sa.ForeignKey('videos.id', ondelete='CASCADE'), nullable=False),
        sa.Column('region', sa.String(length=8), nullable=False),
        sa.Column('observed_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index('idx_vth_video_region_time', 'video_trending_history', ['video_id', 'region', 'observed_at'])
    op.create_index('idx_vth_region_time', 'video_trending_history', ['region', 'observed_at'])

    # 4. chart_entries 파티션 테이블 생성
    op.execute("""
        CREATE TABLE chart_entries (
            id BIGSERIAL,
            chart_type VARCHAR(16) NOT NULL,
            period_key VARCHAR(12) NOT NULL,
            period_start TIMESTAMPTZ NOT NULL,
            period_end TIMESTAMPTZ NOT NULL,
            region VARCHAR(8) NOT NULL DEFAULT 'GLOBAL',
            category VARCHAR(24),
            video_id BIGINT NOT NULL REFERENCES videos(id) ON DELETE CASCADE,
            rank_basis VARCHAR(16) NOT NULL DEFAULT 'view_delta',
            position INT NOT NULL,
            prev_position INT,
            peak_position INT,
            weeks_on_chart INT DEFAULT 1,
            view_delta BIGINT,
            view_count BIGINT NOT NULL,
            zscore FLOAT,
            velocity FLOAT,
            like_count BIGINT NOT NULL DEFAULT 0,
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            PRIMARY KEY (id, created_at)
        ) PARTITION BY RANGE (created_at);
    """)

    # 파티션 등록 (5월 ~ 7월)
    op.execute("CREATE TABLE chart_entries_y2026m05 PARTITION OF chart_entries FOR VALUES FROM ('2026-05-01') TO ('2026-06-01');")
    op.execute("CREATE TABLE chart_entries_y2026m06 PARTITION OF chart_entries FOR VALUES FROM ('2026-06-01') TO ('2026-07-01');")
    op.execute("CREATE TABLE chart_entries_y2026m07 PARTITION OF chart_entries FOR VALUES FROM ('2026-07-01') TO ('2026-08-01');")

    # 인덱스 및 유니크 제약
    op.execute("CREATE INDEX idx_chart_type_period ON chart_entries (chart_type, period_key, region);")
    op.execute("CREATE INDEX idx_chart_video ON chart_entries (video_id, chart_type);")
    op.execute("ALTER TABLE chart_entries ADD CONSTRAINT uq_chart_entries UNIQUE (chart_type, period_key, region, category, rank_basis, position, created_at);")


def downgrade() -> None:
    op.drop_table('video_trending_history')
    op.execute("DROP TABLE chart_entries CASCADE;")
    op.drop_index('idx_videos_trending_regions', table_name='videos')
    op.drop_column('videos', 'trending_regions')
    op.drop_column('videos', 'status')

