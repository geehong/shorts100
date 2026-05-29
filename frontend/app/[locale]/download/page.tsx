"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { GoogleAuth } from "@codetrix-studio/capacitor-google-auth";
import AppInstallButton from "@/components/AppInstallButton";
import Footer from "@/components/Footer";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "https://shorts100.firemarkets.net";

// Translation dictionaries
const translations = {
  ko: {
    placeholder: "쇼츠 동영상 주소를 입력하세요...",
    youtube: "유튜브",
    tiktok: "틱톡",
    instagram: "인스타그램",
    analyzeBtn: "분석",
    downloadBtn: "다운로드",
    analyzing: "비디오 분석 중...",
    success: "성공! 비디오를 다운로드하거나 바로 재생할 수 있습니다.",
    previewPlaceholder: "미리보기",
    guestLimit: "Guest : {left}번",
    memberLimit: "Member : {points}번",
    masterLimit: "Master : 무제한",
    limitGuideTitle: "다운로드 제한 및 크레딧 충전 안내",
    limitGuideGuest: "비회원(Guest)은 최초 5회까지 다운로드 가능합니다. 회원가입 시 무료 20 크레딧이 즉시 지급되며, 로그인 후 추가 크레딧 충전(+50)이 가능합니다.",
    limitGuideMember: "회원은 다운로드당 1 크레딧이 차감됩니다. 크레딧이 부족할 경우 아래 '크레딧 충전 (+50)' 버튼으로 충전할 수 있습니다.",
    errors: {
      PRIVATE_VIDEO: "비공개 동영상이거나 연령 제한이 있습니다.",
      DELETED_VIDEO: "삭제되었거나 존재하지 않는 동영상입니다.",
      UNSUPPORTED_URL: "지원하지 않는 URL 주소입니다. (주소를 다시 확인해주세요)",
      DOWNLOAD_FAILED: "비디오 다운로드에 실패했습니다. 다시 시도해주세요.",
      LIMIT_EXCEEDED: "다운로드 제한을 초과했습니다. 회원가입을 하거나 충전해주세요.",
      generic: "오류가 발생했습니다. 주소를 확인하고 다시 시도해주세요."
    }
  },
  en: {
    placeholder: "Paste shorts video URL here...",
    youtube: "YouTube",
    tiktok: "TikTok",
    instagram: "Instagram",
    analyzeBtn: "Analyze",
    downloadBtn: "Download",
    analyzing: "Analyzing video...",
    success: "Success! You can download the video or preview it below.",
    previewPlaceholder: "Preview",
    guestLimit: "Guest : {left} times",
    memberLimit: "Member : {points} times",
    masterLimit: "Master : Unlimited",
    limitGuideTitle: "Download Limits & Refill Guide",
    limitGuideGuest: "Guests are limited to 5 free downloads. Sign up to get 20 free credits immediately, and log in to refill credits (+50).",
    limitGuideMember: "Members spend 1 credit per download. If you run out, refill (+50) using the button below.",
    errors: {
      PRIVATE_VIDEO: "This video is private or age-restricted.",
      DELETED_VIDEO: "This video has been deleted or is unavailable.",
      UNSUPPORTED_URL: "Unsupported URL. Please check the address.",
      DOWNLOAD_FAILED: "Video download failed. Please try again.",
      LIMIT_EXCEEDED: "Download limit exceeded. Please register or top up.",
      generic: "An error occurred. Please check the URL and try again."
    }
  }
};

