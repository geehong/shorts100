"use client";

import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { useRouter, useParams } from "next/navigation";
import { buildYouTubeDeepLink, openDeepLink } from "@/lib/deeplink";
import { fetchRankingsClient } from "@/lib/api";

interface ChannelData {
  title: string;
  thumbnail_url?: string;
  handle?: string;
  subscriber_count?: number;
  platform_id?: string;
}

interface VideoData {
  id: number;
  platform_video_id: string;
  title: string;
  description?: string;
  thumbnail_url?: string;
  duration_sec?: number;
  view_count: number;
  like_count?: number;
  comment_count?: number;
  category?: string;
  published_at: string;
  channel?: ChannelData;
}

function fmt(n: number) {
  if (n >= 1e8) return `${(n / 1e8).toFixed(1)}억`;
  if (n >= 1e4) return `${(n / 1e4).toFixed(1)}만`;
  return n.toLocaleString();
}

export default function VideoDetailClient({ video }: { video: VideoData }) {
  const router = useRouter();
  const params = useParams();
  const locale = (params?.locale as string) || "ko";

  const [showDesc, setShowDesc] = useState(false);
  const [videoIds, setVideoIds] = useState<number[]>([]);
  const [overlayHidden, setOverlayHidden] = useState(false);

  // touch refs
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);
  const isNavigating = useRef(false);
  const wheelCooldown = useRef(false);

  // Load video IDs from sessionStorage, with localStorage filters fallback
  useEffect(() => {
    try {
      const stored = sessionStorage.getItem("s100_current_ids");
      if (stored) {
        setVideoIds(JSON.parse(stored));
        return;
      }
    } catch (e) {}

    const loadFallback = async () => {
      try {
        const saved = localStorage.getItem("s100_filters");
        let region = "";
        let cat = "";
        let period = "realtime" as any;
        let rankBasis = "algo";
        if (saved) {
          const parsed = JSON.parse(saved);
          region = parsed.region ?? "";
          cat = parsed.cat ?? "";
          period = parsed.period ?? "realtime";
          rankBasis = parsed.rankBasis ?? "algo";
        }
        const data = await fetchRankingsClient("global", 100, 0, period, region, cat, rankBasis);
        setVideoIds(data.map((item: any) => item.id));
      } catch (err) {}
    };
    loadFallback();
  }, []);

  const currentIndex = videoIds.indexOf(video.id);
  const nextVideoId = currentIndex !== -1 && currentIndex < videoIds.length - 1 ? videoIds[currentIndex + 1] : null;
  const prevVideoId = currentIndex > 0 ? videoIds[currentIndex - 1] : null;

  const navigateTo = (targetId: number | "main") => {
    if (isNavigating.current) return;
    isNavigating.current = true;
    if (targetId === "main") {
      router.push(`/${locale}`);
    } else {
      router.push(`/${locale}/v/${targetId}`);
    }
    // Release navigation lock
    setTimeout(() => {
      isNavigating.current = false;
    }, 800);
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (document.activeElement?.tagName === "INPUT" || document.activeElement?.tagName === "TEXTAREA") {
        return;
      }
      switch (e.key) {
        case "ArrowDown":
        case "ArrowLeft":
          // 하위 순위 → 마지막이면 리스트
          if (nextVideoId) navigateTo(nextVideoId); else navigateTo("main");
          break;
        case "ArrowUp":
        case "ArrowRight":
          // 상위 순위 → 1위면 리스트
          if (prevVideoId) navigateTo(prevVideoId); else navigateTo("main");
          break;
        default:
          break;
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [nextVideoId, prevVideoId, locale]);

  // 휠 스크롤 (데스크탑)
  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      if (wheelCooldown.current) return;
      if (Math.abs(e.deltaY) < 60) return;
      wheelCooldown.current = true;
      setTimeout(() => { wheelCooldown.current = false; }, 1000);
      if (e.deltaY > 0) {
        // 아래 스크롤 → 하위 순위 (11위)
        if (nextVideoId) navigateTo(nextVideoId); else navigateTo("main");
      } else {
        // 위 스크롤 → 상위 순위 (9위), 1위면 리스트
        if (prevVideoId) navigateTo(prevVideoId); else navigateTo("main");
      }
    };
    window.addEventListener("wheel", handleWheel, { passive: true });
    return () => window.removeEventListener("wheel", handleWheel);
  }, [nextVideoId, prevVideoId, locale]);

  // Touch handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null || touchStartY.current === null) return;
    const diffX = e.changedTouches[0].clientX - touchStartX.current;
    const diffY = e.changedTouches[0].clientY - touchStartY.current;
    touchStartX.current = null;
    touchStartY.current = null;

    const H_THRESHOLD = 60;   // 수평 스와이프 최소 픽셀
    const V_THRESHOLD = 100;  // 수직 스와이프 최소 픽셀 (텍스트 스크롤과 구분)

    if (Math.abs(diffX) > Math.abs(diffY)) {
      // 수평 스와이프
      if (Math.abs(diffX) > H_THRESHOLD) {
        if (diffX < 0) {
          // 좌측 스와이프 → 다음(하위) 순위 상세
          if (nextVideoId) navigateTo(nextVideoId); else navigateTo("main");
        } else {
          // 우측 스와이프 → 순위 리스트
          navigateTo("main");
        }
      }
    } else {
      // 수직 스와이프 (큰 스와이프만 인식해 텍스트 스크롤과 충돌 방지)
      if (Math.abs(diffY) > V_THRESHOLD) {
        if (diffY > 0) {
          // 아래 스와이프 → 상위 순위 (9위), 1위면 리스트
          if (prevVideoId) navigateTo(prevVideoId); else navigateTo("main");
        } else {
          // 위 스와이프 → 하위 순위 (11위), 마지막이면 리스트
          if (nextVideoId) navigateTo(nextVideoId); else navigateTo("main");
        }
      }
    }
  };

  const handleBack = () => {
    if (window.history.length > 1) {
      router.back();
    } else {
      router.push("/");
    }
  };

  const handleOpenYouTube = () => {
    const result = buildYouTubeDeepLink(video.platform_video_id);
    openDeepLink(result);
  };

  // 통계 계산
  const views = video.view_count;
  const likes = video.like_count ?? 0;
  const comments = video.comment_count ?? 0;
  
  // 참여율 (좋아요 + 댓글 / 조회수) * 100
  const engagementRate = views > 0 ? (((likes + comments) / views) * 100).toFixed(2) : "0.00";
  const likeRatio = views > 0 ? ((likes / views) * 100).toFixed(2) : "0.00";
  
  // 간단한 카테고리 색상 매핑
  const catColors: Record<string, string> = {
    음악: "from-pink-500 to-rose-600 text-rose-100",
    게임: "from-cyan-500 to-blue-600 text-cyan-100",
    코미디: "from-amber-400 to-orange-500 text-amber-950",
    스포츠: "from-emerald-400 to-green-600 text-emerald-100",
    엔터: "from-purple-500 to-violet-600 text-purple-100",
  };
  const catBg = catColors[video.category || ""] || "from-slate-600 to-slate-700 text-slate-100";

  return (
    <div 
      onTouchStart={handleTouchStart} 
      onTouchEnd={handleTouchEnd}
      className="max-w-2xl mx-auto px-4 pt-4 pb-24 min-h-screen select-none"
    >
      {/* ── 상단 헤더 ── */}
      <header className="flex flex-col items-center gap-2 mb-5">
        <div className="flex items-center justify-between w-full">
          <button
            onClick={handleBack}
            className="flex items-center justify-center w-10 h-10 rounded-full bg-slate-900 border border-slate-800 hover:bg-slate-800 text-white transition-all shadow-md"
          >
            <span className="text-lg">←</span>
          </button>
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
            쇼츠 상세 분석
          </span>
          <div className="w-10 h-10" /> {/* Balance spacer */}
        </div>
        
        {/* 순위 네비게이터 */}
        <div className="flex items-center gap-2 mt-1">
          {/* 상위 순위 버튼 */}
          <button
            onClick={() => prevVideoId ? navigateTo(prevVideoId) : navigateTo("main")}
            className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-slate-900/80 border border-slate-700 text-slate-300 text-[10px] font-bold active:scale-95 transition-all"
          >
            <span>↑</span>
            <span>{currentIndex > 0 ? `${currentIndex}위` : "리스트"}</span>
          </button>

          {/* 현재 순위 뱃지 */}
          <div className="flex-1 flex justify-center">
            <span className="px-3 py-1.5 rounded-full bg-violet-600/80 text-white text-[10px] font-black border border-violet-500/50">
              {currentIndex !== -1 ? `${currentIndex + 1}위` : "—"}
            </span>
          </div>

          {/* 하위 순위 버튼 */}
          <button
            onClick={() => nextVideoId ? navigateTo(nextVideoId) : navigateTo("main")}
            className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-slate-900/80 border border-slate-700 text-slate-300 text-[10px] font-bold active:scale-95 transition-all"
          >
            <span>{nextVideoId ? `${currentIndex + 2}위` : "리스트"}</span>
            <span>↓</span>
          </button>
        </div>
      </header>

      {/* ── 비디오 임베드 플레이어 ── */}
      <div className="flex justify-center mb-6">
        <div className="relative w-full max-w-[320px] aspect-[9/16] rounded-3xl overflow-hidden bg-slate-900 border-2 border-slate-800 shadow-[0_15px_40px_rgba(0,0,0,0.6)] group">
          <iframe
            src={`https://www.youtube.com/embed/${video.platform_video_id}?autoplay=0&rel=0`}
            title={video.title}
            className="w-full h-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
          />
          {/* 터치 스와이프 및 유튜브 앱 연결 오버레이 */}
          {!overlayHidden && (
            <div
              onClick={() => setOverlayHidden(true)}
              className="absolute inset-0 bg-black/20 hover:bg-black/35 flex flex-col items-center justify-center cursor-pointer transition-all z-10"
            >
              <button 
                onClick={(e: React.MouseEvent) => {
                  e.stopPropagation();
                  handleOpenYouTube();
                }}
                className="w-16 h-16 rounded-full bg-red-600/90 hover:bg-red-600 flex items-center justify-center text-white shadow-lg transition-transform group-hover:scale-110 active:scale-95 border border-red-500/20"
                title="유튜브 앱에서 재생"
              >
                <span className="text-2xl pl-1 text-white">▶</span>
              </button>
              
              <div className="mt-4 flex flex-col items-center gap-1.5 px-4 text-center">
                <span className="text-[10px] text-white font-extrabold bg-black/60 px-3 py-1.5 rounded-full backdrop-blur-xs shadow-md border border-white/5">
                  유튜브 앱에서 시청하기 (클릭)
                </span>
                <span className="text-[9.5px] text-slate-300 font-medium bg-slate-950/65 px-3 py-1 rounded-full backdrop-blur-xs border border-white/5">
                  여기를 탭하면 웹에서 재생 / 스와이프하여 이동
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── 영상 정보 ── */}
      <section className="bg-slate-900/80 backdrop-blur-md border border-slate-800/80 rounded-3xl p-5 mb-5 shadow-lg">
        {video.category && (
          <span className={`inline-block bg-gradient-to-r ${catBg} px-3 py-1 rounded-full text-[10px] font-black tracking-wide mb-3`}>
            {video.category}
          </span>
        )}
        <h1 className="text-base md:text-lg font-extrabold text-white leading-snug">
          {video.title}
        </h1>

        {/* 채널 정보 */}
        {video.channel && (
          <div className="flex items-center gap-3 mt-4 pt-4 border-t border-slate-800/60">
            {video.channel.thumbnail_url ? (
              <div className="relative w-10 h-10 rounded-full overflow-hidden bg-slate-800 border border-slate-700">
                <Image
                  src={video.channel.thumbnail_url}
                  alt={video.channel.title}
                  fill
                  className="object-cover"
                />
              </div>
            ) : (
              <div className="w-10 h-10 rounded-full bg-violet-600 flex items-center justify-center text-sm font-bold text-white">
                {video.channel.title[0]}
              </div>
            )}
            <div>
              <h3 className="text-xs font-bold text-white">{video.channel.title}</h3>
              <p className="text-[10px] text-slate-400">
                {video.channel.handle ? `@${video.channel.handle}` : ""}
                {video.channel.subscriber_count ? ` · 구독자 ${fmt(video.channel.subscriber_count)}명` : ""}
              </p>
            </div>
          </div>
        )}
      </section>

      {/* ── 크리에이터 채널 & SNS 링크 ── */}
      <section className="bg-slate-900/80 backdrop-blur-md border border-slate-800/80 rounded-3xl p-5 mb-5 shadow-lg">
        <h2 className="text-xs font-bold tracking-wider text-slate-400 uppercase mb-4">
          🔗 크리에이터 관련 채널 & SNS
        </h2>
        <div className="grid grid-cols-3 gap-3">
          {/* 유튜브 채널 링크 */}
          <a
            href={video.channel?.handle ? `https://www.youtube.com/${video.channel.handle}` : `https://www.youtube.com/channel/${video.channel?.platform_id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex flex-col items-center justify-center p-3 rounded-2xl bg-red-950/30 border border-red-900/30 hover:bg-red-900/20 hover:border-red-500/50 transition-all group text-center"
          >
            <span className="text-xl mb-1 text-red-500 group-hover:scale-110 transition-transform">📺</span>
            <span className="text-[10px] font-bold text-white">YouTube</span>
            <span className="text-[8px] text-slate-400 mt-0.5">채널 바로가기</span>
          </a>

          {/* 인스타그램 검색 링크 */}
          <a
            href={`https://www.instagram.com/explore/tags/${encodeURIComponent(video.channel?.title.replace(/\s+/g, "") || "")}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex flex-col items-center justify-center p-3 rounded-2xl bg-pink-950/30 border border-pink-900/30 hover:bg-pink-900/20 hover:border-pink-500/50 transition-all group text-center"
          >
            <span className="text-xl mb-1 text-pink-500 group-hover:scale-110 transition-transform">📸</span>
            <span className="text-[10px] font-bold text-white">Instagram</span>
            <span className="text-[8px] text-slate-400 mt-0.5">태그 검색</span>
          </a>

          {/* 틱톡 검색 링크 */}
          <a
            href={video.channel?.handle ? `https://www.tiktok.com/@${video.channel.handle.replace("@", "")}` : `https://www.tiktok.com/search?q=${encodeURIComponent(video.channel?.title || "")}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex flex-col items-center justify-center p-3 rounded-2xl bg-slate-950 border border-slate-800 hover:bg-slate-800/80 hover:border-slate-600 transition-all group text-center"
          >
            <span className="text-xl mb-1 text-cyan-400 group-hover:scale-110 transition-transform">🎵</span>
            <span className="text-[10px] font-bold text-white">TikTok</span>
            <span className="text-[8px] text-slate-400 mt-0.5">채널/검색</span>
          </a>
        </div>
      </section>

      {/* ── 통계 대시보드 및 차트 ── */}
      <section className="bg-slate-900/80 backdrop-blur-md border border-slate-800/80 rounded-3xl p-5 mb-5 shadow-lg">
        <h2 className="text-xs font-bold tracking-wider text-slate-400 uppercase mb-4">
          📊 실시간 반응 지표
        </h2>

        {/* 3대 지표 수치 */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="bg-slate-950/60 border border-slate-850 p-3 rounded-2xl text-center">
            <span className="text-[10px] text-slate-400 block mb-1">👀 조회수</span>
            <span className="text-xs md:text-sm font-black text-white">{fmt(views)}</span>
          </div>
          <div className="bg-slate-950/60 border border-slate-850 p-3 rounded-2xl text-center">
            <span className="text-[10px] text-slate-400 block mb-1">❤️ 좋아요</span>
            <span className="text-xs md:text-sm font-black text-rose-400">{fmt(likes)}</span>
          </div>
          <div className="bg-slate-950/60 border border-slate-850 p-3 rounded-2xl text-center">
            <span className="text-[10px] text-slate-400 block mb-1">💬 댓글수</span>
            <span className="text-xs md:text-sm font-black text-cyan-400">{fmt(comments)}</span>
          </div>
        </div>

        {/* Engagement 차트 (바형) */}
        <div className="space-y-4">
          <div>
            <div className="flex justify-between items-center text-xs mb-1">
              <span className="text-slate-300">종합 반응률 (Engagement Rate)</span>
              <span className="font-extrabold text-violet-400">{engagementRate}%</span>
            </div>
            <div className="w-full h-2 bg-slate-950 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-violet-600 to-indigo-500 rounded-full"
                style={{ width: `${Math.min(parseFloat(engagementRate) * 5, 100)}%` }}
              />
            </div>
            <p className="text-[9px] text-slate-500 mt-1">
              조회수 대비 좋아요와 댓글 참여 비중을 나타냅니다. (평균 2~5%)
            </p>
          </div>

          <div>
            <div className="flex justify-between items-center text-xs mb-1">
              <span className="text-slate-300">조회수 대비 좋아요 비율</span>
              <span className="font-extrabold text-rose-400">{likeRatio}%</span>
            </div>
            <div className="w-full h-2 bg-slate-950 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-rose-500 to-pink-500 rounded-full"
                style={{ width: `${Math.min(parseFloat(likeRatio) * 8, 100)}%` }}
              />
            </div>
          </div>
        </div>
      </section>

      {/* ── 설명글 (더보기) ── */}
      {video.description && (
        <section className="bg-slate-900/80 backdrop-blur-md border border-slate-800/80 rounded-3xl p-5 mb-5 shadow-lg">
          <div className="flex justify-between items-center mb-2">
            <h2 className="text-xs font-bold tracking-wider text-slate-400 uppercase">
              📝 영상 설명
            </h2>
            <button
              onClick={() => setShowDesc(!showDesc)}
              className="text-xs text-violet-400 hover:text-violet-300"
            >
              {showDesc ? "접기" : "더보기"}
            </button>
          </div>
          <p className={`text-xs text-slate-300 leading-relaxed whitespace-pre-wrap ${
            showDesc ? "" : "line-clamp-3"
          }`}>
            {video.description}
          </p>
        </section>
      )}

      {/* ── 하단 플로팅 액션 바 (유튜브 직접 이동) ── */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-slate-950 via-slate-950/90 to-transparent z-40">
        <div className="max-w-2xl mx-auto">
          <button
            onClick={handleOpenYouTube}
            className="w-full py-4 bg-gradient-to-r from-red-600 via-rose-600 to-violet-600 hover:opacity-95 text-white font-extrabold text-sm rounded-2xl shadow-lg shadow-red-950/40 active:scale-[0.99] transition-all"
          >
            🎬 유튜브 앱에서 시청하기 (스마트 딥링크)
          </button>
        </div>
      </div>
    </div>
  );
}
