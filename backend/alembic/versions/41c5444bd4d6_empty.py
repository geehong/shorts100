from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = '41c5444bd4d6'
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    # T11: ENUM 타입 생성
    op.execute("CREATE TYPE platform_enum AS ENUM ('youtube', 'tiktok', 'instagram')")
    op.execute("CREATE TYPE category_enum AS ENUM ('gaming', 'entertainment', 'music', 'education', 'news', 'sports', 'comedy', 'people', 'other')")

    # T12: channels 테이블 생성
    op.create_table(
        'channels',
        sa.Column('id', sa.BigInteger(), primary_key=True, autoincrement=True),
        sa.Column('platform', sa.Enum('youtube', 'tiktok', 'instagram', name='platform_enum', create_type=False), nullable=False),
        sa.Column('platform_id', sa.String(length=255), nullable=False),
        sa.Column('handle', sa.String(length=255), nullable=True),
        sa.Column('title', sa.Text(), nullable=False),
        sa.Column('thumbnail_url', sa.Text(), nullable=True),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('subscriber_count', sa.BigInteger(), server_default='0', nullable=False),
        sa.Column('video_count', sa.Integer(), server_default='0', nullable=False),
        sa.Column('view_count', sa.BigInteger(), server_default='0', nullable=False),
        sa.Column('published_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now(), onupdate=sa.func.now(), nullable=False),
    )
    op.create_index('idx_channels_platform_id', 'channels', ['platform', 'platform_id'], unique=True)
    op.create_index('idx_channels_handle', 'channels', ['handle'])

    # T13: videos 테이블 생성
    op.create_table(
        'videos',
        sa.Column('id', sa.BigInteger(), primary_key=True, autoincrement=True),
        sa.Column('channel_id', sa.BigInteger(), sa.ForeignKey('channels.id', ondelete='CASCADE'), nullable=False),
        sa.Column('platform_video_id', sa.String(length=255), nullable=False),
        sa.Column('title', sa.Text(), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('thumbnail_url', sa.Text(), nullable=True),
        sa.Column('duration_sec', sa.Integer(), nullable=True),
        sa.Column('view_count', sa.BigInteger(), server_default='0', nullable=False),
        sa.Column('like_count', sa.BigInteger(), server_default='0', nullable=False),
        sa.Column('comment_count', sa.BigInteger(), server_default='0', nullable=False),
        sa.Column('category', sa.Enum('gaming', 'entertainment', 'music', 'education', 'news', 'sports', 'comedy', 'people', 'other', name='category_enum', create_type=False), nullable=True),
        sa.Column('is_short', sa.Boolean(), server_default='false', nullable=False),
        sa.Column('freshness_tier', sa.String(length=16), server_default='HOT', nullable=False),
        sa.Column('next_refresh_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column('safety_status', sa.String(length=16), server_default='unreviewed', nullable=False),
        sa.Column('safety_score', sa.Float(), nullable=True),
        sa.Column('published_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now(), onupdate=sa.func.now(), nullable=False),
    )
    op.create_index('idx_videos_platform_video_id', 'videos', ['platform_video_id'], unique=True)
    op.create_index('idx_videos_channel_id', 'videos', ['channel_id'])

    # T14: video_stats (파티션 테이블)
    op.execute("""
        CREATE TABLE video_stats (
            id BIGSERIAL,
            video_id BIGINT NOT NULL REFERENCES videos(id) ON DELETE CASCADE,
            view_count BIGINT DEFAULT 0,
            like_count BIGINT DEFAULT 0,
            comment_count BIGINT DEFAULT 0,
            measured_at TIMESTAMPTZ NOT NULL,
            PRIMARY KEY (id, measured_at)
        ) PARTITION BY RANGE (measured_at);
    """)
    op.execute("CREATE TABLE video_stats_y2026m05 PARTITION OF video_stats FOR VALUES FROM ('2026-05-01') TO ('2026-06-01');")
    op.execute("CREATE TABLE video_stats_y2026m06 PARTITION OF video_stats FOR VALUES FROM ('2026-06-01') TO ('2026-07-01');")
    op.execute("CREATE TABLE video_stats_y2026m07 PARTITION OF video_stats FOR VALUES FROM ('2026-07-01') TO ('2026-08-01');")

    # T15: rankings + hall_of_fame 테이블 생성
    op.create_table(
        'rankings',
        sa.Column('id', sa.BigInteger(), primary_key=True, autoincrement=True),
        sa.Column('video_id', sa.BigInteger(), sa.ForeignKey('videos.id', ondelete='CASCADE'), nullable=False),
        sa.Column('rank_type', sa.String(length=32), nullable=False),
        sa.Column('score', sa.Float(), nullable=False),
        sa.Column('position', sa.Integer(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_table(
        'hall_of_fame',
        sa.Column('id', sa.BigInteger(), primary_key=True, autoincrement=True),
        sa.Column('video_id', sa.BigInteger(), sa.ForeignKey('videos.id', ondelete='CASCADE'), nullable=False),
        sa.Column('period_type', sa.String(length=16), nullable=False),
        sa.Column('category', sa.String(length=32), nullable=True),
        sa.Column('achieved_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )

    # T16: 운영 관련 테이블 (user_events 파티셔닝 포함)
    op.execute("""
        CREATE TABLE user_events (
            id BIGSERIAL,
            session_id UUID NOT NULL,
            video_id BIGINT REFERENCES videos(id) ON DELETE CASCADE,
            event_type VARCHAR(32) NOT NULL,
            consent_analytics BOOLEAN DEFAULT FALSE,
            consent_advertising BOOLEAN DEFAULT FALSE,
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            PRIMARY KEY (id, created_at)
        ) PARTITION BY RANGE (created_at);
    """)
    op.execute("CREATE TABLE user_events_y2026m05 PARTITION OF user_events FOR VALUES FROM ('2026-05-01') TO ('2026-06-01');")
    op.execute("CREATE TABLE user_events_y2026m06 PARTITION OF user_events FOR VALUES FROM ('2026-06-01') TO ('2026-07-01');")
    op.execute("CREATE TABLE user_events_y2026m07 PARTITION OF user_events FOR VALUES FROM ('2026-07-01') TO ('2026-08-01');")

    op.create_table(
        'consent_log',
        sa.Column('id', sa.BigInteger(), primary_key=True, autoincrement=True),
        sa.Column('session_id', sa.UUID(), nullable=False),
        sa.Column('consent_type', sa.String(length=32), nullable=False),
        sa.Column('granted', sa.Boolean(), nullable=False),
        sa.Column('user_agent', sa.Text(), nullable=True),
        sa.Column('ip_hash', sa.String(length=64), nullable=True),
        sa.Column('signature', sa.String(length=64), nullable=False), # HMAC 서명
        sa.Column('signed_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )

    op.create_table(
        'video_reports',
        sa.Column('id', sa.BigInteger(), primary_key=True, autoincrement=True),
        sa.Column('video_id', sa.BigInteger(), sa.ForeignKey('videos.id', ondelete='CASCADE'), nullable=False),
        sa.Column('session_id', sa.UUID(), nullable=True),
        sa.Column('reason', sa.String(length=32), nullable=False), # 'spam', 'inappropriate' 등
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column('resolved_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('resolved_action', sa.String(length=32), nullable=True),
    )

def downgrade() -> None:
    op.drop_table('video_reports')
    op.drop_table('consent_log')
    op.drop_table('user_events')
    op.drop_table('hall_of_fame')
    op.drop_table('rankings')
    op.drop_table('video_stats')
    op.drop_table('videos')
    op.drop_table('channels')
    op.execute("DROP TYPE category_enum")
    op.execute("DROP TYPE platform_enum")