function getEmbedInfo(inputUrl: string): { embedUrl: string | null; platform: "youtube" | "tiktok" | "instagram" | null } {
  const cleaned = inputUrl.trim();
  if (!cleaned) return { embedUrl: null, platform: null };

  // 1. YouTube Shorts / Standard / Share links
  const ytShortsMatch = cleaned.match(/youtube\.com\/shorts\/([a-zA-Z0-9_-]+)/i);
  if (ytShortsMatch) {
    return { embedUrl: `https://www.youtube.com/embed/${ytShortsMatch[1]}`, platform: "youtube" };
  }
  const ytWatchMatch = cleaned.match(/youtube\.com\/watch\?v=([a-zA-Z0-9_-]+)/i);
  if (ytWatchMatch) {
    return { embedUrl: `https://www.youtube.com/embed/${ytWatchMatch[1]}`, platform: "youtube" };
  }
  const ytBeMatch = cleaned.match(/youtu\.be\/([a-zA-Z0-9_-]+)/i);
  if (ytBeMatch) {
    return { embedUrl: `https://www.youtube.com/embed/${ytBeMatch[1]}`, platform: "youtube" };
  }

  // 2. TikTok video links
  const ttMatch = cleaned.match(/tiktok\.com\/@[a-zA-Z0-9_.]+\/video\/([0-9]+)/i);
  if (ttMatch) {
    return { embedUrl: `https://www.tiktok.com/embed/v2/${ttMatch[1]}`, platform: "tiktok" };
  }
  const ttVM = cleaned.match(/tiktok\.com\/t\/([a-zA-Z0-9_-]+)/i);
  if (ttVM) {
    return { embedUrl: `https://www.tiktok.com/embed/v2/${ttVM[1]}`, platform: "tiktok" };
  }

  // 3. Instagram reel/post links
  const igMatch = cleaned.match(/instagram\.com\/(?:p|reel|reels)\/([a-zA-Z0-9_-]+)/i);
  if (igMatch) {
    return { embedUrl: `https://www.instagram.com/p/${igMatch[1]}/embed/`, platform: "instagram" };
  }

  return { embedUrl: null, platform: null };
}

