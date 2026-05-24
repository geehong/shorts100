import enum
from datetime import datetime
from sqlalchemy import BigInteger, String, Text, DateTime, func, Enum, Integer, Boolean, Float, ForeignKey, ARRAY, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db import Base

class CategoryEnum(str, enum.Enum):
    gaming = "gaming"
    entertainment = "entertainment"
    music = "music"
    education = "education"
    news = "news"
    sports = "sports"
    comedy = "comedy"
    people = "people"
    other = "other"

class Video(Base):
    __tablename__ = "videos"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    channel_id: Mapped[int] = mapped_column(BigInteger, ForeignKey("channels.id", ondelete="CASCADE"), nullable=False)
    platform_video_id: Mapped[str] = mapped_column(String(255), nullable=False)
    title: Mapped[str] = mapped_column(Text, nullable=False)
    description: Mapped[str | None] = mapped_column(Text)
    thumbnail_url: Mapped[str | None] = mapped_column(Text)
    duration_sec: Mapped[int | None] = mapped_column(Integer)
    
    view_count: Mapped[int] = mapped_column(BigInteger, server_default="0")
    like_count: Mapped[int] = mapped_column(BigInteger, server_default="0")
    comment_count: Mapped[int] = mapped_column(BigInteger, server_default="0")
    
    category: Mapped[CategoryEnum | None] = mapped_column(Enum(CategoryEnum, name="category_enum", create_type=False))
    is_short: Mapped[bool] = mapped_column(Boolean, server_default="false")

    # 언어 / 태그 / 지역 제한
    default_language: Mapped[str | None] = mapped_column(String(16))   # "ko", "en", "hi" 등
    tags: Mapped[list | None] = mapped_column(ARRAY(Text))             # ["#shorts", "funny", ...]
    region_blocked: Mapped[str | None] = mapped_column(Text)           # 차단 국가 콤마 구분 "KR,US"
    
    # 랭킹/운영 관련 필드
    freshness_tier: Mapped[str] = mapped_column(String(16), server_default="HOT")
    next_refresh_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    safety_status: Mapped[str] = mapped_column(String(16), server_default="unreviewed")
    safety_score: Mapped[float | None] = mapped_column(Float)
    status: Mapped[str] = mapped_column(String(16), server_default="active", nullable=False)  # active, private, deleted
    trending_regions: Mapped[list] = mapped_column(ARRAY(String(8)), server_default="{}")     # ['KR', 'US'] 등
    
    published_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # 관계 설정 (N:1 및 1:N)
    channel: Mapped["Channel"] = relationship("Channel", back_populates="videos")
    reports: Mapped[list["VideoReport"]] = relationship("VideoReport", back_populates="video", cascade="all, delete-orphan")
    reactions: Mapped[list["VideoReaction"]] = relationship("VideoReaction", back_populates="video", cascade="all, delete-orphan")


class VideoStat(Base):
    __tablename__ = "video_stats"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    video_id: Mapped[int] = mapped_column(BigInteger, ForeignKey("videos.id", ondelete="CASCADE"), nullable=False)
    view_count: Mapped[int] = mapped_column(BigInteger, server_default="0")
    like_count: Mapped[int] = mapped_column(BigInteger, server_default="0")
    comment_count: Mapped[int] = mapped_column(BigInteger, server_default="0")
    measured_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), primary_key=True)

    video = relationship("Video", backref="stats")


class VideoTrendingHistory(Base):
    __tablename__ = "video_trending_history"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    video_id: Mapped[int] = mapped_column(BigInteger, ForeignKey("videos.id", ondelete="CASCADE"), nullable=False)
    region: Mapped[str] = mapped_column(String(8), nullable=False)
    observed_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    video = relationship("Video", backref="trending_history")


class VideoReport(Base):
    __tablename__ = "video_reports"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    video_id: Mapped[int] = mapped_column(BigInteger, ForeignKey("videos.id", ondelete="CASCADE"), nullable=False)
    session_id: Mapped[str | None] = mapped_column(String(36))  # UUID string representation
    reason: Mapped[str] = mapped_column(String(32), nullable=False)
    description: Mapped[str | None] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    resolved_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    resolved_action: Mapped[str | None] = mapped_column(String(32))

    video = relationship("Video", back_populates="reports")


class VideoReaction(Base):
    __tablename__ = "video_reactions"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    video_id: Mapped[int] = mapped_column(BigInteger, ForeignKey("videos.id", ondelete="CASCADE"), nullable=False)
    emoji: Mapped[str] = mapped_column(String(16), nullable=False)
    session_id: Mapped[str] = mapped_column(String(64), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    video = relationship("Video", back_populates="reactions")

    __table_args__ = (
        UniqueConstraint("video_id", "session_id", name="uq_video_reaction_session"),
    )
