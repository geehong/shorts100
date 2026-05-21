# Shorts100.com

실시간 YouTube Shorts 트렌드 TOP 100 랭킹 서비스 및 스마트 딥링크 플랫폼입니다.

## 🛠️ 개발 환경 시작 가이드

이 프로젝트는 기존 서버 자원을 공유하여 실행하는 것을 기본으로 합니다.

### 1. 전제 조건
- Docker 및 Docker Compose 설치 완료
- 기존 `fire_markets_db_postgres` PostgreSQL 컨테이너 작동 중

### 2. 로컬 실행 방법
```bash
# 1. 환경 변수 설정
cp .env.example .env

# 2. 전용 Redis 컨테이너 및 서비스 시작
docker compose up -d

# 3. 데이터베이스 생성 (기존 Postgres 컨테이너 사용)
# 가이드북 T05 단계를 참고하여 shorts100 DB를 생성합니다.
```

## 📄 라이선스
MIT License. 자세한 내용은 [LICENSE](LICENSE) 파일을 참조하세요.
