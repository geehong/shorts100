import uuid
from datetime import datetime, timezone, timedelta
from typing import Optional

import secrets
from fastapi import FastAPI, Depends, HTTPException, Query, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBasic, HTTPBasicCredentials, HTTPBearer, HTTPAuthorizationCredentials
from fastapi.responses import HTMLResponse, FileResponse
from pydantic import BaseModel, Field
from sqlalchemy import asc
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload
from typing import List
import os

from .db import get_db
from app.models import Video, Ranking, VideoStat, Channel, User, DownloadLog
from app.services.auth import hash_password, verify_password, generate_token, verify_token
from app.services.downloader import extract_metadata, download_video, clean_old_files

from .schemas import VideoResponse
from .core.cache import cache
from .config import settings

# ── Sentry 초기화 (T48) — DSN 설정 시에만 활성화 ─────────────────────
if settings.SENTRY_DSN:
    try:
        import sentry_sdk
        from sentry_sdk.integrations.fastapi import FastApiIntegration
        from sentry_sdk.integrations.sqlalchemy import SqlalchemyIntegration
        sentry_sdk.init(
            dsn=settings.SENTRY_DSN,
            integrations=[FastApiIntegration(), SqlalchemyIntegration()],
            traces_sample_rate=0.1,
            environment="production",
        )
    except ImportError:
        pass  # sentry-sdk 미설치 시 조용히 무시

# ── Basic Auth (관리자 페이지용) ─────────────────────────────────────
_basic_security = HTTPBasic()

def _require_admin(credentials: HTTPBasicCredentials = Depends(_basic_security)):
    admin_user = (settings.ADMIN_USER or "admin").encode()
    admin_pass = (settings.ADMIN_PASSWORD or "changeme").encode()
    ok = (
        secrets.compare_digest(credentials.username.encode(), admin_user)
        and secrets.compare_digest(credentials.password.encode(), admin_pass)
    )
    if not ok:
        raise HTTPException(status_code=401, detail="Unauthorized", headers={"WWW-Authenticate": "Basic"})

