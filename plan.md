# 🔧 Shorts100.com 마스터 플랜 v2.2 패치

> v2.1에 대한 2차 리뷰 피드백 반영. 코드 품질, 의존성, 테스트, 접근성, 국제화 등
> **출시 후 1년간 유지보수 비용**을 좌우하는 부분을 보강했습니다.

---

## 📦 Version History

| Version | Date | 주요 변경 사항 | 문서 위치 |
|---------|------|----------------|-----------|
| **v1.0** | 초안 | 3 플랫폼 동시 출시 / 단순 가중치 알고리즘 / AdSense 단독 수익화 | (사용자 원본) |
| **v2.0** | 1차 보강 | 시장 분석, MVP 재정의(유튜브 단일), Z-score 알고리즘, DB 스키마, 수익 다각화, 리스크 매트릭스 | `Shorts100_마스터플랜_v2.md` |
| **v2.1** | 시니어 리뷰 반영 | API 쿼터 백오프, DOM 가상화, Shorts 식별, AdSense thin content, 타임존, 딥링크 폴백, PIPA, 브랜드 안전 | `Shorts100_마스터플랜_v2.1_패치.md` |
| **v2.2** | 코드 품질 라운드 | Dependencies 표, Test Coverage 전략, 캐시 Eviction, PIPA 보안 감사, 접근성(WCAG 2.1 AA), i18n 준비, 가독성/앵커링크 | `Shorts100_마스터플랜_v2.2_패치.md` (이 문서) |

### v2.1 → v2.2 변경 요약

| # | 영역 | 변경 유형 | 출처 |
|---|---|---|---|
| 1 | **Dependencies 표** | 신규 섹션 | 리뷰 제안 |
| 2 | **Test Coverage 전략** | 신규 섹션 | 리뷰 제안 |
| 3 | **캐시 Eviction & Fallback** | 신규 섹션 | 리뷰 제안 |
| 4 | **PIPA 보안 감사** | 신규 섹션 | 리뷰 제안 |
| 5 | **접근성 (WCAG 2.1 AA)** | 신규 섹션 | 리뷰 제안 |
| 6 | **i18n 준비** | 신규 섹션 | 리뷰 제안 |
| 7 | 가독성 (라인 분할, 앵커링크) | 형식 개선 | 리뷰 제안 |
| 8 | v2.1 기존 내용 | 라인 길이 정리, 코드 블록 점검 | 리뷰 제안 |

---

## 📑 목차 (Table of Contents)

