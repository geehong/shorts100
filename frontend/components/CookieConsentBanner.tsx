"use client";

import React, { useState, useEffect } from "react";
import { useTranslations } from "next-intl";

export default function CookieConsentBanner() {
  const t = useTranslations("cookie");
  const [visible, setVisible] = useState<boolean>(false);
  const [showDetails, setShowDetails] = useState<boolean>(false);
  const [analytics, setAnalytics] = useState<boolean>(true);
  const [advertising, setAdvertising] = useState<boolean>(true);

  useEffect(() => {
    // 이미 동의 이력이 있는지 로컬 스토리지 확인
    const consent = localStorage.getItem("shorts100_consent");
    if (!consent) {
      // 1초 뒤 부드럽게 노출
      const timer = setTimeout(() => setVisible(true), 1000);
      return () => clearTimeout(timer);
    }
  }, []);

  const sendConsent = async (consentData: { analytics: boolean; advertising: boolean }) => {
    try {
      const apiBase = process.env.NEXT_PUBLIC_API_URL ?? "";
      await fetch(`${apiBase}/api/consent`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(consentData),
      });
    } catch (err) {
      console.error("Failed to send consent log:", err);
    }
  };

  const handleAcceptAll = () => {
    const data = { analytics: true, advertising: true };
    localStorage.setItem("shorts100_consent", JSON.stringify(data));
    sendConsent(data);
    window.dispatchEvent(new Event("shorts100_consent_updated"));
    setVisible(false);
  };

  const handleEssentialOnly = () => {
    const data = { analytics: false, advertising: false };
    localStorage.setItem("shorts100_consent", JSON.stringify(data));
    sendConsent(data);
    window.dispatchEvent(new Event("shorts100_consent_updated"));
    setVisible(false);
  };

  const handleCustomSave = () => {
    const data = { analytics, advertising };
    localStorage.setItem("shorts100_consent", JSON.stringify(data));
    sendConsent(data);
    window.dispatchEvent(new Event("shorts100_consent_updated"));
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="fixed bottom-20 left-4 right-4 md:left-auto md:right-4 md:max-w-md z-50 animate-slide-up">
      <div className="bg-slate-900/95 backdrop-blur-md border border-slate-800 text-white rounded-3xl p-5 shadow-[0_20px_50px_rgba(0,0,0,0.3)] transition-all">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h4 className="font-semibold text-sm tracking-wide text-violet-400">
              🍪 {t("title")}
            </h4>
            <p className="text-xs text-slate-300 mt-1 leading-relaxed">
              {t("description")}
            </p>
          </div>
        </div>

        {showDetails && (
          <div className="mt-4 pt-4 border-t border-slate-800 space-y-3 animate-fade-in">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-300">{t("analytics")}</span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={analytics}
                  onChange={(e) => setAnalytics(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-violet-500"></div>
              </label>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-300">{t("advertising")}</span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={advertising}
                  onChange={(e) => setAdvertising(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-violet-500"></div>
              </label>
            </div>
          </div>
        )}

        <div className="mt-5 flex flex-wrap gap-2 justify-end text-xs font-medium">
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="text-slate-400 hover:text-white px-3 py-2 rounded-xl transition-all"
          >
            {showDetails ? t("close") : t("settings")}
          </button>
          
          {showDetails ? (
            <button
              onClick={handleCustomSave}
              className="bg-violet-600 hover:bg-violet-500 text-white px-4 py-2 rounded-xl transition-all"
            >
              {t("saveSelection")}
            </button>
          ) : (
            <>
              <button
                onClick={handleEssentialOnly}
                className="bg-slate-800 hover:bg-slate-750 text-slate-300 px-4 py-2 rounded-xl transition-all"
              >
                {t("essentialOnly")}
              </button>
              <button
                onClick={handleAcceptAll}
                className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:opacity-90 text-white px-4 py-2 rounded-xl shadow-lg shadow-violet-900/30 transition-all"
              >
                {t("acceptAll")}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
