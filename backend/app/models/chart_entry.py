from datetime import datetime
from sqlalchemy import BigInteger, String, Float, Integer, ForeignKey, DateTime, func, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db import Base

class ChartEntry(Base):
    __tablename__ = "chart_entries"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    chart_type: Mapped[str] = mapped_column(String(16), nullable=False)  # 'real', 'daily', 'weekly', 'monthly'
    period_key: Mapped[str] = mapped_column(String(20), nullable=False)  # '2026-05-22', '2026-05-22T14', etc.
    period_start: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    period_end: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    region: Mapped[str] = mapped_column(String(8), server_default="GLOBAL", nullable=False)  # 'GLOBAL', 'KR', 'US', etc.
    category: Mapped[str | None] = mapped_column(String(24))  # category slug or null for all
    video_id: Mapped[int] = mapped_column(BigInteger, ForeignKey("videos.id", ondelete="CASCADE"), nullable=False)
    rank_basis: Mapped[str] = mapped_column(String(16), server_default="view_delta", nullable=False)  # 'algo', 'view_count', 'view_delta', 'rising'
    
    position: Mapped[int] = mapped_column(Integer, nullable=False)
    prev_position: Mapped[int | None] = mapped_column(Integer)
    peak_position: Mapped[int | None] = mapped_column(Integer)
    weeks_on_chart: Mapped[int] = mapped_column(Integer, server_default="1", nullable=False)

    view_delta: Mapped[int | None] = mapped_column(BigInteger)
    view_count: Mapped[int] = mapped_column(BigInteger, nullable=False)
    zscore: Mapped[float | None] = mapped_column(Float)
    velocity: Mapped[float | None] = mapped_column(Float)
    like_count: Mapped[int] = mapped_column(BigInteger, server_default="0", nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), primary_key=True, server_default=func.now())

    video = relationship("Video", backref="chart_entries")