### v2.1에서 이어지는 섹션 (가독성 정리됨)
- [§1. YouTube API Adaptive Refresh](#sec-1-api-refresh)
- [§2. 프론트엔드 DOM 가상화](#sec-2-virtualization)
- [§3. Shorts 식별 알고리즘](#sec-3-shorts-detection)
- [§4. AdSense Thin Content 대응](#sec-4-adsense)
- [§5. 타임존 정책](#sec-5-timezone)
- [§6. 딥링크 폴백 전략](#sec-6-deeplink)
- [§7. PIPA + 쿠키 동의 UX](#sec-7-pipa)
- [§8. 브랜드 안전 필터](#sec-8-brand-safety)

### v2.2 신규 섹션
- [§9. Dependencies (의존성 표)](#sec-9-dependencies)
- [§10. Test Coverage 전략](#sec-10-test)
- [§11. 캐시 Eviction & Fallback](#sec-11-cache)
- [§12. PIPA 보안 감사 단계](#sec-12-pipa-audit)
- [§13. 접근성 (WCAG 2.1 AA)](#sec-13-a11y)
- [§14. 국제화 (i18n) 준비](#sec-14-i18n)

### 통합
- [§15. 최종 개발 지시 프롬프트 (v2.2)](#sec-15-prompt)
- [§16. 출시 전 통합 체크리스트](#sec-16-checklist)

---

<a id="sec-1-api-refresh"></a>

## §1. YouTube API Adaptive Refresh (v2.0 §4.1 보강)

### 1.1 영상 연령별 차등 갱신 (Tiered Refresh)

쿼터 절약을 위한 **영상 신선도 등급(freshness tier)** 도입:

| Tier | 영상 연령 | 갱신 주기 | 사유 |
|---|---|---|---|
| **HOT** | 0~24h | 1시간 | 가속도 측정에 결정적 |
| **WARM** | 1~3일 | 3시간 | 트렌드 형성/소멸 구간 |
| **COOL** | 3~7일 | 12시간 | 잔여 트래픽 추적 |
| **COLD** | 7~30일 | 24시간 또는 중단 | TOP 100 진입 시에만 갱신 |
| **ARCHIVED** | 30일 초과 | 갱신 중단 | 명예의 전당 외 비활성화 |

### 1.2 Burst Mode (랭킹 진입 시 가속)

리뷰어 제안에 한 단계 추가: **현재 TOP 100 안에 있는 영상은 무조건 1시간 주기로** 갱신.
가속도(velocity)가 핵심 지표이므로, 랭킹 진입 영상은 freshness tier와 무관하게 burst.

### 1.3 DB 스키마 보강

```sql
ALTER TABLE videos
  ADD COLUMN freshness_tier VARCHAR(16) DEFAULT 'HOT',
  ADD COLUMN next_refresh_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ADD COLUMN refresh_priority SMALLINT DEFAULT 0;
  -- 0=normal, 1=burst, -1=paused

CREATE INDEX idx_videos_next_refresh
  ON videos(next_refresh_at)
  WHERE is_active = TRUE AND refresh_priority >= 0;
```

### 1.4 Celery Task 구현 스케치

```python
# backend/app/crawlers/youtube_refresh.py
from datetime import datetime, timedelta, timezone

TIER_INTERVALS = {
    "HOT":  timedelta(hours=1),
    "WARM": timedelta(hours=3),
    "COOL": timedelta(hours=12),
    "COLD": timedelta(hours=24),
}

def calc_next_refresh(video):
    age = datetime.now(timezone.utc) - video.published_at
    # TOP 100에 있으면 burst (tier 무관)
    if video.refresh_priority == 1:
        return datetime.now(timezone.utc) + timedelta(hours=1)
    if age < timedelta(days=1):
        tier = "HOT"
    elif age < timedelta(days=3):
        tier = "WARM"
    elif age < timedelta(days=7):
        tier = "COOL"
    elif age < timedelta(days=30):
        tier = "COLD"
    else:
        video.refresh_priority = -1  # archive
        return None
    video.freshness_tier = tier
    return datetime.now(timezone.utc) + TIER_INTERVALS[tier]

@celery.task
def batch_refresh_videos():
    """Batched 50-at-a-time refresh (YouTube videos.list 최대 50 id).

    1 unit cost regardless of how many IDs (up to 50).
    이 한 호출로 50개 영상 통계 갱신 = 매우 효율적.
    """
    due = (
        Video.query
        .filter(Video.next_refresh_at <= now())
        .filter(Video.refresh_priority >= 0)
        .order_by(Video.refresh_priority.desc(), Video.next_refresh_at)
        .limit(50)
        .all()
    )
    # ... videos.list API 호출 + 통계 업데이트
```

### 1.5 쿼터 안전 한계선 (Safety Cap)

```python
# 일일 쿼터 80% 사용 시점에 자동 스로틀링
DAILY_QUOTA_LIMIT = 10_000
SAFE_THRESHOLD = 0.80  # 8,000 units

if used_today / DAILY_QUOTA_LIMIT > SAFE_THRESHOLD:
    # COLD/COOL tier 갱신 중단, HOT/WARM만 진행
    pause_lower_tiers()
```

---

<a id="sec-2-virtualization"></a>

## §2. 프론트엔드 DOM 가상화 (v2.0 §6 보강)

### 2.1 문제 재정의

리뷰어 지적대로 100~200개 영상 카드를 누적하면 모바일 메모리가 한계에 도달합니다.
다만 **무한 스크롤 + 가변 높이 카드**는 일반적인 fixed-height 가상화로는 깔끔히 처리되지 않습니다.

### 2.2 권장 라이브러리

| 옵션 | 장점 | 단점 |
|---|---|---|
| **@tanstack/react-virtual** | 가변 높이, Next.js App Router 호환, 활발한 유지보수 | 약간 학습 곡선 |
| react-window | 가볍고 빠름 | 가변 높이 처리 까다로움 |
| react-virtuoso | 무한 스크롤 + 가변 높이 통합 솔루션 | 번들 크기 약간 큼 |

**→ 최종 추천: `@tanstack/react-virtual` (Next.js 14 App Router에서 가장 안정적)**

### 2.3 구현 패턴

```tsx
// frontend/components/RankingList.tsx
'use client';
import { useVirtualizer } from '@tanstack/react-virtual';

export function RankingList({ initialItems }: Props) {
  const parentRef = useRef<HTMLDivElement>(null);
  const [items, setItems] = useState(initialItems);

  const virtualizer = useVirtualizer({
    count: items.length + 1,            // +1 for sentinel
    getScrollElement: () => parentRef.current,
    estimateSize: () => 360,            // 평균 카드 높이 (px)
    overscan: 5,                        // 위/아래 5개 미리 마운트
  });

  // sentinel hit → fetch next page
  useEffect(() => {
    const last = virtualizer.getVirtualItems().at(-1);
    if (last && last.index >= items.length - 1) {
      void fetchNextPage();
    }
  }, [virtualizer.getVirtualItems()]);

  return (
    <div ref={parentRef} className="h-screen overflow-auto">
      <div style={{ height: virtualizer.getTotalSize(), position: 'relative' }}>
        {virtualizer.getVirtualItems().map(v => (
          <div
            key={v.key}
            data-index={v.index}
            ref={virtualizer.measureElement}  // 가변 높이 자동 측정
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              transform: `translateY(${v.start}px)`,
            }}
          >
            <VideoCard video={items[v.index]} rank={v.index + 1} />
          </div>
        ))}
      </div>
    </div>
  );
}
```

### 2.4 추가 최적화

- **이미지 우선순위**:
  - 상단 3개 카드: `priority loading="eager"`
  - 4번째부터: `loading="lazy"`
- **메모리 모니터링**:
  `performance.memory.usedJSHeapSize` 측정 후 250MB 초과 시 강제 리프레시 안내
  (안드로이드 보급형 보호)
- **개발자 도구 검증**: Chrome Lighthouse + WebPageTest에서 200개 카드 시점 메모리 추적

---

<a id="sec-3-shorts-detection"></a>

## §3. Shorts 식별 알고리즘 강화 (v2.0 §4.1 보강)

리뷰어의 HEAD 요청 아이디어는 훌륭하지만, **단독으로는 깨질 수 있습니다.**
YouTube가 응답을 바꿀 수도 있고, 호출 폭주 시 일시 차단 가능성도 있습니다.
**다층 시그널 + 캐싱**으로 강화합니다.

### 3.1 다층 식별 파이프라인

```
[Layer 1] API 메타데이터 (무비용)
  - contentDetails.duration ≤ 60s (PT60S 이하)
  - snippet.title or snippet.description 에 "#shorts" 포함
  - snippet.tags 에 "shorts" 포함 (있을 수 있음)

      ↓ (불확실 시)

[Layer 2] HEAD 요청 검증 (캐싱)
  HEAD https://www.youtube.com/shorts/{video_id}
  - 200 OK → Shorts 확정
  - 30x or 404 → Shorts 아님
  - 결과는 Redis에 7일 캐싱 (영상 ID는 한번 결정되면 안 바뀜)

      ↓ (확정)

[Layer 3] is_short = TRUE 마킹 + 랭킹 대상 포함
```

### 3.2 안전 가드

```python
# backend/app/services/shorts_detector.py
import httpx
from redis import Redis

YT_SHORTS_URL = "https://www.youtube.com/shorts/{vid}"
CACHE_TTL = 7 * 24 * 3600  # 7 days
HEAD_TIMEOUT = 5.0

async def is_short(
    vid: str,
    duration_sec: int,
    title: str,
    description: str = "",
    tags: list[str] | None = None,
    redis: Redis = ...,
) -> bool:
    """§3.1 Layer 1: API 메타데이터 다층 신호 검사."""
    tags = tags or []
    # 명백히 아닌 케이스
    if duration_sec > 60:
        return False
    # Layer 1: 텍스트 신호 (§3.1 명세 — title·description·tags 모두 검사)
    text_signals = [title.lower(), description.lower()] + [t.lower() for t in tags]
    if any("#shorts" in s or "shorts" in s for s in text_signals):
        return True

    # 캐시 조회
    cached = await redis.get(f"isshort:{vid}")
    if cached is not None:
        return cached == b"1"

    # HEAD 검증 (안전 가드)
    try:
        async with httpx.AsyncClient(
            timeout=HEAD_TIMEOUT,
            follow_redirects=False,   # 리다이렉트 따라가지 않아야 판별 가능
            headers={"User-Agent": "Shorts100Bot/1.0"},
        ) as client:
            r = await client.head(YT_SHORTS_URL.format(vid=vid))
        is_s = r.status_code == 200
    except Exception:
        is_s = duration_sec <= 60  # fallback: duration 기준

    await redis.setex(f"isshort:{vid}", CACHE_TTL, b"1" if is_s else b"0")
    return is_s
```

### 3.3 호출 제어

- 분당 최대 60 HEAD 요청 (`asyncio.Semaphore`)
- 5xx/timeout 누적 시 자동 백오프
- 한 번 판별된 video_id는 다시 묻지 않음 (7일 캐시)

---

<a id="sec-4-adsense"></a>

## §4. AdSense 'Thin Content' 대응 전략 (v2.0 §10 보강)

리뷰어 지적이 매우 정확합니다.
**단순 큐레이션 사이트는 거의 100% 처음 신청에서 거절됩니다.** 사전 대응 필수.

### 4.1 콘텐츠 구조 변경 (출시 전)

| 페이지 | 추가 텍스트 콘텐츠 (자체 생성) |
|---|---|
| `/` (메인) | 상단 고정: 운영자의 오늘의 트렌드 코멘트 3~5줄 (매일 갱신) |
| `/rising` | 상단: "이번 주 주목할 만한 신인 크리에이터 5인" 200~400자 |
| `/category/[slug]` | 카테고리별 트렌드 분석문 (300자+, 주 1회 갱신) |
| `/v/[id]` | 자동 생성 분석 (업로드 후 N시간 만에 M회 돌파 등) |
| `/hall-of-fame` | 주간/월간 회고문 (500자+, 사람이 검수) |
| `/blog/[slug]` | **신규 섹션**: 트렌드 분석 아티클 (주 2회) |

### 4.2 블로그 콘텐츠 자동화 파이프라인 (조심스럽게)

- **반자동**: 데이터로 초안 자동 생성 → 운영자 5분 검수 → 발행
- **품질**: 800~1500자, 자체 그래프 1개 이상 포함, 출처 명시
- **주제 예시**:
  - "5월 3주차 K-쇼츠 트렌드: 댄스 챌린지의 귀환"
  - "구독자 1만에서 10만으로: 떡상 채널 5인의 공통점 분석"
  - "쇼츠 vs 릴스 vs 틱톡: 같은 영상도 플랫폼마다 다른 이유"

### 4.3 SEO 일석이조 효과

- 검색 엔진은 텍스트를 좋아함 → 자연 유입 증가
- AdSense 봇은 텍스트/원본성을 좋아함 → 승인 확률 ↑
- 백링크 유도 (분석 글이 인용됨) → 도메인 권위 ↑

### 4.4 AdSense 신청 타이밍

- ❌ 출시 직후 신청 (Thin Content 거절)
- ✅ **블로그 글 15개 이상 + 일 PV 500 이상 + 운영 30일 이상** 시점에 신청
- 거절 시 90일 후 재신청 가능, 그 사이 콘텐츠 보강

---

<a id="sec-5-timezone"></a>

## §5. 타임존 정책 (v2.0 §3 명시화)

리뷰어 지적대로 시간 일관성은 랭킹 시스템의 생명선.
**혼동 방지를 위한 단일 정책 명시:**

### 5.1 정책

| 레이어 | 타임존 | 이유 |
|---|---|---|
| **컨테이너 OS (`TZ`)** | `Asia/Seoul` | 로그/cron 가독성 |
| **PostgreSQL 저장** | UTC (TIMESTAMPTZ) | DB 표준, 멱등성 |
| **PostgreSQL 표시** | `Asia/Seoul` (`SET TIME ZONE`) | 운영자 디버깅 편의 |
| **API 응답** | ISO 8601 with offset (`+09:00`) | 클라이언트가 변환 |
| **프론트엔드 표시** | 사용자 브라우저 로컬 (kr 기본값) | 글로벌 확장 대비 |
| **랭킹 기준 시각** | UTC 내부 연산, "오늘" = KST 자정~자정 | 운영자/사용자 직관 일치 |

### 5.2 docker-compose 설정

```yaml
services:
  postgres:
    image: postgres:16-alpine
    environment:
      TZ: Asia/Seoul
      PGTZ: Asia/Seoul
    volumes:
      - /etc/localtime:/etc/localtime:ro

  redis:
    image: redis:7-alpine
    environment:
      TZ: Asia/Seoul

  backend:
    environment:
      TZ: Asia/Seoul
      PYTHONUNBUFFERED: "1"

  celery-beat:
    environment:
      TZ: Asia/Seoul   # cron 표현식이 KST 기준이 됨
```

### 5.3 PostgreSQL 세션 설정

```sql
-- alembic 마이그레이션 마지막 단계
ALTER DATABASE shorts100 SET TIME ZONE 'Asia/Seoul';
```

### 5.4 Python 코드 컨벤션

```python
# ❌ 절대 금지
datetime.now()                          # naive datetime
datetime.utcnow()                       # naive UTC (deprecated)

# ✅ 항상 사용
from datetime import datetime, timezone
datetime.now(timezone.utc)              # aware UTC

# 표시할 때만 변환:
import zoneinfo
KST = zoneinfo.ZoneInfo("Asia/Seoul")
dt.astimezone(KST).strftime("%Y-%m-%d %H:%M:%S")
```

---

<a id="sec-6-deeplink"></a>

## §6. 딥링크 폴백 전략

v2.0에서 "딥링크로 원본 앱으로 보낸다"고 했지만,
**앱이 없는 사용자 시나리오**를 다루지 않았습니다. 이건 출시 후 클레임 1순위 이슈입니다.

### 6.1 시나리오 매트릭스

| 디바이스 | 앱 설치 | 기대 동작 |
|---|---|---|
| iOS + YouTube 앱 | ✅ | 앱으로 직접 이동 (Universal Link) |
| iOS + YouTube 앱 X | ❌ | Safari로 `youtube.com/shorts/...` |
| Android + 앱 | ✅ | 앱으로 직접 이동 (App Link) |
| Android + 앱 X | ❌ | Chrome으로 `youtube.com/shorts/...` |
| 데스크톱 | - | 새 탭에서 `youtube.com/shorts/...` |
| 인앱 브라우저 (카톡, 인스타) | - | **가장 까다로움.** 외부 브라우저 이동 안내 |

### 6.2 구현 패턴 (스마트 폴백)

```ts
// frontend/lib/deeplink.ts
type Platform = 'youtube' | 'tiktok' | 'instagram';

export function buildDeepLink(platform: Platform, videoId: string) {
  const ua = navigator.userAgent;
  const isIOS = /iPad|iPhone|iPod/.test(ua);
  const isAndroid = /Android/.test(ua);
  const isInApp = /KAKAOTALK|FBAN|FBAV|Instagram|Line/i.test(ua);

  // 인앱 브라우저: 외부로 강제
  if (isInApp) {
    return {
      url: `https://www.youtube.com/shorts/${videoId}`,
      hint: '외부 브라우저로 열어주세요',  // UI 안내 노출
    };
  }

  // 모바일: 앱 시도 + 1.5초 후 웹 폴백
  // ⚠️  주의: `vnd.youtube://` 는 비공식 스킴입니다.
  //   iOS 공식: `youtube://` (Universal Link 우선, 폴백용)
  //   Android 공식: Intent URI — `intent://...#Intent;package=com.google.android.youtube;end`
  //   출시 전 반드시 실기기(iOS/Android) QA 필수 (§16 체크리스트 참조)
  if (isIOS) {
    return {
      url: `youtube://shorts/${videoId}`,
      fallback: `https://www.youtube.com/shorts/${videoId}`,
      delay: 1500,
    };
  }
  if (isAndroid) {
    return {
      url: `intent://shorts/${videoId}#Intent;scheme=youtube;package=com.google.android.youtube;end`,
      fallback: `https://www.youtube.com/shorts/${videoId}`,
      delay: 1500,
    };
  }

  // 데스크톱
  return { url: `https://www.youtube.com/shorts/${videoId}` };
}
```

### 6.3 카카오톡 인앱 브라우저 우회

가장 흔한 한국 사용자 진입로(카톡 공유)인데, 앱 스킴이 막혀있습니다.

- "카카오톡 외부 브라우저로 열기" 안내 노출 (Chrome/Safari 아이콘 + 가이드)
- 또는 `kakaotalk://web/openExternal?url=...` 시도 (안드로이드만 일부 동작)

### 6.4 측정

- 클릭 → 외부 전환 성공률 (`navigator.sendBeacon`으로 떠나기 전 이벤트 전송)
- 인앱 브라우저 비율 (UA 분석)
- 폴백 발생률

---

<a id="sec-7-pipa"></a>

## §7. PIPA + 쿠키 동의 UX

v2.0에 `user_events` 테이블이 있는데, **이걸 합법적으로 수집하려면 동의가 필요**합니다.
한국 개인정보보호법은 GDPR보다 처벌이 약하지 않습니다.

### 7.1 한국 법령 핵심

- **개인정보보호법 제22조**: 개인정보 수집·이용 동의 필수
- **정보통신망법**: 쿠키 등 정보수집 사용 시 사전 고지
- **2023년 개정**: 행위 기반 광고/추적은 별도 동의 필수
- **과징금**: 위반 매출의 3%까지 (스타트업도 예외 없음)

### 7.2 데이터 분류

| 데이터 | 동의 필요 | 출시 시 정책 |
|---|---|---|
| 익명 페이지뷰 (서버 로그) | ❌ 불필요 | 기본 수집 |
| 세션 ID 기반 클릭 로깅 | ⚠️ 고지 필요 | 쿠키 배너에 명시 |
| 행위 기반 개인화 | ✅ 별도 동의 | 옵트인 (오프 기본값) |
| AdSense/광고 쿠키 | ✅ 별도 동의 | 옵트인 (오프 기본값) |
| 회원가입 시 이메일 | ✅ 명시 동의 | 가입 단계에서 동의 |

### 7.3 쿠키 배너 (출시 필수)

```
┌──────────────────────────────────────────────────────────┐
│ 🍪 더 나은 경험을 위한 쿠키 안내                            │
│                                                          │
│ Shorts100은 서비스 운영을 위해 다음을 사용합니다:           │
│  • 필수: 세션 유지 (꺼짐 불가)                             │
│  • 분석: 익명 사용 패턴 (Plausible)        [✓] 동의        │
│  • 광고: 맞춤형 광고 (AdSense, 도입 시점)   [ ] 동의        │
│                                                          │
│  [모두 거부]  [선택만 허용]  [모두 동의]   [자세히 보기]    │
└──────────────────────────────────────────────────────────┘
```

- **Dark Pattern 금지**: "모두 동의"가 더 크거나 강조되어선 안 됨 (법 위반)
- **거부 동등한 노출**: GDPR보다 약하지만 EU 가이드라인 따르는 게 안전
- **재동의**: 6개월마다 또는 정책 변경 시

> 보안 감사 단계는 [§12 PIPA 보안 감사](#sec-12-pipa-audit)에서 별도로 다룹니다.

### 7.4 개인정보처리방침 (필수 페이지)

- 변호사 자문 시 동시에 검토받기 (10~20만원 추가)
- 한국인터넷진흥원(KISA) 가이드 템플릿 참고
- 페이지 푸터 모든 페이지에 링크

### 7.5 DB 스키마 보강

```sql
-- user_events에 동의 상태 기록
ALTER TABLE user_events
  ADD COLUMN consent_analytics BOOLEAN DEFAULT FALSE,
  ADD COLUMN consent_advertising BOOLEAN DEFAULT FALSE;

-- 동의 이력 (감사 추적)
CREATE TABLE consent_log (
    id              BIGSERIAL PRIMARY KEY,
    session_id      UUID NOT NULL,
    consent_type    VARCHAR(32) NOT NULL,   -- 'analytics', 'advertising'
    granted         BOOLEAN NOT NULL,
    user_agent      TEXT,
    ip_hash         CHAR(64),              -- SHA-256 of IP (raw IP 저장 금지)
    created_at      TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_consent_session ON consent_log(session_id, created_at);
```

---

<a id="sec-8-brand-safety"></a>

## §8. 브랜드 안전 필터

알고리즘이 잘 작동할수록 **논란 영상**이 상위에 노출될 가능성이 커집니다.
광고주 이탈, 법적 문제, 평판 리스크 직결.

### 8.1 자동 필터링 신호

| 신호 | 처리 |
|---|---|
| 영상 제목/설명에 **욕설/혐오 키워드** | 자동 격리 (review queue) |
| **연령 제한** 영상 (YT API `contentRating`) | 메인에서 제외, `/adult` 별도 |
| **좋아요 대비 댓글 비율**이 정상 범위 벗어남 | 운영자 검토 큐 |
| **빠른 신고 누적** (24h 내 5건+) | 자동 임시 숨김 → 검토 |

### 8.2 DB 스키마

```sql
ALTER TABLE videos
  ADD COLUMN safety_status VARCHAR(16) DEFAULT 'unreviewed',
  -- 'unreviewed', 'safe', 'flagged', 'hidden', 'banned'
  ADD COLUMN safety_score DOUBLE PRECISION,  -- 0.0 안전 ~ 1.0 위험
  ADD COLUMN flagged_reason TEXT;

CREATE INDEX idx_videos_safety ON videos(safety_status)
  WHERE safety_status IN ('flagged', 'unreviewed');

-- 신고 시스템
CREATE TABLE video_reports (
    id              BIGSERIAL PRIMARY KEY,
    video_id        BIGINT REFERENCES videos(id),
    session_id      UUID,
    reason          VARCHAR(32) NOT NULL,
    -- 'spam', 'inappropriate', 'copyright', 'other'
    description     TEXT,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    resolved_at     TIMESTAMPTZ,
    resolved_action VARCHAR(32)   -- 'no_action', 'hidden', 'banned'
);
```

### 8.3 키워드 사전 (출시 시점)

- 1차: 한국어 욕설 + 혐오 표현 약 200개 (오픈소스 사전 활용: `korcen` 등)
- 2차: 도메인 특화 (성인, 폭력, 정치적 극단)
- 정기 업데이트: 월 1회 검토 + 사용자 신고로 발견된 신규 패턴 추가

### 8.4 운영 워크플로우

```
[신규 영상 수집] → safety_status = 'unreviewed'
        ↓
[키워드/메타 자동 스캔] → safety_score 산출
        ↓
점수 < 0.3 → 'safe' (랭킹 노출 OK)
점수 0.3~0.7 → 'flagged' (운영자 검토 큐)
점수 > 0.7 → 'hidden' (자동 숨김 + 운영자 확인)
        ↓
[운영자 검토] (관리자 대시보드, 하루 30분 운영)
        ↓
최종 'safe' / 'banned' 확정
```

### 8.5 운영 비용

- 일 30분 (출시 초기) → 일 5~10분 (자동화 안정화 후)
- 외주 검토 단가: 영상당 50~100원 (DAU 1만 돌파 시 검토)

> 캐시 폭주 대비 정책은 [§11 캐시 Eviction & Fallback](#sec-11-cache)에서 다룹니다.

---

<a id="sec-9-dependencies"></a>

## §9. Dependencies (의존성 표) 🆕

### 9.1 백엔드 (Python 3.12)

| 패키지 | 버전 (권장) | 용도 | 비고 |
|---|---|---|---|
| `fastapi` | ^0.110 | 비동기 웹 프레임워크 | 메인 |
| `uvicorn[standard]` | ^0.27 | ASGI 서버 | `--workers` 설정 필수 |
| `pydantic` | ^2.6 | 모델/검증 | v2 (성능 ↑) |
| `pydantic-settings` | ^2.2 | 환경변수 관리 | `.env` 로드 |
| `sqlalchemy` | ^2.0 | ORM | async 지원 |
| `alembic` | ^1.13 | DB 마이그레이션 | |
| `asyncpg` | ^0.29 | PostgreSQL 드라이버 | async |
| `redis` | ^5.0 | Redis 클라이언트 | hiredis 포함 |
| `celery[redis]` | ^5.3 | 분산 작업 큐 | |
| `httpx` | ^0.27 | 비동기 HTTP | API/스크래핑 |
| `tenacity` | ^8.2 | 재시도 정책 | 지수 백오프 |
| `google-api-python-client` | ^2.x | YouTube Data API | |
| `sentry-sdk[fastapi]` | ^1.40 | 에러 트래킹 | 무료 5k/월 |
| `prometheus-fastapi-instrumentator` | ^7.0 | 메트릭 노출 | `/metrics` |
| `structlog` | ^24.1 | 구조화 로깅 | JSON 로그 |
| `pybreaker` | ^1.0 | Circuit Breaker | Redis fallback용 |
| `korcen` | latest | 한국어 욕설 필터 | 브랜드 안전 |
| `python-multipart` | ^0.0.9 | 폼 데이터 | |
| `pyjwt` | ^2.8 | JWT (회원 단계) | Phase 2 |

### 9.2 백엔드 개발 도구 (dev)

| 패키지 | 버전 | 용도 |
|---|---|---|
| `ruff` | ^0.3 | 린터 + 포매터 (black 대체) |
| `mypy` | ^1.9 | 타입 체커 (strict 모드) |
| `pytest` | ^8.0 | 테스트 프레임워크 |
| `pytest-asyncio` | ^0.23 | async 테스트 |
| `pytest-cov` | ^4.1 | 커버리지 |
| `httpx` | ^0.27 | TestClient용 |
| `respx` | ^0.20 | httpx 모킹 |
| `freezegun` | ^1.4 | 시간 모킹 (decay 테스트) |
| `factory-boy` | ^3.3 | 테스트 픽스처 |

### 9.3 프론트엔드 (Node 20+ / TypeScript 5+)

| 패키지 | 버전 | 용도 |
|---|---|---|
| `next` | ^14.2 | 프레임워크 (App Router) |
| `react` | ^18.2 | |
| `typescript` | ^5.4 | |
| `tailwindcss` | ^3.4 | 스타일링 (JIT) |
| `@tanstack/react-virtual` | ^3.0 | DOM 가상화 ([§2 참조](#sec-2-virtualization)) |
| `@tanstack/react-query` | ^5.0 | 서버 상태 관리 |
| `framer-motion` | ^11 | 스크롤 애니메이션 |
| `next-intl` | ^3.0 | i18n ([§14 참조](#sec-14-i18n)) |
| `@vercel/og` | ^0.6 | OG 이미지 자동 생성 |
| `zod` | ^3.22 | 런타임 검증 |
| `date-fns` | ^3.6 | 날짜 처리 |
| `date-fns-tz` | ^3.1 | KST 변환 ([§5 참조](#sec-5-timezone)) |
| `lucide-react` | latest | 아이콘 |
| `clsx` | ^2.1 | 클래스명 조합 |

### 9.4 프론트엔드 개발 도구 (dev)

| 패키지 | 버전 | 용도 |
|---|---|---|
| `eslint` | ^8 | 린터 (Next.js 기본) |
| `prettier` | ^3.2 | 포매터 |
| `@playwright/test` | ^1.42 | E2E 테스트 ([§10 참조](#sec-10-test)) |
| `vitest` | ^1.4 | 유닛 테스트 |
| `@testing-library/react` | ^14 | 컴포넌트 테스트 |
| `axe-playwright` | ^2.0 | 접근성 자동 검사 ([§13 참조](#sec-13-a11y)) |
| `@lhci/cli` | ^0.13 | Lighthouse CI |

### 9.5 인프라 / 서비스

| 항목 | 버전/플랜 | 용도 | 비용 |
|---|---|---|---|
| Docker | 26+ | 컨테이너 | 무료 |
| Docker Compose | v2 | 오케스트레이션 | 무료 |
| PostgreSQL | 16-alpine | 메인 DB | 무료 |
| Redis | 7-alpine | 캐시 + Celery broker | 무료 |
| Nginx | 1.26-alpine | 리버스 프록시 | 무료 |
| Cloudflare | Free | CDN + WAF + Tunnel | 무료 |
| Sentry | Free | 에러 트래킹 5k/월 | 무료 |
| UptimeRobot | Free | 외부 헬스체크 | 무료 |
| Plausible (self-hosted) | latest | 분석 | 무료 |
| GitHub Actions | Free | CI/CD 2,000분/월 | 무료 |

### 9.6 핵심 정책

- **버전 고정**: `^` (마이너 자동 업그레이드), `~` 미사용
- **자동 PR**: Renovate Bot 또는 Dependabot으로 주간 PR
- **Lockfile 필수**: `poetry.lock` (Python), `package-lock.json` (Node) 커밋
- **보안 스캔**: `pip-audit`, `npm audit` CI에서 매주 실행

---

<a id="sec-10-test"></a>

## §10. Test Coverage 전략 🆕

> "테스트 없는 코드는 부서질 때까지 동작하는 코드다."

### 10.1 테스트 피라미드

```
       /\
      /E2\        E2E (Playwright)
     /----\       - 핵심 사용자 시나리오 5~10개
    /Integ \      - 모바일 + 데스크톱 viewport
   /--------\    Integration (pytest + TestClient)
  /  Unit    \    - DB + Redis + API 통합
 /------------\   - 외부 API는 respx로 모킹
                 Unit (vitest / pytest)
                  - 비즈니스 로직 (알고리즘, 필터)
                  - 순수 함수 우선
```

### 10.2 커버리지 목표

| 레이어 | 도구 | 최소 커버리지 | CI 차단 임계값 |
|---|---|---|---|
| 백엔드 유닛 | pytest + pytest-cov | 80% | < 75% PR 차단 |
| 백엔드 통합 | pytest | (별도 측정) | 핵심 엔드포인트 100% |
| 프론트엔드 유닛 | vitest | 70% | < 65% PR 차단 |
| E2E | Playwright | (시나리오 기반) | 모든 P0 시나리오 통과 |

### 10.3 ✅ 백엔드 Unit Test 체크리스트

```python
# 예시: 알고리즘 테스트 (가장 중요)
# tests/unit/test_ranking.py
def test_unified_score_decay():
    """오래된 영상일수록 점수 감소."""
    young = compute_score(views=1_000_000, age_hours=1)
    old   = compute_score(views=1_000_000, age_hours=72)
    assert young > old * 2  # decay 효과 검증

def test_zscore_normalization():
    """동일 조회수도 분포에 따라 점수가 달라야 한다."""
    ...

def test_freshness_tier_transitions():
    """24h 직전·직후로 tier가 HOT→WARM 전환."""
    ...
```

- [ ] **알고리즘**: Z-score 정규화, 시간 감쇠, 가속도, 통합 점수 (모두 격리 테스트)
- [ ] **Shorts 식별**: duration, hashtag, HEAD 응답 시나리오 4종
- [ ] **Freshness Tier**: 경계값 (24h, 72h, 7d, 30d) 정확성
- [ ] **Brand Safety**: 키워드 매칭, score 임계값
- [ ] **Deeplink 생성**: iOS/Android/카톡/데스크톱 UA별
- [ ] **타임존 변환**: UTC↔KST 양방향, DST 없음 보장
- [ ] **Pydantic 모델**: 잘못된 페이로드 거부

### 10.4 ✅ Integration Test 체크리스트

```python
# tests/integration/test_youtube_pipeline.py
@pytest.mark.asyncio
async def test_full_collection_pipeline(db, redis, mock_youtube):
    """수집 → DB 저장 → 랭킹 산출 → Redis 캐싱 end-to-end."""
    mock_youtube.add_response(...)
    await run_collector()
    rankings = await get_rankings(rank_type='global')
    assert len(rankings) == 100
    cached = await redis.zrange('ranking:global:current', 0, -1)
    assert len(cached) == 100
```

- [ ] **DB 마이그레이션**: clean state에서 `alembic upgrade head` 통과
- [ ] **Celery 태스크**: 수집 → 저장 → 랭킹 산출 흐름 (mock API)
- [ ] **Redis 캐싱**: TTL, 무효화, eviction 동작
- [ ] **API 엔드포인트**: 200/404/422/500 케이스
- [ ] **YouTube API 쿼터 추적**: 한계 도달 시 자동 스로틀
- [ ] **신고 시스템**: 신고 누적 → 자동 hidden 전환
- [ ] **동의 로그**: consent_log 무결성 (HMAC 서명)

### 10.5 ✅ E2E Test 체크리스트 (Playwright)

```ts
// tests/e2e/ranking.spec.ts
test('메인 페이지 첫 10개 카드가 1.5초 내 표시된다', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('[data-testid="video-card"]'))
    .toHaveCount(10, { timeout: 1500 });
});

test('무한 스크롤이 다음 페이지를 로드한다', async ({ page }) => {
  ...
});

test('카드 클릭 시 YouTube 딥링크가 발생한다', async ({ page }) => {
  ...
});
```

- [ ] **메인 로딩**: 첫 10개 카드 1.5초 내 표시 (LCP 검증)
- [ ] **무한 스크롤**: 70% 스크롤 시점에 다음 페이지 로드
- [ ] **딥링크**: 클릭 → URL 이동/시도 확인
- [ ] **쿠키 배너**: 첫 방문 노출, 동의 저장, 재방문 시 미노출
- [ ] **카테고리 전환**: 5종 카테고리 모두 데이터 표시
- [ ] **Rising 페이지**: 다른 데이터 표시 (메인과 구분)
- [ ] **모바일 viewport**: iPhone 12, Pixel 5
- [ ] **접근성**: axe-playwright 자동 검사 위반 0개

### 10.6 ✅ Performance / Load Test 체크리스트

```bash
# k6 스크립트 예시
k6 run --vus 1000 --duration 5m loadtest.js
```

- [ ] **API p95 < 500ms** (DAU 5,000 시점 가정 1,000 동시 사용자)
- [ ] **EXPLAIN ANALYZE**: 모든 핵심 쿼리 인덱스 사용 확인
- [ ] **Redis hit rate > 90%** (핫 데이터 기준)
- [ ] **메모리 누수**: 1시간 sustained 부하 후 RSS 안정성
- [ ] **Lighthouse Mobile ≥ 90** (Performance, Accessibility, Best Practices, SEO)

### 10.7 CI/CD 파이프라인 (GitHub Actions)

```yaml
# .github/workflows/ci.yml (요약)
on: [pull_request, push]
jobs:
  lint:        # ruff, mypy, eslint, prettier
  unit:        # pytest -q + vitest --run
  integration: # pytest -m integration (with docker compose up)
  build:       # docker build, push to registry
  deploy-staging:  # main 브랜치 push 시, staging 서버에 배포
    needs: [build]
  e2e:             # ← staging 배포 완료 후 실행 (순서 중요)
    needs: [deploy-staging]
    # 흐름: deploy-staging → wait-for-health (/health 200) → playwright 실행
    steps:
      - name: Wait for staging health
        run: |
          for i in $(seq 1 30); do
            curl -sf https://staging.shorts100.com/health && break || sleep 5
          done
      - name: Run Playwright E2E
        run: npx playwright test
  deploy-prod:     # main 머지 + e2e 통과 후만, SSH로 prod 서버
    needs: [e2e]
    # 무중단 배포(Zero-Downtime) 및 롤백 지원 로직 포함
```

- **PR Merge 차단 조건**: lint + unit + integration 통과 + 커버리지 임계값 유지
- **E2E 실행 시점**: PR 단계에서는 통합 테스트까지만, **main 머지 후 staging 배포 뒤** Playwright 실행
- **무중단 배포 (Zero-Downtime)**: `deploy-prod` 시 Nginx reload를 활용한 Blue/Green 배포 로직 또는 FastAPI Graceful Shutdown 적용하여 배포 중 요청 유실 방지
- **롤백 (Rollback)**: 배포 직후 헬스체크 실패 시 즉각 이전 이미지 태그로 복구하는 파이프라인 명시
- **Nightly**: E2E 풀스위트 + 성능 회귀 테스트 (prod 대상)
- **알람**: Slack/Telegram 봇으로 실패 즉시 통지

---

<a id="sec-11-cache"></a>

## §11. 캐시 Eviction & Fallback 전략 🆕

v2.1에서 `maxmemory-policy allkeys-lru`만 언급했지만, **실제 운영에서는 핵심 데이터가 LRU에 의해 날아가면 안 됩니다.** 분리 전략 필요.

### 11.1 Redis 인스턴스 분리 (논리 DB 방식 사용 금지)

> ⚠️ **설계 주의**: Redis의 `maxmemory-policy`는 **인스턴스 전체**에 적용됩니다.
> 논리 DB(SELECT 0/1/2)는 메모리 풀을 공유하므로 DB별로 다른 eviction 정책을 설정할 수 없습니다.
> **인스턴스를 분리**해야 의도한 동작을 구현할 수 있습니다.

| 인스턴스 | 포트 | 용도 | maxmemory-policy | 키 패턴 |
|---|---|---|---|---|
| **redis-cache** | 6379 | 일시 캐시 | `allkeys-lru` | `video:meta:*`, `isshort:*` |
| **redis-state** | 6380 | 중요 상태 + Celery | `noeviction` | `ranking:*`, `api:quota:*`, Celery 큐 |

```yaml
# docker-compose.yml
redis-cache:
  image: redis:7-alpine
  command: redis-server --maxmemory 2gb --maxmemory-policy allkeys-lru --appendonly yes
  ports: ["6379:6379"]

redis-state:
  image: redis:7-alpine
  command: redis-server --maxmemory 512mb --maxmemory-policy noeviction --appendonly yes
  ports: ["6380:6380"]
```

환경변수 구분:
```bash
REDIS_CACHE_URL=redis://redis-cache:6379/0
REDIS_STATE_URL=redis://redis-state:6379/0  # 내부 포트는 동일, 컨테이너명으로 분리
```

### 11.2 키별 TTL 정책

| 키 패턴 | TTL | Eviction 대상 | 비고 |
|---|---|---|---|
| `ranking:global:current` | 10분 | ❌ noeviction | 메인 페이지 응답 핵심 |
| `ranking:rising:current` | 15분 | ❌ noeviction | |
| `ranking:cat:*:current` | 15분 | ❌ noeviction | |
| `video:meta:{id}` | 1시간 | ✅ LRU 허용 | 손실 시 DB 폴백 |
| `isshort:{id}` | 7일 | ✅ LRU 허용 | 손실 시 HEAD 재요청 |
| `api:quota:youtube:{date}` | 25시간 | ❌ noeviction | 쿼터 추적 |
| `consent:{session}` | 6개월 | ❌ noeviction | 법적 증빙 |
| `session:{id}` | 24시간 | ✅ LRU 허용 | |

### 11.3 캐시 폭주 시나리오와 대응

| 시나리오 | 발생 조건 | 대응 |
|---|---|---|
| **Cache Stampede** (캐시 만료 동시 발생) | 메인 페이지 ranking 캐시 만료 + 1,000+ req | `redis-py` 의 `Lock` + Probabilistic Early Recomputation |
| **Hot Key 폭주** | 특정 영상 메타데이터 집중 조회 | 로컬 LRU 캐시 (Python `functools.lru_cache`) 1차 + Redis 2차 |
| **Redis 메모리 80% 도달** | 트래픽 폭증 | Prometheus 알람 → 즉시 `MEMORY STATS` 분석, DB 0의 LRU 활성화 확인 |
| **Redis 인스턴스 다운** | 하드웨어/네트워크 | Circuit Breaker (`pybreaker`) → DB 직접 조회 (degraded mode) |

### 11.4 Circuit Breaker 패턴

```python
# backend/app/core/cache.py
import pybreaker
from redis.asyncio import Redis

redis_breaker = pybreaker.CircuitBreaker(
    fail_max=5,             # 5회 연속 실패 시 열림
    reset_timeout=30,       # 30초 후 half-open 상태로 재시도
)

@redis_breaker
async def get_cached_ranking(rank_type: str) -> list | None:
    return await redis.zrevrange(f"ranking:{rank_type}:current", 0, 99)

async def get_ranking(rank_type: str):
    """캐시 우선, 실패 시 DB 폴백."""
    try:
        cached = await get_cached_ranking(rank_type)
        if cached:
            return cached
    except pybreaker.CircuitBreakerError:
        log.warning("Redis circuit open, falling back to DB")
    # DB 폴백 (느리지만 동작은 함)
    return await db_get_ranking(rank_type)
```

### 11.5 정적 Fallback 페이지

극단적 상황 (DB + Redis 모두 다운):

- Cloudflare에서 **5분마다 메인 페이지 HTML을 R2/Workers KV에 스냅샷**
- Origin 5xx 응답 시 Cloudflare가 정적 스냅샷 서빙 (Cloudflare Rules: `If origin returns 5xx, serve from cache`)
- 사용자에게 "데이터 갱신 중" 배너 노출

### 11.6 모니터링 임계값

| 지표 | 경고 | 알람 |
|---|---|---|
| Redis used_memory_rss / maxmemory | 70% | 85% |
| Hit Rate | < 85% | < 70% |
| Connection 수 | > 1,000 | > 5,000 |
| Slowlog (10ms 이상) | 분당 1+ | 분당 10+ |

### 11.7 캐시 워밍 (Cache Warming) 전략

Redis가 재시작되거나 초기화되는 **콜드 스타트(Cold Start)** 시, 트래픽이 일시적으로 DB로 쏠려 장애가 발생할 수 있습니다.
- **대응 방안**: 애플리케이션 시작 시(혹은 배포 직후) Celery Task를 통해 메인 랭킹 및 주요 메타데이터를 Redis에 미리 적재하는 캐시 워밍 스크립트를 백그라운드에서 실행합니다.

---

<a id="sec-12-pipa-audit"></a>

## §12. PIPA 보안 감사 단계 🆕

[§7 PIPA + 쿠키 동의 UX](#sec-7-pipa)가 UX 계층이라면, 여기서는 **저장·전송·운영 계층의 보안**을 다룹니다.

### 12.1 데이터 분류와 보호 수준

| 분류 | 예시 | 저장 정책 | 전송 정책 |
|---|---|---|---|
| **민감 정보** | 없음 (수집 자체 안 함) | - | - |
| **개인 식별 가능 (PII)** | 이메일 (Phase 2 회원), IP | 암호화 저장 (AES-256-GCM) | TLS 1.3 |
| **준식별 정보** | 세션 ID, UA | 해싱 (SHA-256 + salt) | TLS 1.3 |
| **공개 데이터** | 영상 메타, 랭킹 | 평문 저장 OK | TLS 1.3 (선택) |

### 12.2 쿠키 동의 저장의 무결성 보장

#### A. 동의 정보 HMAC 서명

```python
# backend/app/services/consent.py
import hmac
import hashlib
import time  # ← naive 사용 허용 (wall-clock 타임스탬프 목적)
from app.config import settings

def sign_consent(session_id: str, consent_type: str, granted: bool) -> str:
    """동의 데이터의 무결성을 위한 HMAC-SHA256 서명.

    Python hmac.new() 는 hmac.HMAC() 의 별칭입니다.
    Ref: https://docs.python.org/3/library/hmac.html
    """
    payload = f"{session_id}|{consent_type}|{granted}|{int(time.time())}"
    return hmac.new(
        settings.CONSENT_HMAC_KEY.encode(),
        payload.encode(),
        hashlib.sha256,
    ).hexdigest()

def verify_consent_signature(record: ConsentLog) -> bool:
    expected = sign_consent(record.session_id, record.consent_type, record.granted)
    return hmac.compare_digest(expected, record.signature)
```

스키마 보강:

```sql
ALTER TABLE consent_log
  ADD COLUMN signature CHAR(64) NOT NULL,
  ADD COLUMN signed_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
```

#### B. IP 해싱 (raw IP 저장 금지)

```python
# 일일 salt rotation
import hashlib
from datetime import date

def hash_ip(ip: str) -> str:
    today = date.today().isoformat()
    daily_salt = settings.IP_SALT_BASE + today
    return hashlib.sha256(f"{daily_salt}{ip}".encode()).hexdigest()
```

- 일일 salt 회전 → 동일 IP라도 다른 날엔 다른 해시 (장기 추적 방지)
- 7일 후 IP 해시도 익명 통계로만 사용

#### C. 쿠키 보안 속성 (필수)

```ts
// frontend: cookie 발급 시
document.cookie =
  `sid=${uuid}; ` +
  `Max-Age=86400; ` +
  `Path=/; ` +
  `Secure; ` +              // HTTPS only
  `HttpOnly; ` +            // JS 접근 차단 (서버 발급 시)
  `SameSite=Lax`;           // CSRF 완화
```

### 12.3 ✅ 보안 감사 체크리스트 (출시 전 필수)

- [ ] **저장**
  - [ ] 모든 PII는 저장 전 익명화 또는 암호화
  - [ ] DB 백업 파일 AES-256 암호화 (외장 SSD + 클라우드)
  - [ ] DB 접속 자격증명은 `.env` (커밋 금지) + 권한 분리
- [ ] **전송 및 방어**
  - [ ] HTTPS 강제 (Cloudflare Full Strict)
  - [ ] HSTS 헤더 (max-age=31536000)
  - [ ] 내부 통신도 TLS (Cloudflare Tunnel 자동)
  - [ ] **Rate Limiting**: FastAPI 단(`SlowAPI`) 및 WAF를 통해 어뷰징 방지
- [ ] **인증/인가**
  - [ ] 관리자 대시보드 2FA 필수
  - [ ] API 키는 환경변수, 절대 코드/git 노출 X
  - [ ] `git-secrets` pre-commit hook 설치
- [ ] **로깅**
  - [ ] 로그에 PII 마스킹 (이메일, IP 평문 금지)
  - [ ] 로그 보존 30일 후 자동 삭제
- [ ] **동의 처리**
  - [ ] consent_log에 HMAC 서명 (변조 방지)
  - [ ] 동의 철회 시 즉시 데이터 삭제 + 백업 30일 후 삭제
  - [ ] 6개월마다 재동의 안내
- [ ] **개인정보 영향평가(PIA)**
  - [ ] 50만 명 이상 처리 도달 시 PIA 수행
  - [ ] 변호사 자문 (위탁 처리 명시: Cloudflare, Sentry, Plausible 등)
- [ ] **침해 사고 대응**
  - [ ] 72시간 내 신고 매뉴얼 작성
  - [ ] 사고 시뮬레이션 분기 1회

### 12.4 자동화된 보안 검사 (CI 통합)

```yaml
# .github/workflows/security.yml
- name: Secrets scan
  uses: trufflesecurity/trufflehog@main

- name: Python deps audit
  run: pip-audit --strict

- name: Node deps audit
  run: npm audit --audit-level=high

- name: Docker image scan
  uses: aquasecurity/trivy-action@master
```

---

<a id="sec-13-a11y"></a>

## §13. 접근성 (WCAG 2.1 AA) 🆕

쿠키 배너만 시각적 mockup이 있고 ARIA·키보드 내비게이션 명세가 없었던 부분 보완.
**한국에서도 장애인차별금지법 제21조가 적용되며, 공공·금융이 아니어도 권고 사항입니다.**

### 13.1 핵심 원칙 (WCAG 2.1 AA 기준)

| 원칙 | 의미 | 구체 적용 |
|---|---|---|
| **인식 가능** (Perceivable) | 모두가 볼/들을 수 있음 | 색 대비 4.5:1, alt 텍스트, 자막 |
| **운용 가능** (Operable) | 키보드로 모든 조작 가능 | Tab/Shift+Tab/Enter/Space |
| **이해 가능** (Understandable) | 명확하고 일관된 UI | 명시적 라벨, 에러 메시지 |
| **견고함** (Robust) | 보조 기술 호환 | 표준 HTML + ARIA |

### 13.2 색 대비

- 본문 텍스트 대 배경: **4.5:1 이상** (Tailwind `text-gray-700 on white` = 7.4:1 OK)
- 대제목 (18pt+): **3:1 이상**
- 다크 모드 별도 검증 필수

```ts
// 디자인 토큰 (tailwind.config.ts)
// 모든 텍스트 색은 대비 검증 통과한 것만 사용
export const colors = {
  text: {
    primary: 'oklch(0.20 0 0)',     // 대비 14:1 (against white)
    secondary: 'oklch(0.40 0 0)',   // 대비 6.5:1
    muted: 'oklch(0.55 0 0)',       // 대비 4.6:1 (본문 최소선)
  },
};
```

### 13.3 키보드 내비게이션

| 요소 | 키 | 동작 |
|---|---|---|
| 영상 카드 | `Tab` | 카드별 포커스 이동 |
| 영상 카드 | `Enter` / `Space` | 딥링크 열기 |
| 카테고리 탭 | `← →` | 카테고리 전환 |
| 무한 스크롤 | `Page Down` | 다음 카드들로 이동 |
| 쿠키 배너 | `Tab` | 옵션 → 버튼 순회 |
| 쿠키 배너 | `Esc` | 임시 닫기 (필수 쿠키만 동의) |

```tsx
// 모든 카드는 button 또는 a로 감싸기
<a
  href={deeplink}
  className="block focus:ring-2 focus:ring-blue-500 focus:outline-none"
  aria-label={`${rank}위 영상: ${title} - ${channelName}`}
  onKeyDown={e => {
    if (e.key === 'Enter' || e.key === ' ') handleClick();
  }}
>
  <VideoCard ... />
</a>
```

### 13.4 ARIA 역할과 라벨

```tsx
// 영상 카드
<article
  role="article"
  aria-labelledby={`video-title-${id}`}
  aria-describedby={`video-stats-${id}`}
>
  <span aria-label={`현재 순위 ${rank}위`} className="text-6xl">
    {rank}
  </span>
  <h3 id={`video-title-${id}`}>{title}</h3>
  <span aria-label="YouTube 영상">📺</span>  {/* 플랫폼 뱃지 */}
  <div id={`video-stats-${id}`}>
    <span aria-label={`조회수 ${formatLong(views)}`}>{formatShort(views)}</span>
    <span aria-label={`좋아요 ${formatLong(likes)}`}>{formatShort(likes)}</span>
  </div>
</article>

// 무한 스크롤 알림
<div role="status" aria-live="polite" className="sr-only">
  {newItemsCount > 0 && `새로운 영상 ${newItemsCount}개가 추가되었습니다.`}
</div>

// 쿠키 배너 (모달 패턴)
<div
  role="dialog"
  aria-modal="true"
  aria-labelledby="cookie-title"
  aria-describedby="cookie-desc"
>
  <h2 id="cookie-title">쿠키 사용 동의</h2>
  <p id="cookie-desc">서비스 운영을 위한 쿠키 사용에 동의해 주세요.</p>
  ...
</div>
```

### 13.5 미디어 / 모션 접근성

```tsx
// 3초 미리보기는 prefers-reduced-motion 존중
const prefersReducedMotion = useMediaQuery('(prefers-reduced-motion: reduce)');

<video
  autoPlay={!prefersReducedMotion}
  muted
  loop
  playsInline
  preload="metadata"
  aria-label={`${title} 미리보기`}
>
  ...
</video>
```

- 자동 재생 영상은 음소거 기본
- 사용자가 OS에서 "동작 줄이기" 설정 시 자동 정지
- Framer Motion 사용 시 `useReducedMotion()` 훅 호출

### 13.6 ✅ 접근성 테스트 체크리스트

- [ ] **자동 검사**: `axe-playwright`로 모든 E2E 시나리오 검증, 위반 0개
- [ ] **Lighthouse Accessibility ≥ 90** (CI에서 자동 측정)
- [ ] **키보드 단독 통과**: 메인 → 카드 클릭 → 카테고리 전환 → 쿠키 배너 동의까지 마우스 없이
- [ ] **스크린 리더 수동 검증**: VoiceOver(macOS/iOS) + NVDA(Windows) 각 1회
- [ ] **색 대비**: 모든 디자인 토큰 WebAIM Contrast Checker 통과
- [ ] **줌 200%**: 페이지 깨짐 없이 사용 가능
- [ ] **터치 타겟**: 최소 44×44 px (모바일)
- [ ] **포커스 인디케이터**: 모든 인터랙티브 요소에서 시각적으로 명확

---

<a id="sec-14-i18n"></a>

## §14. 국제화 (i18n) 준비 🆕

출시 시점은 한국어 단독이지만, **출시 전부터 i18n 추상화를 적용**해두면 12개월 후 영어/일본어 확장 비용이 1/5로 줍니다.

### 14.1 단계별 계획

| Phase | 시점 | 언어 | 동작 |
|---|---|---|---|
| **Phase 1** | 출시~6개월 | ko-KR only | i18n 코드 구조만 적용 (1개 언어 파일) |
| **Phase 2** | 6~9개월 | + en-US | 글로벌 사용자 유입 시작 |
| **Phase 3** | 9~12개월 | + ja-JP | 일본 콘텐츠/시장 확장 |

### 14.2 기술 선택: `next-intl`

| 옵션 | 장점 | 단점 |
|---|---|---|
| **next-intl** | Next.js 14 App Router 공식 권장, ICU 메시지 형식 지원 | (없음, 표준 선택) |
| next-i18next | 성숙도 ↑ | Pages Router용, App Router 비공식 |
| react-i18next 단독 | 유연 | Next.js 통합 직접 구현 부담 |

**→ `next-intl` 채택**

### 14.3 디렉토리 구조

```
frontend/
├── messages/
│   ├── ko.json          # 출시 시점
│   ├── en.json          # Phase 2
│   └── ja.json          # Phase 3
├── i18n/
│   ├── config.ts        # locale 목록, 기본값
│   ├── routing.ts       # URL 정책
│   └── request.ts       # 서버 컴포넌트용 로더
├── app/
│   └── [locale]/        # /ko/*, /en/*, /ja/*
│       ├── page.tsx
│       ├── rising/
│       └── ...
└── middleware.ts        # locale 감지 + 리디렉트
```

### 14.4 URL 정책

| URL | 동작 |
|---|---|
| `shorts100.com` | `ko-KR` 자동 (Accept-Language 무시, 한국 중심) |
| `shorts100.com/en` | 영어 |
| `shorts100.com/ja` | 일본어 |
| `shorts100.com/en/rising` | 영어 Rising 페이지 |

SEO 영향:
- `hreflang` 태그 자동 생성 (`<link rel="alternate" hreflang="ko">`)
- 사이트맵을 언어별로 분리
- 기본 도메인은 한국어, 검색 엔진에 명시

### 14.5 메시지 파일 예시

```json
// messages/ko.json
{
  "common": {
    "rank": "{n}위",
    "views": "{count, plural, other {조회수 #}}",
    "openInApp": "앱에서 열기"
  },
  "main": {
    "title": "오늘의 쇼츠 TOP 100",
    "subtitle": "지금 가장 핫한 숏폼 영상 모음"
  },
  "rising": {
    "title": "주목할 신인 크리에이터"
  },
  "cookie": {
    "title": "쿠키 사용 동의",
    "essentialOnly": "필수만 허용",
    "acceptAll": "모두 동의",
    "decline": "거부"
  }
}
```

```tsx
// 사용
'use client';
import { useTranslations } from 'next-intl';

export function MainHeader() {
  const t = useTranslations('main');
  return (
    <header>
      <h1>{t('title')}</h1>
      <p>{t('subtitle')}</p>
    </header>
  );
}
```

### 14.6 ✅ 출시 시점 i18n 준비 체크리스트

- [ ] **모든 UI 문자열을 `t('key')` 형태로 추상화** (한국어 하드코딩 금지)
- [ ] **`messages/ko.json` 단일 파일에 모든 키 집계**
- [ ] **날짜/숫자**: `date-fns-tz` + `Intl.NumberFormat`
- [ ] **방향성**: LTR만 사용 (RTL 언어 미지원이어도 코드 차단 없음)
- [ ] **번역 키 lint**: `i18next-parser`로 누락 키 자동 검출

### 14.7 DB 스키마 영향 (Phase 2 대비)

```sql
-- 블로그 글은 언어별 필요
CREATE TABLE blog_articles (
    id              BIGSERIAL PRIMARY KEY,
    slug            VARCHAR(200) NOT NULL,
    locale          CHAR(5) NOT NULL DEFAULT 'ko-KR',  -- 'ko-KR', 'en-US', 'ja-JP'
    title           TEXT NOT NULL,
    body_md         TEXT NOT NULL,
    published_at    TIMESTAMPTZ,
    UNIQUE(slug, locale)
);

-- 영상 메타는 원본 언어 그대로 (번역 X)
-- 단, 카테고리 라벨은 i18n 키로 매핑
```

---

<a id="sec-15-prompt"></a>

## §15. 최종 개발 지시 프롬프트 (v2.2)

v2.1 §9 프롬프트에 **테스트·접근성·의존성·시간대 정책**까지 명시:

> **"우리는 Ubuntu 24.04 환경에서 shorts100.com을 개발한다.**
> **마스터 플랜 v2.0 §5 DB 스키마 + v2.1 + v2.2 패치를 기반으로 다음을 만들어줘:**
>
> **1. `docker-compose.yml`:**
> - PostgreSQL 16 + Redis 7 (DB 0=cache LRU, DB 1=state noeviction)
>   + 백엔드(FastAPI) + Celery worker + Celery beat + Nginx
> - 모든 컨테이너 `TZ=Asia/Seoul` + `/etc/localtime` 마운트
> - PostgreSQL: named volume `pgdata`, `PGTZ=Asia/Seoul`
> - Redis: `--maxmemory 2gb --maxmemory-policy allkeys-lru`, AOF 활성화
> - 모든 서비스 healthcheck 포함
> - `.env` 파일에서 시크릿 주입
>
> **2. `backend/alembic/versions/001_initial_schema.py`:**
> - v2.0 §5 DDL + v2.1·v2.2 보강 모두 포함
>   (freshness_tier, safety_status, consent_log + signature, video_reports, blog_articles)
> - `video_stats`, `user_events`는 월 단위 RANGE 파티셔닝 (PostgreSQL native)
> - Data Pruning: 6개월 초과 통계/로그성 데이터 정리를 위한 스키마 설계 및 Celery Task 추가
> - ENUM 타입 명시적 생성
> - 모든 인덱스 포함
> - `ALTER DATABASE shorts100 SET TIME ZONE 'Asia/Seoul';` 포함
>
> **3. `backend/app/main.py`:**
> - FastAPI 기본 골격 (배포 시 Graceful Shutdown 지원)
> - `/health` (DB + Redis 핑 포함)
> - `/metrics` (Prometheus 형식, prometheus-fastapi-instrumentator)
> - CORS 미들웨어 (Cloudflare Tunnel 고려)
> - 글로벌 예외 핸들러 + Sentry 통합
> - Circuit Breaker (`pybreaker`)로 Redis 폴백 패턴 적용
> - Rate Limiting (`SlowAPI` 등) 적용하여 어뷰징 차단
>
> **4. `backend/app/core/time.py`:**
> - 모든 시간 처리는 UTC aware로, 표시용 KST 변환 헬퍼 포함
> - `naive datetime` 사용 시 mypy/ruff 에러
>
> **5. `backend/app/core/cache.py`:**
> - Redis 클라이언트 + Circuit Breaker
> - 키 패턴 상수 정의 (RANKING_KEY, ISSHORT_KEY 등)
>
> **6. `backend/pyproject.toml`:**
> - 의존성 표 §9.1 그대로 (Poetry 형식)
> - ruff + mypy strict 설정
> - pytest 설정 (asyncio_mode = "auto")
>
> **7. `backend/tests/`:**
> - `tests/unit/test_ranking.py` (알고리즘 단위 테스트 5개 이상)
> - `tests/unit/test_shorts_detector.py`
> - `tests/integration/test_health.py` (DB + Redis 통합)
> - `conftest.py` (fixture: db, redis, mock_youtube)
>
> **8. `.env.example`:**
> - DATABASE_URL, REDIS_URL, YOUTUBE_API_KEY, SENTRY_DSN, SECRET_KEY,
>   CONSENT_HMAC_KEY, IP_SALT_BASE, ALLOWED_ORIGINS, TZ
> - 보안 키는 `<generate-strong-secret>` placeholder
>
> **9. `.github/workflows/ci.yml`:**
> - lint (ruff, mypy) → unit → integration
> - 커버리지 75% 미만 시 차단
> - trufflehog secrets scan
>
> **10. `README.md`:**
> - 로컬 개발 환경 3분 안에 `docker compose up`
> - 마이그레이션 실행 (`alembic upgrade head`)
> - 테스트 실행 (`pytest`, `pytest -m integration`)
> - 트러블슈팅
>
> **11. `frontend/` 골격 (Next.js 14 App Router):**
> - React Query `staleTime`을 서버 Redis TTL(10분)보다 짧게(3~5분) 설정해 정합성 유지
> - `app/[locale]/page.tsx` — 메인 랭킹 페이지 (SSR + 첫 100개 서버 렌더)
> - `app/[locale]/rising/page.tsx` — Rising 페이지
> - `components/RankingList.tsx` — `@tanstack/react-virtual` 기반 가상화 목록 (§2 구현)
> - `components/VideoCard.tsx` — 카드 UI + ARIA 라벨 (§13 구현)
> - `lib/deeplink.ts` — iOS/Android/카톡 딥링크 (§6 구현)
> - `lib/consent.ts` — 쿠키 배너 상태 관리 (§7 구현)
> - `messages/ko.json` — 전체 UI 문자열 i18n 키 (§14 구현)
> - `middleware.ts` — locale 감지 + 리디렉트
> - `next.config.ts` — `next-intl` + 이미지 도메인 (`i.ytimg.com`) 설정
> - Tailwind + 디자인 토큰 (색 대비 §13.2 통과 값 적용)
>
> **코드 품질 요건:**
> - 타입 힌트 100%, mypy strict 통과
> - docstring (Google style)
> - 비밀번호/키 하드코딩 금지
> - 모든 datetime은 aware (UTC)"

---

<a id="sec-16-checklist"></a>

## §16. 출시 전 통합 체크리스트 (v2.2 최종)

### 기술 (Backend)

- [ ] [§1](#sec-1-api-refresh) API 쿼터: freshness tier + Burst Mode 동작 확인
- [ ] [§3](#sec-3-shorts-detection) Shorts 식별: 다층 파이프라인 + 7일 캐싱
- [ ] [§5](#sec-5-timezone) 타임존: 컨테이너 + DB + 코드 정책 일관성
- [ ] [§11](#sec-11-cache) 캐시: 논리 DB 분리 + Circuit Breaker

### 기술 (Frontend)

- [ ] [§2](#sec-2-virtualization) 가상화: `@tanstack/react-virtual`, 200 카드 메모리 < 200MB
- [ ] [§6](#sec-6-deeplink) 딥링크: iOS/Android/카톡 4 시나리오 실기기 검증
- [ ] [§13](#sec-13-a11y) 접근성: Lighthouse A11y ≥ 90, axe 위반 0
- [ ] [§14](#sec-14-i18n) i18n: 모든 UI 문자열 `t()` 추상화

### 콘텐츠 / 비즈니스

- [ ] [§4](#sec-4-adsense) AdSense: 블로그 글 15개 + 카테고리 분석문 + 운영자 코멘트
- [ ] [§8](#sec-8-brand-safety) 브랜드 안전: 키워드 사전 + 신고 + 운영 워크플로우

### 법적 / 보안

- [ ] [§7](#sec-7-pipa) PIPA: 쿠키 배너 + 개인정보처리방침 변호사 검토
- [ ] [§12](#sec-12-pipa-audit) 보안 감사: HMAC 서명, IP 해싱, secrets scan CI

### 테스트

- [ ] [§10](#sec-10-test) 백엔드 유닛 커버리지 ≥ 80%
- [ ] [§10](#sec-10-test) 통합 테스트: DB 마이그레이션, Celery 파이프라인
- [ ] [§10](#sec-10-test) E2E: 메인 + 무한 스크롤 + 딥링크 + 쿠키 동의 시나리오
- [ ] [§10](#sec-10-test) Lighthouse Mobile ≥ 90 (Perf/A11y/SEO 모두)

### 운영

- [ ] [§9](#sec-9-dependencies) 의존성: lockfile 커밋, Renovate 활성화
- [ ] 무중단 배포 및 롤백: 배포 시 다운타임 최소화 및 실패 시 즉각 롤백 파이프라인
- [ ] 캐시 워밍 및 데이터 정리: 배포 직후 캐시 워밍 스크립트 실행, 6개월 초과 로그 삭제
- [ ] 모니터링: Prometheus + Grafana + Sentry + UptimeRobot
- [ ] 백업: 일일 `pg_dump` + 외부 스토리지 + 복구 리허설 1회

---

## 결론

| Version | 핵심 가치 | 한 줄 요약 |
|---|---|---|
| v1.0 | 비전 | "이런 서비스가 있으면 좋겠다" |
| v2.0 | 방향성 | "현실적으로 가능한 범위 + 차별화" |
| v2.1 | 견고성 | "출시 직후 다칠 곳을 미리 패치" |
| **v2.2** | **유지보수성** | **"1년 후 누군가 합류해도 이어받을 수 있는 코드 기반"** |

이제 정말 **코드 단계로 가도 좋습니다.** [§15](#sec-15-prompt)의 프롬프트는 Antigravity가
첫 스프린트(1~2일) 만에 동작하는 백엔드 골격을 만들 수 있는 수준의 명세입니다.

> "잘 짠 코드는 잘 짠 명세에서 나오고, 잘 짠 명세는 잘 짠 리뷰에서 나온다."
> — 이 문서는 그 리뷰를 세 번 거쳤다.