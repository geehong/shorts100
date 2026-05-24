import uuid
from datetime import datetime
from sqlalchemy import BigInteger, String, Boolean, DateTime, func, Text, UUID
from sqlalchemy.orm import Mapped, mapped_column
from app.db import Base

class ConsentLog(Base):
    __tablename__ = "consent_log"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    session_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), nullable=False)
    consent_type: Mapped[str] = mapped_column(String(32), nullable=False)  # 'analytics', 'advertising'
    granted: Mapped[bool] = mapped_column(Boolean, nullable=False)
    user_agent: Mapped[str | None] = mapped_column(Text)
    ip_hash: Mapped[str | None] = mapped_column(String(64))
    signature: Mapped[str] = mapped_column(String(64), nullable=False)  # HMAC signature
    signed_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)
