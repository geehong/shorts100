# 🎯 Shorts100.com 점진적 개발 가이드

> v2.2 명세를 **40개 작은 티켓**으로 분해. 각 티켓 = 파일 1개 생성 또는 기능 1개 추가.
> 한 번에 하나씩, 검증하고 다음으로.

---

## 왜 이렇게 바꾸나

❌ **나쁜 방식**: "docker-compose + DB 스키마 + FastAPI + 테스트 다 만들어줘"
→ AI가 엉킨 코드 한 뭉치를 토해내고, 어디가 잘못됐는지 추적 불가.

✅ **좋은 방식**: "docker-compose에 PostgreSQL 한 서비스만 추가해줘"
→ 30초 만에 검증, 다음 티켓으로.

**규칙: 한 티켓 = 30분~2시간 안에 끝나고, `git commit` 1번.**

---

## 📋 전체 티켓 흐름 (40개)

| Phase | 기간 | 티켓 | 결과물 |
|---|---|---|---|
| **0. 시작** | Day 1 | T01~T03 | 빈 프로젝트 + 도구 |
| **1. 인프라** | Day 2~3 | T04~T08 | docker-compose 동작 |
| **2. DB 스키마** | Day 4~7 | T09~T16 | 마이그레이션 8개 |
| **3. 첫 API** | Day 8~10 | T17~T21 | `/health`, `/api/videos` |
| **4. 수집기** | Day 11~14 | T22~T27 | YouTube 크롤러 + Celery |
| **5. 랭킹** | Day 15~17 | T28~T31 | 알고리즘 + Redis |
| **6. 프론트 뼈대** | Day 18~21 | T32~T36 | Next.js + 카드 표시 |
| **7. 점진 기능** | Day 22~30 | T37~T44 | 카테고리, Rising, 쿠키 |
| **8. 출시 준비** | Day 31~40 | T45~T50 | 모니터링, 테스트, SEO |

> 각 Phase가 끝나면 **동작하는 무언가**가 있습니다. 도중에 멈춰도 손해 없음.

---

## 📑 티켓 마스터 리스트

### Phase 0: 시작 (Day 1)

| # | 티켓 | 의존성 | 시간 |
|---|---|---|---|
| T01 | 빈 프로젝트 + README + LICENSE | - | 10분 |
| T02 | `.gitignore` 생성 (Python + Node) | T01 | 5분 |
| T03 | `.env.example` 생성 (DB/Redis URL만 먼저) | T01 | 10분 |

### Phase 1: 인프라 (Day 2~3)

| # | 티켓 | 의존성 | 시간 |
|---|---|---|---|
| T04 | `docker-compose.yml`: 전용 `shorts100_redis` 서비스만 추가 | T03 | 20분 |
| T05 | 기존 `fire_markets_db_postgres` 내에 `shorts100` DB 생성 | T04 | 20분 |
| T06 | `backend/pyproject.toml` (FastAPI + SQLAlchemy 최소) | T01 | 20분 |
| T07 | `backend/Dockerfile` (multi-stage) | T06 | 30분 |
| T08 | `docker-compose.yml`에 backend 서비스 추가 (기존 DB 및 네트워크 연동) | T05, T07 | 30분 |

### Phase 2: DB 스키마 (Day 4~7) - 한 번에 1 테이블씩

| # | 티켓 | 의존성 | 시간 |
|---|---|---|---|
| T09 | `backend/app/db.py` (SQLAlchemy async 엔진) | T08 | 30분 |
| T10 | Alembic 초기화 (`alembic init`) | T09 | 20분 |
| T11 | 마이그레이션 001: ENUM 타입만 (`platform_enum`, `category_enum`) | T10 | 20분 |
| T12 | 마이그레이션 002: `channels` 테이블 + 인덱스 | T11 | 30분 |
| T13 | 마이그레이션 003: `videos` 테이블 + 인덱스 | T12 | 30분 |
| T14 | 마이그레이션 004: `video_stats` (월 단위 파티셔닝) | T13 | 1시간 |
| T15 | 마이그레이션 005: `rankings` + `hall_of_fame` | T14 | 30분 |
| T16 | 마이그레이션 006: `user_events`, `consent_log`, `video_reports` | T15 | 40분 |

### Phase 3: 첫 API (Day 8~10)

