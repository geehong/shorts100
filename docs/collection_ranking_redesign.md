# 수집 & 랭킹 시스템 재설계 v1.2

> 현재 구조의 근본적 문제를 해결하고, 멜론/스포티파이 수준의 차트 이력 시스템을 구축한다.
> v1.2: rankings(Z-score) vs chart_entries(view_delta) 역할 명확화, videos.trending_regions 추가

---

## 1. 현재 구조의 문제점

| # | 문제 | 영향 |
|---|------|------|
| 1 | `rankings` 매시간 전체 삭제 후 재삽입 | 순위 이력 전혀 없음 |
| 2 | `videos.view_count` 덮어씀 | 기간 증가분(view_delta) 계산 불가 |
| 3 | `chart_entries` 없음 | 일간/주간/월간/특정날짜 차트 불가 |
| 4 | 나라별 수집 결과를 저장 안 함 | 나라별 순위 불가 |
| 5 | `rankings` 정렬 기준(Z-score)이 기간 차트에 맞지 않음 | 주간 차트는 그 주 증가량이 기준이어야 함 |
| 6 | `ARCHIVED` 영상 갱신 완전 중단 | 역주행 영상 차트 누락 |
| 7 | 백필 없음 | 서비스 초기 데이터 빈약 |
| 8 | API 키 1개 | 단일 장애점 |
| 9 | `video_stats` 등 테이블 미활용 | 기존 설계 자산 낭비 |

---

## 2. 핵심 설계 원칙

### 테이블별 역할 분리

| 테이블 | 역할 | 보존 |
|--------|------|------|
| `rankings` | 실시간 순위 캐시 | 덮어씀 |
| `chart_entries` | 기간별 영구 기록 | append only |

### rank_basis — 순위 기준 4종

`chart_entries`의 모든 스냅샷은 어떤 기준으로 순위를 매겼는지 `rank_basis`로 명시한다.

| rank_basis | 의미 | 적합한 차트 |
|------------|------|------------|
| `algo` | **우리 알고리즘** Z-score × time_decay | 종합 순위, 실시간 |
| `view_count` | **유튜브 단순 조회수** 누적 절대값 | 역대 누적 TOP |
| `view_delta` | **기간 내 증가량** period_start~end 조회수 차이 | 일간/주간/월간 성장 |
| `rising` | **시간당 가속도** 단위시간 대비 증가율 | 급상승, 신인 발굴 |

**같은 영상이 같은 날 rank_basis에 따라 다른 순위를 가진다:**

```
video "아이유 쇼츠" — 2026-05-22 / daily / KR

  rank_basis=algo        → 3위   (Z-score 높음, 인지도 있는 인기 영상)
  rank_basis=view_count  → 1위   (누적 조회수 절대값 1위)
  rank_basis=view_delta  → 15위  (오늘 증가량은 많지 않음)
  rank_basis=rising      → 47위  (가속도 낮음, 이미 정점 지남)
```

→ 프론트엔드에서 탭으로 전환: **종합순위 / 조회수순 / 증가량순 / 급상승순**

### 불변 스냅샷 원칙

> 차트가 발표되는 순간 그 데이터를 영구 보존한다. 절대 수정하지 않는다.

---

## 3. 계층 분리

```
L1  신규 발견      YouTube API → channels, videos, trending_regions 저장
L2  기존 갱신      freshness tier 기반 통계 갱신 → video_stats 시계열 기록
L3  실시간 랭킹    Z-score 계산 → rankings 캐시 갱신
L4  차트 스냅샷    view_delta 집계 → chart_entries 영구 기록
L5  백필           과거 구간 소급 수집
```

---

## 4. DB 스키마

### 4.1 `videos` 테이블 — `trending_regions` 컬럼 추가

```sql
ALTER TABLE videos
  ADD COLUMN trending_regions TEXT[] DEFAULT '{}';
-- 예: ['KR', 'JP'] → KR과 JP 검색에서 발견된 영상
```

**수집 시 업데이트 방식**

```python
# 'KR' 검색으로 발견된 영상 → trending_regions에 'KR' 누적
UPDATE videos
SET trending_regions = array_append(trending_regions, 'KR')
WHERE platform_video_id = ?
  AND NOT ('KR' = ANY(trending_regions))  -- 중복 방지
```

**이 컬럼이 있어야 나라별 차트 생성 가능**

```sql
-- 한국에서 trending된 영상들의 주간 view_delta TOP50
SELECT v.title, SUM(vs.view_delta) AS weekly_delta
FROM videos v
JOIN video_stats vs ON v.id = vs.video_id
WHERE 'KR' = ANY(v.trending_regions)
  AND vs.measured_at BETWEEN period_start AND period_end
ORDER BY weekly_delta DESC
LIMIT 50;
```

---

### 4.2 `rankings` 테이블 — 역할 명확화 (구조 변경 없음)

```
역할: 실시간 API 응답용 캐시 (덮어씀)
기준: Z-score = f(view_count, like_count, comment_count, time_decay)
범위: global / rising / category:xxx
한계: 나라별 없음, 기간별 없음
```

---

