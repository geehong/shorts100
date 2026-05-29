"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import Image from "next/image";
import { useRouter, useParams } from "next/navigation";
import { useWindowVirtualizer } from "@tanstack/react-virtual";
import { fetchRankingsClient, searchVideosClient } from "@/lib/api";
import AppInstallButton from "@/components/AppInstallButton";
import Footer from "@/components/Footer";

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
    noSearchResults: "Shorts100 내 검색 결과가 없습니다.",
    searchPlaceholder: "제목, 설명, 채널명 검색…",
    exitSearch: "검색 종료",
    searchOnYouTube: "YouTube Shorts 전체 검색",
    searchOnYouTubeHint: "YouTube에서 더 많은 Shorts 보기 →",
    lastVideo: "마지막 영상입니다.",
    regions: {
      all: "전체",
      kr: "한국",
      us: "미국",
      in: "인도",
      jp: "일본",
      br: "브라질",
      gb: "영국",
      mx: "멕시코",
      tw: "대만",
      de: "독일",
      fr: "프랑스",
      eg: "아프리카",
      ng: "나이지리아",
      za: "남아공",
      sa_am: "남미",
      ar: "아르헨티나",
      co: "콜롬비아"
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
    noSearchResults: "No results found in Shorts100.",
    searchPlaceholder: "Search title, description, channel…",
    exitSearch: "Exit Search",
    searchOnYouTube: "Search all YouTube Shorts",
    searchOnYouTubeHint: "See more Shorts on YouTube →",
    lastVideo: "No more videos.",
    regions: {
      all: "All",
      kr: "Korea",
      us: "USA",
      in: "India",
      jp: "Japan",
      br: "Brazil",
      gb: "UK",
      mx: "Mexico",
      tw: "Taiwan",
      de: "Germany",
      fr: "France",
      eg: "Africa",
      ng: "Nigeria",
      za: "S.Africa",
      sa_am: "S.America",
      ar: "Argentina",
      co: "Colombia"
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

const REGION_GROUPS = [
  {
    id: "all",
    label: "all",
    code: "",
    icon: "🌍",
    flag: "",
    subs: []
  },
  {
    id: "asia",
    label: "kr",
    code: "KR",
    flag: "kr",
    icon: "",
    subs: [
      { key: "jp", flag: "jp", code: "JP" },
      { key: "tw", flag: "tw", code: "TW" },
      { key: "in", flag: "in", code: "IN" }
    ]
  },
  {
    id: "americas",
    label: "us",
    code: "US",
    flag: "us",
    icon: "",
    subs: [
      { key: "br", flag: "br", code: "BR" },
      { key: "mx", flag: "mx", code: "MX" }
    ]
  },
  {
    id: "europe",
    label: "gb",
    code: "GB",
    flag: "gb",
    icon: "",
    subs: [
      { key: "de", flag: "de", code: "DE" },
      { key: "fr", flag: "fr", code: "FR" }
    ]
  },
  {
    id: "south_america",
    label: "sa_am",
    code: "BR",
    flag: "br",
    icon: "",
    subs: [
      { key: "ar", flag: "ar", code: "AR" },
      { key: "co", flag: "co", code: "CO" },
      { key: "mx", flag: "mx", code: "MX" }
    ]
  },
  {
    id: "africa",
    label: "eg",
    code: "EG",
    flag: "eg",
    icon: "",
    subs: [
      { key: "ng", flag: "ng", code: "NG" },
      { key: "za", flag: "za", code: "ZA" }
    ]
  }
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

  // 검색 관련 상태 추가
  const [searchQuery, setSearchQuery] = useState("");
  const [activeSearchQuery, setActiveSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);

  // 스크롤 상단 메뉴 접기/펴기 상태
  const [headerVisible, setHeaderVisible] = useState(true);
  const headerVisibleRef = useRef(true); // ref mirror to avoid stale closure
  const isTransitioning = useRef(false); // guard: spacer height change causes phantom scroll

  // 대륙별 하위 지역 드롭다운 활성화 상태
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const longPressTimeout = useRef<any>(null);
  const isLongPress = useRef(false);

  // 스크롤 방향 감지 Effect — 스페이서 높이 변경으로 인한 유령 스크롤 이벤트 차단
  useEffect(() => {
    let lastScrollY = window.scrollY;
    let collapseScrollY = 0; // position where we collapsed the header

    const handleScroll = () => {
      // During spacer resize transition, ignore scroll events to prevent flicker loop
      if (isTransitioning.current) return;

      const currentScrollY = window.scrollY;
      const delta = currentScrollY - lastScrollY;

      if (currentScrollY <= 20) {
        // Always expand at very top
        if (!headerVisibleRef.current) {
          isTransitioning.current = true;
          headerVisibleRef.current = true;
          setHeaderVisible(true);
          setTimeout(() => { isTransitioning.current = false; }, 400);
        }
      } else if (delta > 8 && headerVisibleRef.current) {
        // Scrolling DOWN by enough → collapse
        collapseScrollY = currentScrollY;
        isTransitioning.current = true;
        headerVisibleRef.current = false;
        setHeaderVisible(false);
        setTimeout(() => { isTransitioning.current = false; }, 400);
      } else if (delta < -8 && !headerVisibleRef.current) {
        // Scrolling UP by enough after collapsing → expand
        // Hysteresis: only re-expand if user has scrolled 60px back up from collapse point
        if (collapseScrollY - currentScrollY > 60 || currentScrollY < 120) {
          isTransitioning.current = true;
          headerVisibleRef.current = true;
          setHeaderVisible(true);
          setTimeout(() => { isTransitioning.current = false; }, 400);
        }
      }

      lastScrollY = currentScrollY;
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  // 롱프레스 핸들러 구현
  const touchFiredRef = useRef(false); // touch 이벤트가 발생했으면 mouse 이벤트 무시

  const handleTouchStart = (groupId: string, code: string) => {
    isLongPress.current = false;
    if (longPressTimeout.current) clearTimeout(longPressTimeout.current);

    longPressTimeout.current = setTimeout(() => {
      isLongPress.current = true;
      setActiveDropdown(groupId);
    }, 600); // 0.6초 롱프레스 임계값
  };

  const handleTouchStartTouch = (e: React.TouchEvent, groupId: string, code: string) => {
    touchFiredRef.current = true;
    handleTouchStart(groupId, code);
  };

  const handleTouchEndTouch = (e: React.TouchEvent, group: any) => {
    e.preventDefault(); // 합성 mouse 이벤트 차단 (핵심!)
    touchFiredRef.current = true;
    if (longPressTimeout.current) {
      clearTimeout(longPressTimeout.current);
      longPressTimeout.current = null;
    }
    if (!isLongPress.current) {
      if (group.code === "") {
        setRegion("");
      } else {
        setRegion(region === group.code ? "" : group.code);
      }
      setActiveDropdown(null);
    }
    // 짧은 딜레이 후 touch 플래그 초기화
    setTimeout(() => { touchFiredRef.current = false; }, 300);
  };

  const handleMouseDownRegion = (groupId: string, code: string) => {
    if (touchFiredRef.current) return; // 터치 직후 mouse 이벤트 무시
    handleTouchStart(groupId, code);
  };

  const handleMouseUpRegion = (group: any) => {
    if (touchFiredRef.current) return; // 터치 직후 mouse 이벤트 무시
    handleTouchEnd(group);
  };

  const handleTouchEnd = (group: any) => {
    if (longPressTimeout.current) {
      clearTimeout(longPressTimeout.current);
      longPressTimeout.current = null;
    }
    if (!isLongPress.current) {
      if (group.code === "") {
        setRegion("");
      } else {
        // 1번 누르면 해당 대표 국가 토글
        setRegion(region === group.code ? "" : group.code);
      }
      setActiveDropdown(null);
    }
  };

  const handleTouchMove = () => {
    if (longPressTimeout.current) {
      clearTimeout(longPressTimeout.current);
      longPressTimeout.current = null;
    }
  };

  const selectSubRegion = (code: string) => {
    setRegion(code);
    setActiveDropdown(null);
  };

  const router = useRouter();
  const params = useParams();
  const locale = (params?.locale as string) || "ko";

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

  /* 검색 실행 핸들러 */
  const handleSearch = useCallback((query: string) => {
    const trimmed = query.trim();
    if (!trimmed) {
      handleClearSearch();
      return;
    }
    setActiveSearchQuery(trimmed);
    setIsSearching(true);
    setLoading(true);
    searchVideosClient(trimmed, 20, 0)
      .then(data => {
        setItems(data);
        setOffset(data.length);
        setHasMore(data.length >= 20);
      })
      .finally(() => setLoading(false));
  }, []);

  /* 검색 초기화 핸들러 */
  const handleClearSearch = useCallback(() => {
    setSearchQuery("");
    setActiveSearchQuery("");
    setIsSearching(false);
    setLoading(true);
    fetchRankingsClient(rankType, 20, 0, period, region, cat, rankBasis)
      .then(data => {
        setItems(data);
        setOffset(data.length);
        setHasMore(data.length >= 20);
      })
      .finally(() => setLoading(false));
  }, [rankType, period, region, cat, rankBasis]);

  /* 필터 변경 시 재조회 (hydration 완료 후에만 실행) */
  useEffect(() => {
    if (!hydrated) return;
    
    // 필터 변경 시 검색 비활성화
    setIsSearching(false);
    setSearchQuery("");
    setActiveSearchQuery("");

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
      if (isSearching && activeSearchQuery) {
        const data = await searchVideosClient(activeSearchQuery, 20, offset);
        if (data.length < 20) setHasMore(false);
        setItems((p: RankingItem[]) => [...p, ...data]);
        setOffset((p: number) => p + data.length);
      } else {
        const data = await fetchRankingsClient(rankType, 20, offset, period, region, cat, rankBasis);
        if (data.length < 20) setHasMore(false);
        setItems((p: RankingItem[]) => [...p, ...data]);
        setOffset((p: number) => p + data.length);
      }
    } finally { setLoading(false); }
  }, [loading, hasMore, offset, rankType, period, region, cat, rankBasis, isSearching, activeSearchQuery]);

  useEffect(() => {
    const obs = new IntersectionObserver(
      (entries: IntersectionObserverEntry[]) => { if (entries[0]?.isIntersecting) loadMore(); }, { threshold: 0.3 }
    );
    if (sentinelRef.current) obs.observe(sentinelRef.current);
    return () => obs.disconnect();
  }, [loadMore]);

  return (
    <div style={{ background: BG }} className="min-h-screen">

      {/* ══ 고정 상단 메뉴 ══ */}
      <div className="fixed top-0 left-0 right-0 z-30 max-w-2xl mx-auto w-full"
        style={{
          background: "linear-gradient(to bottom,rgba(253,249,245,0.95) 0%,rgba(253,249,245,0.85) 100%)",
          backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)",
          boxShadow: "0 4px 20px -5px rgba(0,0,0,0.05)"
        }}>

        {/* 타이틀 및 한영 전환 */}
        <div className="flex items-center gap-2 px-4 pt-3 pb-1">
          <span className="text-lg">🔥</span>
          <h1 className="font-black text-sm text-gray-800 tracking-tight flex items-center">
            {T[lang].title}
            <span
              onClick={() => router.push(`/${locale}/download`)}
              className="ml-1.5 cursor-pointer text-blue-600 hover:text-blue-700 hover:underline transition-colors font-black"
            >
              ShortsDown
            </span>
          </h1>
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

        {/* 검색 바 */}
        <div className="px-4 py-1.5">
          <div className="relative flex items-center">
            <span className="absolute left-3 text-gray-400 text-xs">🔍</span>
            <input
              type="text"
              placeholder={T[lang].searchPlaceholder}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSearch(searchQuery);
              }}
              className="w-full pl-8 pr-8 py-2 text-xs font-semibold text-gray-700 bg-white/80 backdrop-blur-xs border border-violet-100 rounded-full focus:outline-none focus:ring-1 focus:ring-violet-400 focus:bg-white placeholder-gray-400 transition-all shadow-[0_2px_6px_rgba(109,40,217,0.03)]"
            />
            {searchQuery && (
              <button
                onClick={handleClearSearch}
                className="absolute right-3 w-4 h-4 rounded-full flex items-center justify-center bg-gray-200/50 hover:bg-gray-200 text-gray-500 hover:text-gray-700 transition-colors text-[9px] font-bold"
                title={T[lang].exitSearch}
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* 접혔을 때 표시되는 미니 기간 필터 (텍스트만, 아이콘 없음) */}
        {!headerVisible && (
          <div className="px-4 pb-2.5 flex gap-1.5 overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] animate-fadeIn">
            {PERIOD_DATA.map(p => {
              const isSelected = period === p.pKey;
              return (
                <button
                  key={p.pKey}
                  onClick={() => setPeriod(p.pKey)}
                  className={`shrink-0 px-3 py-1 rounded-full text-[11px] font-bold transition-all duration-150 ${
                    isSelected
                      ? "bg-violet-500 text-white shadow-sm"
                      : "bg-white/80 text-gray-500 hover:bg-gray-100 border border-violet-100/50"
                  }`}
                >
                  {T[lang].periods[p.key as keyof typeof T.ko.periods]}
                </button>
              );
            })}
          </div>
        )}

        {/* 접이식 필터 영역 */}
        <div className={`transition-all duration-300 ease-in-out overflow-hidden ${
          headerVisible ? "max-h-[350px] opacity-100 mt-1 pb-3" : "max-h-0 opacity-0 pointer-events-none"
        }`}>
          {/* 나라 */}
          <div className={`px-4 mb-2.5 transition-all duration-300 relative ${isSearching ? "opacity-20 pointer-events-none filter blur-[0.5px]" : ""}`}>
            <p className="text-[9px] font-bold mb-1 tracking-widest uppercase text-violet-300">{T[lang].sectionRegion}</p>
            
            {/* Transparent overlay to close dropdown on tapping outside */}
            {activeDropdown && (
              <div className="fixed inset-0 z-40 bg-transparent" onClick={() => setActiveDropdown(null)} />
            )}

            {/* Region buttons row — 6개 균등 분배: flex-1 + 최소 간격 */}
            <div className="flex gap-1 w-full relative z-40">
              {REGION_GROUPS.map(group => {
                const isGroupActive = 
                  (group.code === "" && region === "") ||
                  (group.code !== "" && (region === group.code || group.subs.some(s => s.code === region)));
                
                let displayLabel = T[lang].regions[group.label as keyof typeof T.ko.regions] || group.icon;
                let displayFlag = group.flag;
                let displayIcon = group.icon;

                if (group.code !== "" && region !== group.code) {
                  const activeSub = group.subs.find(s => s.code === region);
                  if (activeSub) {
                    displayLabel = T[lang].regions[activeSub.key as keyof typeof T.ko.regions] || activeSub.key.toUpperCase();
                    displayFlag = activeSub.flag;
                    displayIcon = "";
                  }
                }

                return (
                  <div key={group.id} className="relative flex-1 flex flex-col items-center z-45">
                     <button
                      onMouseDown={() => handleMouseDownRegion(group.id, group.code)}
                      onMouseUp={() => handleMouseUpRegion(group)}
                      onMouseLeave={handleTouchMove}
                      onTouchStart={(e) => handleTouchStartTouch(e, group.id, group.code)}
                      onTouchEnd={(e) => handleTouchEndTouch(e, group)}
                      onTouchMove={handleTouchMove}
                      style={{
                        boxShadow: isGroupActive ? "0 4px 10px rgba(109,40,217,0.25)" : "0 2px 4px rgba(0,0,0,0.02)"
                      }}
                      className={`w-full h-[52px] rounded-full flex flex-col items-center justify-between py-1.5 px-1 transition-all duration-200 select-none ${
                        isGroupActive ? "bg-violet-500 text-white" : "bg-white/80 text-gray-500"
                      }`}
                    >
                      <span className="text-[10px] font-bold leading-tight truncate w-full text-center px-1">
                        {displayLabel}
                      </span>
                      {displayFlag ? (
                        <img
                          src={`https://flagcdn.com/w40/${displayFlag}.png`}
                          alt={displayLabel}
                          className="w-6 h-4 object-cover rounded-sm"
                        />
                      ) : (
                        <span className="text-[18px] leading-none">{displayIcon}</span>
                      )}
                    </button>

                    {/* Dropdown Menu for Sub-Regions */}
                    {activeDropdown === group.id && group.subs.length > 0 && (
                      <div 
                        className="absolute top-[58px] left-1/2 -translate-x-1/2 z-50 flex gap-2 p-2 bg-white/95 backdrop-blur-md border border-violet-100 rounded-2xl shadow-[0_10px_30px_-5px_rgba(109,40,217,0.2)]"
                        style={{
                          animation: "fadeInDown 0.15s cubic-bezier(0.16, 1, 0.3, 1) forwards",
                        }}
                      >
                        {/* Keyframe animation inline definitions */}
                        <style dangerouslySetInnerHTML={{__html: `
                          @keyframes fadeInDown {
                            from { opacity: 0; transform: translate(-50%, -8px) scale(0.95); }
                            to { opacity: 1; transform: translate(-50%, 0) scale(1); }
                          }
                        `}} />
                        {group.subs.map(sub => {
                          const isSubActive = region === sub.code;
                          return (
                            <button
                              key={sub.code}
                              onClick={() => selectSubRegion(sub.code)}
                              className={`shrink-0 w-11 h-11 rounded-full flex flex-col items-center justify-center gap-0.5 border transition-all ${
                                isSubActive 
                                  ? "bg-violet-500 text-white border-violet-600 shadow-md scale-105" 
                                  : "bg-white/90 text-gray-600 border-gray-100 hover:bg-gray-50"
                              }`}
                            >
                              <img src={`https://flagcdn.com/w40/${sub.flag}.png`} alt={sub.key} className="w-5 h-3.5 object-cover rounded-xs" />
                              <span className="text-[8px] font-extrabold tracking-tighter leading-none">
                                {T[lang].regions[sub.key as keyof typeof T.ko.regions] || sub.key.toUpperCase()}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* 카테고리 */}
          <div className={`px-4 mb-1.5 transition-all duration-300 ${isSearching ? "opacity-20 pointer-events-none filter blur-[0.5px]" : ""}`}>
            <p className="text-[9px] font-bold mb-1 tracking-widest uppercase text-violet-300">{T[lang].sectionCategory}</p>
            <div className={SCROLL}>
              {CAT_DATA.map(c => (
                <Tile key={c.val} label={T[lang].categories[c.key as keyof typeof T.ko.categories]} icon={c.icon}
                  active={cat === c.val}
                  onClick={() => setCat(cat === c.val && c.val !== "" ? "" : c.val)} />
              ))}
            </div>
          </div>

          {/* 기간 */}
          <div className={`px-4 transition-all duration-300 ${isSearching ? "opacity-20 pointer-events-none filter blur-[0.5px]" : ""}`}>
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

      </div>

      {/* ══ 고정 상단 메뉴 Spacer (레이아웃 시프트 방지) ══ */}
      <div className={`transition-all duration-300 pointer-events-none ${headerVisible ? "h-[282px]" : "h-[116.5px]"}`} />

      {/* ══ 우측 상단 정렬 기준 스위처 (사이드바 스타일, 투명도 50%) ══ */}
      <div className={`fixed right-3 top-48 z-30 flex flex-col items-center gap-2 transition-all duration-300 ${isSearching ? "opacity-10 pointer-events-none filter blur-[0.5px]" : "opacity-50 hover:opacity-100"}`}>
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
            disabled={isSearching}
            style={{ boxShadow: cat === c.val ? SHA : SH }}
            className={`w-10 h-10 rounded-full flex flex-col items-center justify-center gap-0.5 transition-all duration-200 ${
              isSearching ? "opacity-20 cursor-not-allowed filter blur-[0.5px]" : ""
            } ${
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
        {/* 검색 중일 때 YouTube 전체 검색 버튼 (항상 상단에 표시) */}
        {isSearching && activeSearchQuery && (
          <div className="px-4 pt-3 pb-1">
            <a
              href={`https://www.youtube.com/results?search_query=${encodeURIComponent(activeSearchQuery + ' shorts')}&sp=EgIYAQ%3D%3D`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between w-full px-4 py-3 rounded-2xl bg-gradient-to-r from-red-500 to-red-600 text-white text-[13px] font-bold shadow-[0_4px_16px_rgba(239,68,68,0.35)] hover:from-red-600 hover:to-red-700 active:scale-[0.98] transition-all duration-150"
            >
              <span className="flex items-center gap-2">
                {/* YouTube 로고 아이콘 */}
                <svg viewBox="0 0 24 24" className="w-5 h-5 fill-white flex-shrink-0">
                  <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                </svg>
                <span>&ldquo;{activeSearchQuery}&rdquo; {T[lang].searchOnYouTube}</span>
              </span>
              <span className="text-red-100 text-[11px] font-normal">Shorts ▶</span>
            </a>
          </div>
        )}

        {loading && items.length === 0 ? (
          <p className="text-center text-violet-300 py-16 text-sm">{T[lang].loading}</p>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center gap-4 py-16 px-4">
            <p className="text-center text-gray-400 text-sm">
              {isSearching ? T[lang].noSearchResults : T[lang].noData}
            </p>
            {isSearching && activeSearchQuery && (
              <a
                href={`https://www.youtube.com/results?search_query=${encodeURIComponent(activeSearchQuery + ' shorts')}&sp=EgIYAQ%3D%3D`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-red-500 text-white text-[12px] font-bold shadow-lg hover:bg-red-600 active:scale-95 transition-all"
              >
                <svg viewBox="0 0 24 24" className="w-4 h-4 fill-white">
                  <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                </svg>
                {T[lang].searchOnYouTubeHint}
              </a>
            )}
          </div>
        ) : layout === "list" ? (
          <ListView items={items} lang={lang} />
        ) : (
          <BoxView items={items} lang={lang} />
        )}

        {/* 결과 있을 때 하단에 YouTube 링크 */}
        {isSearching && activeSearchQuery && items.length > 0 && (
          <div className="px-4 py-3 flex justify-center">
            <a
              href={`https://www.youtube.com/results?search_query=${encodeURIComponent(activeSearchQuery + ' shorts')}&sp=EgIYAQ%3D%3D`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-[11px] text-red-400 font-semibold hover:text-red-500 transition-colors"
            >
              <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 fill-red-400">
                <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
              </svg>
              {T[lang].searchOnYouTubeHint}
            </a>
          </div>
        )}

        <div ref={sentinelRef} className="h-10 flex items-center justify-center">
          {loading && <p className="text-xs text-violet-300">{T[lang].loading}</p>}
          {!hasMore && items.length > 0 && (
            <p className="text-xs text-violet-200">{T[lang].lastVideo}</p>
          )}
        </div>
        <Footer lang={lang} />
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
            try {
              sessionStorage.setItem("s100_current_ids", JSON.stringify(items.map(i => i.id)));
            } catch (err) {}
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

                <div className="flex flex-col items-center gap-1 shrink-0">
                  <span className="text-violet-300 text-xs">▶</span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      const url = `https://www.youtube.com/shorts/${item.platform_video_id}`;
                      if (navigator.share) {
                        navigator.share({ title: item.title, url });
                      } else {
                        navigator.clipboard.writeText(url);
                      }
                    }}
                    className="text-gray-300 hover:text-violet-400 transition-colors"
                    title="Share"
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>
                      <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
                    </svg>
                  </button>
                </div>
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
                    try {
                      sessionStorage.setItem("s100_current_ids", JSON.stringify(items.map(i => i.id)));
                    } catch (err) {}
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