| # | 티켓 | 의존성 | 시간 |
|---|---|---|---|
| T17 | `app/main.py` 최소 골격 + `/health` | T08 | 20분 |
| T18 | `app/models/` SQLAlchemy 모델 (channels, videos만) | T13 | 40분 |
| T19 | `app/schemas/` Pydantic 응답 모델 | T18 | 30분 |
| T20 | `GET /api/videos?limit=10` 엔드포인트 | T19 | 40분 |
| T21 | `GET /api/videos/{id}` 엔드포인트 | T20 | 30분 |

### Phase 4: YouTube 수집기 (Day 11~14)

| # | 티켓 | 의존성 | 시간 |
|---|---|---|---|
| T22 | `app/crawlers/youtube_client.py` (단일 영상 fetch) | T18 | 1시간 |
| T23 | 수동 실행 스크립트 (`scripts/seed_youtube.py`) - 10개 영상 수동 수집 | T22 | 40분 |
| T24 | Celery 설정 (`app/celery_app.py`) + Worker 컨테이너 | T08 | 1시간 |
| T25 | 정기 수집 태스크 (1시간마다 트렌딩) | T22, T24 | 1시간 |
| T26 | Celery Beat 스케줄러 컨테이너 | T25 | 30분 |
| T27 | Freshness tier 로직 + 차등 갱신 | T25 | 1시간 |

### Phase 5: 랭킹 (Day 15~17)

| # | 티켓 | 의존성 | 시간 |
|---|---|---|---|
| T28 | `app/services/ranking.py` 알고리즘 (Z-score + decay) | T20 | 1시간 |
| T29 | 랭킹 계산 Celery 태스크 (5분마다) | T28, T25 | 40분 |
| T30 | `app/core/cache.py` Redis 래퍼 + Sorted Set 저장 | T29 | 40분 |
| T31 | `GET /api/rankings/global?limit=100` 엔드포인트 | T30 | 30분 |

### Phase 6: 프론트엔드 뼈대 (Day 18~21)

| # | 티켓 | 의존성 | 시간 |
|---|---|---|---|
| T32 | `frontend/` Next.js 14 프로젝트 init + Tailwind | T01 | 30분 |
| T33 | 메인 페이지 (정적 mock 데이터 카드 10개) | T32 | 1시간 |
| T34 | 백엔드 API 연동 (서버 컴포넌트 fetch) | T33, T31 | 1시간 |
| T35 | 무한 스크롤 (단순 IntersectionObserver) | T34 | 1.5시간 |
| T36 | `frontend/Dockerfile` + docker-compose에 추가 | T32 | 30분 |

### Phase 7: 점진 기능 추가 (Day 22~30) - 매일 1~2개

| # | 티켓 | 의존성 | 시간 |
|---|---|---|---|
| T37 | Rising Star 알고리즘 + `/api/rankings/rising` | T28 | 1.5시간 |
| T38 | `/rising` 프론트 페이지 | T37 | 40분 |
| T39 | 카테고리 필터 (`/category/[slug]`) | T34 | 1시간 |
| T40 | 영상 상세 페이지 (`/v/[id]`) + 통계 차트 | T21 | 1.5시간 |
| T41 | 딥링크 빌더 (`lib/deeplink.ts`) + 카드 클릭 연결 | T34 | 40분 |
| T42 | 쿠키 동의 배너 + consent_log 저장 | T20 | 1.5시간 |
| T43 | DOM 가상화 도입 (`@tanstack/react-virtual`) | T35 | 1시간 |
| T44 | Shorts 식별 강화 (HEAD 검증 + 7일 캐싱) | T22 | 1시간 |

### Phase 8: 출시 준비 (Day 31~40)

| # | 티켓 | 의존성 | 시간 |
|---|---|---|---|
| T45 | 브랜드 안전 키워드 필터 + safety_status 자동 산정 | T16 | 2시간 |
| T46 | 운영자 신고 처리 페이지 (basic auth) | T45 | 2시간 |
| T47 | `sitemap.xml` + `robots.txt` + JSON-LD VideoObject | T34 | 1시간 |
| T48 | Sentry 통합 (백엔드 + 프론트) | T08 | 30분 |
| T49 | 단위 테스트: 알고리즘 (pytest) | T28 | 2시간 |
| T50 | E2E 테스트: 메인 + 카드 클릭 (Playwright) | T35 | 2시간 |

