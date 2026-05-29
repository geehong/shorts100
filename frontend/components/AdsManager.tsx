"use client";

import { useEffect, useState } from "react";
import { Capacitor } from "@capacitor/core";
import { initializeAdMob, showBannerAd } from "@/lib/admob";

let adsInitialized = false;

export default function AdsManager() {
  const [consentGiven, setConsentGiven] = useState<boolean>(false);

  useEffect(() => {
    const checkConsent = () => {
      if (typeof window === "undefined") return;
      const consentStr = localStorage.getItem("shorts100_consent");
      if (consentStr) {
        try {
          const consent = JSON.parse(consentStr);
          if (consent.advertising) {
            setConsentGiven(true);
            return;
          }
        } catch (e) {
          console.error("Failed to parse cookie consent:", e);
        }
      }
      setConsentGiven(false);
    };

    // Check initial consent state
    checkConsent();

    // Listen to custom event for updates
    const handleConsentUpdate = () => {
      checkConsent();
    };
    window.addEventListener("shorts100_consent_updated", handleConsentUpdate);

    return () => {
      window.removeEventListener("shorts100_consent_updated", handleConsentUpdate);
    };
  }, []);

  useEffect(() => {
    if (!consentGiven || adsInitialized) return;

    adsInitialized = true;

    if (Capacitor.isNativePlatform()) {
      // 1. 네이티브 앱 환경: AdMob SDK 초기화 후 배너 광고 호출
      initializeAdMob().then(() => {
        // 실제 배너 광고 ID 전달
        showBannerAd('ca-app-pub-1199110233969910/6521386326');
      });
    } else {
      // 2. 일반 웹 브라우저 환경: 구글 애드센스 스크립트 로드
      const script = document.createElement("script");
      script.src = "https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-1199110233969910";
      script.async = true;
      script.crossOrigin = "anonymous";
      document.head.appendChild(script);
    }
  }, [consentGiven]);

  return null;
}
