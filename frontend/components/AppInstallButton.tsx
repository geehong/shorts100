"use client";

export default function AppInstallButton() {
  const handleClick = () => {
    // public/shorts100.apk 경로로 다운로드 이동
    window.location.href = "/shorts100.apk";
  };

  return (
    <button
      onClick={handleClick}
      title="앱 다운로드 (APK)"
      className="flex items-center gap-1 text-[9px] font-bold px-2 py-1 rounded-full bg-green-100 text-green-600 hover:bg-green-200 transition-all"
    >
      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 16L12 4M12 16l-4-4M12 16l4-4"/>
        <path d="M3 20h18"/>
      </svg>
      App
    </button>
  );
}

