"""Videos 라우터"""
from typing import Optional, List

from fastapi import APIRouter, Depends, HTTPException, Query, Request
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload

from app.db import get_db
from app.deps import get_current_user, get_client_ip
from app.models import Video, Channel, User
from app.schemas import VideoResponse

router = APIRouter(tags=["Videos"])


class ReportPayload(BaseModel):
    reason: str
    description: Optional[str] = None


@router.get("/api/videos", response_model=List[VideoResponse])
async def get_videos(
    limit: int = Query(default=10, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
    db: AsyncSession = Depends(get_db),
):
    """동영상 목록 조회 (최신순 정렬)"""
    query = (
        select(Video)
        .options(selectinload(Video.channel))
        .order_by(Video.published_at.desc())
        .limit(limit)
        .offset(offset)
    )
    result = await db.execute(query)
    return result.scalars().all()


@router.get("/api/videos/search")
async def search_videos(
    request: Request,
    q: str = Query(..., min_length=1),
    limit: int = Query(default=20, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
    current_user: Optional[User] = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """영상 제목, 설명, 채널명 검색"""
    from app.models import SearchQueryLog
    from sqlalchemy import or_

    if offset == 0:
        try:
            db.add(SearchQueryLog(
                user_id=current_user.id if current_user else None,
                guest_ip=get_client_ip(request) if not current_user else None,
                guest_session_id=request.cookies.get("sid") if not current_user else None,
                query=q.strip(),
            ))
            await db.commit()
        except Exception as e:
            print(f"[SEARCH_LOG_ERROR] {e}", flush=True)

    search_pattern = f"%{q}%"
    query = (
        select(Video)
        .join(Video.channel)
        .options(selectinload(Video.channel))
        .where(Video.is_short == True)
        .where(Video.safety_status.notin_(["hidden", "banned"]))
        .where(or_(
            Video.title.ilike(search_pattern),
            Video.description.ilike(search_pattern),
            Channel.title.ilike(search_pattern),
        ))
        .order_by(Video.view_count.desc())
        .limit(limit)
        .offset(offset)
    )
    videos = (await db.execute(query)).scalars().all()
    return [
        {
            "id": v.id, "title": v.title,
            "channel_title": v.channel.title,
            "thumbnail_url": v.thumbnail_url,
            "view_count": v.view_count, "like_count": v.like_count,
            "score": float(v.view_count),
            "position": offset + i + 1,
            "platform_video_id": v.platform_video_id,
            "category": v.category.value if v.category else None,
            "published_at": v.published_at.isoformat() if v.published_at else None,
        }
        for i, v in enumerate(videos)
    ]


@router.get("/api/videos/{video_id}", response_model=VideoResponse)
async def get_video(
    video_id: int,
    db: AsyncSession = Depends(get_db),
):
    """특정 동영상 상세 조회"""
    query = select(Video).options(selectinload(Video.channel)).where(Video.id == video_id)
    video = (await db.execute(query)).scalar_one_or_none()
    if video is None:
        raise HTTPException(status_code=404, detail="Video not found")
    return video


@router.post("/api/videos/{video_id}/report", status_code=204)
async def report_video(
    video_id: int,
    payload: "ReportPayload",
    request: Request,
    db: AsyncSession = Depends(get_db),
):
    """영상 신고 접수. 쿠키 기반 세션 ID로 중복 신고 방지."""
    import uuid
    from sqlalchemy import func
    from app.models import VideoReport

    valid_reasons = {"spam", "inappropriate", "copyright", "other"}
    if payload.reason not in valid_reasons:
        raise HTTPException(status_code=422, detail="Invalid reason")

    session_id_str = request.cookies.get("sid") or str(uuid.uuid4())
    try:
        sid = uuid.UUID(session_id_str)
    except ValueError:
        sid = uuid.uuid4()

    from sqlalchemy import text
    dup = await db.execute(
        text("SELECT id FROM video_reports WHERE video_id=:vid AND session_id=CAST(:sid AS uuid) LIMIT 1"),
        {"vid": video_id, "sid": str(sid)},
    )
    if dup.scalar_one_or_none():
        return

    await db.execute(
        text("INSERT INTO video_reports (video_id, session_id, reason, description) VALUES (:vid, CAST(:sid AS uuid), :reason, :desc)"),
        {"vid": video_id, "sid": str(sid), "reason": payload.reason, "desc": payload.description},
    )

    count_result = await db.execute(
        text("SELECT COUNT(*) FROM video_reports WHERE video_id=:vid AND resolved_at IS NULL"),
        {"vid": video_id},
    )
    report_count = (count_result.scalar() or 0) + 1

    if report_count >= 5:
        video_result = await db.execute(select(Video).where(Video.id == video_id))
        video = video_result.scalar_one_or_none()
        if video and video.safety_status not in ("safe", "banned"):
            video.safety_status = "hidden"

    await db.commit()


