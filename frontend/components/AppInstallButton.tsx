"use client";
import { useEffect, useState } from "react";

export default function AppInstallButton() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showGuide, setShowGuide] = useState(false);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    // 이미 설치된 경우 숨김
    if (window.matchMedia("(display-mode: standalone)").matches) {
      setInstalled(true);
      return;
    }
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  if (installed) return null;

  const handleClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === "accepted") setInstalled(true);
      setDeferredPrompt(null);
    } else {
      setShowGuide(true);
    }
  };

  return (
    <>
      <button
        onClick={handleClick}
        title="앱 설치"
        className="flex items-center gap-1 text-[9px] font-bold px-2 py-1 rounded-full bg-green-100 text-green-600 hover:bg-green-200 transition-all"
      >
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 16L12 4M12 16l-4-4M12 16l4-4"/>
          <path d="M3 20h18"/>
        </svg>
        App
      </button>

      {showGuide && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/40"
          onClick={() => setShowGuide(false)}
        >
          <div
            className="bg-white w-full max-w-sm rounded-t-2xl p-5 pb-8 shadow-xl"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center gap-2 mb-4">
              <span className="text-2xl">🔥</span>
              <span className="font-black text-base text-gray-800">Shorts100 앱 설치</span>
            </div>
            <p className="text-xs text-gray-500 mb-4">Android Chrome 에서 홈화면에 추가하면 앱처럼 사용할 수 있습니다.</p>
            <ol className="text-xs text-gray-700 space-y-2 mb-5">
              <li className="flex gap-2"><span className="font-bold text-violet-500">1.</span> Chrome 브라우저 우측 상단 <span className="font-bold">⋮</span> 메뉴 탭</li>
              <li className="flex gap-2"><span className="font-bold text-violet-500">2.</span> <span className="font-bold">"홈 화면에 추가"</span> 선택</li>
              <li className="flex gap-2"><span className="font-bold text-violet-500">3.</span> <span className="font-bold">"추가"</span> 버튼 탭</li>
            </ol>
            <button
              onClick={() => setShowGuide(false)}
              className="w-full py-2.5 rounded-xl bg-violet-500 text-white font-bold text-sm"
            >
              확인
            </button>
          </div>
        </div>
      )}
    </>
  );
}
