# 📊 Shorts100.com 개발 진행 상황 (PROGRESS.md)

## Phase 0: 시작 (Day 1)
- [x] T01 (2026-05-21) 빈 프로젝트 + README + LICENSE
- [x] T02 (2026-05-21) `.gitignore` 생성 (Python + Node)
- [x] T03 (2026-05-21) `.env.example` 생성 (DB/Redis URL만)

## Phase 1: 인프라 (Day 2~3)
- [x] T04 (2026-05-21) `docker-compose.yml`: 전용 `shorts100_redis` 서비스 추가
- [x] T05 (2026-05-21) 기존 `fire_markets_db_postgres` 내 `shorts100` DB 생성 및 권한 설정
- [x] T06 (2026-05-21) `backend/pyproject.toml` (FastAPI + SQLAlchemy 최소 의존성)
- [x] T07 (2026-05-21) `backend/Dockerfile` (multi-stage)
- [x] T08 (2026-05-21) `docker-compose.yml`에 backend 서비스 추가, 포트 충돌(8002) & 네트워크 연동 해결
- [x] T09 (2026-05-21) `backend/app/db.py` (SQLAlchemy async 엔진 연결 검증 완료)
- [x] T10 (2026-05-21) Alembic 초기화 및 빈 마이그레이션 (`empty`) 검증 완료

## Phase 2: DB 스키마 (Day 4~7)
- [x] T11 (2026-05-21) 마이그레이션 001: ENUM 타입 생성 및 검증 완료
- [x] T12 (2026-05-21) 마이그레이션 002: `channels` 테이블 + 인덱스 생성 완료
- [x] T13 (2026-05-21) 마이그레이션 003: `videos` 테이블 + 인덱스 생성 완료
- [x] T14 (2026-05-21) 마이그레이션 004: `video_stats` (월 단위 파티셔닝) 생성 완료
- [x] T15 (2026-05-21) 마이그레이션 005: `rankings` + `hall_of_fame` 생성 완료
- [x] T16 (2026-05-21) 마이그레이션 006: `user_events`, `consent_log`, `video_reports` 생성 완료

## Phase 3: 첫 API (Day 8~10)
- [x] T17 (2026-05-21) `app/main.py` 최소 골격 + `/health` 구현 완료
- [x] T18 (2026-05-21) `app/models/` SQLAlchemy 모델 정의 완료
- [x] T19 (2026-05-21) `app/schemas/` Pydantic 응답 모델 완료
- [x] T20 (2026-05-21) `GET /api/videos?limit=10` 엔드포인트 구현 완료
- [x] T21 (2026-05-21) `GET /api/videos/{id}` 엔드포인트 구현 완료

## Phase 4: YouTube 수집기 (Day 11~14)
- [x] T22 (2026-05-21) `app/crawlers/youtube_client.py` (YouTube Data API v3 클라이언트) 완료
- [x] T23 (2026-05-21) 수동 실행 스크립트 (`scripts/seed_youtube.py`) 완료
- [x] T24 (2026-05-21) Celery 설정 (`app/celery_app.py`) + Worker 컨테이너 완료
- [x] T25 (2026-05-21) 정기 수집 태스크 (1시간마다 트렌딩 + 5분마다 통계 갱신) 완료
- [x] T26 (2026-05-21) Celery Beat 스케줄러 컨테이너 완료
- [x] T27 (2026-05-21) Freshness tier 로직 + 차등 갱신 완료

## Phase 5: 랭킹 (Day 15~17)
- [x] T28 (2026-05-21) `app/services/ranking.py` 알고리즘 (Z-score + decay) 완료
- [x] T29 (2026-05-21) 랭킹 계산 Celery 태스크 (5분마다) 완료
- [x] T30 (2026-05-21) `app/core/cache.py` Redis 래퍼 완료
- [x] T31 (2026-05-21) `GET /api/rankings/global` 엔드포인트 구현 완료

## Phase 6: 프론트엔드 뼈대 (Day 18~21)
- [x] T32 (2026-05-21) `frontend/` Next.js 14 프로젝트 초기화 완료
- [x] T33 (2026-05-21) 메인 페이지 UI 구현 (정적 Mock 데이터 카드 10개) 완료
- [x] T34 (2026-05-21) 백엔드 API 연동 (서버 컴포넌트 fetch) 완료
- [x] T35 (2026-05-21) 무한 스크롤 (IntersectionObserver) 구현 완료
- [x] T36 (2026-05-21) `frontend/Dockerfile` + docker-compose 연동 완료

## Phase 7: 점진 기능 추가 (Day 22~30)
- [x] T37 (2026-05-21) Rising Star 알고리즘 + `/api/rankings/rising` 구현 완료
- [x] T38 (2026-05-21) `/rising` 프론트 페이지 구현 및 도메인 연동 완료
- [x] T39 (2026-05-21) 카테고리 필터 백엔드 API (`/category/[slug]`) 구현 완료
- [x] T40 (2026-05-21) 영상 상세 페이지 (`/v/[id]`) + 조회수 추이 차트 구현 완료
- [x] T41 (2026-05-21) 딥링크 빌더 (`lib/deeplink.ts`) + 카드 클릭 연결 완료
- [x] T42 (2026-05-21) 쿠키 동의 백엔드 API + consent_log 저장 구현 완료
- [x] T43 (2026-05-21) DOM 가상화 도입 (`@tanstack/react-virtual` 적용 완료)
- [x] T44 (2026-05-21) Shorts 식별 강화 (HEAD 검증 + 7일 캐싱 완료)

## Phase 8: 출시 준비 (Day 31~40)
- [x] T45 (2026-05-22) 브랜드 안전 키워드 필터 + safety_status 자동 산정 완료
- [x] T46 (2026-05-22) 운영자 신고 처리 페이지 (`/admin/reports`, basic auth) + 신고 접수 API 완료
- [x] T47 (2026-05-22) `sitemap.ts` + `robots.ts` + JSON-LD VideoObject + OG 메타데이터 완료
- [x] T48 (2026-05-22) Sentry 통합 (백엔드 `sentry-sdk[fastapi]` + 프론트 `@sentry/nextjs`) 완료
- [x] T49 (2026-05-22) 단위 테스트 26개 작성 및 통과 (ranking + brand_safety)
- [x] T50 (2026-05-22) E2E 테스트 Playwright 설정 + 시나리오 5개 작성 완료
