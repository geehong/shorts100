import uuid
from datetime import datetime
from sqlalchemy import String, DateTime, ForeignKey, UUID, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db import Base

class DownloadRequestLog(Base):
    __tablename__ = "download_request_logs"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=True)
    guest_ip: Mapped[str | None] = mapped_column(String(45), index=True, nullable=True)
    guest_session_id: Mapped[str | None] = mapped_column(String(64), index=True, nullable=True)
    url: Mapped[str] = mapped_column(String(2048), nullable=False)
    status: Mapped[str] = mapped_column(String(50), nullable=False)  # pending, success, failed, limit_exceeded
    error_detail: Mapped[str | None] = mapped_column(String(1024), nullable=True)
    file_token: Mapped[str | None] = mapped_column(String(128), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    user = relationship("User", backref="download_request_logs")
