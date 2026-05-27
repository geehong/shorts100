# Shorts100.com

실시간 YouTube Shorts 트렌드 TOP 100 랭킹 서비스 및 쇼츠 다운로드 플랫폼입니다.

---

## 주요 기능

### 랭킹 서비스
- 실시간 / 일간 / 주간 / 월간 / 연간 YouTube Shorts TOP 100 랭킹
- 지역 필터 (한국, 미국, 영국, 남미, 아프리카 등)
- 카테고리 필터 (게임, 음악, 코미디, 엔터, 스포츠 등)
- 알고리즘 / 조회수 / 조회수 증가량 / 신규 기준 정렬
- 리스트 / 박스 레이아웃 전환
- 순위 변동 표시 (NEW, ▲, ▼), 최고 순위, 차트 유지 기간
- 영상 상세 페이지: 썸네일·통계·채널 정보, 상하 스와이프 영상 탐색
- 카드 공유 버튼 (Web Share API / URL 복사)

### 쇼츠 다운로드 (ShortsDown)
- YouTube / TikTok / Instagram 쇼츠 영상 분석 및 다운로드
- 게스트 5회 / 회원 포인트제 / Master 무제한
- 다운로드 이력 조회 (최근 50건)

### 회원 시스템
- 일반 가입 (username + password)
- Google OAuth 소셜 로그인
- 포인트 충전 (+50)
- 프로필 (이름, 나이, 성별, 지역)

### 앱 & PWA
- Android APK 다운로드 (`/shorts100.apk`)
- PWA Service Worker — 정적 자산 캐싱, 오프라인 대응
- 스마트 딥링크: YouTube 앱으로 바로 이동

### 법적 페이지
- 개인정보처리방침 (`/[locale]/privacy`)
- 이용약관 (`/[locale]/terms`)

---

## 기술 스택

| 구분 | 기술 |
|------|------|
| Frontend | Next.js 14 (App Router), TypeScript, Tailwind CSS, next-intl |
| Backend | FastAPI (Python 3.12), SQLAlchemy, Alembic, Pydantic |
| Database | PostgreSQL (asyncpg) |
| Cache / Queue | Redis 7, Celery |
| 인증 | 커스텀 HMAC 토큰 (PBKDF2-SHA256), Google OAuth 2.0 |
| 영상 처리 | yt-dlp |
| 컨테이너 | Docker Compose |
| 모니터링 | Sentry (DSN 설정 시 활성화) |

---

## 아키텍처

```
┌─────────────────────────────────────┐
│  Frontend (Next.js · port 3000)     │
│  /[locale]          랭킹 목록        │
│  /[locale]/v/[id]   영상 상세        │
│  /[locale]/download 다운로드         │
│  /[locale]/download/history 이력     │
│  /[locale]/privacy  개인정보방침      │
│  /[locale]/terms    이용약관          │
└────────────────┬────────────────────┘
                 │ REST API
┌────────────────▼────────────────────┐
│  Backend (FastAPI · port 8002)      │
│  /api/rankings      랭킹 조회        │
│  /api/auth/*        인증             │
│  /api/download/*    다운로드         │
│  /api/videos/*      영상 정보        │
└────────┬──────────────┬─────────────┘
         │              │
┌────────▼───┐   ┌──────▼──────┐
│ PostgreSQL │   │  Redis 7    │
│  (DB)      │   │ (캐시/큐)   │
└────────────┘   └──────┬──────┘
                        │
              ┌─────────▼─────────┐
              │  Celery Workers   │
              │  (YouTube 수집)   │
              └───────────────────┘
```

---

## 환경 변수 (`.env`)

```env
# DB
DATABASE_URL=postgresql+asyncpg://user:pass@host:5432/shorts100

# Redis
REDIS_URL=redis://shorts100_redis:6379/0

# YouTube Data API v3
YOUTUBE_API_KEY1=...
YOUTUBE_API_KEY2=...

# 관리자
ADMIN_USER=admin
ADMIN_PASSWORD=...

# 인증 시크릿 (필수 — 랜덤 64자 hex 권장)
AUTH_SECRET_KEY=...

# Google OAuth
GOOGLE_OAUTH_KEY=...   # Google Cloud Console Client ID

# Sentry (선택)
SENTRY_DSN=
NEXT_PUBLIC_SENTRY_DSN=
```

---

## 실행 방법

```bash
# 1. 환경 변수 설정
cp .env.example .env
# .env 파일에 값 입력

# 2. 전체 빌드 및 시작
docker compose up -d --build

# 3. DB 마이그레이션
docker compose exec backend alembic upgrade head
```

### 개발 모드 (프론트엔드)
```bash
cd frontend
npm install
npm run dev   # http://localhost:3000
```

---

## API 주요 엔드포인트

| Method | Path | 설명 |
|--------|------|------|
| GET | `/api/rankings` | 랭킹 목록 조회 |
| GET | `/api/videos/{id}` | 영상 상세 |
| POST | `/api/auth/register` | 회원가입 |
| POST | `/api/auth/login` | 로그인 |
| POST | `/api/auth/oauth/google` | 구글 로그인 |
| GET | `/api/auth/me` | 내 정보 |
| GET | `/api/auth/downloads` | 다운로드 이력 |
| POST | `/api/download/prepare` | 영상 분석 |
| GET | `/api/download/file/{token}` | 영상 다운로드 |
| GET | `/api/download/limits` | 잔여 횟수 조회 |

---

## 다국어 지원

`/ko/*` — 한국어, `/en/*` — 영어 (next-intl 기반)

---

## 라이선스

MIT License. 자세한 내용은 [LICENSE](LICENSE) 파일을 참조하세요.
