from datetime import datetime
from sqlalchemy import BigInteger, String, Float, Integer, ForeignKey, DateTime, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db import Base

class Ranking(Base):
    __tablename__ = "rankings"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    video_id: Mapped[int] = mapped_column(BigInteger, ForeignKey("videos.id", ondelete="CASCADE"), nullable=False)
    rank_type: Mapped[str] = mapped_column(String(32), nullable=False)  # 'global' or category
    score: Mapped[float] = mapped_column(Float, nullable=False)
    position: Mapped[int] = mapped_column(Integer, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    # 관계 설정
    video = relationship("Video", backref="rankings")