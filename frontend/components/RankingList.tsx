"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import Image from "next/image";
import { useRouter, useParams } from "next/navigation";
import { useWindowVirtualizer } from "@tanstack/react-virtual";
import { fetchRankingsClient } from "@/lib/api";
import AppInstallButton from "@/components/AppInstallButton";

export interface RankingItem {
  id: number;
  title: string;
  channel_title: string;
  thumbnail_url: string | null;
  view_count: number;
  like_count?: number;
  score: number;
  position: number;
  platform_video_id: string;
  published_at?: string | null;
  category?: string | null;
  
  // 역사 차트 변동 표시용 필드
  prev_position?: number | null;
  peak_position?: number | null;
  weeks_on_chart?: number | null;
  view_delta?: number | null;
}

interface RankingListProps {
  initialItems: RankingItem[];
  rankType: string;
}

type Period = "realtime" | "today" | "weekly" | "monthly" | "yearly" | "all";
type Layout = "list" | "box";
type Lang = "en" | "ko";

const T: any = {
  ko: {
    title: "Shorts100",
    badge: "TOP 100",
    sectionRegion: "나라",
    sectionCategory: "카테고리",
    sectionPeriod: "기간",
    sectionRankBasis: "정렬 기준",
    loading: "불러오는 중…",
    noData: "해당 조건의 데이터가 없습니다.",
    lastVideo: "마지막 영상입니다.",
    regions: {
      all: "전체",
      kr: "한국",
      us: "미국",
      in: "인도",
      jp: "일본",
      br: "브라질",
      gb: "영국",
      mx: "멕시코"
    },
    categories: {
      all: "전체",
      gaming: "게임",
      music: "음악",
      comedy: "코미디",
      entertainment: "엔터",
      sports: "스포츠",
      education: "교육",
      animal: "동물",
      life: "라이프"
    },
    periods: {
      realtime: "실시간",
      today: "오늘",
      weekly: "주간",
      monthly: "월간",
      yearly: "연간",
      all: "전체"
    },
    rankBases: {
      algo: "스코어",
      view_count: "뷰",
      view_delta: "그로스",
      rising: "뉴"
    },
    peak: "최고",
    weeksOnChart: "주째"
  },
  en: {
    title: "Shorts100",
    badge: "TOP 100",
    sectionRegion: "Region",
    sectionCategory: "Category",
    sectionPeriod: "Period",
    sectionRankBasis: "Rank Basis",
    loading: "Loading...",
    noData: "No data found for this condition.",
    lastVideo: "No more videos.",
    regions: {
      all: "All",
      kr: "Korea",
      us: "USA",
      in: "India",
      jp: "Japan",
      br: "Brazil",
      gb: "UK",
      mx: "Mexico"
    },
    categories: {
      all: "All",
      gaming: "Gaming",
      music: "Music",
      comedy: "Comedy",
      entertainment: "Enter",
      sports: "Sports",
      education: "Education",
      animal: "Animals",
      life: "Lifestyle"
    },
    periods: {
      realtime: "Real",
      today: "Today",
      weekly: "Weekly",
      monthly: "Monthly",
      yearly: "Yearly",
      all: "All"
    },
    rankBases: {
      algo: "Score",
      view_count: "View",
      view_delta: "Growth",
      rising: "New"
    },
    peak: "Peak",
    weeksOnChart: "w on chart"
  }
};

const REGION_DATA = [
  { key: "all", icon: "🌍", flag: "",   code: "" },
  { key: "kr",  icon: "",   flag: "kr", code: "KR" },
  { key: "us",  icon: "",   flag: "us", code: "US" },
  { key: "in",  icon: "",   flag: "in", code: "IN" },
  { key: "jp",  icon: "",   flag: "jp", code: "JP" },
  { key: "br",  icon: "",   flag: "br", code: "BR" },
  { key: "gb",  icon: "",   flag: "gb", code: "GB" },
  { key: "mx",  icon: "",   flag: "mx", code: "MX" },
];

const CAT_DATA = [
  { key: "all",           icon: "☰", val: "" },
  { key: "gaming",        icon: "🎮", val: "게임" },
  { key: "music",         icon: "🎵", val: "음악" },
  { key: "comedy",        icon: "😂", val: "코미디" },
  { key: "entertainment", icon: "🎬", val: "엔터" },
  { key: "sports",        icon: "⚽", val: "스포츠" },
  { key: "education",     icon: "📚", val: "교육" },
  { key: "animal",        icon: "🐾", val: "동물" },
  { key: "life",          icon: "💄", val: "라이프" },
];

