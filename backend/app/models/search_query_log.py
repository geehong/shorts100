import uuid
from datetime import datetime
from sqlalchemy import String, DateTime, ForeignKey, UUID, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db import Base

class SearchQueryLog(Base):
    __tablename__ = "search_query_logs"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=True)
    guest_ip: Mapped[str | None] = mapped_column(String(45), index=True, nullable=True)
    guest_session_id: Mapped[str | None] = mapped_column(String(64), index=True, nullable=True)
    query: Mapped[str] = mapped_column(String(255), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    user = relationship("User", backref="search_query_logs")
