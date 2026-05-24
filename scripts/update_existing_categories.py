"""
기존 비디오 데이터 카테고리 일괄 복구 스크립트
"""
import logging
from sqlalchemy import create_engine, select
from sqlalchemy.orm import sessionmaker

from app.config import settings
from app.models import Video, CategoryEnum
from app.crawlers.youtube_client import YouTubeClient

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("update_categories")

YOUTUBE_CATEGORY_MAP = {
    "1": "other",
    "2": "other",
    "10": "music",
    "15": "other",
    "17": "sports",
    "18": "other",
    "19": "other",
    "20": "gaming",
    "21": "other",
    "22": "people",
    "23": "comedy",
    "24": "entertainment",
    "25": "news",
    "26": "other",
    "27": "education",
    "28": "education",
    "29": "other",
    "30": "other",
    "31": "other",
}

def main():
    sync_url = settings.DATABASE_URL.replace("postgresql+asyncpg://", "postgresql://")
    engine = create_engine(sync_url, echo=False)
    Session = sessionmaker(bind=engine)

    client = YouTubeClient()

    with Session() as session:
        # category가 없는 비디오들 조회
        videos = session.execute(
            select(Video).where(Video.category.is_(None))
        ).scalars().all()

        if not videos:
            logger.info("업데이트할 카테고리 없는 비디오가 없습니다.")
            return

        logger.info(f"카테고리 업데이트 필요 대상: {len(videos)}개")

        # 50개씩 끊어서 유튜브 API로 조회
        video_ids = [v.platform_video_id for v in videos]
        id_to_video = {v.platform_video_id: v for v in videos}

        for i in range(0, len(video_ids), 50):
            chunk = video_ids[i:i+50]
            logger.info(f"유튜브 API 조회 중... {i} ~ {i+len(chunk)}")
            
            # youtube client의 _service를 직접 호출하여 categoryId를 얻음
            try:
                response = client._service.videos().list(
                    part="snippet",
                    id=",".join(chunk)
                ).execute()
            except Exception as e:
                logger.error(f"유튜브 API 호출 실패: {e}")
                continue

            for item in response.get("items", []):
                vid = item["id"]
                category_id = item["snippet"].get("categoryId")
                
                video = id_to_video.get(vid)
                if video and category_id:
                    cat_val = YOUTUBE_CATEGORY_MAP.get(category_id)
                    if cat_val:
                        video.category = CategoryEnum(cat_val)
                        logger.info(f"비디오 '{video.title[:15]}...' -> 카테고리: {cat_val}")

        session.commit()
        logger.info("모든 비디오 카테고리 업데이트 완료!")

if __name__ == "__main__":
    main()
