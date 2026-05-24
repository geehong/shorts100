from datetime import datetime
from pydantic import BaseModel, ConfigDict
from app.models import CategoryEnum
from .channel import ChannelResponse

class VideoBase(BaseModel):
    platform_video_id: str
    title: str
    description: str | None = None
    thumbnail_url: str | None = None
    duration_sec: int | None = None
    view_count: int = 0
    like_count: int = 0
    comment_count: int = 0
    category: CategoryEnum | None = None
    is_short: bool = False
    freshness_tier: str = "HOT"
    safety_status: str = "unreviewed"
    safety_score: float | None = None
    published_at: datetime

class VideoCreate(VideoBase):
    channel_id: int

class VideoResponse(VideoBase):
    id: int
    channel_id: int
    created_at: datetime
    updated_at: datetime
    channel: ChannelResponse | None = None

    model_config = ConfigDict(from_attributes=True)
