"""Rankings & Charts 라우터"""
import statistics
from datetime import datetime, timezone, timedelta
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import asc
from sqlalchemy.orm import selectinload

from app.db import get_db
from app.models import Video, Ranking, VideoStat
from app.core.cache import cache

router = APIRouter(tags=["Rankings"])

# ── 상수 ──────────────────────────────────────────────────────────────

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

_PERIOD_TO_CHART_TYPE = {
    "realtime": "real",
    "today":    "daily",
    "weekly":   "weekly",
    "monthly":  "monthly",
    "yearly":   "yearly",
}

# ── 헬퍼 ──────────────────────────────────────────────────────────────

def translate_category(cat: Optional[str]) -> Optional[str]:
    if not cat:
        return None
    return CATEGORY_KOR_TO_ENG.get(cat, cat).lower()


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
        "prev_position": r.prev_position,
        "platform_video_id": v.platform_video_id,
        "category": v.category.value if v.category else None,
        "published_at": v.published_at.isoformat() if v.published_at else None,
    }


async def _get_chart_entries(
    db: AsyncSession,
    chart_type: str,
    region: str,
    category: Optional[str],
    rank_basis: str,
    limit: int,
    offset: int,
) -> list:
    """chart_entries 테이블에서 prev_position 포함 랭킹 반환.

    created_at 내림차순으로 가장 최신 스냅샷을 사용한다.
    """
    from app.models import ChartEntry
    from app.services.ranking import apply_region_filter

    _STALENESS = {
        "real":    timedelta(hours=8),
        "daily":   timedelta(days=2),
        "weekly":  timedelta(days=14),
        "monthly": timedelta(days=60),
        "yearly":  timedelta(days=400),
    }
    staleness_cutoff = datetime.now(timezone.utc) - _STALENESS.get(chart_type, timedelta(days=30))
    effective_region = region.upper() if region else "GLOBAL"

    async def _find_period_key(rgn: str) -> Optional[str]:
        r = await db.execute(
            select(ChartEntry.period_key)
            .where(ChartEntry.chart_type == chart_type)
            .where(ChartEntry.rank_basis == rank_basis)
            .where(ChartEntry.region == rgn)
            .where(ChartEntry.created_at >= staleness_cutoff)
            .order_by(ChartEntry.created_at.desc())
            .limit(1)
        )
        return r.scalar_one_or_none()

    period_key = await _find_period_key(effective_region)
    if not period_key and effective_region != "GLOBAL":
        period_key = await _find_period_key("GLOBAL")
        if period_key:
            effective_region = "GLOBAL"

    if not period_key:
        return []

    from app.models import ChartEntry
    stmt = (
        select(ChartEntry)
        .join(Video, ChartEntry.video_id == Video.id)
        .options(selectinload(ChartEntry.video).selectinload(Video.channel))
        .where(ChartEntry.chart_type == chart_type)
        .where(ChartEntry.period_key == period_key)
        .where(ChartEntry.region == effective_region)
        .where(ChartEntry.category == category)
        .where(ChartEntry.rank_basis == rank_basis)
    )
    stmt = apply_region_filter(stmt, effective_region)
    stmt = stmt.order_by(ChartEntry.position.asc()).limit(limit).offset(offset)
    entries = (await db.execute(stmt)).scalars().all()

    result = []
    for i, entry in enumerate(entries):
        v = entry.video
        if not v:
            continue
        if rank_basis == "algo":
            score_val = entry.zscore or 0.0
        elif rank_basis == "rising":
            score_val = entry.velocity or 0.0
        elif rank_basis == "view_delta":
            score_val = float(entry.view_delta or 0)
        else:  # view_count
            score_val = float(entry.view_count or 0)
        result.append({
            "id": v.id,
            "title": v.title,
            "channel_title": v.channel.title if v.channel else "",
            "thumbnail_url": v.thumbnail_url,
            "view_count": entry.view_count,
            "like_count": entry.like_count,
            "view_delta": entry.view_delta,
            "score": score_val,
            "position": offset + i + 1,
            "prev_position": entry.prev_position,
            "platform_video_id": v.platform_video_id,
            "category": category,
            "published_at": v.published_at.isoformat() if v.published_at else None,
        })
    return result


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
    """region/category/period 복합 필터링. 전체(all/None + algo) 는 캐시 사용."""
    category = translate_category(category)

    resolved_rank_type = rank_type
    if rank_type == "global" and category:
        resolved_rank_type = f"category:{category}"

    use_cache = (not period or period == "all") and not region and (not rank_basis or rank_basis == "algo")
    if use_cache:
        cached = await cache.get_ranking(resolved_rank_type)
        if cached:
            return cached[offset: offset + limit]

    # period가 지정된 경우 chart_entries 우선 → 없으면 Video 테이블 직접 계산으로 폴백
    if period and period in _PERIOD_TO_CHART_TYPE:
        chart_result = await _get_chart_entries(
            db=db,
            chart_type=_PERIOD_TO_CHART_TYPE[period],
            region=region or "GLOBAL",
            category=category,
            rank_basis=rank_basis or "algo",
            limit=limit,
            offset=offset,
        )
        if chart_result:
            return chart_result

    cutoff = None
    if period == "realtime":
        cutoff = datetime.now(timezone.utc) - timedelta(hours=24)
    elif period and period in PERIOD_DAYS:
        cutoff = datetime.now(timezone.utc) - timedelta(days=PERIOD_DAYS[period])

    if (not period or period == "all") and (not rank_basis or rank_basis == "algo"):
        query = (
            select(Ranking)
            .join(Ranking.video)
            .options(selectinload(Ranking.video).selectinload(Video.channel))
            .where(Ranking.rank_type == resolved_rank_type)
        )
        if region:
            from sqlalchemy import or_
            lang_map = {"KR": ["ko"], "US": ["en"], "IN": ["hi", "en-IN"], "JP": ["ja"], "BR": ["pt"], "GB": ["en"]}
            langs = lang_map.get(region.upper())
            if langs:
                conditions = [Video.default_language.startswith(lang) for lang in langs]
                if region.upper() == "KR":
                    conditions.append(Video.title.op("~")("[가-힣]"))
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

    # Video 테이블 직접 조회 (폴백)
    from app.services.ranking import calculate_z_score, calculate_decay, compute_final_score, compute_rising_score

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
        lang_map = {"KR": ["ko"], "US": ["en"], "IN": ["hi", "en-IN"], "JP": ["ja"], "BR": ["pt"], "GB": ["en"]}
        langs = lang_map.get(region.upper())
        if langs:
            conditions = [Video.default_language.startswith(lang) for lang in langs]
            if region.upper() == "KR":
                conditions.append(Video.title.op("~")("[가-힣]"))
            query = query.where(or_(*conditions))
    if category:
        query = query.where(Video.category == category)

    _LANG_WEIGHT: dict[str, float] = {
        "en": 1.00, "ko": 0.85, "ja": 0.70, "fr": 0.55, "es": 0.45,
        "pt": 0.35, "hi": 0.12, "id": 0.12, "ur": 0.10, "bn": 0.10,
        "ta": 0.10, "te": 0.10, "mr": 0.10,
    }
    _DEFAULT_WEIGHT = 0.20

    def _lang_weight(v) -> float:
        import re
        if region:
            return 1.0
        from app.services.ranking import global_lang_weight
        return global_lang_weight(v)

    if rank_basis == "view_delta":
        from sqlalchemy import func, desc as sa_desc
        now_utc = datetime.now(timezone.utc)
        cutoff_24h = now_utc - timedelta(hours=23)
        stat_24h_subq = (
            select(VideoStat.video_id, VideoStat.view_count.label("old_views"))
            .where(VideoStat.measured_at <= cutoff_24h)
            .distinct(VideoStat.video_id)
            .order_by(VideoStat.video_id, VideoStat.measured_at.desc())
            .subquery()
        )
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
            .select_from(stat_oldest_subq.outerjoin(stat_24h_subq, stat_oldest_subq.c.video_id == stat_24h_subq.c.video_id))
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
            lang_map = {"KR": ["ko"], "US": ["en"], "IN": ["hi", "en-IN"], "JP": ["ja"], "BR": ["pt"], "GB": ["en"]}
            langs = lang_map.get(region.upper())
            if langs:
                conditions = [Video.default_language.startswith(lang) for lang in langs]
                if region.upper() == "KR":
                    conditions.append(Video.title.op("~")("[가-힣]"))
                delta_query = delta_query.where(or_(*conditions))
        if category:
            delta_query = delta_query.where(Video.category == category)
        rows = (await db.execute(delta_query)).all()
        return [
            {
                "id": v.id, "title": v.title,
                "channel_title": v.channel.title if v.channel else "",
                "thumbnail_url": v.thumbnail_url,
                "view_count": v.view_count, "like_count": v.like_count or 0,
                "score": float(delta_val or 0),
                "position": offset + i + 1,
                "prev_position": None,
                "view_delta": float(delta_val or 0),
                "platform_video_id": v.platform_video_id,
                "published_at": v.published_at.isoformat() if v.published_at else None,
                "category": v.category.value if v.category else None,
            }
            for i, (v, delta_val) in enumerate(rows)
        ]

    if rank_basis == "view_count" and region:
        query = query.order_by(Video.view_count.desc()).limit(limit).offset(offset)
        videos = (await db.execute(query)).scalars().all()
    else:
        query = query.order_by(Video.view_count.desc()).limit(200)
        videos = (await db.execute(query)).scalars().all()

        if rank_basis == "rising" and videos:
            hl = 12.0
            if period == "weekly":
                hl = 84.0
            elif period == "monthly":
                hl = 360.0
            elif period == "yearly":
                hl = 4380.0
            scored = [(v, compute_rising_score(v.view_count, v.like_count or 0, v.published_at, freshness_half_life_hours=hl) * _lang_weight(v)) for v in videos]
            scored.sort(key=lambda x: x[1], reverse=True)
            return [
                {
                    "id": v.id, "title": v.title,
                    "channel_title": v.channel.title,
                    "thumbnail_url": v.thumbnail_url,
                    "view_count": v.view_count, "like_count": v.like_count or 0,
                    "score": score,
                    "position": offset + i + 1,
                    "prev_position": None,
                    "view_delta": None,
                    "platform_video_id": v.platform_video_id,
                    "category": v.category.value if v.category else None,
                    "published_at": v.published_at.isoformat() if v.published_at else None,
                }
                for i, (v, score) in enumerate(scored[offset: offset + limit])
            ]
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
                scored.append((v, compute_final_score(vz, lz, cz, decay) * _lang_weight(v)))
            scored.sort(key=lambda x: x[1], reverse=True)
            return [
                {
                    "id": v.id, "title": v.title,
                    "channel_title": v.channel.title,
                    "thumbnail_url": v.thumbnail_url,
                    "view_count": v.view_count, "like_count": v.like_count or 0,
                    "score": score,
                    "position": offset + i + 1,
                    "prev_position": None,
                    "view_delta": None,
                    "platform_video_id": v.platform_video_id,
                    "category": v.category.value if v.category else None,
                    "published_at": v.published_at.isoformat() if v.published_at else None,
                }
                for i, (v, score) in enumerate(scored[offset: offset + limit])
            ]
        else:
            if not region:
                scored = [(v, float(v.view_count) * _lang_weight(v)) for v in videos]
                scored.sort(key=lambda x: x[1], reverse=True)
                videos = [x[0] for x in scored][offset: offset + limit]
            else:
                videos = videos[offset: offset + limit]

    return [
        {
            "id": v.id, "title": v.title,
            "channel_title": v.channel.title,
            "thumbnail_url": v.thumbnail_url,
            "view_count": v.view_count, "like_count": v.like_count or 0,
            "score": float(v.view_count),
            "position": offset + i + 1,
            "prev_position": None,
            "view_delta": None,
            "platform_video_id": v.platform_video_id,
            "category": v.category.value if v.category else None,
            "published_at": v.published_at.isoformat() if v.published_at else None,
        }
        for i, v in enumerate(videos)
    ]