app = FastAPI(
    title="Shorts100 API",
    description="유튜브 쇼츠 랭킹 서비스 API",
    version="0.1.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://shorts100.firemarkets.net", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
async def health_check():
    """
    서버 상태 확인용 엔드포인트
    """
    return {"status": "ok", "message": "Shorts100 API is running"}

@app.get("/api/videos", response_model=List[VideoResponse])
async def get_videos(
    limit: int = Query(default=10, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
    db: AsyncSession = Depends(get_db)
):
    """
    동영상 목록 조회 (최신순 정렬)
    """
    query = (
        select(Video)
        .options(selectinload(Video.channel))
        .order_by(Video.published_at.desc())
        .limit(limit)
        .offset(offset)
    )
    result = await db.execute(query)
    videos = result.scalars().all()
    return videos

@app.get("/api/videos/search")
async def search_videos(
    q: str = Query(..., min_length=1),
    limit: int = Query(default=20, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
    db: AsyncSession = Depends(get_db)
):
    """
    영상 제목, 설명, 채널명 검색 API
    """
    from sqlalchemy import or_
    
    search_pattern = f"%{q}%"
    query = (
        select(Video)
        .join(Video.channel)
        .options(selectinload(Video.channel))
        .where(Video.is_short == True)
        .where(Video.safety_status.notin_(["hidden", "banned"]))
        .where(
            or_(
                Video.title.ilike(search_pattern),
                Video.description.ilike(search_pattern),
                Channel.title.ilike(search_pattern)
            )
        )
        .order_by(Video.view_count.desc())
        .limit(limit)
        .offset(offset)
    )
    result = await db.execute(query)
    videos = result.scalars().all()
    
    items = []
    for i, v in enumerate(videos):
        items.append({
            "id": v.id,
            "title": v.title,
            "channel_title": v.channel.title,
            "thumbnail_url": v.thumbnail_url,
            "view_count": v.view_count,
            "like_count": v.like_count,
            "score": float(v.view_count),
            "position": offset + i + 1,
            "platform_video_id": v.platform_video_id,
            "category": v.category.value if v.category else None,
            "published_at": v.published_at.isoformat() if v.published_at else None,
        })
    return items

@app.get("/api/videos/{video_id}", response_model=VideoResponse)
async def get_video(
    video_id: int,
    db: AsyncSession = Depends(get_db)
):
    """
    특정 동영상 상세 조회
    """
    query = (
        select(Video)
        .options(selectinload(Video.channel))
        .where(Video.id == video_id)
    )
    result = await db.execute(query)
    video = result.scalar_one_or_none()
    if video is None:
        raise HTTPException(status_code=404, detail="Video not found")
    return video

def _build_ranking_response(r: Ranking) -> dict:
    v = r.video
    return {
        "id": v.id,
        "title": v.title,
        "channel_title": v.channel.title,
        "thumbnail_url": v.thumbnail_url,
        "view_count": v.view_count,
        "like_count": v.like_count,
        "score": r.score,
        "position": r.position,
        "platform_video_id": v.platform_video_id,
        "category": v.category.value if v.category else None,
        "published_at": v.published_at.isoformat() if v.published_at else None,
    }


PERIOD_DAYS = {
    "today":   1,
    "weekly":  7,
    "monthly": 30,
    "yearly":  365,
}

CATEGORY_KOR_TO_ENG = {
    "게임": "gaming",
    "음악": "music",
    "코미디": "comedy",
    "엔터": "entertainment",
    "스포츠": "sports",
    "교육": "education",
    "동물": "people",
    "라이프": "people",
}

def translate_category(cat: Optional[str]) -> Optional[str]:
    if not cat:
        return None
    return CATEGORY_KOR_TO_ENG.get(cat, cat).lower()


async def _get_ranking_list(
    rank_type: str,
    limit: int,
    offset: int,
    db: AsyncSession,
    period: Optional[str] = None,
    region: Optional[str] = None,
    category: Optional[str] = None,
    rank_basis: Optional[str] = "algo",
) -> list:
    """region/category/period 복합 필터링. 전체(region=None,category=None,period=None,rank_basis='algo') 는 캐시 사용."""
    category = translate_category(category)
    
    # 만약 카테고리가 지정되었고 global 랭킹을 조회하는 경우, 카테고리별 랭킹 테이블/캐시를 사용함
    resolved_rank_type = rank_type
    if rank_type == "global" and category:
        resolved_rank_type = f"category:{category}"

    use_cache = (not period or period == "all") and not region and (not rank_basis or rank_basis == "algo")
    if use_cache:
        cached = await cache.get_ranking(resolved_rank_type)
        if cached:
            return cached[offset : offset + limit]

    cutoff = None
    if period == "realtime":
        cutoff = datetime.now(timezone.utc) - timedelta(hours=24) # 24 hours for realtime to ensure we have data
    elif period and period in PERIOD_DAYS:
        cutoff = datetime.now(timezone.utc) - timedelta(days=PERIOD_DAYS[period])

    # 만약 period가 전체(all/None) 이고 rank_basis가 algo인 경우에만 Ranking 테이블 조회
    if (not period or period == "all") and (not rank_basis or rank_basis == "algo"):
        query = (
            select(Ranking)
            .join(Ranking.video)
            .options(selectinload(Ranking.video).selectinload(Video.channel))
            .where(Ranking.rank_type == resolved_rank_type)
        )

        if region:
            from sqlalchemy import or_
            lang_map = {
                "KR": ["ko"],
                "US": ["en"],
                "IN": ["hi", "en-IN"],
                "JP": ["ja"],
                "BR": ["pt"],
                "GB": ["en"],
            }
            langs = lang_map.get(region.upper())
            if langs:
                conditions = [Video.default_language.startswith(lang) for lang in langs]
                if region.upper() == "KR":
                    conditions.append(Video.title.op("~")("[\uac00-\ud7a3]"))
                query = query.where(or_(*conditions))

        if category:
            query = query.where(Video.category == category)

        query = query.order_by(asc(Ranking.position)).limit(limit).offset(offset)
        rankings = (await db.execute(query)).scalars().all()

        items = []
        for i, r in enumerate(rankings):
            item = _build_ranking_response(r)
            if category:
                item["position"] = offset + i + 1
            items.append(item)
        return items

    # 그 외의 모든 경우 (특정 기간이 지정되었거나, rank_basis가 algo가 아닌 경우): Video 테이블 직접 조회
    query = (
        select(Video)
        .options(selectinload(Video.channel))
        .where(Video.is_short == True)
        .where(Video.safety_status.notin_(["hidden", "banned"]))
    )

    if cutoff:
        query = query.where(Video.published_at >= cutoff)

    if region:
        from sqlalchemy import or_
        lang_map = {
            "KR": ["ko"],
            "US": ["en"],
            "IN": ["hi", "en-IN"],
            "JP": ["ja"],
            "BR": ["pt"],
            "GB": ["en"],
        }
        langs = lang_map.get(region.upper())
        if langs:
            conditions = [Video.default_language.startswith(lang) for lang in langs]
            if region.upper() == "KR":
                conditions.append(Video.title.op("~")("[\uac00-\ud7a3]"))
            query = query.where(or_(*conditions))

    if category:
        query = query.where(Video.category == category)

    # 정렬 방식에 따른 처리
    import statistics
    from app.services.ranking import calculate_z_score, calculate_decay, compute_final_score, compute_rising_score

    # GLOBAL 뷰 언어별 랭킹 가중치 (높을수록 상위 노출 유리)
    _LANG_WEIGHT: dict[str, float] = {
        "en": 1.00,  # 영어
        "ko": 0.85,  # 한국어
        "ja": 0.70,  # 일본어
        "fr": 0.55,  # 프랑스어
        "es": 0.45,  # 스페인어
        "pt": 0.35,  # 포르투갈어
        "hi": 0.12,  # 힌디 (인도)
        "id": 0.12,  # 인도네시아
        "ur": 0.10,  # 우르두 (파키스탄)
        "bn": 0.10,  # 벵갈리
        "ta": 0.10,  # 타밀
        "te": 0.10,  # 텔루구
        "mr": 0.10,  # 마라티
    }
    _DEFAULT_WEIGHT = 0.20  # 나머지 언어
    def _lang_weight(v) -> float:
        import re
        if region:   # 지역 탭 선택 시엔 가중치 없음
            return 1.0
        lang = (v.default_language or "")[:2].lower()
        title = v.title or ""
        # 제목에 남아시아 문자가 포함되면 실제 언어 기준으로 낮은 가중치 적용
        # (YouTube가 en-IN 등으로 잘못 태깅하는 경우 대응)
        if re.search(r'[\u0900-\u097F]', title):  # 데바나가리 (힌디/마라티/네팔어)
            return 0.12
        if re.search(r'[\u0980-\u09FF]', title):  # 벵갈리
            return 0.10
        if re.search(r'[\u0B80-\u0BFF\u0C00-\u0C7F\u0C80-\u0CFF\u0D00-\u0D7F]', title):  # 타밀/텔루구/칸나다/말라얄람
            return 0.10
        if re.search(r'[\u0600-\u06FF]', title):  # 아랍/우르두
            return 0.10
        if re.search(r'[\u0E00-\u0E7F\u1000-\u109F]', title):  # 태국/미얀마
            return 0.15
        return _LANG_WEIGHT.get(lang, _DEFAULT_WEIGHT)

    if rank_basis == "view_delta":
        # ~24h 전 스냅샷 우선, 없으면 가장 오래된 스냅샷으로 fallback
        from sqlalchemy import func, desc as sa_desc, literal_column
        now_utc = datetime.now(timezone.utc)
        cutoff_24h = now_utc - timedelta(hours=23)
        # DISTINCT ON: 23h+ 이전 스냅샷 중 가장 최근 것 (≈ 24h 전)
        stat_24h_subq = (
            select(VideoStat.video_id, VideoStat.view_count.label("old_views"))
            .where(VideoStat.measured_at <= cutoff_24h)
            .distinct(VideoStat.video_id)
            .order_by(VideoStat.video_id, VideoStat.measured_at.desc())
            .subquery()
        )
        # fallback: 가장 오래된 스냅샷
        stat_oldest_subq = (
            select(VideoStat.video_id, func.min(VideoStat.view_count).label("old_views"))
            .group_by(VideoStat.video_id)
            .subquery()
        )
        stat_subq = (
            select(
                func.coalesce(stat_24h_subq.c.video_id, stat_oldest_subq.c.video_id).label("video_id"),
                func.coalesce(stat_24h_subq.c.old_views, stat_oldest_subq.c.old_views).label("old_views"),
            )
            .select_from(
                stat_oldest_subq.outerjoin(stat_24h_subq, stat_oldest_subq.c.video_id == stat_24h_subq.c.video_id)
            )
            .subquery()
        )
        delta_expr = (Video.view_count - func.coalesce(stat_subq.c.old_views, Video.view_count)).label("delta")
        delta_query = (
            select(Video, delta_expr)
            .options(selectinload(Video.channel))
            .outerjoin(stat_subq, Video.id == stat_subq.c.video_id)
            .where(Video.is_short == True)
            .where(Video.safety_status.notin_(["hidden", "banned"]))
            .order_by(sa_desc("delta"))
            .limit(limit).offset(offset)
        )
        if cutoff:
            delta_query = delta_query.where(Video.published_at >= cutoff)
        if region:
            from sqlalchemy import or_
            lang_map = {
                "KR": ["ko"], "US": ["en"], "IN": ["hi", "en-IN"],
                "JP": ["ja"], "BR": ["pt"], "GB": ["en"],
            }
            langs = lang_map.get(region.upper())
            if langs:
                conditions = [Video.default_language.startswith(lang) for lang in langs]
                if region.upper() == "KR":
                    conditions.append(Video.title.op("~")("[\uac00-\ud7a3]"))
                delta_query = delta_query.where(or_(*conditions))
        if category:
            delta_query = delta_query.where(Video.category == category)
        rows = (await db.execute(delta_query)).all()
        items = []
        for i, row in enumerate(rows):
            v, delta_val = row[0], row[1] or 0
            items.append({
                "id": v.id,
                "title": v.title,
                "channel_title": v.channel.title if v.channel else "",
                "thumbnail_url": v.thumbnail_url,
                "view_count": v.view_count,
                "like_count": v.like_count or 0,
                "score": float(delta_val),
                "position": offset + i + 1,
                "platform_video_id": v.platform_video_id,
                "published_at": v.published_at.isoformat() if v.published_at else None,
                "category": v.category.value if v.category else None,
            })
        return items

    if rank_basis == "view_count" and region:
        # 나라별: 가중치 없이 순수 조회수 정렬
        query = query.order_by(Video.view_count.desc()).limit(limit).offset(offset)
        videos = (await db.execute(query)).scalars().all()
    else:
        # algo 혹은 rising인 경우, top 200개를 가져와서 python에서 정렬 후 슬라이싱
        query = query.order_by(Video.view_count.desc()).limit(200)
        videos = (await db.execute(query)).scalars().all()

        if rank_basis == "rising" and videos:
            scored = []
            for v in videos:
                score = compute_rising_score(v.view_count, v.like_count or 0, v.published_at) * _lang_weight(v)
                scored.append((v, score))
            scored.sort(key=lambda x: x[1], reverse=True)
            videos = [x[0] for x in scored][offset : offset + limit]
        elif rank_basis == "algo" and videos:
            views = [float(v.view_count) for v in videos]
            likes = [float(v.like_count or 0) for v in videos]
            comments = [float(v.comment_count or 0) for v in videos]
            def get_stats(data):
                if len(data) < 2:
                    return (sum(data) / len(data) if data else 0.0), 0.0
                return statistics.mean(data), statistics.stdev(data)
            m_v, s_v = get_stats(views)
            m_l, s_l = get_stats(likes)
            m_c, s_c = get_stats(comments)

            scored = []
            for v in videos:
                vz = calculate_z_score(float(v.view_count), m_v, s_v)
                lz = calculate_z_score(float(v.like_count or 0), m_l, s_l)
                cz = calculate_z_score(float(v.comment_count or 0), m_c, s_c)
                decay = calculate_decay(v.published_at)
                score = compute_final_score(vz, lz, cz, decay) * _lang_weight(v)
                scored.append((v, score))
            scored.sort(key=lambda x: x[1], reverse=True)
            videos = [x[0] for x in scored][offset : offset + limit]
        else:
            # view_count 정렬도 가중치 적용 (GLOBAL 한정)
            if not region:
                scored = [(v, float(v.view_count) * _lang_weight(v)) for v in videos]
                scored.sort(key=lambda x: x[1], reverse=True)
                videos = [x[0] for x in scored][offset : offset + limit]
            else:
                videos = videos[offset : offset + limit]

    items = []
    for i, v in enumerate(videos):
        # score 값은 정렬 기준에 맞춰 지정
        if rank_basis == "view_count":
            score_val = float(v.view_count)
        elif rank_basis == "view_delta":
            score_val = float(v.view_count)  # view_delta는 위에서 별도 처리됨 (미도달 시 fallback)
        elif rank_basis == "rising":
            score_val = compute_rising_score(v.view_count, v.like_count or 0, v.published_at)
        else:
            score_val = float(v.view_count)
            
        items.append({
            "id": v.id,
            "title": v.title,
            "channel_title": v.channel.title,
            "thumbnail_url": v.thumbnail_url,
            "view_count": v.view_count,
            "like_count": v.like_count,
            "score": score_val,
            "position": offset + i + 1,
            "platform_video_id": v.platform_video_id,
            "category": v.category.value if v.category else None,
            "published_at": v.published_at.isoformat() if v.published_at else None,
        })
    return items


@app.get("/api/rankings/global")
async def get_global_rankings(
    limit: int = Query(default=20, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
    period: Optional[str] = Query(default=None, regex="^(realtime|today|weekly|monthly|yearly|all)?$"),
    region: Optional[str] = Query(default=None, max_length=8),
    category: Optional[str] = Query(default=None, max_length=32),
    rank_basis: Optional[str] = Query(default="algo", regex="^(algo|view_count|view_delta|rising)?$"),
    db: AsyncSession = Depends(get_db),
):
    """글로벌 TOP 100. region: KR|US|IN|JP|BR|GB|MX  category: 게임|음악|코미디|엔터|스포츠|교육|동물|라이프"""
    return await _get_ranking_list("global", limit, offset, db, period, region, category, rank_basis)


@app.get("/api/rankings/rising")
async def get_rising_rankings(
    limit: int = Query(default=20, ge=1, le=50),
    offset: int = Query(default=0, ge=0),
    db: AsyncSession = Depends(get_db),
):
    """Rising Star TOP 50 조회 — 7일 이내 영상 중 시간당 조회수 속도 기준."""
    return await _get_ranking_list("rising", limit, offset, db)


@app.get("/api/rankings/category/{slug}")
async def get_category_rankings(
    slug: str,
    limit: int = Query(default=20, ge=1, le=50),
    offset: int = Query(default=0, ge=0),
    period: Optional[str] = Query(default=None, regex="^(realtime|today|weekly|monthly|yearly|all)?$"),
    region: Optional[str] = Query(default=None, max_length=8),
    rank_basis: Optional[str] = Query(default="algo", regex="^(algo|view_count|view_delta|rising)?$"),
    db: AsyncSession = Depends(get_db),
):
    """카테고리별 TOP 50 랭킹 조회.

    slug: gaming | entertainment | music | education | news | sports | comedy | people | other
    """
    from app.models import CategoryEnum
    valid = {c.value for c in CategoryEnum}
    if slug not in valid:
        raise HTTPException(status_code=404, detail=f"유효하지 않은 카테고리: {slug}")
    return await _get_ranking_list(f"category:{slug}", limit, offset, db, period, region, None, rank_basis)


@app.get("/api/charts")
async def get_charts(
    chart_type: str = Query(default="daily", regex="^(real|daily|weekly|monthly|yearly)$"),
    period_key: Optional[str] = Query(default=None),
    region: str = Query(default="GLOBAL"),
    category: Optional[str] = Query(default=None),
    rank_basis: str = Query(default="algo", regex="^(algo|view_count|view_delta|rising)$"),
    limit: int = Query(default=20, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
    db: AsyncSession = Depends(get_db)
):
    """
    실시간/일간/주간/월간/연간 역사 차트 조회 API

    chart_type: real(실시간2h) | daily(일간24h) | weekly | monthly | yearly
    real/daily는 rank_basis 무관하게 view_count 기준으로 저장됨.
    real/daily에서 region=GLOBAL이면 가장 최근 수집된 지역 데이터를 반환.
    """
    from app.models import ChartEntry, Video, CategoryEnum

    # real/daily는 항상 view_count 기준으로 저장됨
    if chart_type in ("real", "daily"):
        rank_basis = "view_count"

    # 차트 타입별 유효 기간 (이보다 오래된 차트 데이터는 무시)
    _CHART_STALENESS: dict[str, timedelta] = {
        "real":    timedelta(hours=6),
        "daily":   timedelta(days=2),
        "weekly":  timedelta(days=8),
        "monthly": timedelta(days=35),
        "yearly":  timedelta(days=400),
    }
    staleness_cutoff = datetime.now(timezone.utc) - _CHART_STALENESS.get(chart_type, timedelta(days=30))

    # 퍼블리싱 기준 필터: 차트 기간보다 훨씬 오래된 영상은 제외
    _PUB_WINDOWS: dict[str, timedelta] = {
        "real":    timedelta(days=7),
        "daily":   timedelta(days=7),
        "weekly":  timedelta(days=30),
        "monthly": timedelta(days=90),
        "yearly":  timedelta(days=400),
    }
    pub_cutoff = datetime.now(timezone.utc) - _PUB_WINDOWS.get(chart_type, timedelta(days=30))

    # 1. period_key가 없으면 최신 유효 period_key 조회 (region별로 찾아야 함)
    if not period_key:
        # region이 지정된 경우 해당 region 기준으로 최신 period_key 검색
        # (region마다 수집 시점이 달라 전체 최신 period_key를 쓰면 특정 region이 빈결과 됨)
        lookup_region = region.upper() if region and region.upper() != "GLOBAL" else None
        pk_stmt = select(ChartEntry.period_key).where(
            ChartEntry.chart_type == chart_type
        ).where(ChartEntry.created_at >= staleness_cutoff)
        if lookup_region:
            pk_stmt = pk_stmt.where(ChartEntry.region == lookup_region)
        pk_stmt = pk_stmt.order_by(ChartEntry.created_at.desc()).limit(1)
        pk_res = await db.execute(pk_stmt)
        period_key = pk_res.scalar_one_or_none()

    if not period_key:
        return []

    # 2. real/daily에서 GLOBAL 요청 시 가장 최근 수집 지역으로 폴백
    effective_region = region.upper()
    if chart_type in ("real", "daily") and effective_region == "GLOBAL":
        latest_region_stmt = (
            select(ChartEntry.region)
            .where(ChartEntry.chart_type == chart_type)
            .where(ChartEntry.period_key == period_key)
            .order_by(ChartEntry.created_at.desc())
            .limit(1)
        )
        latest_region_res = await db.execute(latest_region_stmt)
        fallback_region = latest_region_res.scalar_one_or_none()
        if fallback_region:
            effective_region = fallback_region

    # 3. 카테고리 검증 및 변환
    category = translate_category(category)
    if category:
        valid_cats = {c.value for c in CategoryEnum}
        if category not in valid_cats:
            raise HTTPException(status_code=400, detail=f"Invalid category: {category}")

    from app.services.ranking import apply_region_filter

    # 4. 차트 엔트리 조회 (퍼블리싱 날짜 필터 포함 — 오래된 바이럴 영상 제외)
    stmt = (
        select(ChartEntry)
        .join(Video, ChartEntry.video_id == Video.id)
        .options(selectinload(ChartEntry.video).selectinload(Video.channel))
        .where(ChartEntry.chart_type == chart_type)
        .where(ChartEntry.period_key == period_key)
        .where(ChartEntry.region == effective_region)
        .where(ChartEntry.category == category)
        .where(ChartEntry.rank_basis == rank_basis)
        .where(Video.published_at >= pub_cutoff)
    )
    stmt = apply_region_filter(stmt, effective_region)
    stmt = stmt.order_by(ChartEntry.position.asc()).limit(limit).offset(offset)
    res = await db.execute(stmt)
    entries = res.scalars().all()

    # 4. 포맷팅 응답 반환
    response_data = []
    for i, entry in enumerate(entries):
        v = entry.video
        if not v:
            continue
        response_data.append({
            "id": entry.id,
            "position": offset + i + 1,
            "prev_position": entry.prev_position,
            "peak_position": entry.peak_position,
            "weeks_on_chart": entry.weeks_on_chart,
            "view_delta": entry.view_delta,
            "view_count": entry.view_count,
            "like_count": entry.like_count,
            "zscore": entry.zscore,
            "velocity": entry.velocity,
            "period_key": entry.period_key,
            "period_start": entry.period_start.isoformat(),
            "period_end": entry.period_end.isoformat(),
            "video": {
                "id": v.id,
                "title": v.title,
                "thumbnail_url": v.thumbnail_url,
                "platform_video_id": v.platform_video_id,
                "published_at": v.published_at.isoformat() if v.published_at else None,
                "channel": {
                    "id": v.channel.id,
                    "title": v.channel.title,
                    "thumbnail_url": v.channel.thumbnail_url,
                    "handle": v.channel.handle
                }
            }
        })
    return response_data


# ── 쿠키 동의 (T42) ──────────────────────────────────────────────

class ConsentPayload(BaseModel):
    analytics: bool = False
    advertising: bool = False


@app.post("/api/consent", status_code=204)
async def save_consent(
    payload: ConsentPayload,
    request: Request,
    db: AsyncSession = Depends(get_db),
):
    """쿠키 동의 저장 — consent_log 테이블에 기록."""
    import hashlib
    import hmac

    session_id_str = request.cookies.get("sid") or str(uuid.uuid4())
    try:
        session_id = uuid.UUID(session_id_str)
    except ValueError:
        session_id = uuid.uuid4()

    raw_ip = request.client.host if request.client else "unknown"
    ip_hash = hashlib.sha256(raw_ip.encode()).hexdigest()
    user_agent = request.headers.get("user-agent")

    secret_key = b"shorts100_consent_secret_key_fallback"

    from sqlalchemy import text
    for consent_type, granted in [
        ("analytics", payload.analytics),
        ("advertising", payload.advertising),
    ]:
        msg = f"{session_id}:{consent_type}:{granted}".encode()
        signature = hmac.new(secret_key, msg, hashlib.sha256).hexdigest()

        await db.execute(
            text(
                "INSERT INTO consent_log "
                "(session_id, consent_type, granted, user_agent, ip_hash, signature, signed_at) "
                "VALUES (:sid, :ct, :gr, :ua, :ip, :sig, :now)"
            ),
            {
                "sid": session_id,
                "ct": consent_type,
                "gr": granted,
                "ua": user_agent,
                "ip": ip_hash,
                "sig": signature,
                "now": datetime.now(timezone.utc),
            },
        )
    await db.commit()


# ── 신고 접수 (공개 API) ────────────────────────────────────────────

class ReportPayload(BaseModel):
    reason: str  # spam | inappropriate | copyright | other
    description: Optional[str] = None


@app.post("/api/videos/{video_id}/report", status_code=204)
async def report_video(
    video_id: int,
    payload: ReportPayload,
    request: Request,
    db: AsyncSession = Depends(get_db),
):
    """영상 신고 접수. 쿠키 기반 세션 ID로 중복 신고 방지."""
    from app.models import VideoReport
    from sqlalchemy import func

    valid_reasons = {"spam", "inappropriate", "copyright", "other"}
    if payload.reason not in valid_reasons:
        raise HTTPException(status_code=422, detail="Invalid reason")

    session_id_str = request.cookies.get("sid") or str(uuid.uuid4())
    try:
        sid = uuid.UUID(session_id_str)
    except ValueError:
        sid = uuid.uuid4()

    # 같은 세션이 같은 영상에 이미 신고했는지 확인
    existing = await db.execute(
        select(VideoReport)
        .where(VideoReport.video_id == video_id)
        .where(VideoReport.session_id == str(sid))
    )
    if existing.scalar_one_or_none():
        return  # 중복 신고 무시 (204 그냥 반환)

    db.add(VideoReport(
        video_id=video_id,
        session_id=str(sid),
        reason=payload.reason,
        description=payload.description,
    ))

    # 24시간 내 5건 이상 신고 → 자동 hidden (T45 §8.1)
    count_result = await db.execute(
        select(func.count(VideoReport.id))
        .where(VideoReport.video_id == video_id)
        .where(VideoReport.resolved_at == None)
    )
    report_count = (count_result.scalar() or 0) + 1  # +1 포함 현재 신고

    if report_count >= 5:
        video_result = await db.execute(select(Video).where(Video.id == video_id))
        video = video_result.scalar_one_or_none()
        if video and video.safety_status not in ("safe", "banned"):
            video.safety_status = "hidden"

    await db.commit()


# ── 관리자: 신고 처리 (T46) ──────────────────────────────────────────

@app.get("/admin/reports", response_class=HTMLResponse, dependencies=[Depends(_require_admin)])
async def admin_reports_page(db: AsyncSession = Depends(get_db)):
    """신고된 영상 목록을 보여주는 관리자 HTML 페이지."""
    from app.models import VideoReport
    from sqlalchemy import func

    # 미처리 신고 집계 (resolved_at IS NULL)
    stmt = (
        select(
            VideoReport.video_id,
            func.count(VideoReport.id).label("report_count"),
            func.max(VideoReport.created_at).label("latest_at"),
        )
        .where(VideoReport.resolved_at == None)
        .group_by(VideoReport.video_id)
        .order_by(func.count(VideoReport.id).desc())
        .limit(100)
    )
    rows = (await db.execute(stmt)).all()

    # video_id → 영상 정보 조회
    video_ids = [r.video_id for r in rows]
    videos_map: dict[int, Video] = {}
    if video_ids:
        v_stmt = select(Video).options(selectinload(Video.channel)).where(Video.id.in_(video_ids))
        videos_map = {v.id: v for v in (await db.execute(v_stmt)).scalars().all()}

    # flagged/hidden 영상도 표시
    flagged_stmt = (
        select(Video)
        .options(selectinload(Video.channel))
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

    report_rows = "".join(
        _row(videos_map[r.video_id], r.report_count, r.latest_at)
        for r in rows
        if r.video_id in videos_map
    )
    flagged_rows = "".join(
        _row(v) for v in flagged_videos
        if not any(r.video_id == v.id for r in rows)
    )

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
<p>신고 누적 영상 및 자동 플래그된 영상을 검토하세요.</p>

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


@app.get("/admin/videos/{video_id}/action", dependencies=[Depends(_require_admin)])
async def admin_video_action(
    video_id: int,
    action: str = Query(..., regex="^(safe|flagged|hidden|banned)$"),
    db: AsyncSession = Depends(get_db),
):
    """영상의 safety_status를 수동으로 변경한다."""
    from sqlalchemy import text

    result = await db.execute(select(Video).where(Video.id == video_id))
    video = result.scalar_one_or_none()
    if not video:
        raise HTTPException(status_code=404, detail="Video not found")

    video.safety_status = action
    # 신고도 일괄 처리로 표시
    await db.execute(
        text("UPDATE video_reports SET resolved_at = NOW(), resolved_action = :action WHERE video_id = :vid AND resolved_at IS NULL"),
        {"action": action, "vid": video_id},
    )
    await db.commit()
    return HTMLResponse(f'<meta http-equiv="refresh" content="0;url=/admin/reports"><p>✅ 처리 완료 ({action})</p>')


# ── ShortsDown API 엔드포인트 ──────────────────────────────────────────

security_bearer = HTTPBearer(auto_error=False)

class RegisterRequest(BaseModel):
    username: str = Field(..., min_length=2, max_length=50)
    password: str = Field(..., min_length=4, max_length=50)
    name: Optional[str] = None
    age: Optional[int] = None
    gender: Optional[str] = None
    region: Optional[str] = None

class LoginRequest(BaseModel):
    username: str
    password: str

class GoogleLoginRequest(BaseModel):
    credential: str

class ProfileUpdateRequest(BaseModel):
    name: Optional[str] = None
    age: Optional[int] = None
    gender: Optional[str] = None
    region: Optional[str] = None

class DownloadPrepareRequest(BaseModel):
    url: str

async def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security_bearer),
    db: AsyncSession = Depends(get_db)
) -> Optional[User]:
    if not credentials:
        return None
    token = credentials.credentials
    payload = verify_token(token)
    if not payload or "user_id" not in payload:
        return None
    try:
        user_uuid = uuid.UUID(payload["user_id"])
    except ValueError:
        return None
        
    result = await db.execute(select(User).where(User.id == user_uuid))
    return result.scalar_one_or_none()

def get_client_ip(request: Request) -> str:
    forwarded = request.headers.get("x-forwarded-for")
    if forwarded:
        return forwarded.split(",")[0].strip()
    return request.client.host if request.client else "127.0.0.1"


@app.post("/api/auth/register")
async def register(req: RegisterRequest, db: AsyncSession = Depends(get_db)):
    # Check if username exists
    existing = await db.execute(select(User).where(User.username == req.username))
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Username already exists")
        
    new_user = User(
        username=req.username,
        hashed_password=hash_password(req.password),
        role="member",
        points=20,
        name=req.name,
        age=req.age,
        gender=req.gender,
        region=req.region
    )
    db.add(new_user)
    await db.commit()
    await db.refresh(new_user)
    
    token = generate_token({"user_id": str(new_user.id)})
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "username": new_user.username,
            "role": new_user.role,
            "points": new_user.points,
            "email": new_user.email,
            "name": new_user.name,
            "age": new_user.age,
            "gender": new_user.gender,
            "region": new_user.region,
            "avatar_url": new_user.avatar_url
        }
    }


@app.post("/api/auth/login")
async def login(req: LoginRequest, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.username == req.username))
    user = result.scalar_one_or_none()
    if not user or not user.hashed_password or not verify_password(req.password, user.hashed_password):
        raise HTTPException(status_code=400, detail="Invalid username or password")
        
    token = generate_token({"user_id": str(user.id)})
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "username": user.username,
            "role": user.role,
            "points": user.points,
            "email": user.email,
            "name": user.name,
            "age": user.age,
            "gender": user.gender,
            "region": user.region,
            "avatar_url": user.avatar_url
        }
    }


