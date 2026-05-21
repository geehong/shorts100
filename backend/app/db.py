from typing import AsyncGenerator
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from sqlalchemy.orm import DeclarativeBase
from .config import settings

# 비동기 DB 엔진 생성 (SQL 실행 로그 출력을 위해 echo=True 설정)
engine = create_async_engine(settings.DATABASE_URL, echo=True)

# 비동기 세션 팩토리 생성
AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
)

# SQLAlchemy 모델의 Base 클래스
class Base(DeclarativeBase):
    pass

# FastAPI에서 DB 세션을 사용할 때 사용할 의존성 함수
async def get_db() -> AsyncGenerator[AsyncSession, None]:
    async with AsyncSessionLocal() as session:
        yield session