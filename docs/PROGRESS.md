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
- [ ] T11 마이그레이션 001: ENUM 타입만 (`platform_enum`, `category_enum`)
- [ ] T12 마이그레이션 002: `channels` 테이블 + 인덱스
- [ ] T13 마이그레이션 003: `videos` 테이블 + 인덱스
- [ ] T14 마이그레이션 004: `video_stats` (월 단위 파티셔닝)
- [ ] T15 마이그레이션 005: `rankings` + `hall_of_fame`
- [ ] T16 마이그레이션 006: `user_events`, `consent_log`, `video_reports`

## Phase 3: 첫 API (Day 8~10)
- [ ] T17 `app/main.py` 최소 골격 + `/health`
- [ ] T18 `app/models/` SQLAlchemy 모델 (channels, videos만)
- [ ] T19 `app/schemas/` Pydantic 응답 모델
- [ ] T20 `GET /api/videos?limit=10` 엔드포인트
- [ ] T21 `GET /api/videos/{id}` 엔드포인트

## Phase 4: YouTube 수집기 (Day 11~14)
- [ ] T22 `app/crawlers/youtube_client.py` (단일 영상 fetch)
- [ ] T23 수동 실행 스크립트 (`scripts/seed_youtube.py`)
- [ ] T24 Celery 설정 (`app/celery_app.py`) + Worker 컨테이너
- [ ] T25 정기 수집 태스크 (1시간마다 트렌딩)
- [ ] T26 Celery Beat 스케줄러 컨테이너
- [ ] T27 Freshness tier 로직 + 차등 갱신

## Phase 5: 랭킹 (Day 15~17)
- [ ] T28 `app/services/ranking.py` 알고리즘 (Z-score + decay)
- [ ] T29 랭킹 계산 Celery 태스크 (5분마다)
- [ ] T30 `app/core/cache.py` Redis 래퍼 + Sorted Set 저장
- [ ] T31 `GET /api/rankings/global?limit=100` 엔드포인트

## Phase 6: 프론트엔드 뼈대 (Day 18~21)
- [ ] T32 `frontend/` Next.js 14 프로젝트 init + Tailwind
- [ ] T33 메인 페이지 (정적 mock 데이터 카드 10개)
- [ ] T34 백엔드 API 연동 (서버 컴포넌트 fetch)
- [ ] T35 무한 스크롤 (단순 IntersectionObserver)
- [ ] T36 `frontend/Dockerfile` + docker-compose에 추가

## Phase 7: 점진 기능 추가 (Day 22~30)
- [ ] T37 Rising Star 알고리즘 + `/api/rankings/rising`
- [ ] T38 `/rising` 프론트 페이지
- [ ] T39 카테고리 필터 (`/category/[slug]`)
- [ ] T40 영상 상세 페이지 (`/v/[id]`) + 통계 차트
- [ ] T41 딥링크 빌더 (`lib/deeplink.ts`) + 카드 클릭 연결
- [ ] T42 쿠키 동의 배너 + consent_log 저장
- [ ] T43 DOM 가상화 도입 (`@tanstack/react-virtual`)
- [ ] T44 Shorts 식별 강화 (HEAD 검증 + 7일 캐싱)

## Phase 8: 출시 준비 (Day 31~40)
- [ ] T45 브랜드 안전 키워드 필터 + safety_status 자동 산정
- [ ] T46 운영자 신고 처리 페이지 (basic auth)
- [ ] T47 `sitemap.xml` + `robots.txt` + JSON-LD VideoObject
- [ ] T48 Sentry 통합 (백엔드 + 프론트)
- [ ] T49 단위 테스트: 알고리즘 (pytest)
- [ ] T50 E2E 테스트: 메인 + 카드 클릭 (Playwright)
