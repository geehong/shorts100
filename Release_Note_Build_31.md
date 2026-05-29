# Shorts100 업데이트 노트 (Build #31 / v1.0.3)

- **작성일**: 2026-05-29
- **배포 버전**: `v1.0.3` (Version Code: `4`)
- **빌드 번호**: GitHub Actions Build `#31`
- **배포 대상**: Google Play Console 비공개 테스트 트랙 (20인 대상)

---

## 🛠️ 주요 변경 및 개선 사항

### 1. 동영상 백그라운드 다운로드 (DownloadManager 연동) 
- **기존 문제**: 모바일 앱에서 동영상을 다운로드할 때 크롬 브라우저 창(검은 화면)이 새로 열려 다운로드가 실행되어 사용자 경험(UX)이 매끄럽지 못했습니다.
- **개선 내용**:
  - 네이티브 안드로이드 앱의 웹뷰에 **`DownloadListener`**를 탑재하여, 다운로드 클릭 시 **구글 브라우저 창을 띄우지 않고 백그라운드에서 즉시 네이티브 다운로드(Android DownloadManager)가 시작**되도록 변경했습니다.
  - 이제 다운로드를 누르면 상단 상태 표시줄(노티바)에 다운로드 진행률이 네이티브로 표시되고, 다운로드가 끝나면 폰의 **`다운로드(Downloads)`** 폴더에 자동으로 영상 파일이 깔끔하게 저장됩니다.

---

## 📋 구글 플레이 콘솔 입력용 출시 노트 (Release Notes)

구글 플레이 콘솔 등록 시, **릴리스 노트** 입력 창에 아래 XML 태그를 그대로 복사해서 넣어주세요.

```xml
<ko-KR>
- 동영상 다운로드 시 웹 브라우저 창을 열지 않고 백그라운드에서 바로 다운로드되도록 사용자 경험을 대폭 개선하였습니다.
</ko-KR>

<en-US>
- Enhanced user experience by enabling background video downloads via native DownloadManager without opening a browser window.
</en-US>
```
