"""Shorts100 FastAPI 진입점 — 미들웨어 설정 및 라우터 등록만 담당."""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .config import settings
from .routers import rankings, videos, auth, download, admin, misc

# ── Sentry 초기화 ─────────────────────────────────────────────────────
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
        pass

# ── 앱 초기화 ─────────────────────────────────────────────────────────
app = FastAPI(
    title="Shorts100 API",
    description="유튜브 쇼츠 랭킹 서비스 API",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://shorts100.firemarkets.net",
        "http://localhost:3000",
        "https://shorts100.com",
        "https://www.shorts100.com",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── 라우터 등록 ───────────────────────────────────────────────────────
app.include_router(rankings.router)
app.include_router(videos.router)
app.include_router(auth.router)
app.include_router(download.router)
app.include_router(admin.router)
app.include_router(misc.router)


@app.get("/health", tags=["Health"])
async def health_check():
    return {"status": "ok", "message": "Shorts100 API is running"}