export default function DownloadPage() {
  const params = useParams();
  const router = useRouter();
  const lang = ((params?.locale as string) === "en" ? "en" : "ko") as "en" | "ko";
  const t = translations[lang];
  const [uiLang, setUiLang] = useState<"en" | "ko">(lang);

  // UI State
  const [url, setUrl] = useState("");
  const [platform, setPlatform] = useState<"youtube" | "tiktok" | "instagram" | null>(null);
  const [embedUrl, setEmbedUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [result, setResult] = useState<{
    file_token: string;
    title: string;
    thumbnail: string;
    duration: number;
    extractor: string;
  } | null>(null);

  // Authentication State
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [user, setUser] = useState<{
    username: string;
    role: string;
    points: number;
    email?: string | null;
    name?: string | null;
    age?: number | null;
    gender?: string | null;
    region?: string | null;
    avatar_url?: string | null;
  } | null>(null);
  const [usernameInput, setUsernameInput] = useState("");
  const [passwordInput, setPasswordInput] = useState("");
  const [authMessage, setAuthMessage] = useState<string | null>(null);

  // Onboarding State
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [onboardingName, setOnboardingName] = useState("");
  const [onboardingAge, setOnboardingAge] = useState("");
  const [onboardingGender, setOnboardingGender] = useState("");
  const [onboardingRegion, setOnboardingRegion] = useState("");
  const [googleClientId, setGoogleClientId] = useState("");

  // Limits State
  const [limits, setLimits] = useState<{
    role: string;
    downloads_left?: number;
    points?: number;
    limit_reached: boolean;
  } | null>(null);

  // Fetch Google Client ID configuration
  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/auth/config`);
        if (res.ok) {
          const data = await res.json();
          if (data.google_client_id) {
            setGoogleClientId(data.google_client_id);
          }
        }
      } catch (e) {
        console.error("Failed to fetch auth config", e);
      }
    };
    fetchConfig();
  }, []);

  // Hydration check
  useEffect(() => {
    const token = localStorage.getItem("shorts100_auth_token");
    if (token) {
      setAuthToken(token);
      fetchUser(token);
    } else {
      fetchLimits(null);
    }
  }, []);

  // Google OAuth Initialization & Rendering (web only — native app uses Capacitor GoogleAuth plugin)
  useEffect(() => {
    if (authToken || !googleClientId) return;
    if (typeof window !== "undefined" && (window as any).Capacitor?.isNativePlatform?.()) return;

    const initGoogleOAuth = () => {
      if (typeof window !== "undefined" && (window as any).google) {
        (window as any).google.accounts.id.initialize({
          client_id: googleClientId,
          callback: handleGoogleLoginCallback
        });
        const container = document.getElementById("google-signin-button");
        if (container) {
          (window as any).google.accounts.id.renderButton(container, {
            theme: "outline",
            size: "large",
            width: container.clientWidth || 320,
            text: "signin_with"
          });
        }
      }
    };

    const script = document.querySelector('script[src="https://accounts.google.com/gsi/client"]');
    if (script) {
      initGoogleOAuth();
    } else {
      const newScript = document.createElement("script");
      newScript.src = "https://accounts.google.com/gsi/client";
      newScript.async = true;
      newScript.defer = true;
      newScript.onload = initGoogleOAuth;
      document.body.appendChild(newScript);
    }
  }, [authToken, googleClientId]);

  const handleCapacitorGoogleLogin = async () => {
    try {
      await GoogleAuth.initialize({
        clientId: "828066610288-b1jqjjm5tpiresrilivgtcilumiqpq9j.apps.googleusercontent.com",
        scopes: ["profile", "email"],
        grantOfflineAccess: true,
      });
      const user = await GoogleAuth.signIn();
      const credential = user.authentication.idToken;
      await handleGoogleCredential(credential);
    } catch (e: any) {
      const code = e?.error ?? e?.code ?? JSON.stringify(e);
      if (code !== "popup_closed_by_user" && code !== "12501") {
        setAuthMessage(
          lang === "ko"
            ? "구글 로그인에 실패했습니다. 잠시 후 다시 시도해주세요."
            : "Google login failed. Please try again in a moment."
        );
      }
    }
  };

  const handleGoogleCredential = async (credential: string) => {
    try {
      const res = await fetch(`${API_BASE}/api/auth/oauth/google`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ credential })
      });
      if (res.ok) {
        const data = await res.json();
        localStorage.setItem("shorts100_auth_token", data.access_token);
        setAuthToken(data.access_token);
        setUser(data.user);
        fetchLimits(data.access_token);
        setAuthMessage(lang === "ko" ? "구글 로그인 성공!" : "Google login successful!");
        if (data.user && (!data.user.age || !data.user.gender || !data.user.region)) {
          setOnboardingName(data.user.name || "");
          setShowOnboarding(true);
        }
      } else {
        const err = await res.json();
        setAuthMessage(err.detail || (lang === "ko" ? "구글 로그인에 실패했습니다." : "Google login failed."));
      }
    } catch {
      setAuthMessage(lang === "ko" ? "로그인 중 오류가 발생했습니다." : "Error occurred during login.");
    }
  };

  const handleGoogleLoginCallback = async (response: any) => {
    try {
      const res = await fetch(`${API_BASE}/api/auth/oauth/google`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ credential: response.credential })
      });
      if (res.ok) {
        const data = await res.json();
        localStorage.setItem("shorts100_auth_token", data.access_token);
        setAuthToken(data.access_token);
        setUser(data.user);
        fetchLimits(data.access_token);
        setAuthMessage(lang === "ko" ? "구글 로그인 성공!" : "Google login successful!");
        
        // Onboarding Check
        if (data.user && (!data.user.age || !data.user.gender || !data.user.region)) {
          setOnboardingName(data.user.name || "");
          setShowOnboarding(true);
        }
      } else {
        const err = await res.json();
        setAuthMessage(err.detail || (lang === "ko" ? "구글 로그인에 실패했습니다." : "Google login failed."));
      }
    } catch {
      setAuthMessage(lang === "ko" ? "로그인 중 오류가 발생했습니다." : "Error occurred during login.");
    }
  };

  const fetchUser = async (token: string) => {
    try {
      const res = await fetch(`${API_BASE}/api/auth/me`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const userData = await res.json();
        setUser(userData);
        fetchLimits(token);
        
        // Onboarding Check
        if (userData && (!userData.age || !userData.gender || !userData.region)) {
          setOnboardingName(userData.name || "");
          setShowOnboarding(true);
        }
      } else {
        localStorage.removeItem("shorts100_auth_token");
        setAuthToken(null);
        setUser(null);
        fetchLimits(null);
      }
    } catch {
      fetchLimits(null);
    }
  };

  const fetchLimits = async (token: string | null) => {
    try {
      const headers: HeadersInit = {};
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }
      const res = await fetch(`${API_BASE}/api/download/limits`, { headers });
      if (res.ok) {
        const limitData = await res.json();
        setLimits(limitData);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleUrlChange = (value: string) => {
    setUrl(value);
    setResult(null);
    const cleaned = value.trim();
    const info = getEmbedInfo(cleaned);
    if (info.platform) {
      setPlatform(info.platform);
    }
    if (info.embedUrl) {
      setEmbedUrl(info.embedUrl);
      setErrorMsg(null);
    } else {
      setEmbedUrl(null);
    }
  };

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthMessage(null);
    if (!usernameInput || !passwordInput) return;

    try {
      const res = await fetch(`${API_BASE}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: usernameInput, password: passwordInput })
      });

      const data = await res.json();
      if (!res.ok) {
        setAuthMessage(data.detail || "Login failed");
        return;
      }

      localStorage.setItem("shorts100_auth_token", data.access_token);
      setAuthToken(data.access_token);
      setUser(data.user);
      setUsernameInput("");
      setPasswordInput("");
      setAuthMessage(lang === "ko" ? "로그인 성공!" : "Login successful!");
      fetchLimits(data.access_token);

      // Onboarding Check
      if (data.user && (!data.user.age || !data.user.gender || !data.user.region)) {
        setOnboardingName(data.user.name || "");
        setShowOnboarding(true);
      }
    } catch {
      setAuthMessage("Network error occurred");
    }
  };

  const handleOnboardingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!onboardingAge || !onboardingGender || !onboardingRegion) {
      alert(lang === "ko" ? "모든 정보를 입력해주세요." : "Please fill in all details.");
      return;
    }
    try {
      const res = await fetch(`${API_BASE}/api/auth/profile`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`
        },
        body: JSON.stringify({
          name: onboardingName.trim() || undefined,
          age: parseInt(onboardingAge, 10),
          gender: onboardingGender,
          region: onboardingRegion
        })
      });
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
        setShowOnboarding(false);
      } else {
        alert(lang === "ko" ? "정보 저장에 실패했습니다." : "Failed to save profile information.");
      }
    } catch {
      alert(lang === "ko" ? "오류가 발생했습니다." : "An error occurred.");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("shorts100_auth_token");
    setAuthToken(null);
    setUser(null);
    setLimits(null);
    setAuthMessage(null);
    fetchLimits(null);
    setShowOnboarding(false);
    setOnboardingName("");
    setOnboardingAge("");
    setOnboardingGender("");
    setOnboardingRegion("");
  };

  const handleUpgrade = async () => {
    if (!authToken) return;
    try {
      const res = await fetch(`${API_BASE}/api/download/upgrade`, {
        method: "POST",
        headers: { Authorization: `Bearer ${authToken}` }
      });
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
        fetchLimits(authToken);
      }
    } catch {
      setAuthMessage("Upgrade failed");
    }
  };

  const handleDownloadPrepare = async () => {
    setErrorMsg(null);
    setResult(null);
    if (!url.trim()) return;

    setIsLoading(true);
    try {
      const headers: HeadersInit = { "Content-Type": "application/json" };
      if (authToken) {
        headers["Authorization"] = `Bearer ${authToken}`;
      }

      const res = await fetch(`${API_BASE}/api/download/prepare`, {
        method: "POST",
        headers,
        body: JSON.stringify({ url: url.trim() })
      });

      const data = await res.json();
      if (!res.ok) {
        const errDetail = data.detail;
        const mappedError = t.errors[errDetail as keyof typeof t.errors] || t.errors.generic;
        setErrorMsg(mappedError);
        setIsLoading(false);
        return;
      }

      setResult(data);
      fetchLimits(authToken);
    } catch {
      setErrorMsg(t.errors.generic);
    } finally {
      setIsLoading(false);
    }
  };

  const handleMainAction = () => {
    if (result) {
      // Trigger direct download of file
      window.location.href = `${API_BASE}/api/download/serve/${result.file_token}?dl=1`;
    } else {
      handleDownloadPrepare();
    }
  };

  const formatDuration = (sec: number) => {
    if (!sec) return "00:00";
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  return (
    <div className="min-h-screen bg-[#fdf9f5] font-sans max-w-2xl mx-auto flex flex-col">
      {/* ══ 고정 상단 헤더 (순위 페이지와 동일 구조) ══ */}
      <div
        className="sticky top-0 z-40 w-full"
        style={{
          background: "linear-gradient(to bottom,rgba(253,249,245,0.97) 0%,rgba(253,249,245,0.90) 100%)",
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
          boxShadow: "0 4px 20px -5px rgba(0,0,0,0.06)"
        }}
      >
        <div className="flex items-center gap-2 px-4 pt-3 pb-1">
          {/* 로고 & 네비 */}
          <span className="text-lg select-none">🔥</span>
          <h1 className="font-black text-sm text-gray-800 tracking-tight flex items-center gap-1">
            <span className="cursor-pointer" onClick={() => router.push(`/${lang}`)}>Shorts100</span>
            <span className="text-blue-600">ShortsDown</span>
          </h1>

          {/* APK 앱 설치 버튼 (웹) 또는 웹페이지 링크 (앱) */}
          <AppInstallButton />

          {/* 잔여 횟수 뱃지 */}
          <div className="bg-violet-100 text-violet-600 px-3 py-1 rounded-full font-black text-[10px] shadow-sm whitespace-nowrap shrink-0">
            {limits ? (
              limits.role === "master" || limits.role === "admin" ? t.masterLimit
              : limits.role === "guest" ? t.guestLimit.replace("{left}", String(limits.downloads_left ?? 5))
              : t.memberLimit.replace("{points}", String(limits.points ?? 20))
            ) : "Guest : 5번"}
          </div>

          {/* EN / KR 언어 전환 */}
          <div className="flex items-center gap-1 ml-auto">
            <button
              onClick={() => setUiLang("en")}
              className={`text-[9px] font-extrabold px-2.5 py-1 rounded-full transition-all ${
                uiLang === "en" ? "bg-violet-500 text-white shadow-sm" : "bg-violet-100 text-violet-500"
              }`}
            >EN</button>
            <button
              onClick={() => setUiLang("ko")}
              className={`text-[9px] font-extrabold px-2.5 py-1 rounded-full transition-all ${
                uiLang === "ko" ? "bg-violet-500 text-white shadow-sm" : "bg-violet-100 text-violet-500"
              }`}
            >KR</button>
          </div>
        </div>
      </div>

      <div className="flex-1 px-4 py-5">

        {/* URL Input Box */}
        <div className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100 mb-4">
          <div className="relative">
            <input
              type="text"
              value={url}
              onChange={(e) => handleUrlChange(e.target.value)}
              placeholder={t.placeholder}
              className="w-full bg-gray-50 border border-gray-200 text-gray-800 rounded-2xl pl-4 pr-12 py-3.5 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            />
            {url && (
              <button
                onClick={() => {
                  setUrl("");
                  setResult(null);
                  setPlatform(null);
                  setEmbedUrl(null);
                }}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 font-bold"
              >
                ✕
              </button>
            )}
          </div>

          {/* Platform selection buttons */}
          <div className="flex gap-2 mt-3">
            <button
              onClick={() => setPlatform("youtube")}
              className={`flex-1 py-2 rounded-xl font-black text-[10px] border transition-all ${
                platform === "youtube"
                  ? "bg-red-500 border-red-500 text-white shadow-sm"
                  : "bg-gray-50 border-gray-200 text-gray-500 hover:bg-gray-100"
              }`}
            >
              {t.youtube}
            </button>
            <button
              onClick={() => setPlatform("tiktok")}
              className={`flex-1 py-2 rounded-xl font-black text-[10px] border transition-all ${
                platform === "tiktok"
                  ? "bg-black border-black text-white shadow-sm"
                  : "bg-gray-50 border-gray-200 text-gray-500 hover:bg-gray-100"
              }`}
            >
              {t.tiktok}
            </button>
            <button
              onClick={() => setPlatform("instagram")}
              className={`flex-1 py-2 rounded-xl font-black text-[10px] border transition-all ${
                platform === "instagram"
                  ? "bg-gradient-to-r from-purple-500 via-pink-500 to-yellow-500 border-transparent text-white shadow-sm"
                  : "bg-gray-50 border-gray-200 text-gray-500 hover:bg-gray-100"
              }`}
            >
              {t.instagram}
            </button>
          </div>
        </div>

        {/* Preview Container ("미리보기") */}
        <div className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100 mb-4 min-h-[280px] flex flex-col justify-center items-center overflow-hidden">
          {isLoading ? (
            <div className="flex flex-col items-center gap-3">
              <svg className="animate-spin h-8 w-8 text-blue-600" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              <span className="text-xs font-bold text-gray-500">{t.analyzing}</span>
            </div>
          ) : result ? (
            <div className="w-full flex flex-col gap-4">
              <div className="flex gap-3 items-start pb-3 border-b border-gray-100">
                <img
                  src={result.thumbnail || "/placeholder-thumb.png"}
                  alt={result.title}
                  onError={(e) => {
                    e.currentTarget.src = "/placeholder-thumb.png";
                  }}
                  className="w-16 h-24 object-cover rounded-lg shadow-sm bg-gray-100"
                />
                <div className="flex-1">
                  <span className="inline-block bg-blue-100 text-blue-700 text-[9px] font-black px-1.5 py-0.5 rounded-full uppercase mb-1">
                    {result.extractor}
                  </span>
                  <h3 className="font-extrabold text-xs text-gray-800 line-clamp-2 mb-1">
                    {result.title}
                  </h3>
                  <p className="text-[10px] text-gray-400 font-bold">
                    Duration: {formatDuration(result.duration)}
                  </p>
                </div>
              </div>
              <video
                src={`${API_BASE}/api/download/serve/${result.file_token}`}
                controls
                playsInline
                className="w-full rounded-2xl shadow-inner border border-gray-100 bg-black aspect-[9/16] max-h-[300px] object-contain"
                poster={result.extractor === "instagram" ? undefined : result.thumbnail}
              />
            </div>
          ) : embedUrl ? (
            <div className="w-full flex flex-col items-center">
              <iframe
                src={embedUrl}
                className="w-full rounded-2xl shadow-inner border border-gray-100 bg-black aspect-[9/16] max-h-[360px]"
                allowFullScreen
                allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"
              />
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center text-gray-300 font-black text-lg py-12">
              <span className="text-4xl mb-2">📺</span>
              <span>{t.previewPlaceholder}</span>
            </div>
          )}
        </div>

        {/* Download Button */}
        <button
          onClick={handleMainAction}
          disabled={isLoading || (!result && !url.trim())}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-extrabold py-4 rounded-2xl transition duration-200 shadow-md text-sm tracking-wide"
        >
          {result ? t.downloadBtn : t.analyzeBtn}
        </button>

        {/* Error message display */}
        {errorMsg && (
          <div className="mt-4 p-4 bg-red-50 border border-red-100 text-red-700 text-xs font-bold rounded-2xl">
            ⚠️ {errorMsg}
          </div>
        )}

        {/* Dynamic tips for Instagram/TikTok */}
        {platform === "instagram" && (
          <div className="mt-4 p-4 bg-purple-50 border border-purple-100 rounded-2xl text-xs text-purple-700 font-bold flex flex-col gap-1.5 shadow-sm">
            <span className="text-sm">💡 인스타그램 다운로드 안내:</span>
            <span>인스타그램 서버 보안 정책으로 인해 직접 다운로드가 안 되는 경우, 아래 외부 전용 다운로드 사이트를 편리하게 이용하실 수 있습니다.</span>
            <a href={`https://downloadgram.org/`} target="_blank" rel="noopener noreferrer" className="underline text-blue-600 font-extrabold mt-1 hover:text-blue-800 text-sm">
              👉 Downloadgram 사이트에서 다운로드하기
            </a>
          </div>
        )}
        {platform === "tiktok" && (
          <div className="mt-4 p-4 bg-neutral-50 border border-neutral-200 rounded-2xl text-xs text-neutral-700 font-bold flex flex-col gap-1.5 shadow-sm">
            <span className="text-sm">💡 틱톡 다운로드 안내:</span>
            <span>틱톡 서버 보안 정책으로 인해 직접 다운로드가 안 되는 경우, 아래 외부 전용 다운로드 사이트를 편리하게 이용하실 수 있습니다.</span>
            <a href={`https://snaptik.app/`} target="_blank" rel="noopener noreferrer" className="underline text-blue-600 font-extrabold mt-1 hover:text-blue-800 text-sm">
              👉 SnapTik 사이트에서 다운로드하기
            </a>
          </div>
        )}
        {/* Limits & Refill Guide Card */}
        <div className="bg-amber-50/50 border border-amber-100 rounded-3xl p-5 mt-6 shadow-sm flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <span className="text-sm">💡</span>
            <span className="text-xs font-black text-amber-900">{t.limitGuideTitle}</span>
          </div>
          <p className="text-[11px] text-amber-800 leading-relaxed font-semibold">
            {!authToken ? t.limitGuideGuest : t.limitGuideMember}
          </p>
        </div>

        {/* Auth / Login form at the bottom */}
        {!authToken ? (
          <div className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100 mt-6">
            <h3 className="text-[10px] font-black text-gray-400 mb-3 uppercase tracking-wider">
              {lang === "ko" ? "멤버 로그인" : "Member Login"}
            </h3>
            <form onSubmit={handleAuthSubmit} className="flex flex-col gap-2">
              <input
                type="text"
                value={usernameInput}
                onChange={(e) => setUsernameInput(e.target.value)}
                placeholder={lang === "ko" ? "아이디" : "Username"}
                className="w-full bg-gray-50 border border-gray-200 text-gray-800 rounded-xl px-3 py-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 font-semibold"
                required
              />
              <input
                type="password"
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                placeholder={lang === "ko" ? "비밀번호" : "Password"}
                className="w-full bg-gray-50 border border-gray-200 text-gray-800 rounded-xl px-3 py-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 font-semibold"
                required
              />
              <button
                type="submit"
                className="w-full bg-gray-800 hover:bg-gray-900 text-white font-bold py-2.5 rounded-xl text-xs transition"
              >
                {lang === "ko" ? "로그인" : "Login"}
              </button>
            </form>
            {authMessage && (
              <p className="text-[10px] font-bold text-blue-600 mt-2 text-center">{authMessage}</p>
            )}
            <div className="text-center mt-3 pt-3 border-t border-gray-100">
              <button
                onClick={() => router.push(`/${lang}/download/register`)}
                className="text-xs font-extrabold text-blue-600 hover:text-blue-700 underline"
              >
                {lang === "ko" ? "회원가입하기 (무료 20 크레딧 지급)" : "Register (Get 20 Free Credits)"}
              </button>
            </div>
            {/* Google Sign In Button */}
            <div className="mt-4 pt-4 border-t border-gray-100 flex flex-col items-center justify-center gap-2">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                {lang === "ko" ? "또는 구글 계정으로 로그인" : "Or Sign in with Google"}
              </span>
              <div id="google-signin-button" className="w-full flex justify-center mt-1"></div>
              {/* 네이티브 앱: Capacitor GoogleAuth 플러그인 / 웹: GSI 폴백 버튼 */}
              {googleClientId && (
                <button
                  onClick={() => {
                    const isNative = !!(window as any).Capacitor?.isNativePlatform?.();
                    if (isNative) {
                      handleCapacitorGoogleLogin();
                    } else if ((window as any).google?.accounts?.id) {
                      (window as any).google.accounts.id.prompt();
                    } else {
                      const s = document.createElement("script");
                      s.src = "https://accounts.google.com/gsi/client";
                      s.onload = () => {
                        (window as any).google?.accounts?.id?.initialize({
                          client_id: googleClientId,
                          callback: handleGoogleLoginCallback
                        });
                        (window as any).google?.accounts?.id?.prompt();
                      };
                      document.body.appendChild(s);
                    }
                  }}
                  className="w-full flex items-center justify-center gap-3 px-4 py-2.5 border border-gray-200 rounded-xl bg-white hover:bg-gray-50 transition-colors text-sm font-medium text-gray-700 shadow-sm"
                  id="google-fallback-button"
                >
                  <svg viewBox="0 0 24 24" className="w-5 h-5 shrink-0">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  {lang === "ko" ? "Google로 로그인" : "Sign in with Google"}
                </button>
              )}
            </div>
          </div>
        ) : (
          /* ── 로그인 상태 패널 ── */
          <div className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100 mt-6">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-wider mb-3">
              {lang === "ko" ? "로그인 정보" : "Account"}
            </p>
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2 bg-gray-50 rounded-2xl px-4 py-3">
                <span className="text-base">👤</span>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-extrabold text-gray-800 truncate">{user?.username}</p>
                  {user?.email && (
                    <p className="text-[10px] text-gray-400 font-semibold truncate">{user.email}</p>
                  )}
                </div>
                <span className={`text-[9px] font-black px-2 py-0.5 rounded-full ${
                  user?.role === "master" ? "bg-yellow-100 text-yellow-600"
                  : user?.role === "admin" ? "bg-red-100 text-red-600"
                  : "bg-blue-100 text-blue-600"
                }`}>
                  {user?.role?.toUpperCase()}
                </span>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleUpgrade}
                  className="flex-1 bg-violet-600 hover:bg-violet-700 text-white font-bold py-2.5 rounded-xl text-xs transition"
                >
                  {lang === "ko" ? "크레딧 충전 (+50)" : "Refill (+50)"}
                </button>
                <button
                  onClick={handleLogout}
                  className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-2.5 rounded-xl text-xs transition"
                >
                  {lang === "ko" ? "로그아웃" : "Logout"}
                </button>
              </div>
              <button
                onClick={() => router.push(`/${lang}/download/history`)}
                className="w-full mt-2 py-2 bg-violet-50 hover:bg-violet-100 text-violet-600 font-bold rounded-xl text-xs transition"
              >
                {lang === "ko" ? "📋 다운로드 이력" : "📋 Download History"}
              </button>
            </div>
            {authMessage && (
              <p className="text-[10px] font-bold text-blue-600 mt-2 text-center">{authMessage}</p>
            )}
          </div>
        )}
      </div>

      {/* Footer */}
      <Footer lang={uiLang} />
      {showOnboarding && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl border border-gray-100 flex flex-col gap-4 relative animate-in fade-in zoom-in-95 duration-200">
            <h2 className="text-lg font-black text-gray-800 text-center animate-pulse">
              ✨ {lang === "ko" ? "추가 프로필 정보 입력" : "Complete Your Profile"}
            </h2>
            <p className="text-xs text-gray-500 text-center font-bold">
              {lang === "ko"
                ? "서비스 이용을 위해 아래 기본 정보를 입력해주세요."
                : "Please fill in the basic details below to continue."}
            </p>
            <form onSubmit={handleOnboardingSubmit} className="flex flex-col gap-4 mt-2">
              <div>
                <label className="text-[10px] font-bold text-gray-400 block mb-1 uppercase">
                  {lang === "ko" ? "이름 / 닉네임" : "Name / Nickname"}
                </label>
                <input
                  type="text"
                  value={onboardingName}
                  onChange={(e) => setOnboardingName(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 text-gray-800 rounded-xl px-4 py-2.5 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  placeholder={lang === "ko" ? "이름을 입력하세요" : "Enter your name"}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold text-gray-400 block mb-1 uppercase">
                    {lang === "ko" ? "나이" : "Age"}
                  </label>
                  <input
                    type="number"
                    value={onboardingAge}
                    onChange={(e) => setOnboardingAge(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 text-gray-800 rounded-xl px-4 py-2.5 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    placeholder={lang === "ko" ? "나이" : "Age"}
                    min="0"
                    max="150"
                    required
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-gray-400 block mb-1 uppercase">
                    {lang === "ko" ? "성별" : "Gender"}
                  </label>
                  <select
                    value={onboardingGender}
                    onChange={(e) => setOnboardingGender(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 text-gray-800 rounded-xl px-4 py-2.5 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    required
                  >
                    <option value="">{lang === "ko" ? "선택" : "Select"}</option>
                    <option value="male">{lang === "ko" ? "남성" : "Male"}</option>
                    <option value="female">{lang === "ko" ? "여성" : "Female"}</option>
                    <option value="other">{lang === "ko" ? "기타" : "Other"}</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-gray-400 block mb-1 uppercase">
                  {lang === "ko" ? "지역 / 국가" : "Region / Country"}
                </label>
                <select
                  value={onboardingRegion}
                  onChange={(e) => setOnboardingRegion(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 text-gray-800 rounded-xl px-4 py-2.5 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  required
                >
                  <option value="">{lang === "ko" ? "지역 선택" : "Select Region"}</option>
                  <option value="KR">{lang === "ko" ? "대한민국 (KR)" : "South Korea (KR)"}</option>
                  <option value="US">{lang === "ko" ? "미국 (US)" : "United States (US)"}</option>
                  <option value="JP">{lang === "ko" ? "일본 (JP)" : "Japan (JP)"}</option>
                  <option value="other">{lang === "ko" ? "기타 (Other)" : "Other"}</option>
                </select>
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-extrabold rounded-2xl shadow-lg transition-all text-xs tracking-wider"
              >
                {lang === "ko" ? "제출 및 완료" : "Submit & Complete"}
              </button>

              <button
                type="button"
                onClick={handleLogout}
                className="w-full py-2 bg-gray-100 hover:bg-gray-200 text-gray-600 font-bold rounded-2xl transition text-xs"
              >
                {lang === "ko" ? "로그아웃 및 취소" : "Logout & Cancel"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