# ── 엔드포인트 ────────────────────────────────────────────────────────

@router.get("/api/rankings/global")
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


@router.get("/api/rankings/rising")
async def get_rising_rankings(
    limit: int = Query(default=20, ge=1, le=50),
    offset: int = Query(default=0, ge=0),
    db: AsyncSession = Depends(get_db),
):
    """Rising Star TOP 50 — 48시간 이내 영상 중 속도×신선도 기준."""
    return await _get_ranking_list("rising", limit, offset, db)


@router.get("/api/rankings/category/{slug}")
async def get_category_rankings(
    slug: str,
    limit: int = Query(default=20, ge=1, le=50),
    offset: int = Query(default=0, ge=0),
    period: Optional[str] = Query(default=None, regex="^(realtime|today|weekly|monthly|yearly|all)?$"),
    region: Optional[str] = Query(default=None, max_length=8),
    rank_basis: Optional[str] = Query(default="algo", regex="^(algo|view_count|view_delta|rising)?$"),
    db: AsyncSession = Depends(get_db),
):
    """카테고리별 TOP 50. slug: gaming|entertainment|music|education|news|sports|comedy|people|other"""
    from app.models import CategoryEnum
    valid = {c.value for c in CategoryEnum}
    if slug not in valid:
        raise HTTPException(status_code=404, detail=f"유효하지 않은 카테고리: {slug}")
    return await _get_ranking_list(f"category:{slug}", limit, offset, db, period, region, None, rank_basis)


