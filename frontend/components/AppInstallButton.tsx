"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Capacitor } from "@capacitor/core";
import { Browser } from "@capacitor/browser";

export default function AppInstallButton() {
  const params = useParams();
  const locale = params?.locale === "ko" ? "ko" : "en";
  const [isNative, setIsNative] = useState(false);

  useEffect(() => {
    setIsNative(Capacitor.isNativePlatform());
  }, []);

  const handleClick = async () => {
    if (isNative) {
      await Browser.open({ url: "https://shorts100.firemarkets.net/" });
    } else {
      window.location.href = "/shorts100.apk";
    }
  };

  if (isNative) {
    return (
      <button
        onClick={handleClick}
        title={locale === "ko" ? "웹페이지로 이동" : "Go to Webpage"}
        className="flex items-center gap-1 text-[9px] font-bold px-2 py-1 rounded-full bg-blue-100 text-blue-600 hover:bg-blue-200 transition-all"
      >
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <line x1="2" y1="12" x2="22" y2="12" />
          <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
        </svg>
        {locale === "ko" ? "웹" : "Web"}
      </button>
    );
  }

  return (
    <button
      onClick={handleClick}
      title={locale === "ko" ? "앱 다운로드 (APK)" : "Download App (APK)"}
      className="flex items-center gap-1 text-[9px] font-bold px-2 py-1 rounded-full bg-green-100 text-green-600 hover:bg-green-200 transition-all"
    >
      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 16L12 4M12 16l-4-4M12 16l4-4"/>
        <path d="M3 20h18"/>
      </svg>
      {locale === "ko" ? "앱" : "App"}
    </button>
  );
}