@app.get("/api/auth/me")
async def me(current_user: Optional[User] = Depends(get_current_user)):
    if not current_user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    return {
        "username": current_user.username,
        "role": current_user.role,
        "points": current_user.points,
        "email": current_user.email,
        "name": current_user.name,
        "age": current_user.age,
        "gender": current_user.gender,
        "region": current_user.region,
        "avatar_url": current_user.avatar_url
    }


@app.get("/api/auth/config")
async def get_auth_config():
    return {
        "google_client_id": settings.GOOGLE_OAUTH_KEY or ""
    }


@app.post("/api/auth/oauth/google")
async def google_oauth_login(req: GoogleLoginRequest, db: AsyncSession = Depends(get_db)):
    from google.oauth2 import id_token
    from google.auth.transport import requests

    client_id = settings.GOOGLE_OAUTH_KEY
    if not client_id:
        raise HTTPException(status_code=500, detail="Google Client ID is not configured on the server.")

    try:
        idinfo = id_token.verify_oauth2_token(req.credential, requests.Request(), client_id)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Invalid Google token: {str(e)}")

    oauth_id = idinfo.get("sub")
    email = idinfo.get("email")
    name = idinfo.get("name")
    avatar_url = idinfo.get("picture")

    if not oauth_id:
        raise HTTPException(status_code=400, detail="OAuth ID (sub) not provided in Google token.")

    # 1. Search for existing user with oauth_id
    result = await db.execute(select(User).where(User.oauth_id == oauth_id))
    user = result.scalar_one_or_none()

    if not user and email:
        # 2. Search by email to link accounts
        result = await db.execute(select(User).where(User.email == email))
        user = result.scalar_one_or_none()
        if user:
            # Link Google account
            user.oauth_provider = "google"
            user.oauth_id = oauth_id
            if not user.avatar_url:
                user.avatar_url = avatar_url
            if not user.name:
                user.name = name
            db.add(user)
            await db.commit()
            await db.refresh(user)

    if not user:
        # 3. Register new user
        base_username = email.split("@")[0] if email else f"google_{oauth_id[:8]}"
        username = base_username
        
        # Check collision
        suffix = 1
        while True:
            existing_user = await db.execute(select(User).where(User.username == username))
            if not existing_user.scalar_one_or_none():
                break
            username = f"{base_username}_{suffix}"
            suffix += 1

        user = User(
            username=username,
            hashed_password=None,
            email=email,
            oauth_provider="google",
            oauth_id=oauth_id,
            avatar_url=avatar_url,
            name=name,
            role="member",
            points=20
        )
        db.add(user)
        await db.commit()
        await db.refresh(user)

    token = generate_token({"user_id": str(user.id)})
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "username": user.username,
            "role": user.role,
            "points": user.points,
            "email": user.email,
            "name": user.name,
            "age": user.age,
            "gender": user.gender,
            "region": user.region,
            "avatar_url": user.avatar_url
        }
    }