@router.get("/api/charts")
async def get_charts(
    chart_type: str = Query(default="daily", regex="^(real|daily|weekly|monthly|yearly)$"),
    period_key: Optional[str] = Query(default=None),
    region: str = Query(default="GLOBAL"),
    category: Optional[str] = Query(default=None),
    rank_basis: str = Query(default="algo", regex="^(algo|view_count|view_delta|rising)$"),
    limit: int = Query(default=20, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
    db: AsyncSession = Depends(get_db),
):
    """실시간/일간/주간/월간/연간 역사 차트 조회 API"""
    from app.models import ChartEntry, CategoryEnum
    from app.services.ranking import apply_region_filter

    if chart_type in ("real", "daily"):
        rank_basis = "view_count"

    _CHART_STALENESS: dict[str, timedelta] = {
        "real":    timedelta(hours=8),
        "daily":   timedelta(days=2),
        "weekly":  timedelta(days=8),
        "monthly": timedelta(days=35),
        "yearly":  timedelta(days=400),
    }
    staleness_cutoff = datetime.now(timezone.utc) - _CHART_STALENESS.get(chart_type, timedelta(days=30))

    _PUB_WINDOWS: dict[str, timedelta] = {
        "real":    timedelta(days=7),
        "daily":   timedelta(days=7),
        "weekly":  timedelta(days=30),
        "monthly": timedelta(days=90),
        "yearly":  timedelta(days=400),
    }
    pub_cutoff = datetime.now(timezone.utc) - _PUB_WINDOWS.get(chart_type, timedelta(days=30))

    if not period_key:
        lookup_region = region.upper() if region and region.upper() != "GLOBAL" else None
        pk_stmt = select(ChartEntry.period_key).where(
            ChartEntry.chart_type == chart_type
        ).where(ChartEntry.created_at >= staleness_cutoff)
        if lookup_region:
            pk_stmt = pk_stmt.where(ChartEntry.region == lookup_region)
        pk_stmt = pk_stmt.order_by(ChartEntry.created_at.desc()).limit(1)
        period_key = (await db.execute(pk_stmt)).scalar_one_or_none()

    if not period_key:
        return []

    effective_region = region.upper()
    if chart_type in ("real", "daily") and effective_region == "GLOBAL":
        latest_region_stmt = (
            select(ChartEntry.region)
            .where(ChartEntry.chart_type == chart_type)
            .where(ChartEntry.period_key == period_key)
            .order_by(ChartEntry.created_at.desc())
            .limit(1)
        )
        fallback_region = (await db.execute(latest_region_stmt)).scalar_one_or_none()
        if fallback_region:
            effective_region = fallback_region

    category = translate_category(category)
    if category:
        valid_cats = {c.value for c in CategoryEnum}
        if category not in valid_cats:
            raise HTTPException(status_code=400, detail=f"Invalid category: {category}")

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
    entries = (await db.execute(stmt)).scalars().all()

    return [
        {
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
                    "handle": v.channel.handle,
                },
            },
        }
        for i, entry in enumerate(entries)
        if (v := entry.video)
    ]
