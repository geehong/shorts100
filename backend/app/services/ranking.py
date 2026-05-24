import math
from datetime import datetime, timezone
from typing import List


def calculate_z_score(value: float, mean: float, std: float) -> float:
    if std == 0:
        return 0.0
    return (value - mean) / std


def calculate_decay(published_at: datetime, half_life_hours: float = 168.0) -> float:
    """시간 감쇠 알고리즘 (지수 감쇠).

    Score = Initial * (0.5)^(age / half_life)
    """
    now = datetime.now(timezone.utc)
    if published_at.tzinfo is None:
        published_at = published_at.replace(tzinfo=timezone.utc)
    age_hours = (now - published_at).total_seconds() / 3600.0
    if age_hours < 0:
        age_hours = 0
    return math.pow(0.5, age_hours / half_life_hours)


def compute_final_score(
    view_z: float,
    like_z: float,
    comment_z: float,
    decay_factor: float,
) -> float:
    """Z-score 합산 후 시간 감쇠 적용.

    가중치: 조회수(1.0), 좋아요(1.2), 댓글(1.5)
    """
    raw_score = (view_z * 1.0) + (like_z * 1.2) + (comment_z * 1.5)
    return raw_score * decay_factor


def compute_rising_score(
    view_count: int,
    like_count: int,
    published_at: datetime,
) -> float:
    """Rising Star 점수 = 시간당 조회수(속도) × 좋아요 가중치.

    신규 영상일수록 속도가 높으면 유리하다.
    7일 이상 된 영상은 Rising 대상에서 제외(호출 전 필터링).
    """
    now = datetime.now(timezone.utc)
    if published_at.tzinfo is None:
        published_at = published_at.replace(tzinfo=timezone.utc)

    age_hours = max((now - published_at).total_seconds() / 3600.0, 1.0)
    velocity = view_count / age_hours  # 시간당 조회수

    # 좋아요 비율 보정 (engagagement 높을수록 ×최대 1.5 배)
    engagement_boost = 1.0
    if view_count > 0:
        ratio = like_count / view_count
        engagement_boost = 1.0 + min(ratio * 10, 0.5)  # 최대 1.5배

    return velocity * engagement_boost


def apply_region_filter(query, region_code: str):
    """지정된 지역(region_code)에 맞는 동영상 필터를 적용한다.
    
    KR, US, JP, IN, BR, GB, TW, DE, FR, MX 등을 지원한다.
    """
    from sqlalchemy import or_
    from app.models.video import Video
    
    region = region_code.upper()
    if region == "GLOBAL":
        return query
        
    lang_map = {
        "KR": ["ko"],
        "US": ["en"],
        "IN": ["hi", "en-IN"],
        "JP": ["ja"],
        "BR": ["pt"],
        "GB": ["en"],
        "TW": ["zh"],
        "DE": ["de"],
        "FR": ["fr"],
        "MX": ["es"],
    }
    
    langs = lang_map.get(region)
    if langs:
        conditions = [Video.default_language.startswith(lang) for lang in langs]
        if region == "KR":
            # 한국의 경우 제목에 한글이 포함된 경우도 인정
            conditions.append(Video.title.op("~")("[\uac00-\ud7a3]"))
        elif region == "JP":
            # 일본의 경우 제목에 일어(히라가나/가타카나)가 포함된 경우도 인정
            conditions.append(Video.title.op("~")("[\u3040-\u30ff]"))
        return query.where(or_(*conditions))
        
    return query