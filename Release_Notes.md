# Shorts100 통합 업데이트 릴리즈 노트

이 파일은 Shorts100 어플리케이션의 버전별 변경 사항 및 구글 플레이 콘솔 등록용 출시 노트를 통합하여 관리하는 문서입니다.

---

## 📱 프론트엔드 & 안드로이드 앱 업데이트: 안드로이드 15 호환성 및 태블릿 UI 개선 (2026-06-17)
- **배포 대상**: 프론트엔드 웹 서버 (라이브 반영 완료) 및 안드로이드 앱 (차기 빌드 적용 예정)

### 🛠️ 주요 변경 사항

1. **태블릿 UI 레이아웃 최적화**
   - 화면 폭이 넓은 기기(태블릿 등)에서 영상 썸네일이 과도하게 커지는 문제를 해결하기 위해, 영상 그리드가 자동으로 2열에서 **3열**로 변경되도록 수정했습니다.
   - 우측 하단/상단에 위치한 플로팅 버튼(필터, 카테고리 등)이 브라우저 창 끝이 아니라 메인 콘텐츠 중앙 영역 우측에 보기 좋게 붙도록 위치를 개선했습니다.

2. **Android 15 Edge-To-Edge 디스플레이 호환**
   - 안드로이드 최신 버전에서 강제되는 화면 꽉 참(Edge-To-Edge) 요구사항을 준수하기 위해 앱 코드(`MainActivity`)에 호환성을 적용했습니다.

3. **안드로이드 기기 화면 회전 제한 해제**
   - 태블릿 등 대형 화면 기기 사용성을 위해 기존 세로 모드(`portrait`) 강제 고정을 해제하여 가로 모드에서도 자연스럽게 UI를 사용할 수 있도록 개선했습니다.

4. **구글 플레이 콘솔 권장 조치 사항 대응**
   - AdMob 패키지 버전을 최신으로 업데이트하여 지원 중단된 API 관련 경고가 사라지도록 조치했습니다.
## 🖥️ 백엔드 업데이트: 순위 변동 표시 & 코드 구조 개선 (2026-06-02)
- **배포 대상**: 백엔드 서버 (APK 재빌드 없음 — 현재 앱에 즉시 반영)

### 🛠️ 주요 변경 사항

1. **순위 변동 표시 (▲▼ NEW) 복구**
   - 일간 / 주간 / 월간 / 연간 기간 탭에서 이전 기간 대비 순위 상승(▲), 하락(▼), 신규 진입(NEW) 뱃지가 실제 데이터 기반으로 표시됩니다.
   - `chart_entries` 스냅샷 테이블을 우선 조회하고, 데이터가 없으면 Video 테이블 직접 계산으로 자동 폴백합니다.
   - `rankings` 테이블에 `prev_position` 컬럼 추가 (DB 마이그레이션 적용 완료).
   - global / rising / category / today_delta 4개 랭킹 계산 태스크 모두 이전 순위를 보존한 뒤 재계산합니다.

2. **"New(🆕)" 탭 개선**
   - 대상 영상 창 7일 → **48시간**으로 축소해 진짜 신규 영상만 노출.
   - 신선도 감쇠(반감기 12시간) 추가 — 갓 올라온 영상이 누적 조회수 큰 구작을 이기도록 개선.

3. **백엔드 코드 구조 리팩토링**
   - `main.py` (1,590줄) → `main.py` (54줄) + 6개 라우터 파일로 분리.
   - `routers/rankings.py`, `routers/videos.py`, `routers/auth.py`, `routers/download.py`, `routers/admin.py`, `routers/misc.py`
   - 공유 의존성(`get_current_user`, `get_client_ip`)을 `deps.py`로 분리.
   - 기존 모든 API 동작은 100% 동일하게 유지.

---

