from datetime import datetime
from pydantic import BaseModel, ConfigDict
from app.models import PlatformEnum

class ChannelBase(BaseModel):
    platform: PlatformEnum
    platform_id: str
    handle: str | None = None
    title: str
    thumbnail_url: str | None = None
    description: str | None = None
    subscriber_count: int = 0
    video_count: int = 0
    view_count: int = 0
    published_at: datetime | None = None

class ChannelCreate(ChannelBase):
    pass

class ChannelResponse(ChannelBase):
    id: int
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
