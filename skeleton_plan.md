# 📋 Shorts100.com 개발 뼈대 계획 (Skeleton Plan)

`plan.md` (v2.2)의 방대한 명세에서 **핵심 개발 단계와 핵심 태스크**만 추출한 가장 직관적이고 직관적인 개발 뼈대 계획입니다.

---

## 🎯 MVP 핵심 목표
- **대상 플랫폼**: YouTube Shorts 단일 (v2.0 MVP 정의 반영)
- **핵심 가치**: 실시간 쇼츠 트렌드 TOP 100 랭킹 제공 및 원본 앱 연결 (스마트 딥링크)
- **최종 지향**: 출시 후 유지보수 비용을 최소화하는 탄탄한 코드 베이스 (v2.2 지향)

---

## 🛠️ 기술 스택 (Core Tech Stack)
- **Backend**: FastAPI (Python 3.12) + SQLAlchemy (asyncpg) + Celery (Redis)
- **Frontend**: Next.js 14 (App Router, Node 20+) + TailwindCSS + `@tanstack/react-virtual`
- **Database**: PostgreSQL 15 (기존 `fire_markets_db_postgres` 컨테이너 내 `shorts100` DB 생성/재사용)
- **Cache / Message Queue**: Redis 7 (shorts100 전용 신규 1개 인스턴스로 캐시/큐 통합 운영)

---

## 🗓️ 4단계 핵심 로드맵 (4-Phase Roadmap)

### **Phase 1: 인프라 및 DB 기초 구축 (Foundation)**
- [ ] **Docker Compose 및 네트워크 구성**:
  - `FastAPI`, `Celery`, `shorts100_redis` (캐시/큐 통합) 구성
  - 기존 `fire_markets_db_postgres` 및 `nginx-proxy-manager` 네트워크 연동 (외부 링크 설정)
- [ ] **기존 PostgreSQL 내 신규 DB 구성**:
  - 기존 Postgres 컨테이너에 접속하여 `shorts100` 데이터베이스 생성 및 권한 설정
- [ ] **DB 스키마 및 마이그레이션 (`Alembic`)**:
  - `videos`, `video_stats` (월 단위 파티셔닝), `consent_log` (개인정보 동의 서명용)
- [ ] **FastAPI 기본 골격 및 라우팅**:
  - `/health` (DB + Redis 연결성 체크), `/metrics` (Prometheus)
  - 기존 `nginx-proxy-manager`에 `shorts100.com` 역방향 프록시 규칙 추가

### **Phase 2: 핵심 백엔드 파이프라인 (Core Backend)**
- [ ] **Shorts 식별 알고리즘 (§3)**:
  - Duration(<=60s) + `#shorts` 텍스트 매칭 + HEAD 요청 검증 (Redis 7일 캐싱)
- [ ] **유튜브 API Adaptive Refresh (§1)**:
  - 연령별 차등 주기 (HOT: 1h, WARM: 3h, COOL: 12h, COLD: 24h) + TOP 100 Burst 모드
- [ ] **랭킹 산출 및 캐시 정책 (§11)**:
  - Z-score 기반 랭킹 알고리즘 연산 + Redis `noeviction` 영역에 랭킹 캐싱
  - Redis 장애 대비 DB 폴백용 Circuit Breaker 패턴 적용

### **Phase 3: 프론트엔드 및 사용자 경험 (Core Frontend & UX)**
- [ ] **가상화 목록 렌더링 (§2)**:
  - `@tanstack/react-virtual` 기반 무한 스크롤 및 가변 높이 카드 UI (메모리 절약)
- [ ] **스마트 딥링크 (§6)**:
  - iOS/Android/데스크톱 대응 + 카카오톡 인앱 브라우저 외부 실행 가이드 제공
- [ ] **PIPA & 쿠키 동의 배너 (§7, §12)**:
  - 필수/선택 쿠키 분류 및 동의 시 IP 해싱/HMAC 서명 로깅
- [ ] **국제화 (i18n) 프레임워크 (§14)**:
  - `next-intl` 연동 및 모든 UI 텍스트 키로 추상화 (ko 우선 적용)

### **Phase 4: 품질, 안전성 및 출시 준비 (Quality & Launch)**
- [ ] **브랜드 안전 필터 (§8)**:
  - 욕설/혐오 사전 기반 영상 차단 및 신고 임시 숨김 처리 워크플로우 구축
- [ ] **AdSense 승인 대비 콘텐츠 보강 (§4)**:
  - 메인/Rising 상단 코멘트 및 주 2회 분석 블로그 반자동 발행 설정
- [ ] **테스트 커버리지 달성 (§10)**:
  - 백엔드 Unit/Integration 테스트 (목표 80%), Playwright E2E 시나리오 검증
- [ ] **CI/CD 및 배포 파이프라인 (§10.7)**:
  - GitHub Actions 연동, Zero-Downtime 배포 및 즉시 롤백 스크립트 작성