---

## 🚀 처음 10개 티켓 상세 가이드

각 티켓을 **Antigravity에 그대로 복붙**할 수 있는 프롬프트 + 완료 확인법.

---

### T01: 빈 프로젝트 + README ⏱️ 10분

**프롬프트:**
> 빈 디렉토리에서 시작한다. 다음만 만들어줘:
> 1. `README.md` — 프로젝트 한 줄 소개 + 로컬 개발 시작 명령(아직은 placeholder OK)
> 2. `LICENSE` — MIT
> 3. 디렉토리 구조: `backend/`, `frontend/`, `docs/`, `scripts/` 빈 폴더 + 각 폴더에 `.gitkeep`

**완료 확인:**
```bash
ls -la
# README.md, LICENSE, backend/, frontend/, docs/, scripts/ 보임
git init && git add . && git commit -m "T01: 프로젝트 초기화"
```

---

### T02: .gitignore ⏱️ 5분

**프롬프트:**
> Python + Node + Docker + IDE용 `.gitignore`를 프로젝트 루트에 만들어줘. `.env`, `__pycache__/`, `node_modules/`, `.next/`, `*.log`, `.DS_Store`, `.idea/`, `.vscode/` 포함.

**완료 확인:**
```bash
cat .gitignore | head -20
git add .gitignore && git commit -m "T02: .gitignore"
```

---

### T03: .env.example ⏱️ 10분

**프롬프트:**
> 프로젝트 루트에 `.env.example`을 만들어줘. 지금은 **딱 2개만**:
> - `DATABASE_URL=postgresql+asyncpg://shorts:shorts@fire_markets_db_postgres:5432/shorts100` (기존 DB 컨테이너용 주소, 로컬 테스트 시에는 localhost로 변경 가능)
> - `REDIS_URL=redis://shorts100_redis:6379/0` (전용 Redis 컨테이너 주소)
>
> 각 변수 위에 한 줄 주석으로 용도 설명. 다른 변수는 나중에 필요할 때 추가할 거니까 지금은 절대 추가하지 마.

**완료 확인:**
```bash
cp .env.example .env  # 로컬용 복사
cat .env.example  # 2개 변수만 보여야 함
git add .env.example && git commit -m "T03: .env.example (DB + Redis만)"
```

---

### T04: docker-compose - 전용 Redis만 ⏱️ 20분

**프롬프트:**
> 프로젝트 루트에 `docker-compose.yml`을 만들어줘. **shorts100 전용 Redis 서비스 하나만**:
> - 서비스 이름: `redis` (컨테이너 이름 `shorts100_redis`)
> - 이미지: `redis:7-alpine`
> - 명령: `redis-server --maxmemory 512mb --maxmemory-policy allkeys-lru --appendonly yes`
> - 포트: `6379:6379`
> - 볼륨: named volume `redisdata` 마운트
> - healthcheck: `redis-cli ping` 10초 간격
>
> 기존 DB(`fire_markets_db_postgres`)는 재사용할 예정이므로 여기에 추가하지 마. 백엔드 등 다른 서비스도 절대 추가하지 마.

**완료 확인:**
```bash
docker compose up -d
docker compose ps  # redis가 "healthy" 표시될 때까지 확인
docker compose exec redis redis-cli ping  # PONG 출력 확인
docker compose down
git add docker-compose.yml && git commit -m "T04: docker-compose - Redis only"
```

---

### T05: 기존 PostgreSQL 내 신규 DB 구성 ⏱️ 20분

**프롬프트:**
> 기존에 작동 중인 PostgreSQL 컨테이너(`fire_markets_db_postgres`) 내에 `shorts100` 데이터베이스와 전용 사용자/권한을 생성하려 한다.
> 다음 명령을 수행할 수 있는 가이드나 SQL 스크립트를 작성하거나 직접 실행할 수 있도록 안내해줘:
> 1. `fire_markets_db_postgres` 컨테이너에 접속하여 psql 실행
> 2. `shorts` 사용자 생성 (비밀번호: `shorts`)
> 3. `shorts100` 데이터베이스 생성 및 소유자를 `shorts`로 지정
> 4. 데이터베이스 권한 부여
>
> `docker-compose.yml`이나 다른 파일은 변경하지 마.