## 📱 최신 버전: v1.0.4 (Build #32)
- **작성일**: 2026-06-01
- **버전 이름 (versionName)**: `1.0.4`
- **버전 코드 (versionCode)**: `5`
- **배포 대상**: Google Play Console 비공개 테스트 트랙 (20인 대상)

### 🛠️ 주요 변경 및 개선 사항
1. **동영상 다운로드 파일 확장자 오류 수정 (.bin ➡️ .mp4)**
   - 앱 및 웹 환경에서 동영상 다운로드 시 파일 확장자가 `.bin`으로 잘못 지정되던 현상을 해결하기 위해, 다운로드 MIME 타입을 `video/mp4`로 수정 및 복원했습니다.
   - 기존 설치된 앱 사용자 또한 별도 재설치 없이 바로 정상적인 `.mp4` 동영상 파일로 안정적으로 다운로드 가능합니다.
2. **다운로드 완료 시 저장 경로 및 파일명 실시간 팝업 안내**
   - 동영상 다운로드가 완료되는 즉시 앱 내에서 파일명과 정확한 기기 내 저장 경로(예: `"내장 메모리 > Download > shortsdown_xxxx.mp4"`)를 Toast 메시지로 안내하는 기능을 추가했습니다.
   - 안드로이드 14(API 34) 이상의 최신 기기에서도 앱이 비정상 종료(Crash)되지 않도록 `BroadcastReceiver` 등록 시 수신 속성(`RECEIVER_EXPORTED`)을 안전하게 처리했습니다.

### 📋 구글 플레이 콘솔 입력용 출시 노트 (v1.0.4)
```xml
<ko-KR>
- 동영상 다운로드 시 파일 확장자가 .bin으로 저장되던 현상을 수정하고, 다운로드 완료 시 파일명과 실제 기기 내 저장 폴더 경로를 실시간 팝업으로 안내하도록 개선하였습니다.
</ko-KR>

<en-US>
- Fixed an issue where downloaded videos were saved with a .bin extension, and added a real-time toast notification displaying the file name and the storage path upon download completion.
</en-US>
```

---

## 📱 이전 버전: v1.0.3 (Build #31)
- **작성일**: 2026-05-29
- **버전 이름 (versionName)**: `1.0.3`
- **버전 코드 (versionCode)**: `4`
- **배포 대상**: Google Play Console 비공개 테스트 트랙 (20인 대상)

### 🛠️ 주요 변경 및 개선 사항
1. **화면 회전 방지 (가로 모드 비활성화)**
   - 앱이 가로로 회전할 때 화면이 잘리거나 레이아웃이 찢어지는 문제를 해결하기 위해, 앱 화면 방향을 **세로 모드(Portrait)**로 단단히 고정했습니다.
2. **동영상 백그라운드 다운로드 (DownloadManager 연동)**
   - 기존의 외부 브라우저 창(검은 화면)을 띄우는 대신, 웹뷰의 `DownloadListener`를 통해 안드로이드 시스템의 **`DownloadManager`**와 연동했습니다.
   - 브라우저 창이 열리지 않으며, 상단 상태 표시줄(노티바)에 다운로드 상태가 네이티브로 보이고, 완료 시 폰의 `Downloads` 폴더에 즉시 저장됩니다.

### 📋 구글 플레이 콘솔 입력용 출시 노트 (v1.0.3)
```xml
<ko-KR>
- 동영상 다운로드 시 웹 브라우저 창을 열지 않고 백그라운드에서 바로 다운로드되도록 사용자 경험을 개선하고, 앱 화면 방향을 세로로 고정하였습니다.
</ko-KR>

<en-US>
- Improved download behavior to run in the background without opening a browser, and locked the screen orientation to portrait mode.
</en-US>
```

---

## 📱 이전 버전: v1.0.2 (Build #30)
- **작성일**: 2026-05-29
- **버전 이름 (versionName)**: `1.0.2`
- **버전 코드 (versionCode)**: `3`

