"use client";

import { useEffect } from "react";
import { Capacitor } from "@capacitor/core";
import { initializeAdMob, showBannerAd } from "@/lib/admob";

export default function AdsManager() {
  useEffect(() => {
    if (Capacitor.isNativePlatform()) {
      // 1. 네이티브 앱 환경: AdMob SDK 초기화 후 배너 광고 호출
      initializeAdMob().then(() => {
        // 실제 배너 광고 ID가 있으면 여기에 매개변수로 전달합니다.
        // 예: showBannerAd('ca-app-pub-xxx/yyy');
        // 매개변수를 넣지 않으면 구글 제공 공식 테스트 배너 ID가 적용됩니다.
        showBannerAd();
      });
    } else {
      // 2. 일반 웹 브라우저 환경: 구글 애드센스 스크립트 로드
      const script = document.createElement("script");
      script.src = "https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-1199110233969910";
      script.async = true;
      script.crossOrigin = "anonymous";
      document.head.appendChild(script);
    }
  }, []);

  return null;
}