**완료 확인:**
```bash
# 컨테이너 내에서 db가 정상 생성되었는지 확인
docker exec -it fire_markets_db_postgres psql -U shorts -d shorts100 -c "SELECT 1;"
# 1이 반환되면 정상 완료
git commit --allow-empty -m "T05: 기존 PostgreSQL 내 shorts100 DB 생성 완료"
```

---

### T06: pyproject.toml ⏱️ 20분

**프롬프트:**
> `backend/pyproject.toml`을 만들어줘. Poetry 형식. **최소 의존성만**:
> - Python 3.12
> - `fastapi ^0.110`
> - `uvicorn[standard] ^0.27`
> - `sqlalchemy ^2.0`
> - `asyncpg ^0.29`
> - `alembic ^1.13`
> - `pydantic ^2.6`
> - `pydantic-settings ^2.2`
>
> dev: `ruff`, `mypy`, `pytest`, `pytest-asyncio`만.
> ruff/mypy 기본 설정도 `[tool.ruff]`, `[tool.mypy]` 섹션에 포함. mypy는 `strict = true`.

**완료 확인:**
```bash
cd backend && poetry install  # 또는 pip install -e .
poetry run python -c "import fastapi; print(fastapi.__version__)"
git add backend/pyproject.toml && git commit -m "T06: backend 의존성 정의"
```

---

### T07: backend/Dockerfile ⏱️ 30분

**프롬프트:**
> `backend/Dockerfile`을 만들어줘. multi-stage:
> - **builder stage**: `python:3.12-slim`에서 Poetry 설치 + 의존성 빌드
> - **runtime stage**: `python:3.12-slim`에 builder의 venv 복사, 비루트 사용자(`app`)로 실행
> - WORKDIR `/app`
> - 포트 8000 expose
> - CMD: `uvicorn app.main:app --host 0.0.0.0 --port 8000`
>
> 아직 `app/main.py`는 없지만 Dockerfile만 먼저 준비. 빌드만 통과하면 OK (실행은 다음 티켓에서).

**완료 확인:**
```bash
cd backend && docker build -t shorts100-backend:dev .
# 마지막에 "Successfully tagged shorts100-backend:dev" 나오면 OK
# (실행하면 main.py 없어서 실패 — 정상)
git add backend/Dockerfile && git commit -m "T07: backend Dockerfile"
```

---

### T08: docker-compose에 backend 추가 + 헬스체크 ⏱️ 30분

**프롬프트:**
> 두 가지 작업:
>
> **(1) `backend/app/main.py`를 최소 형태로 만들어:**
> ```python
> from fastapi import FastAPI
> app = FastAPI(title="Shorts100 API")
>
> @app.get("/health")
> async def health():
>     return {"status": "ok"}
> ```
>
> **(2) `docker-compose.yml`에 backend 서비스 추가 및 네트워크 연동:**
> - build: `./backend`
> - 포트 `8000:8000`
> - `env_file: .env`
> - `depends_on`은 내부 `redis` 서비스만 의존하도록 설정
> - 기존 PostgreSQL 컨테이너(`fire_markets_db_postgres`)와 통신할 수 있도록 외부 네트워크 연동 설정 추가
> - `healthcheck`: `curl -f http://localhost:8000/health`
>
> redis 설정은 절대 건드리지 마.

**완료 확인:**
```bash
docker compose up -d --build
docker compose ps  # redis + backend 모두 healthy
# 외부 Postgres 통신 및 healthcheck 통과 확인
curl http://localhost:8000/health  # {"status":"ok"}
docker compose down
git add . && git commit -m "T08: backend 컨테이너 + /health"
```

🎉 **Phase 1 완료! 동작하는 API가 있습니다.**

---

### T09: SQLAlchemy 연결 ⏱️ 30분

**프롬프트:**
> `backend/app/db.py`를 만들어줘:
> - 비동기 엔진 (`create_async_engine`) + `DATABASE_URL` 환경변수에서 읽기
> - `AsyncSessionLocal` 팩토리
> - FastAPI 의존성 함수 `get_db()` (yield 패턴)
> - `Base = declarative_base()` 익스포트
>
> `backend/app/config.py`도 만들어줘 (pydantic-settings 사용, `DATABASE_URL`, `REDIS_URL`만).
>
> `app/main.py`는 건드리지 마.