### 🛠️ 주요 변경 및 개선 사항
1. **네이티브 앱(Capacitor) 내 동영상 다운로드 오류 수정**
   - 모바일 앱 내부(Capacitor WebView)에서 동영상 다운로드 버튼을 누르면 다운로드 매니저가 실행되지 않고 멈춰있던 현상을 시스템 외부 브라우저(`@capacitor/browser` 플러그인) 호출 방식을 통해 임시 해결했었습니다. (v1.0.3에서 백그라운드 다운로드로 추가 업그레이드됨)

### 📋 구글 플레이 콘솔 입력용 출시 노트 (v1.0.2)
```xml
<ko-KR>
- 모바일 앱 내부에서 동영상 다운로드 버튼이 작동하지 않던 오류를 수정하였습니다.
</ko-KR>

<en-US>
- Fixed an issue where the video download button did not function properly inside the native mobile app.
</en-US>
```

---

## 📱 이전 버전: v1.0.1 (Build #29)
- **작성일**: 2026-05-29
- **버전 이름 (versionName)**: `1.0.1`
- **버전 코드 (versionCode)**: `2`

### 🛠️ 주요 변경 및 개선 사항
1. **구글 로그인 편의성 개선**
   - WebView 환경에서 Google 로그인 실패 시 알 수 없는 영어 에러 코드 대신 친절한 한국어/영어 안내 문구(`"구글 로그인에 실패했습니다..."`)가 표시되도록 에러 화면을 개선했습니다.
2. **다운로드 이용 제한 및 크레딧 설명 추가**
   - 무료 사용량(5회) 소진 이후 포인트 충전 및 사용 가이드라인 카드 UI를 도입하여 크레딧 사용 흐름을 투명하게 안내합니다.
3. **급상승 탭(Rising) 설명 및 이름 최적화**
   - 한국어는 `급상승 쇼츠`("지금 빠르게 오르는 영상들"), 영어는 `Trending Shorts`("Videos rising rapidly right now")로 노출되도록 콘텐츠 특성에 맞게 교정했습니다.
4. **쿠키 동의 배너 완벽 다국어화 & 광고 수집 동기 제어 (GDPR/CCPA)**
   - 닫기, 설정, 저장 버튼의 한글 하드코딩을 다국어 리소스 파일에 매핑하고, 명시적으로 광고 수집에 동의(`advertising: true`)한 시점에만 광고 스크립트가 로드되도록 변경했습니다.
5. **백엔드 CORS 프로덕션 허용 추가**
   - 프로덕션 도메인 `https://shorts100.com` 및 `https://www.shorts100.com`을 백엔드 CORS 허용 목록에 등록했습니다.

### 📋 구글 플레이 콘솔 입력용 출시 노트 (v1.0.1)
```xml
<ko-KR>
- 구글 로그인 오류 발생 시 안내 메시지가 노출되도록 에러 화면을 개선하였습니다.
- 다운로드 탭에 일일 제한 횟수 및 크레딧 충전 안내 가이드라인 카드를 추가하였습니다.
- 급상승 쇼츠 메뉴의 다국어 제목 및 설명을 콘텐츠 특성에 맞게 교정하였습니다.
- 쿠키 동의 배너의 설정 및 저장 버튼 번역을 최적화하고 다국어 호환성을 높였습니다.
</ko-KR>

<en-US>
- Enhanced the Google login error handling to show user-friendly messages under webview environments.
- Added a detailed guideline card on the download page for download limits and credit refills.
- Fixed localization titles and subtitles for the Trending Shorts section.
- Localized hardcoded Korean button texts in the Cookie Consent Banner for English-speaking users.
</en-US>
```

---

## 📱 최초 버전: v1.0.0 (Build #1)
- **버전 이름 (versionName)**: `1.0.0`
- **버전 코드 (versionCode)**: `1`
- **주요 내용**: 최초 릴리즈 및 구글 플레이 콘솔 비공개 테스트 트랙 생성.