### 4.3 `video_stats` 테이블 — 시계열 기록 활성화 (기존 테이블)

```sql
-- 이미 존재, 파티셔닝 완료. 데이터만 안 쌓고 있었음
video_stats (PARTITION BY RANGE measured_at)
  video_id, view_count, like_count, comment_count, measured_at
```

`refresh_video_stats` 실행 시 `videos` 갱신과 동시에 여기도 INSERT.
→ 이 시계열이 `view_delta` 계산의 원천 데이터.

---

### 4.4 `chart_entries` 테이블 — 신규 추가 (핵심)

```sql
CREATE TABLE chart_entries (
    id              BIGSERIAL PRIMARY KEY,

    chart_type      VARCHAR(16) NOT NULL,
    -- 'daily' | 'weekly' | 'monthly'

    period_key      VARCHAR(12) NOT NULL,
    -- daily   → '2026-05-22'
    -- weekly  → '2026-W20'
    -- monthly → '2026-05'

    period_start    TIMESTAMPTZ NOT NULL,
    period_end      TIMESTAMPTZ NOT NULL,

    region          VARCHAR(5)  NOT NULL DEFAULT 'GLOBAL',
    -- 'GLOBAL' | 'KR' | 'US' | 'JP' | 'GB' 등

    category        VARCHAR(24),
    -- NULL = 전체, 'music' | 'gaming' | 'entertainment' 등

    video_id        BIGINT NOT NULL REFERENCES videos(id),

    -- 순위 기준 (§2 rank_basis 참조)
    rank_basis      VARCHAR(16) NOT NULL DEFAULT 'view_delta',
    -- 'algo' | 'view_count' | 'view_delta' | 'rising'

    -- 순위
    position        INT NOT NULL,
    prev_position   INT,       -- 직전 동일 차트 + 동일 rank_basis 순위 (▲▼)
    peak_position   INT,       -- 역대 최고 순위 (rank_basis 기준)
    weeks_on_chart  INT DEFAULT 1,

    -- 각 기준별 수치 (모두 저장, 비교 가능)
    view_delta      BIGINT,    -- rank_basis=view_delta 시 정렬 기준
    view_count      BIGINT NOT NULL,  -- rank_basis=view_count 시 정렬 기준
    zscore          FLOAT,     -- rank_basis=algo 시 정렬 기준
    velocity        FLOAT,     -- rank_basis=rising 시 정렬 기준 (조회수/시간)
    like_count      BIGINT NOT NULL DEFAULT 0,

    created_at      TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE (chart_type, period_key, region, category, rank_basis, position)
);

CREATE INDEX idx_chart_type_period ON chart_entries(chart_type, period_key, region);
CREATE INDEX idx_chart_video       ON chart_entries(video_id, chart_type);
```

---

### 4.5 나머지 기존 테이블 활용 계획

| 테이블 | 활성화 시점 | 역할 |
|--------|------------|------|
| `hall_of_fame` | chart_entries 완성 후 | 1위 달성 영상 자동 기록 |
| `video_reports` | 프론트 신고 버튼 구현 시 | 신고 누적 → safety_status 자동 변경 |
| `consent_log` | 쿠키 배너 구현 시 | PIPA 동의 증빙 (영구 보존) |
| `user_events` | 2단계 개선 시 | 실제 클릭 기반 랭킹 보정 |

---

## 5. 수집 → 저장 → 표시 전체 흐름

```
① 수집 (YouTube API, 매시간)
   search.list → 50개 video_id
   videos.list → 상세정보
   channels.list → 채널정보
        ↓
② 저장
   channels     upsert
   videos       upsert (view_count 최신값으로 갱신)
   videos.trending_regions  += 이번 검색 region  ← 신규
        ↓
③ 통계 갱신 (매 5분, freshness tier 기반)
   videos       view_count 갱신
   video_stats  그 시점 스냅샷 INSERT  ← 신규
        ↓
④ 실시간 랭킹 계산 (매시간)
   Z-score 계산 → rankings 갱신 (덮어씀)
   → API: /api/rankings/global  (실시간 TOP100)
   → API: /api/rankings/category/music
        ↓
⑤ 차트 스냅샷 (기간별)
   [매일 00:00] — rank_basis별로 각각 생성
     ┌─ rank_basis=algo      rankings.score 기준 → daily/GLOBAL, daily/KR ...
     ├─ rank_basis=view_count videos.view_count 기준 → daily/GLOBAL, daily/KR ...
     ├─ rank_basis=view_delta video_stats 24h 증가량 → daily/GLOBAL, daily/KR ...
     └─ rank_basis=rising     velocity 계산 → daily/GLOBAL, daily/KR ...
     position=1 달성 영상 → hall_of_fame INSERT

   [매주 월요일 00:00]
     ┌─ rank_basis=algo      7일 평균 zscore → weekly
     ├─ rank_basis=view_count 현재 누적 view_count → weekly
     ├─ rank_basis=view_delta 7일 view_delta 합산 → weekly
     └─ rank_basis=rising    7일 velocity 평균 → weekly

   [매월 1일 00:00]
     위 4종 기준 동일, 30일 집계 → monthly
        ↓
⑥ 표시 (프론트엔드)
```

