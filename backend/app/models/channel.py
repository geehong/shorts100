import enum
from datetime import datetime
from sqlalchemy import BigInteger, String, Text, DateTime, func, Enum, Integer, Boolean
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db import Base

class PlatformEnum(str, enum.Enum):
    youtube = "youtube"
    tiktok = "tiktok"
    instagram = "instagram"

class Channel(Base):
    __tablename__ = "channels"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    platform: Mapped[PlatformEnum] = mapped_column(Enum(PlatformEnum, name="platform_enum", create_type=False), nullable=False)
    platform_id: Mapped[str] = mapped_column(String(255), nullable=False)
    handle: Mapped[str | None] = mapped_column(String(255))
    title: Mapped[str] = mapped_column(Text, nullable=False)
    thumbnail_url: Mapped[str | None] = mapped_column(Text)
    description: Mapped[str | None] = mapped_column(Text)
    
    subscriber_count: Mapped[int] = mapped_column(BigInteger, server_default="0")
    video_count: Mapped[int] = mapped_column(Integer, server_default="0")
    view_count: Mapped[int] = mapped_column(BigInteger, server_default="0")
    
    # Creator notifications & claim skeletons
    owner_email: Mapped[str | None] = mapped_column(String(255))
    notify_on_rank: Mapped[bool] = mapped_column(Boolean, server_default="false", default=False, nullable=False)
    verification_token: Mapped[str | None] = mapped_column(String(255))

    published_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # 관계 설정 (1:N)
    videos: Mapped[list["Video"]] = relationship("Video", back_populates="channel", cascade="all, delete-orphan")
