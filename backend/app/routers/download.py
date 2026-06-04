"""Download 라우터"""
import os
import uuid
from datetime import datetime, timezone, timedelta
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, Request
from fastapi.responses import FileResponse
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.db import get_db
from app.deps import get_current_user, get_client_ip
from app.models import User, DownloadLog, DownloadRequestLog
from app.services.downloader import extract_metadata, download_video, clean_old_files

router = APIRouter(prefix="/api/download", tags=["Download"])


class DownloadPrepareRequest(BaseModel):
    url: str


async def _get_guest_download_count(db: AsyncSession, client_ip: str, session_id: str | None) -> int:
    from sqlalchemy import func
    since = datetime.now(timezone.utc) - timedelta(days=1)
    ip_filter = DownloadLog.guest_ip == client_ip
    id_filter = (ip_filter | (DownloadLog.guest_session_id == session_id)) if session_id else ip_filter
    stmt = (
        select(func.count(DownloadLog.id))
        .where(DownloadLog.user_id == None)
        .where(id_filter)
        .where(DownloadLog.created_at >= since)
    )
    return (await db.execute(stmt)).scalar() or 0


async def _get_guest_bonus(client_ip: str) -> int:
    from app.core.cache import cache
    return int(await cache.get(f"guest_bonus:{client_ip}") or 0)