---

## 6. 표시 가능한 차트 전체 목록

### 실시간 (`rankings` 테이블)

| 차트 | rank_basis | 비고 |
|------|-----------|------|
| 실시간 종합 TOP100 | `algo` (Z-score) | 매시간 갱신 |
| 실시간 카테고리별 | `algo` | music / gaming 등 |
| 실시간 급상승 | `rising` | 7일 이내 신규 |

### 기간별 (`chart_entries` 테이블)

같은 기간/지역에 `rank_basis`별로 각각 저장 → 프론트 탭 전환

| 차트 | period | region | rank_basis |
|------|--------|--------|-----------|
| 오늘 종합순위 | daily | GLOBAL | `algo` |
| 오늘 조회수순 | daily | GLOBAL | `view_count` |
| 오늘 증가량순 | daily | GLOBAL | `view_delta` |
| 한국 오늘 종합 | daily | KR | `algo` |
| 한국 오늘 조회수순 | daily | KR | `view_count` |
| 이번 주 종합 | weekly | GLOBAL | `algo` |
| 이번 주 성장 | weekly | GLOBAL | `view_delta` |
| 한국 주간 | weekly | KR | `view_delta` |
| 5월 2주차 한국 | weekly / 2026-W19 | KR | `view_delta` |
| 음악 주간 | weekly | GLOBAL | `view_delta` |
| 이번 달 종합 | monthly | GLOBAL | `algo` |
| 역주행 | weekly | GLOBAL | `rising` |
| 역대 누적 TOP | monthly | GLOBAL | `view_count` |
| 명예의 전당 | - | - | `hall_of_fame` |

---

## 7. API 키 전략

| 키 | 담당 지역 | 담당 태스크 | 일일 쿼터 |
|----|----------|------------|----------|
| **KEY1** | KR 45% / US 35% / JP 20% | trending + monthly | 4,896 units |
| **KEY2** | 유럽 50% + 기타 50% | regional + backfill + refresh | 5,184 units |

**KEY2 지역 상세 (유럽 50% + 기타 50%)**

| 국가 | 가중치 | | 국가 | 가중치 |
|------|--------|-|------|--------|
| GB | 15% | | TW | 13% |
| DE | 13% | | IN | 12% |
| FR | 12% | | ID | 10% |
| ES | 10% | | AU | 8% |
|    |     | | BR | 7% |

---

## 8. 수집 스케줄

```
매 5분      refresh_video_stats       KEY2   videos 갱신 + video_stats INSERT
매시 00분   collect_trending          KEY1   KR/US/JP + trending_regions 저장
매시 20분   collect_monthly           KEY1   KR/US/JP (최근 30일)
매시 40분   collect_regional          KEY2   유럽+기타 + trending_regions 저장
            backfill_hourly           KEY2   12국 순환, 7~180일 전 구간
매시간 후   compute_rankings          -      Z-score → rankings 갱신

매일 00:00  daily_chart_snapshot      -      video_stats → chart_entries (daily)
                                             position=1 → hall_of_fame
매주 월     weekly_chart_snapshot     -      7일 합산 → chart_entries (weekly)
매월 1일    monthly_chart_snapshot    -      30일 합산 → chart_entries (monthly)
```

---

## 9. 쿼터 계산

| 태스크 | 키 | 횟수/일 | 일일 소비 |
|--------|-----|---------|----------|
| collect_trending | KEY1 | 24 | 2,448 |
| collect_monthly | KEY1 | 24 | 2,448 |
| collect_regional | KEY2 | 24 | 2,448 |
| backfill_hourly | KEY2 | 24 | 2,448 |
| refresh_video_stats | KEY2 | 288 | 288 |
| **KEY1 합계** | | | **4,896 / 10,000** |
| **KEY2 합계** | | | **5,184 / 10,000** |

---

## 10. ARCHIVED 정책 변경

```
기존: 30일+ → 갱신 완전 중단
변경: 30일+ → 주 1회 갱신

이유: 역주행 영상이 30일 후에도 차트 진입 가능
     비용: videos.list 1 unit (무시할 수준)
```

---

## 11. 구현 순서

| 순서 | 작업 | 파일 |
|------|------|------|
| 1 | `.env` KEY1/KEY2 추가 | `.env` ✅ 완료 |
| 2 | `videos.trending_regions` 컬럼 추가 | Alembic 마이그레이션 |
| 3 | `chart_entries` 테이블 생성 | Alembic 마이그레이션 |
| 4 | `config.py` 키 분리 | `backend/app/config.py` |
| 5 | `tasks.py` 전면 재설계 | `backend/app/crawlers/tasks.py` |
| 6 | `video_stats` INSERT 추가 | `tasks.py` refresh 로직 |
| 7 | 차트 스냅샷 태스크 추가 | `backend/app/services/chart.py` |
| 8 | ORM 모델 추가 | `backend/app/models/` |

---

*최종 수정: 2026-05-22*
*관련 문서: plan.md (v2.2 마스터 플랜)*
