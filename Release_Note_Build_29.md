# Shorts100 업데이트 노트 (Build #29 / v1.0.1)

- **작성일**: 2026-05-29
- **배포 버전**: `v1.0.1` (Version Code: `2`)
- **빌드 번호**: GitHub Actions Build `#29`
- **배포 대상**: Google Play Console 비공개 테스트 트랙 (20인 대상)

---

## 🛠️ 주요 변경 및 개선 사항

### 1. 구글 로그인 편의성 개선
- **기존 문제**: 모바일 앱 WebView 환경에서 Google 로그인 실패 시 알 수 없는 내부 에러 코드만 표시되었습니다.
- **개선 내용**: 일반 사용자도 이해하기 쉽도록 친절한 에러 안내 문구(한/영)로 처리하였습니다.
  - *예: "구글 로그인에 실패했습니다. 잠시 후 다시 시도해주세요."*

### 2. 다운로드 이용 안내 및 크레딧 설명 추가
- **기존 문제**: 무료 사용량(5회) 소진 이후 포인트 충전 안내가 불명확했습니다.
- **개선 내용**: 다운로드 페이지에 비회원(Guest)과 회원(Member) 맞춤형 **"다운로드 제한 및 크레딧 충전 안내"** 카드 UI를 도입하여 크레딧 사용 흐름을 명확하게 가이드합니다.

### 3. 급상승 탭(Rising) 설명 및 이름 최적화
- **기존 문제**: 실제 급상승 비디오 랭킹을 보여주고 있으나, 다국어 문구에 "주목할 신인 크리에이터"로 노출되어 명칭 불일치가 있었습니다.
- **개선 내용**: 직관적이고 정확하게 명칭을 변경했습니다.
  - **한국어**: `급상승 쇼츠` ("지금 빠르게 오르는 영상들")
  - **영어**: `Trending Shorts` ("Videos rising rapidly right now")

### 4. 쿠키 동의 배너 완벽 다국어화 & 광고 제어 (GDPR/CCPA 대응)
- **기존 문제**: 쿠키 동의 창 내부 일부 텍스트가 한국어로 고정되어 있었고, 동의 여부와 무관하게 애드센스/AdMob 광고가 최초부터 바로 로드되었습니다.
- **개선 내용**: 
  - 버튼(`닫기`, `설정`, `선택 저장`)의 한글 하드코딩을 다국어 리소스 파일에 매핑하여 영어 권역에서도 매끄럽게 번역되어 표시됩니다.
  - 사용자가 명시적으로 광고 수집에 동의(`advertising: true`)한 시점에만 광고 스크립트가 활성화되도록 동적 로드 로직을 연동했습니다.

### 5. 백엔드 CORS 프로덕션 허용 추가
- **개선 내용**: 정식 출시 후 사용할 `https://shorts100.com` 및 `https://www.shorts100.com` 도메인을 백엔드 CORS 설정에 등록하여 프로덕션 배포 시 발생할 수 있는 API 차단 현상을 방지했습니다.

---

## 📋 구글 플레이 콘솔 입력용 출시 노트 (Release Notes)

구글 플레이 콘솔 등록 시, **릴리스 노트** 입력 창에 아래 XML 태그를 그대로 복사해서 넣어주세요.

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
