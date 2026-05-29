# Shorts100 업데이트 노트 (Build #30 / v1.0.2)

- **작성일**: 2026-05-29
- **배포 버전**: `v1.0.2` (Version Code: `3`)
- **빌드 번호**: GitHub Actions Build `#30`
- **배포 대상**: Google Play Console 비공개 테스트 트랙 (20인 대상)

---

## 🛠️ 주요 변경 및 개선 사항

### 1. 네이티브 앱(Capacitor) 내 동영상 다운로드 오류 수정 
- **기존 문제**: 모바일 앱 내부(Capacitor WebView)에서 동영상 다운로드 버튼을 누르면 다운로드 매니저가 유기적으로 연결되지 않아 아무 동작도 하지 않는 현상이 발생했습니다.
- **개선 내용**: 
  - 앱 내부에서 다운로드 주소를 호출할 때, 기기가 네이티브 플랫폼인 경우 시스템 브라우저(`@capacitor/browser` 플러그인)를 띄워 모바일 다운로드 매니저를 통해 안전하고 확실하게 동영상을 내려받도록 개선했습니다.

---

## 📋 구글 플레이 콘솔 입력용 출시 노트 (Release Notes)

구글 플레이 콘솔 등록 시, **릴릴스 노트** 입력 창에 아래 XML 태그를 그대로 복사해서 넣어주세요.

```xml
<ko-KR>
- 모바일 앱 내부에서 동영상 다운로드 버튼이 작동하지 않던 오류를 수정하였습니다.
</ko-KR>

<en-US>
- Fixed an issue where the video download button did not function properly inside the native mobile app.
</en-US>
```
