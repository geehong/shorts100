"""Admin 라우터"""
import secrets

from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import HTMLResponse
from fastapi.security import HTTPBasic, HTTPBasicCredentials
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload

from app.db import get_db
from app.models import Video

router = APIRouter(tags=["Admin"])

_basic_security = HTTPBasic()


def _require_admin(credentials: HTTPBasicCredentials = Depends(_basic_security)):
    from app.config import settings
    admin_user = (settings.ADMIN_USER or "admin").encode()
    admin_pass = (settings.ADMIN_PASSWORD or "changeme").encode()
    ok = (
        secrets.compare_digest(credentials.username.encode(), admin_user)
        and secrets.compare_digest(credentials.password.encode(), admin_pass)
    )
    if not ok:
        raise HTTPException(status_code=401, detail="Unauthorized", headers={"WWW-Authenticate": "Basic"})


@router.get("/admin/reports", response_class=HTMLResponse, dependencies=[Depends(_require_admin)])
async def admin_reports_page(db: AsyncSession = Depends(get_db)):
    """신고된 영상 목록 관리자 페이지"""
    from app.models import VideoReport
    from sqlalchemy import func

    stmt = (
        select(VideoReport.video_id, func.count(VideoReport.id).label("report_count"), func.max(VideoReport.created_at).label("latest_at"))
        .where(VideoReport.resolved_at == None)
        .group_by(VideoReport.video_id)
        .order_by(func.count(VideoReport.id).desc())
        .limit(100)
    )
    rows = (await db.execute(stmt)).all()

    video_ids = [r.video_id for r in rows]
    videos_map: dict[int, Video] = {}
    if video_ids:
        v_stmt = select(Video).options(selectinload(Video.channel)).where(Video.id.in_(video_ids))
        videos_map = {v.id: v for v in (await db.execute(v_stmt)).scalars().all()}

    flagged_stmt = (
        select(Video).options(selectinload(Video.channel))
        .where(Video.safety_status.in_(["flagged", "hidden"]))
        .order_by(Video.safety_score.desc())
        .limit(50)
    )
    flagged_videos = (await db.execute(flagged_stmt)).scalars().all()

    def _row(v: Video, count: int = 0, latest: str = "") -> str:
        yt_url = f"https://youtube.com/shorts/{v.platform_video_id}"
        return f"""
        <tr>
          <td>{v.id}</td>
          <td><a href="{yt_url}" target="_blank">{v.title[:60]}</a></td>
          <td>{v.channel.title if v.channel else "-"}</td>
          <td><b>{v.safety_status}</b></td>
          <td>{f"{v.safety_score:.2f}" if v.safety_score is not None else "-"}</td>
          <td>{count}</td>
          <td>{str(latest)[:16]}</td>
          <td>
            <a href="/admin/videos/{v.id}/action?action=safe">✅ safe</a> |
            <a href="/admin/videos/{v.id}/action?action=hidden">🚫 hidden</a> |
            <a href="/admin/videos/{v.id}/action?action=banned">❌ ban</a>
          </td>
        </tr>"""

    report_rows = "".join(_row(videos_map[r.video_id], r.report_count, r.latest_at) for r in rows if r.video_id in videos_map)
    flagged_rows = "".join(_row(v) for v in flagged_videos if not any(r.video_id == v.id for r in rows))

    html = f"""<!DOCTYPE html>
<html lang="ko"><head><meta charset="utf-8">
<title>Shorts100 관리자 - 신고 처리</title>
<style>
  body {{ font-family: sans-serif; padding: 20px; }}
  table {{ border-collapse: collapse; width: 100%; font-size: 13px; }}
  th, td {{ border: 1px solid #ddd; padding: 6px 10px; text-align: left; }}
  th {{ background: #f5f5f5; }}
  tr:hover {{ background: #fafafa; }}
  h2 {{ margin-top: 30px; }}
  a {{ color: #1a73e8; }}
</style></head><body>
<h1>🛡️ Shorts100 관리자 대시보드</h1>
<h2>📋 신고 누적 영상 ({len(rows)}건)</h2>
<table>
  <tr><th>ID</th><th>제목</th><th>채널</th><th>상태</th><th>점수</th><th>신고수</th><th>최근신고</th><th>액션</th></tr>
  {report_rows or "<tr><td colspan='8'>신고 없음</td></tr>"}
</table>
<h2>⚠️ 자동 플래그 영상 ({len(flagged_videos)}건)</h2>
<table>
  <tr><th>ID</th><th>제목</th><th>채널</th><th>상태</th><th>점수</th><th>신고수</th><th>최근신고</th><th>액션</th></tr>
  {flagged_rows or "<tr><td colspan='8'>없음</td></tr>"}
</table>
</body></html>"""
    return HTMLResponse(html)


@router.get("/admin/videos/{video_id}/action", dependencies=[Depends(_require_admin)])
async def admin_video_action(
    video_id: int,
    action: str = Query(..., regex="^(safe|flagged|hidden|banned)$"),
    db: AsyncSession = Depends(get_db),
):
    """영상 safety_status 수동 변경"""
    from sqlalchemy import text
    video = (await db.execute(select(Video).where(Video.id == video_id))).scalar_one_or_none()
    if not video:
        raise HTTPException(status_code=404, detail="Video not found")
    video.safety_status = action
    await db.execute(
        text("UPDATE video_reports SET resolved_at = NOW(), resolved_action = :action WHERE video_id = :vid AND resolved_at IS NULL"),
        {"action": action, "vid": video_id},
    )
    await db.commit()
    return HTMLResponse(f'<meta http-equiv="refresh" content="0;url=/admin/reports"><p>✅ 처리 완료 ({action})</p>')
