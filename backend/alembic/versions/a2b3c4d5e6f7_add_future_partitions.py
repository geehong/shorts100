"""add future partitions for video_stats and user_events

Revision ID: a2b3c4d5e6f7
Revises: a1b2c3d4e5f6
Create Date: 2026-09-09 08:32:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = 'a2b3c4d5e6f7'
down_revision: Union[str, None] = '98619b790064'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # video_stats & user_events DEFAULT 파티션
    op.execute("CREATE TABLE IF NOT EXISTS video_stats_default PARTITION OF video_stats DEFAULT;")
    op.execute("CREATE TABLE IF NOT EXISTS user_events_default PARTITION OF user_events DEFAULT;")

    # 2026년 9월 ~ 2027년 12월 파티션 생성
    years = [2026, 2027]
    for year in years:
        start_month = 9 if year == 2026 else 1
        for month in range(start_month, 13):
            next_year = year if month < 12 else year + 1
            next_month = month + 1 if month < 12 else 1
            
            m_str = f"{month:02d}"
            nm_str = f"{next_month:02d}"
            
            start_date = f"{year}-{m_str}-01 00:00:00+09"
            end_date = f"{next_year}-{nm_str}-01 00:00:00+09"
            
            vs_table = f"video_stats_y{year}m{m_str}"
            ue_table = f"user_events_y{year}m{m_str}"
            
            op.execute(f"CREATE TABLE IF NOT EXISTS {vs_table} PARTITION OF video_stats FOR VALUES FROM ('{start_date}') TO ('{end_date}');")
            op.execute(f"CREATE TABLE IF NOT EXISTS {ue_table} PARTITION OF user_events FOR VALUES FROM ('{start_date}') TO ('{end_date}');")


def downgrade() -> None:
    pass
