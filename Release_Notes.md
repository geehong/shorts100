# Shorts100 통합 업데이트 릴리즈 노트

이 파일은 Shorts100 어플리케이션의 버전별 변경 사항 및 구글 플레이 콘솔 등록용 출시 노트를 통합하여 관리하는 문서입니다.

---

## 📱 최신 버전: v1.0.3 (Build #31)
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