@app.put("/api/auth/profile")
async def update_profile(
    req: ProfileUpdateRequest,
    current_user: Optional[User] = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    if not current_user:
        raise HTTPException(status_code=401, detail="Not authenticated")

    if req.name is not None:
        current_user.name = req.name
    if req.age is not None:
        current_user.age = req.age
    if req.gender is not None:
        current_user.gender = req.gender
    if req.region is not None:
        current_user.region = req.region

    db.add(current_user)
    await db.commit()
    await db.refresh(current_user)

    return {
        "status": "success",
        "user": {
            "username": current_user.username,
            "role": current_user.role,
            "points": current_user.points,
            "email": current_user.email,
            "name": current_user.name,
            "age": current_user.age,
            "gender": current_user.gender,
            "region": current_user.region,
            "avatar_url": current_user.avatar_url
        }
    }


@app.get("/api/download/limits")
async def get_download_limits(
    request: Request,
    current_user: Optional[User] = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    if current_user:
        return {
            "role": current_user.role,
            "points": current_user.points,
            "limit_reached": False if current_user.role in ["master", "admin"] else current_user.points <= 0
        }
    
    # Guest logic
    client_ip = get_client_ip(request)
    session_id = request.cookies.get("sid") or "unknown_sid"
    since = datetime.now(timezone.utc) - timedelta(days=1)
    
    from sqlalchemy import func
    stmt = (
        select(func.count(DownloadLog.id))
        .where(DownloadLog.user_id == None)
        .where(
            (DownloadLog.guest_ip == client_ip) | 
            (DownloadLog.guest_session_id == session_id)
        )
        .where(DownloadLog.created_at >= since)
    )
    downloads_count = (await db.execute(stmt)).scalar() or 0
    
    return {
        "role": "guest",
        "downloads_left": max(0, 5 - downloads_count),
        "limit_reached": downloads_count >= 5
    }


@app.post("/api/download/prepare")
async def prepare_download(
    req: DownloadPrepareRequest,
    request: Request,
    current_user: Optional[User] = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    url = req.url.strip()
    if not url:
        raise HTTPException(status_code=400, detail="URL cannot be empty")
        
    # Check limit first
    if current_user:
        if current_user.role not in ["master", "admin"] and current_user.points <= 0:
            raise HTTPException(status_code=403, detail="LIMIT_EXCEEDED")
    else:
        # Check guest daily limit
        client_ip = get_client_ip(request)
        session_id = request.cookies.get("sid") or "unknown_sid"
        since = datetime.now(timezone.utc) - timedelta(days=1)
        from sqlalchemy import func
        stmt = (
            select(func.count(DownloadLog.id))
            .where(DownloadLog.user_id == None)
            .where(
                (DownloadLog.guest_ip == client_ip) | 
                (DownloadLog.guest_session_id == session_id)
            )
            .where(DownloadLog.created_at >= since)
        )
        downloads_count = (await db.execute(stmt)).scalar() or 0
        if downloads_count >= 5:
            raise HTTPException(status_code=403, detail="LIMIT_EXCEEDED")

    # Clean old files to keep directory tidy
    try:
        clean_old_files()
    except Exception:
        pass

    # Extract metadata using yt-dlp
    try:
        meta = await extract_metadata(url)
    except ValueError as e:
        print(f"[DEBUG_PREPARE] ValueError: {e} for url: {url}", flush=True)
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        import traceback
        print(f"[DEBUG_PREPARE] Exception: {e} for url: {url}", flush=True)
        traceback.print_exc()
        raise HTTPException(status_code=400, detail="UNSUPPORTED_URL")

    # Generate a unique token for safe download
    file_id = str(uuid.uuid4())
    
    # Download file asynchronously
    try:
        local_path = await download_video(url, file_id)
    except ValueError as e:
        raise HTTPException(status_code=500, detail=str(e))
    except Exception:
        raise HTTPException(status_code=500, detail="DOWNLOAD_FAILED")

    # Save to download log and decrement member credits
    file_token = str(uuid.uuid4())
    expires_at = datetime.now(timezone.utc) + timedelta(hours=1)
    
    if current_user:
        if current_user.role not in ["master", "admin"]:
            current_user.points = max(0, current_user.points - 1)
        db.add(current_user)
        log = DownloadLog(
            user_id=current_user.id,
            file_token=file_token,
            local_path=local_path,
            original_url=url,
            expires_at=expires_at
        )
    else:
        client_ip = get_client_ip(request)
        session_id = request.cookies.get("sid") or "unknown_sid"
        log = DownloadLog(
            guest_ip=client_ip,
            guest_session_id=session_id,
            file_token=file_token,
            local_path=local_path,
            original_url=url,
            expires_at=expires_at
        )
        
    db.add(log)
    await db.commit()
    
    return {
        "file_token": file_token,
        "title": meta["title"],
        "thumbnail": meta["thumbnail"],
        "duration": meta["duration"],
        "extractor": meta["extractor"],
        "expires_at": expires_at.isoformat()
    }


@app.get("/api/download/serve/{file_token}")
async def serve_download(
    file_token: str,
    dl: Optional[int] = Query(None),
    db: AsyncSession = Depends(get_db)
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
        
    return FileResponse(
        path=log.local_path,
        media_type="video/mp4",
        headers=headers
    )


@app.post("/api/download/upgrade")
async def upgrade_membership(
    current_user: Optional[User] = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    if not current_user:
        raise HTTPException(status_code=401, detail="Not authenticated")
        
    current_user.role = "upgraded"
    current_user.points = current_user.points + 50
    db.add(current_user)
    await db.commit()
    await db.refresh(current_user)
    
    return {
        "status": "success",
        "user": {
            "username": current_user.username,
            "role": current_user.role,
            "points": current_user.points
        }
    }