**완료 확인:**
```bash
docker compose up -d
docker compose exec backend python -c "
from app.db import engine
import asyncio
async def t():
    async with engine.connect() as c:
        r = await c.execute('SELECT 1')
        print(r.scalar())
asyncio.run(t())
"
# 1 출력되면 OK
git commit -am "T09: SQLAlchemy 연결"
```

---

### T10: Alembic 초기화 ⏱️ 20분

**프롬프트:**
> backend에서 Alembic 초기화:
> - `cd backend && alembic init alembic` 명령 실행
> - `backend/alembic.ini`의 `sqlalchemy.url`은 환경변수에서 읽도록 비워둠
> - `backend/alembic/env.py`를 수정해서 `app.config.settings.DATABASE_URL`을 사용하도록 (async 엔진 지원)
> - 빈 마이그레이션 하나 생성해서 동작 검증 (`alembic revision -m "empty"`)
>
> 실제 테이블은 다음 티켓에서 만들 거야. 지금은 alembic 인프라만.

**완료 확인:**
```bash
docker compose exec backend alembic upgrade head  # 에러 없이 통과
docker compose exec backend alembic current  # 빈 마이그레이션 ID 표시
git add backend/alembic.ini backend/alembic/ && git commit -m "T10: Alembic 초기화"
```

---

## 🔁 11번째 티켓부터 적용할 작업 원칙

### ✅ 각 티켓마다 반복할 5단계

1. **티켓 1개**를 위 마스터 리스트에서 선택
2. **상단의 상세 가이드 형식**으로 Antigravity에 프롬프트 전달 (T01~T10 예시 참고)
3. AI가 코드 생성 → **즉시 docker-compose / 테스트로 검증**
4. 통과하면 `git commit -m "TNN: 한 줄 요약"`
5. 안 통과하면 → 같은 대화에서 "에러 메시지: ..." 보여주고 수정 (새 티켓으로 진행 X)

### 📏 티켓 크기 신호등

- 🟢 **30분~2시간**: 정상
- 🟡 **3시간 넘어감**: 티켓을 둘로 쪼개라
- 🔴 **AI가 5개 이상 파일을 한 번에 만들려고 함**: 멈춰. 프롬프트가 너무 큼

### 🚫 금지 사항

- ❌ "이거 다 만들어줘" 형태의 프롬프트
- ❌ 한 티켓에서 여러 파일을 동시에 새로 만들기 (수정은 OK)
- ❌ 검증 없이 다음 티켓으로 넘어가기
- ❌ 의존성 무시하고 순서 건너뛰기 (T13 없이 T18 시도 등)

### 💡 막힐 때

- AI가 헛소리하면 → 새 채팅 시작, **티켓 번호 + 이미 만든 파일 목록**만 주고 다시
- 같은 에러 3번 반복 → 그 티켓을 더 작게 쪼개기
- Phase 단위로 멈춰서 며칠 쉬어도 됨 (각 Phase는 독립적으로 동작)

---

## 📊 진행 추적 템플릿

`docs/PROGRESS.md`로 만들어 매일 체크:

```markdown
## Phase 0: 시작
- [x] T01 (2026-05-21) 프로젝트 초기화
- [x] T02 (2026-05-21) .gitignore
- [ ] T03

## Phase 1: 인프라
- [ ] T04
...
```

---

## 🎯 가장 중요한 한 가지

> **"이번 티켓에서 추가하지 않을 것"을 매번 프롬프트에 명시하라.**

예: T05 프롬프트의 "PostgreSQL 설정은 절대 건드리지 마", T06의 "다른 의존성 추가하지 마".

AI 에이전트는 "도와주려는" 본능 때문에 시키지 않은 것을 자꾸 추가합니다. 명시적 금지가 가장 효과적입니다.

---

## 결론

| 문서 | 역할 | 언제 보나 |
|---|---|---|
| `Shorts100_마스터플랜_v2.2_패치.md` | **레퍼런스** (전체 명세) | 구현 중 막혔을 때 해당 §N 참조 |
| **`이 문서`** | **실행 가이드** (티켓 분해) | **매일 작업 시작할 때** |

내일 아침 `T01` 부터 시작하시면 됩니다.
중간에 막히면 그 티켓 번호 알려주세요. 같이 봅니다.