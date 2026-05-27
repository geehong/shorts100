"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "https://shorts100.firemarkets.net";

const T = {
  ko: {
    title: "다운로드 이력",
    empty: "다운로드 이력이 없습니다.",
    login: "로그인이 필요합니다.",
    loginBtn: "로그인하러 가기",
    back: "← 뒤로",
    expires: "만료",
    copy: "복사",
    copied: "복사됨!",
    open: "열기",
  },
  en: {
    title: "Download History",
    empty: "No download history yet.",
    login: "Please log in to view history.",
    loginBtn: "Go to Login",
    back: "← Back",
    expires: "Expires",
    copy: "Copy",
    copied: "Copied!",
    open: "Open",
  },
};

function getDomain(url: string) {
  try {
    return new URL(url).hostname.replace("www.", "");
  } catch {
    return url.slice(0, 30);
  }
}

function getPlatformIcon(url: string) {
  if (url.includes("youtube") || url.includes("youtu.be")) return "▶";
  if (url.includes("tiktok")) return "♪";
  if (url.includes("instagram")) return "◈";
  return "↓";
}

export default function HistoryPage() {
  const params = useParams();
  const router = useRouter();
  const lang = ((params?.locale as string) === "en" ? "en" : "ko") as "en" | "ko";
  const t = T[lang];

  const [logs, setLogs] = useState<{
    id: string;
    original_url: string;
    created_at: string;
    expires_at: string;
    file_token: string;
  }[]>([]);
  const [loading, setLoading] = useState(true);
  const [authed, setAuthed] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("shorts100_auth_token");
    if (!token) {
      setAuthed(false);
      setLoading(false);
      return;
    }
    fetch(`${API_BASE}/api/auth/downloads`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => {
        if (r.status === 401) { setAuthed(false); return null; }
        return r.json();
      })
      .then((data) => { if (data) setLogs(data); })
      .finally(() => setLoading(false));
  }, []);

  const handleCopy = (url: string, id: string) => {
    navigator.clipboard.writeText(url).then(() => {
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 1500);
    });
  };

  return (
    <div className="min-h-screen bg-[#fdf9f5] font-sans max-w-2xl mx-auto flex flex-col">
      {/* Header */}
      <div
        className="sticky top-0 z-40 w-full"
        style={{
          background: "linear-gradient(to bottom,rgba(253,249,245,0.97) 0%,rgba(253,249,245,0.90) 100%)",
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
          boxShadow: "0 4px 20px -5px rgba(0,0,0,0.06)",
        }}
      >
        <div className="flex items-center gap-2 px-4 pt-3 pb-1">
          <span className="text-lg select-none">🔥</span>
          <span className="font-black text-sm text-gray-800 tracking-tight flex items-center gap-1">
            <span className="cursor-pointer" onClick={() => router.push(`/${lang}`)}>Shorts100</span>
            <span className="text-blue-600">ShortsDown</span>
          </span>
          <button
            onClick={() => router.back()}
            className="ml-auto text-[10px] font-bold text-violet-500 px-3 py-1 rounded-full bg-violet-100 hover:bg-violet-200 transition-all"
          >
            {t.back}
          </button>
        </div>
        <div className="px-4 pb-2">
          <h1 className="text-sm font-black text-gray-800">{t.title}</h1>
        </div>
      </div>

      <div className="flex-1 px-4 py-4">
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="w-6 h-6 border-2 border-violet-400 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : !authed ? (
          <div className="text-center py-16 flex flex-col items-center gap-4">
            <p className="text-sm text-gray-400">{t.login}</p>
            <button
              onClick={() => router.push(`/${lang}/download`)}
              className="px-5 py-2 bg-violet-500 text-white rounded-full text-xs font-bold hover:bg-violet-600 transition-all"
            >
              {t.loginBtn}
            </button>
          </div>
        ) : logs.length === 0 ? (
          <p className="text-center py-16 text-sm text-gray-400">{t.empty}</p>
        ) : (
          <div className="flex flex-col gap-3">
            {logs.map((log) => {
              const date = new Date(log.created_at);
              const expires = new Date(log.expires_at);
              const isExpired = expires < new Date();
              const icon = getPlatformIcon(log.original_url);
              const domain = getDomain(log.original_url);
              return (
                <div
                  key={log.id}
                  className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex items-start gap-3"
                >
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 text-base font-bold ${
                    isExpired ? "bg-gray-100 text-gray-400" : "bg-violet-100 text-violet-600"
                  }`}>
                    {icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-gray-700 truncate">{domain}</p>
                    <p className="text-[10px] text-gray-400 mt-0.5">
                      {date.toLocaleDateString(lang === "ko" ? "ko-KR" : "en-US", {
                        month: "short", day: "numeric", hour: "2-digit", minute: "2-digit"
                      })}
                    </p>
                    <p className={`text-[9px] mt-0.5 font-medium ${isExpired ? "text-red-400" : "text-green-500"}`}>
                      {t.expires}: {expires.toLocaleDateString(lang === "ko" ? "ko-KR" : "en-US", { month: "short", day: "numeric" })}
                    </p>
                  </div>
                  <div className="flex flex-col gap-1.5 shrink-0">
                    <button
                      onClick={() => handleCopy(log.original_url, log.id)}
                      className="text-[9px] font-bold px-2.5 py-1 rounded-full bg-violet-100 text-violet-600 hover:bg-violet-200 transition-all"
                    >
                      {copiedId === log.id ? t.copied : t.copy}
                    </button>
                    <a
                      href={log.original_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[9px] font-bold px-2.5 py-1 rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200 transition-all text-center"
                    >
                      {t.open}
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