const PERIOD_DATA = [
  { key: "realtime", icon: "⚡", pKey: "realtime" as Period },
  { key: "today",    icon: "📅", pKey: "today"    as Period },
  { key: "weekly",   icon: "📊", pKey: "weekly"   as Period },
  { key: "monthly",  icon: "📆", pKey: "monthly"  as Period },
  { key: "yearly",   icon: "🗓", pKey: "yearly"   as Period },
  { key: "all",      icon: "♾", pKey: "all"      as Period },
];

const SIDE_CATS = [
  { key: "music",         icon: "🎵", val: "음악" },
  { key: "gaming",        icon: "🎮", val: "게임" },
  { key: "sports",        icon: "⚽", val: "스포츠" },
  { key: "comedy",        icon: "😂", val: "코미디" },
  { key: "entertainment", icon: "🎬", val: "엔터" },
];

const CAT_ICONS: Record<string, string> = {
  gaming: "🎮",
  music: "🎵",
  comedy: "😂",
  entertainment: "🎬",
  sports: "⚽",
  education: "📚",
  animal: "🐾",
  life: "💄",
  "게임": "🎮",
  "음악": "🎵",
  "코미디": "😂",
  "엔터": "🎬",
  "스포츠": "⚽",
  "교육": "📚",
  "동물": "🐾",
  "라이프": "💄",
};

const SH  = "2px -0.2px 5px rgba(109,40,217,0.10),3px -0.3px 9px rgba(109,40,217,0.05)";
const SHA = "2px -0.2px 5px rgba(109,40,217,0.30),3px -0.3px 9px rgba(109,40,217,0.15)";
const SCROLL = "flex gap-1.5 overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]";
const BG = "linear-gradient(160deg,#fdf9f5 0%,#f8f3ed 50%,#f3eee7 100%)";

/* ── Tile 버튼 ── */
function Tile({ label, icon, flag, active, fill, onClick }: {
  label: string; icon: string; flag?: string; active: boolean; fill?: boolean; onClick: () => void;
  key?: string;
}) {
  return (
    <button onClick={onClick} style={{ boxShadow: active ? SHA : SH }}
      className={`${fill ? "flex-1" : "shrink-0 w-[52px]"} h-[52px] rounded-full flex flex-col items-center justify-between py-1.5 px-1 transition-all duration-200 ${
        active ? "bg-violet-500/60 text-white" : "bg-white/80 text-gray-500"
      }`}>
      <span className="text-[10px] font-semibold leading-tight truncate w-full text-center">{label}</span>
      {flag
        ? <img src={`https://flagcdn.com/w40/${flag}.png`} alt={label} className="w-6 h-4 object-cover rounded-sm" />
        : <span className="text-[18px] leading-none">{icon}</span>
      }
    </button>
  );
}

function fmt(n: number, lang: Lang) {
  if (lang === "ko") {
    if (n >= 1e8) return `${(n / 1e8).toFixed(1)}억`;
    if (n >= 1e4) return `${(n / 1e4).toFixed(1)}만`;
    return n.toLocaleString();
  } else {
    if (n >= 1e9) return `${(n / 1e9).toFixed(1)}B`;
    if (n >= 1e6) return `${(n / 1e6).toFixed(1)}M`;
    if (n >= 1e3) return `${(n / 1e3).toFixed(1)}K`;
    return n.toLocaleString();
  }
}

function timeAgo(iso: string, lang: Lang) {
  const d = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
  if (lang === "ko") {
    if (d === 0) return "오늘";
    if (d < 30)  return `${d}일 전`;
    if (d < 365) return `${Math.floor(d / 30)}개월 전`;
    return `${Math.floor(d / 365)}년 전`;
  } else {
    if (d === 0) return "Today";
    if (d < 30)  return `${d}d ago`;
    if (d < 365) return `${Math.floor(d / 30)}mo ago`;
    return `${Math.floor(d / 365)}y ago`;
  }
}

const YTIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="text-red-400 w-3 h-3 shrink-0">
    <path d="M23.5 6.2a3 3 0 0 0-2.1-2.1C19.5 3.6 12 3.6 12 3.6s-7.5 0-9.4.5A3 3 0 0 0 .5 6.2C0 8.1 0 12 0 12s0 3.9.5 5.8a3 3 0 0 0 2.1 2.1C4.5 20.4 12 20.4 12 20.4s7.5 0 9.4-.5a3 3 0 0 0 2.1-2.1C24 15.9 24 12 24 12s0-3.9-.5-5.8zM9.6 15.6V8.4l6.3 3.6-6.3 3.6z" />
  </svg>
);

const FILTER_KEY = "s100_filters";
function loadFilters() {
  if (typeof window === "undefined") return {};
  try { return JSON.parse(localStorage.getItem(FILTER_KEY) || "{}"); } catch { return {}; }
}

/* ── 메인 컴포넌트 ── */
export default function RankingList({ initialItems, rankType }: RankingListProps) {
  // SSR 안전한 기본값으로 초기화 (localStorage 읽지 않음 → hydration 불일치 방지)
  const [lang, setLang] = useState<Lang>("en");
  const [region,  setRegion]  = useState<string>("");
  const [cat,     setCat]     = useState<string>("");
  const [period,  setPeriod]  = useState<Period>("realtime");
  const [layout,  setLayout]  = useState<Layout>("list");
  const [rankBasis, setRankBasis] = useState<string>("algo");
  const [items,   setItems]   = useState(initialItems);
  const [offset,  setOffset]  = useState(initialItems.length);
  const [hasMore, setHasMore] = useState(initialItems.length >= 20);
  const [loading, setLoading] = useState(false);
  // hydration 완료 후 localStorage 로드 여부 추적
  const [hydrated, setHydrated] = useState(false);
  const sentinelRef = useRef<HTMLDivElement>(null);

  /* 마운트 후 localStorage에서 필터 복원 (hydration 완료 후 실행) */
  useEffect(() => {
    const saved = loadFilters();
    if (saved.lang) setLang(saved.lang as Lang);
    if (saved.region !== undefined) setRegion(saved.region as string);
    if (saved.cat !== undefined) setCat(saved.cat as string);
    if (saved.period) setPeriod(saved.period as Period);
    if (saved.layout) setLayout(saved.layout as Layout);
    if (saved.rankBasis) setRankBasis(saved.rankBasis as string);
    setHydrated(true);
  }, []);

  /* 필터 변경 시 localStorage 저장 */
  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(FILTER_KEY, JSON.stringify({ lang, region, cat, period, layout, rankBasis }));
    } catch {}
  }, [hydrated, lang, region, cat, period, layout, rankBasis]);

  /* 필터 변경 시 재조회 (hydration 완료 후에만 실행) */
  useEffect(() => {
    if (!hydrated) return;
    if (period === "all" && !region && !cat) {
      setItems(initialItems);
      setOffset(initialItems.length);
      setHasMore(initialItems.length >= 20);
      return;
    }
    let cancelled = false;
    setLoading(true);
    fetchRankingsClient(rankType, 20, 0, period, region, cat, rankBasis).then(data => {
      if (cancelled) return;
      setItems(data);
      setOffset(data.length);
      setHasMore(data.length >= 20);
    }).finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [hydrated, period, region, cat, rankBasis]);

  const loadMore = useCallback(async () => {
    if (loading || !hasMore) return;
    setLoading(true);
    try {
      const data = await fetchRankingsClient(rankType, 20, offset, period, region, cat, rankBasis);
      if (data.length < 20) setHasMore(false);
      setItems(p => [...p, ...data]);
      setOffset(p => p + data.length);
    } finally { setLoading(false); }
  }, [loading, hasMore, offset, rankType, period, region, cat, rankBasis]);

  useEffect(() => {
    const obs = new IntersectionObserver(
      e => { if (e[0].isIntersecting) loadMore(); }, { threshold: 0.3 }
    );
    if (sentinelRef.current) obs.observe(sentinelRef.current);
    return () => obs.disconnect();
  }, [loadMore]);

  return (
    <div style={{ background: BG }} className="min-h-screen">

      {/* ══ 스티키 상단 메뉴 ══ */}
      <div className="sticky top-0 z-30"
        style={{
          background: "linear-gradient(to bottom,rgba(253,249,245,0.3) 0%,rgba(253,249,245,0.02) 100%)",
          backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)",
        }}>

        {/* 타이틀 및 한영 전환 */}
        <div className="flex items-center gap-2 px-4 pt-3 pb-1">
          <span className="text-lg">🔥</span>
          <span className="font-black text-sm text-gray-800 tracking-tight">{T[lang].title}</span>
          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-violet-100 text-violet-500">{T[lang].badge}</span>
          <AppInstallButton />

          <div className="flex items-center gap-1.5 ml-auto">
            <button
              onClick={() => setLang("en")}
              className={`text-[9px] font-extrabold px-2.5 py-1 rounded-full transition-all ${
                lang === "en" ? "bg-violet-500 text-white shadow-sm" : "bg-violet-100 text-violet-500"
              }`}
            >
              EN
            </button>
            <button
              onClick={() => setLang("ko")}
              className={`text-[9px] font-extrabold px-2.5 py-1 rounded-full transition-all ${
                lang === "ko" ? "bg-violet-500 text-white shadow-sm" : "bg-violet-100 text-violet-500"
              }`}
            >
              KR
            </button>
          </div>
        </div>

        {/* 나라 */}
        <div className="px-4 mb-1.5">
          <p className="text-[9px] font-bold mb-1 tracking-widest uppercase text-violet-300">{T[lang].sectionRegion}</p>
          <div className={SCROLL}>
            {REGION_DATA.map(r => (
              <Tile key={r.code} label={T[lang].regions[r.key as keyof typeof T.ko.regions]} icon={r.icon} flag={r.flag || undefined}
                active={region === r.code}
                onClick={() => setRegion(region === r.code && r.code !== "" ? "" : r.code)} />
            ))}
          </div>
        </div>

        {/* 카테고리 */}
        <div className="px-4 mb-1.5">
          <p className="text-[9px] font-bold mb-1 tracking-widest uppercase text-violet-300">{T[lang].sectionCategory}</p>
          <div className={SCROLL}>
            {CAT_DATA.map(c => (
              <Tile key={c.val} label={T[lang].categories[c.key as keyof typeof T.ko.categories]} icon={c.icon}
                active={cat === c.val}
                onClick={() => setCat(cat === c.val && c.val !== "" ? "" : c.val)} />
            ))}
          </div>
        </div>

        <div className="px-4 pb-3">
          <p className="text-[9px] font-bold mb-1 tracking-widest uppercase text-violet-300">{T[lang].sectionPeriod}</p>
          <div className={SCROLL}>
            {PERIOD_DATA.map(p => (
              <Tile key={p.pKey as string} label={T[lang].periods[p.key as keyof typeof T.ko.periods]} icon={p.icon}
                active={period === p.pKey}
                onClick={() => setPeriod(p.pKey)} />
            ))}
          </div>
        </div>

      </div>

      {/* ══ 우측 상단 정렬 기준 스위처 (사이드바 스타일, 투명도 50%) ══ */}
      <div className="fixed right-3 top-40 z-30 flex flex-col items-center gap-2 opacity-50 hover:opacity-100 transition-opacity duration-200">
        {[
          { key: "algo",       icon: "🏆" },
          { key: "view_count", icon: "👁" },
          { key: "view_delta", icon: "📈" },
          { key: "rising",     icon: "🆕" }
        ].map(rb => (
          <button key={rb.key} onClick={() => setRankBasis(rb.key)}
            style={{ boxShadow: rankBasis === rb.key ? SHA : SH }}
            className={`w-10 h-10 rounded-full flex flex-col items-center justify-center gap-0.5 transition-all duration-200 ${
              rankBasis === rb.key ? "bg-violet-500 text-white" : "bg-white text-gray-500 hover:bg-gray-50"
            }`}
            title={T[lang].rankBases[rb.key as keyof typeof T.ko.rankBases]}
          >
            <span className="text-[15px] leading-none">{rb.icon}</span>
            <span className="text-[7px] font-semibold leading-none scale-90 whitespace-nowrap">
              {T[lang].rankBases[rb.key as keyof typeof T.ko.rankBases].split(" ")[0]}
            </span>
          </button>
        ))}
      </div>

      {/* ══ 우측 고정 사이드바 ══ */}
      <div className="fixed right-3 bottom-20 z-30 flex flex-col items-center gap-2">
        {SIDE_CATS.map(c => (
          <button key={c.val} onClick={() => setCat(cat === c.val ? "" : c.val)}
            style={{ boxShadow: cat === c.val ? SHA : SH }}
            className={`w-10 h-10 rounded-full flex flex-col items-center justify-center gap-0.5 transition-all duration-200 ${
              cat === c.val ? "bg-violet-500/60 text-white" : "bg-white/85 text-gray-500"
            }`}>
            <span className="text-base leading-none">{c.icon}</span>
            <span className="text-[8px] font-semibold leading-none">{T[lang].categories[c.key as keyof typeof T.ko.categories]}</span>
          </button>
        ))}

        {/* 구분선 */}
        <div className="w-6 h-px bg-gray-200/80 my-1" />

        {(["list", "box"] as Layout[]).map(key => (
          <button key={key} onClick={() => setLayout(key)}
            style={{ boxShadow: layout === key ? SHA : SH }}
            className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-200 ${
              layout === key ? "bg-violet-500 text-white" : "bg-white/85 text-gray-500 hover:bg-gray-50"
            }`}>
            {key === "list"
              ? <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="w-4 h-4"><line x1="3" y1="6"  x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
              : <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4"><rect x="3" y="3" width="8" height="8" rx="1"/><rect x="13" y="3" width="8" height="8" rx="1"/><rect x="3" y="13" width="8" height="8" rx="1"/><rect x="13" y="13" width="8" height="8" rx="1"/></svg>
            }
          </button>
        ))}
      </div>

      {/* ══ 콘텐츠 ══ */}
      <div className="pb-24">
        {loading && items.length === 0 ? (
          <p className="text-center text-violet-300 py-16 text-sm">{T[lang].loading}</p>
        ) : items.length === 0 ? (
          <p className="text-center text-gray-400 py-16 text-sm">{T[lang].noData}</p>
        ) : layout === "list" ? (
          <ListView items={items} lang={lang} />
        ) : (
          <BoxView items={items} lang={lang} />
        )}
        <div ref={sentinelRef} className="h-10 flex items-center justify-center">
          {loading && <p className="text-xs text-violet-300">{T[lang].loading}</p>}
          {!hasMore && items.length > 0 && (
            <p className="text-xs text-violet-200">{T[lang].lastVideo}</p>
          )}
        </div>
      </div>

    </div>
  );
}

/* ── Rank Change Indicators ── */
function RankChangeIndicator({ item }: { item: RankingItem }) {
  if (item.prev_position === undefined) return null;

  if (item.prev_position === null) {
    return (
      <span className="text-[8px] font-black text-green-500 bg-green-50 px-1 py-0.5 rounded leading-none shrink-0 scale-90">
        NEW
      </span>
    );
  }

  const diff = item.prev_position - item.position;
  if (diff > 0) {
    return (
      <span className="text-[9px] font-bold text-green-500 flex items-center leading-none shrink-0">
        ▲{diff}
      </span>
    );
  } else if (diff < 0) {
    return (
      <span className="text-[9px] font-bold text-red-500 flex items-center leading-none shrink-0">
        ▼{Math.abs(diff)}
      </span>
    );
  } else {
    return (
      <span className="text-[9px] font-bold text-gray-400 flex items-center leading-none shrink-0">
        -
      </span>
    );
  }
}

function RankChangeIndicatorBox({ item }: { item: RankingItem }) {
  if (item.prev_position === undefined) return null;

  if (item.prev_position === null) {
    return (
      <span className="text-[8px] font-extrabold text-green-400 leading-none">
        NEW
      </span>
    );
  }

  const diff = item.prev_position - item.position;
  if (diff > 0) {
    return (
      <span className="text-[9px] font-bold text-green-400 flex items-center leading-none">
        ▲{diff}
      </span>
    );
  } else if (diff < 0) {
    return (
      <span className="text-[9px] font-bold text-red-400 flex items-center leading-none">
        ▼{Math.abs(diff)}
      </span>
    );
  } else {
    return (
      <span className="text-[9px] font-bold text-gray-300 flex items-center leading-none">
        -
      </span>
    );
  }
}

/* ── LIST ── */
function ListView({ items, lang }: { items: RankingItem[]; lang: Lang }) {
  const router = useRouter();
  const params = useParams();
  const locale = (params?.locale as string) || "ko";

  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollMargin, setScrollMargin] = useState(0);

  useEffect(() => {
    if (containerRef.current) {
      setScrollMargin(containerRef.current.offsetTop);
    }
  }, []);

  const virtualizer = useWindowVirtualizer({
    count: items.length,
    estimateSize: () => 58,
    overscan: 10,
    scrollMargin,
  });

  const virtualItems = virtualizer.getVirtualItems();

  return (
    <div ref={containerRef} className="px-3 py-2">
      <div
        style={{
          height: `${virtualizer.getTotalSize()}px`,
          width: "100%",
          position: "relative",
        }}
      >
        {virtualItems.map(virtualItem => {
          const item = items[virtualItem.index];
          if (!item) return null;

          const handleCardClick = (e: React.MouseEvent) => {
            e.preventDefault();
            router.push(`/${locale}/v/${item.id}`);
          };

          const displayCategory = item.category
            ? (T[lang].categories[item.category as keyof typeof T.ko.categories] || item.category)
            : null;

          return (
            <div
              key={virtualItem.key}
              data-index={virtualItem.index}
              ref={virtualizer.measureElement}
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                transform: `translateY(${virtualItem.start - virtualizer.options.scrollMargin}px)`,
                paddingBottom: "8px",
              }}
            >
              <div
                onClick={handleCardClick}
                style={{ boxShadow: SH }}
                className="flex items-center gap-3 bg-white/85 rounded-2xl px-3 py-2.5 active:scale-[0.99] transition-all cursor-pointer"
              >
                <div className="flex flex-col items-center gap-0.5 shrink-0 w-8">
                  <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black ${
                    item.position === 1 ? "bg-yellow-400 text-white" :
                    item.position === 2 ? "bg-gray-300 text-gray-600" :
                    item.position === 3 ? "bg-amber-500 text-white" :
                    "bg-violet-50 text-violet-400"
                  }`}>{item.position}</span>
                  <RankChangeIndicator item={item} />
                </div>

                <div className="relative w-[52px] h-[39px] shrink-0 rounded-xl overflow-hidden bg-violet-50">
                  {item.thumbnail_url ? (
                    <Image src={item.thumbnail_url} alt={item.title} fill
                      className="object-cover" sizes="52px"
                      loading={item.position <= 4 ? "eager" : "lazy"} />
                  ) : <div className="w-full h-full bg-violet-100" />}
                </div>

                <div className="flex-1 min-w-0">
                  <h3 className="text-xs font-semibold text-gray-800 line-clamp-1">{item.title}</h3>
                  <p className="text-[10px] text-gray-400 mt-0.5 flex items-center gap-1">
                    <YTIcon />{item.channel_title}
                  </p>
                  <div className="flex items-center gap-1.5 mt-0.5 text-[10px] text-gray-400 flex-wrap">
                    <span>👁 {fmt(item.view_count, lang)}</span>
                    {(item.like_count ?? 0) > 0 && <span>❤️ {fmt(item.like_count!, lang)}</span>}
                    {item.published_at && <span>· {timeAgo(item.published_at, lang)}</span>}
                    {item.peak_position && (
                      <span className="text-amber-500/80 font-medium bg-amber-50/55 px-1.5 py-0.5 rounded-md text-[9px] shrink-0">
                        ★ {T[lang].peak} #{item.peak_position}
                      </span>
                    )}
                    {item.weeks_on_chart && (
                      <span className="text-violet-500/80 font-medium bg-violet-50/55 px-1.5 py-0.5 rounded-md text-[9px] shrink-0">
                        {item.weeks_on_chart}{T[lang].weeksOnChart}
                      </span>
                    )}
                    {displayCategory && (
                      <span className="bg-violet-50 text-violet-400 px-1.5 py-0.5 rounded-md text-[9px] flex items-center gap-0.5 shrink-0">
                        <span>{CAT_ICONS[item.category || ""] || "🏷️"}</span>
                        <span>{displayCategory}</span>
                      </span>
                    )}
                  </div>
                </div>

                <span className="text-violet-300 text-xs shrink-0">▶</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ── BOX ── */
function BoxView({ items, lang }: { items: RankingItem[]; lang: Lang }) {
  const router = useRouter();
  const params = useParams();
  const locale = (params?.locale as string) || "ko";

  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollMargin, setScrollMargin] = useState(0);

  useEffect(() => {
    if (containerRef.current) {
      setScrollMargin(containerRef.current.offsetTop);
    }
  }, []);

  const rowCount = Math.ceil(items.length / 2);

  const virtualizer = useWindowVirtualizer({
    count: rowCount,
    estimateSize: () => 320,
    overscan: 6,
    scrollMargin,
  });

  const virtualItems = virtualizer.getVirtualItems();

  return (
    <div ref={containerRef} className="px-3 py-2">
      <div
        style={{
          height: `${virtualizer.getTotalSize()}px`,
          width: "100%",
          position: "relative",
        }}
      >
        {virtualItems.map(virtualItem => {
          const rowIndex = virtualItem.index;
          const leftItem = items[rowIndex * 2];
          const rightItem = items[rowIndex * 2 + 1];

          return (
            <div
              key={virtualItem.key}
              data-index={virtualItem.index}
              ref={virtualizer.measureElement}
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                transform: `translateY(${virtualItem.start - virtualizer.options.scrollMargin}px)`,
                paddingBottom: "8px",
              }}
            >
              <div className="grid grid-cols-2 gap-2">
                {[leftItem, rightItem].map((item, idx) => {
                  if (!item) return <div key={idx} className="aspect-[9/16] opacity-0" />;

                  const handleCardClick = (e: React.MouseEvent) => {
                    e.preventDefault();
                    router.push(`/${locale}/v/${item.id}`);
                  };

                  const displayCategory = item.category
                    ? (T[lang].categories[item.category as keyof typeof T.ko.categories] || item.category)
                    : null;

                  return (
                    <div
                      key={`${item.id}-${item.position}`}
                      onClick={handleCardClick}
                      style={{ boxShadow: SH }}
                      className="relative block aspect-[9/16] overflow-hidden rounded-2xl bg-violet-50 cursor-pointer"
                    >
                      {item.thumbnail_url ? (
                        <Image src={item.thumbnail_url} alt={item.title} fill
                          className="object-cover" sizes="(max-width:640px) 50vw,320px"
                          loading={item.position <= 4 ? "eager" : "lazy"} />
                      ) : <div className="w-full h-full bg-violet-100" />}

                      <div className="absolute top-2 left-2 z-10 flex flex-col items-center gap-0.5">
                        <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black shadow-md ${
                          item.position === 1 ? "bg-yellow-400 text-gray-900 scale-110" :
                          item.position === 2 ? "bg-gray-300 text-gray-700" :
                          item.position === 3 ? "bg-amber-500 text-white" :
                          "bg-black/50 text-white"
                        }`}>{item.position}</span>
                        {item.prev_position !== undefined && (
                          <div className="bg-black/60 backdrop-blur-xs px-1 py-0.5 rounded-md text-[8px] font-bold text-white shadow-sm scale-90 mt-0.5 flex items-center justify-center">
                            <RankChangeIndicatorBox item={item} />
                          </div>
                        )}
                      </div>

                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent px-2 pt-8 pb-2.5 z-10">
                        <p className="text-white/60 text-[9px] truncate">@{item.channel_title}</p>
                        <p className="text-white text-[10px] font-semibold line-clamp-2 leading-snug">{item.title}</p>
                        <div className="flex items-center justify-between mt-1 text-white/50 text-[9px] flex-wrap gap-1">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span>👁 {fmt(item.view_count, lang)}</span>
                            {item.peak_position && (
                              <span className="text-amber-300 font-semibold flex items-center scale-90 shrink-0 bg-black/40 px-1 rounded-sm">
                                ★{item.peak_position}
                              </span>
                            )}
                            {item.weeks_on_chart && (
                              <span className="text-violet-300 font-semibold flex items-center scale-90 shrink-0 bg-black/40 px-1 rounded-sm">
                                {item.weeks_on_chart}w
                              </span>
                            )}
                          </div>
                          {displayCategory && (
                            <span className="bg-white/20 backdrop-blur-xs text-white/90 px-1.5 py-0.5 rounded-md text-[8px] flex items-center gap-0.5 shrink-0">
                              <span>{CAT_ICONS[item.category || ""] || "🏷️"}</span>
                              <span>{displayCategory}</span>
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