@router.get("/limits")
async def get_download_limits(
    request: Request,
    current_user: Optional[User] = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if current_user:
        return {
            "role": current_user.role,
            "points": current_user.points,
            "limit_reached": False if current_user.role in ["master", "admin"] else current_user.points <= 0,
        }
    client_ip = get_client_ip(request)
    session_id = request.cookies.get("sid")
    downloads_count = await _get_guest_download_count(db, client_ip, session_id)
    bonus = await _get_guest_bonus(client_ip)
    total_limit = 5 + bonus
    return {
        "role": "guest",
        "downloads_left": max(0, total_limit - downloads_count),
        "limit_reached": downloads_count >= total_limit,
    }


@router.post("/guest-refill")
async def guest_ad_refill(
    request: Request,
    db: AsyncSession = Depends(get_db),
):
    """게스트 광고 시청 후 다운로드 3회 충전"""
    from app.core.cache import cache
    client_ip = get_client_ip(request)
    session_id = request.cookies.get("sid")

    rate_key = f"guest_refill_rate:{client_ip}"
    if await cache.get(rate_key):
        raise HTTPException(status_code=429, detail="REFILL_LIMIT_EXCEEDED")

    bonus_key = f"guest_bonus:{client_ip}"
    current_bonus = int(await cache.get(bonus_key) or 0)
    new_bonus = current_bonus + 3

    await cache.setex(rate_key, 86400, "1")       # 24h 재충전 제한
    await cache.setex(bonus_key, 172800, str(new_bonus))  # 보너스 2일 유지

    downloads_count = await _get_guest_download_count(db, client_ip, session_id)
    total_limit = 5 + new_bonus
    return {
        "role": "guest",
        "downloads_left": max(0, total_limit - downloads_count),
        "limit_reached": downloads_count >= total_limit,
    }


@router.post("/prepare")
async def prepare_download(
    req: DownloadPrepareRequest,
    request: Request,
    current_user: Optional[User] = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    url = req.url.strip()
    if not url:
        raise HTTPException(status_code=400, detail="URL cannot be empty")

    client_ip = get_client_ip(request) if not current_user else None
    session_id = request.cookies.get("sid") if not current_user else None

    req_log = DownloadRequestLog(
        user_id=current_user.id if current_user else None,
        guest_ip=client_ip, guest_session_id=session_id,
        url=url, status="pending",
    )
    db.add(req_log)
    await db.commit()
    await db.refresh(req_log)

    try:
        if current_user:
            if current_user.role not in ["master", "admin"] and current_user.points <= 0:
                req_log.status = "limit_exceeded"
                req_log.error_detail = "LIMIT_EXCEEDED"
                await db.commit()
                raise HTTPException(status_code=403, detail="LIMIT_EXCEEDED")
        else:
            client_ip_guest = get_client_ip(request)
            session_id_guest = request.cookies.get("sid")
            downloads_count_guest = await _get_guest_download_count(db, client_ip_guest, session_id_guest)
            bonus_guest = await _get_guest_bonus(client_ip_guest)
            if downloads_count_guest >= 5 + bonus_guest:
                req_log.status = "limit_exceeded"
                req_log.error_detail = "LIMIT_EXCEEDED"
                await db.commit()
                raise HTTPException(status_code=403, detail="LIMIT_EXCEEDED")

        try:
            clean_old_files()
        except Exception:
            pass

        try:
            meta = await extract_metadata(url)
        except ValueError as e:
            req_log.status = "failed"
            req_log.error_detail = str(e)
            await db.commit()
            raise HTTPException(status_code=400, detail=str(e))
        except Exception as e:
            import traceback
            traceback.print_exc()
            req_log.status = "failed"
            req_log.error_detail = "UNSUPPORTED_URL"
            await db.commit()
            raise HTTPException(status_code=400, detail="UNSUPPORTED_URL")

        file_id = str(uuid.uuid4())
        try:
            local_path = await download_video(url, file_id)
        except ValueError as e:
            req_log.status = "failed"
            req_log.error_detail = str(e)
            await db.commit()
            raise HTTPException(status_code=500, detail=str(e))
        except Exception:
            req_log.status = "failed"
            req_log.error_detail = "DOWNLOAD_FAILED"
            await db.commit()
            raise HTTPException(status_code=500, detail="DOWNLOAD_FAILED")

        file_token = str(uuid.uuid4())
        expires_at = datetime.now(timezone.utc) + timedelta(hours=1)

        if current_user:
            if current_user.role not in ["master", "admin"]:
                current_user.points = max(0, current_user.points - 1)
            db.add(current_user)
            log = DownloadLog(
                user_id=current_user.id, file_token=file_token,
                local_path=local_path, original_url=url, expires_at=expires_at,
            )
        else:
            log = DownloadLog(
                guest_ip=get_client_ip(request),
                guest_session_id=request.cookies.get("sid"),
                file_token=file_token, local_path=local_path,
                original_url=url, expires_at=expires_at,
            )
        db.add(log)
        req_log.status = "success"
        req_log.file_token = file_token
        await db.commit()

        return {
            "file_token": file_token,
            "title": meta["title"],
            "thumbnail": meta["thumbnail"],
            "duration": meta["duration"],
            "extractor": meta["extractor"],
            "expires_at": expires_at.isoformat(),
        }
    except HTTPException:
        raise
    except Exception as e:
        req_log.status = "failed"
        req_log.error_detail = str(e)[:1024]
        await db.commit()
        raise HTTPException(status_code=500, detail="INTERNAL_SERVER_ERROR")


@router.get("/serve/{file_token}")
async def serve_download(
    file_token: str,
    dl: Optional[int] = Query(None),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(DownloadLog).where(DownloadLog.file_token == file_token))
    log = result.scalar_one_or_none()
    if not log:
        raise HTTPException(status_code=404, detail="File token not found")

    expires_at = log.expires_at
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)
    if expires_at < datetime.now(timezone.utc):
        raise HTTPException(status_code=410, detail="File has expired")
    if not os.path.exists(log.local_path):
        raise HTTPException(status_code=404, detail="File does not exist on server")

    headers = {}
    if dl == 1:
        headers["Content-Disposition"] = f'attachment; filename="shortsdown_{file_token[:8]}.mp4"'
    return FileResponse(path=log.local_path, media_type="video/mp4", headers=headers)


@router.post("/upgrade")
async def upgrade_membership(
    current_user: Optional[User] = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if not current_user:
        raise HTTPException(status_code=401, detail="Not authenticated")

    from app.core.cache import cache
    rate_key = f"upgrade_limit:{current_user.id}"
    if await cache.get(rate_key):
        raise HTTPException(status_code=429, detail="REFILL_LIMIT_EXCEEDED")

    current_user.role = "upgraded"
    current_user.points = current_user.points + 50
    db.add(current_user)
    await db.commit()
    await db.refresh(current_user)
    await cache.setex(rate_key, 86400, "1")  # 24시간 1회 제한
    return {"status": "success", "user": {"username": current_user.username, "role": current_user.role, "points": current_user.points}}
