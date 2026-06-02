"use client";

import React, { useState, useEffect, useCallback } from "react";
import { fetchRankingsClient } from "@/lib/api";
import type { RankingItem } from "@/components/RankingList";

type Period    = "realtime" | "today" | "weekly" | "monthly" | "yearly";
type RankBasis = "algo" | "view_count" | "view_delta" | "rising";
type Lang      = "ko" | "en";

const PERIODS: { key: Period; ko: string; en: string }[] = [
  { key: "realtime", ko: "실시간", en: "Live"    },
  { key: "today",    ko: "오늘",   en: "Today"   },
  { key: "weekly",   ko: "주간",   en: "Weekly"  },
  { key: "monthly",  ko: "월간",   en: "Monthly" },
  { key: "yearly",   ko: "연간",   en: "Yearly"  },
];
const RANK_BASES: { key: RankBasis; ko: string; en: string }[] = [
  { key: "algo",       ko: "스코어", en: "Score"  },
  { key: "view_count", ko: "조회수", en: "Views"  },
  { key: "view_delta", ko: "증가량", en: "Growth" },
  { key: "rising",     ko: "신규",   en: "Rising" },
];
const REGIONS = [
  { key: "",   ko: "전체",   en: "All",    flag: "" },
  { key: "KR", ko: "한국",   en: "Korea",  flag: "kr" },
  { key: "US", ko: "미국",   en: "USA",    flag: "us" },
  { key: "IN", ko: "인도",   en: "India",  flag: "in" },
  { key: "JP", ko: "일본",   en: "Japan",  flag: "jp" },
  { key: "GB", ko: "영국",   en: "UK",     flag: "gb" },
  { key: "BR", ko: "브라질", en: "Brazil", flag: "br" },
];

/* ─── Helpers ───────────────────────────────────────── */
function fmt(n: number, lang: Lang) {
  if (!n) return "─";
  if (lang === "ko") {
    if (n >= 1e8) return `${(n / 1e8).toFixed(1)}억`;
    if (n >= 1e4) return `${(n / 1e4).toFixed(1)}만`;
    return n.toLocaleString();
  }
  if (n >= 1e9) return `${(n / 1e9).toFixed(1)}B`;
  if (n >= 1e6) return `${(n / 1e6).toFixed(1)}M`;
  if (n >= 1e3) return `${(n / 1e3).toFixed(1)}K`;
  return n.toLocaleString();
}

/* ─── Badge (왼쪽 분리 패널) ─────────────────────────── */
function RankBadge({ pos }: { pos: number }) {
  /* 1위: 형광 초록 그라데이션 배경 + 흰색 텍스트 
     2위 이상: 투명 배경 + 형광 초록/회색 텍스트 + 우측 희미한 구분선 */
  const isFirst = pos === 1;
  const isTop3 = pos <= 3;
  
  return (
    <div style={{
      background: isFirst ? "linear-gradient(180deg, #34d399 0%, #10b981 100%)" : "transparent",
      color: isFirst ? "#fff" : isTop3 ? "#34d399" : "rgba(255,255,255,0.4)",
      borderRight: isFirst ? "none" : "1px solid rgba(255,255,255,0.06)",
      minWidth: 64, width: 64, alignSelf: "stretch",
      display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      flexShrink: 0,
      fontWeight: 900,
      fontSize: isFirst ? 24 : 20,
    }}>
      {isFirst ? "#1" : pos}
    </div>
  );
}

/* ─── Change badge ───────────────────────────────────── */
function Change({ cur, prev }: { cur: number; prev?: number | null }) {
  if (prev == null)
    return <span style={{ background:"rgba(52,211,153,0.15)", color:"#34d399", fontSize:9, fontWeight:900, padding:"2px 6px", borderRadius:999 }}>NEW</span>;
  const d = prev - cur;
  if (d > 0) return <span style={{ color:"#34d399", fontSize:10, fontWeight:700 }}>▲{d}</span>;
  if (d < 0) return <span style={{ color:"#f87171", fontSize:10, fontWeight:700 }}>▼{Math.abs(d)}</span>;
  return <span style={{ color:"rgba(255,255,255,0.2)", fontSize:10 }}>─</span>;
}

/* ─── Thumbnail ──────────────────────────────────────── */
function Thumb({ url, title }: { url: string | null; title: string }) {
  const [err, setErr] = useState(false);
  const base: React.CSSProperties = {
    width: 52, height: 52, borderRadius: 12, flexShrink: 0, objectFit: "cover",
    border: "1px solid rgba(45,212,191,0.12)",
  };
  if (!url || err)
    return <div style={{ ...base, background:"rgba(45,212,191,0.07)", display:"flex", alignItems:"center", justifyContent:"center" }}>
      <span style={{ color:"rgba(45,212,191,0.3)", fontSize:18 }}>▶</span>
    </div>;
  return <img src={url} alt={title} onError={() => setErr(true)} style={base} />;
}

/* ─── Stat column ────────────────────────────────────── */
function Stat({ val, label, accent }: { val: string; label: string; accent?: boolean }) {
  return (
    <div style={{ textAlign:"right", flexShrink:0, minWidth:54 }}>
      <div style={{ color: accent ? "#2dd4bf" : "#fff", fontWeight:700, fontSize:13, fontVariantNumeric:"tabular-nums" }}>{val}</div>
      <div style={{ color:"rgba(45,212,191,0.4)", fontSize:9, marginTop:2 }}>{label}</div>
    </div>
  );
}

/* ─── Card ───────────────────────────────────────────── */
function Card({ item, lang }: { item: RankingItem; lang: Lang }) {
  const [hov, setHov] = useState(false);
  const isTop = item.position <= 3;

  const cardStyle: React.CSSProperties = {
    display: "flex", overflow: "hidden", borderRadius: 20,
    transition: "all 0.2s ease",
    background: item.position === 1 ? "rgba(16, 185, 129, 0.15)" : "rgba(255, 255, 255, 0.04)",
    backdropFilter: "blur(12px)",
    WebkitBackdropFilter: "blur(12px)",
    border: item.position === 1 
      ? "1px solid rgba(52, 211, 153, 0.3)" 
      : hov ? "1px solid rgba(255, 255, 255, 0.15)" : "1px solid rgba(255,255,255,0.06)",
    boxShadow: hov
      ? "0 8px 24px rgba(0,0,0,0.6)"
      : "0 4px 16px rgba(0,0,0,0.4)",
    marginBottom: "12px",
  };

  const bodyStyle: React.CSSProperties = {
    flex: 1, display: "flex", alignItems: "center", gap: 14,
    padding: "16px",
  };

  return (
    <button
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      onClick={() => window.open(`https://www.youtube.com/shorts/${item.platform_video_id}`, "_blank", "noopener")}
      style={{ ...cardStyle, width:"100%", cursor:"pointer", textAlign:"left" }}
    >
      <RankBadge pos={item.position} />

      <div style={bodyStyle}>
        <Thumb url={item.thumbnail_url} title={item.title} />

        <div style={{ flex:1, minWidth:0 }}>
          <p style={{ color:"#fff", fontWeight:600, fontSize:13, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", marginBottom:3 }}>
            {item.title}
          </p>
          <div style={{ display:"flex", alignItems:"center", gap:6 }}>
            <span style={{ color:"rgba(255,255,255,0.35)", fontSize:11, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
              {item.channel_title}
            </span>
            <Change cur={item.position} prev={item.prev_position} />
          </div>
        </div>

        {/* Stats */}
        <div style={{ display:"flex", gap:12, alignItems:"center" }}>
          <Stat val={fmt(item.view_count, lang)} label={lang === "ko" ? "조회수" : "Views"} />
          {(item.like_count ?? 0) > 0 && (
            <div style={{ display:"none" }} className="sm-stat">
              <Stat val={fmt(item.like_count!, lang)} label={lang === "ko" ? "좋아요" : "Likes"} />
            </div>
          )}
          {item.score != null && (
            <Stat val={item.score.toFixed(1)} label="Score" accent />
          )}
        </div>
      </div>
    </button>
  );
}

/* ─── Skeleton ───────────────────────────────────────── */
function Skeleton() {
  return (
    <div style={{ display:"flex", overflow:"hidden", borderRadius:16, border:"1px solid rgba(255,255,255,0.04)" }}>
      <div style={{ width:52, minHeight:76, background:"rgba(45,212,191,0.06)", flexShrink:0 }} />
      <div style={{ flex:1, display:"flex", alignItems:"center", gap:12, padding:"12px 14px",
        background:"rgba(255,255,255,0.02)" }} className="animate-pulse">
        <div style={{ width:52, height:52, borderRadius:12, background:"rgba(255,255,255,0.06)", flexShrink:0 }} />
        <div style={{ flex:1 }}>
          <div style={{ height:13, background:"rgba(255,255,255,0.07)", borderRadius:6, width:"70%", marginBottom:8 }} />
          <div style={{ height:10, background:"rgba(255,255,255,0.04)", borderRadius:6, width:"45%" }} />
        </div>
        <div style={{ width:50, height:30, background:"rgba(255,255,255,0.04)", borderRadius:8 }} />
      </div>
    </div>
  );
}

/* ─── Filter Pill ────────────────────────────────────── */
function Pill({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      style={{
        flexShrink:0, padding:"8px 20px", borderRadius:999,
        fontSize:14, fontWeight:700, cursor:"pointer",
        transition:"all 0.3s cubic-bezier(0.4, 0, 0.2, 1)", whiteSpace:"nowrap",
        ...(active ? {
          background: "linear-gradient(135deg, #10b981 0%, #047857 100%)",
          border: "1px solid rgba(52, 211, 153, 0.6)",
          color: "#fff",
          textShadow: "0 1px 2px rgba(0,0,0,0.5)",
          boxShadow: "0 4px 16px rgba(16, 185, 129, 0.4), inset 0 1px 2px rgba(255, 255, 255, 0.4)",
        } : {
          background: "rgba(255, 255, 255, 0.04)",
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
          border: "1px solid rgba(255, 255, 255, 0.1)",
          color: "rgba(255,255,255,0.7)",
          boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
        }),
      }}
    >
      {children}
    </button>
  );
}

/* ─── Logo ───────────────────────────────────────────── */
function Logo() {
  return (
    <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
      <rect width="32" height="32" rx="10" fill="url(#lg2)" />
      <path d="M12 10.5l11 5.5-11 5.5V10.5z" fill="white"/>
      <defs>
        <linearGradient id="lg2" x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
          <stop stopColor="#2dd4bf"/><stop offset="1" stopColor="#059669"/>
        </linearGradient>
      </defs>
    </svg>
  );
}

/* ─── Main ───────────────────────────────────────────── */
export default function NewRankingUI({ contained = false }: { contained?: boolean }) {
  const [lang,      setLang]      = useState<Lang>("ko");
  const [period,    setPeriod]    = useState<Period>("realtime");
  const [region,    setRegion]    = useState("");
  const [rankBasis, setRankBasis] = useState<RankBasis>("algo");
  const [items,     setItems]     = useState<RankingItem[]>([]);
  const [loading,   setLoading]   = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const data = await fetchRankingsClient("global", 30, 0, period, region || undefined, undefined, rankBasis);
    setItems(data);
    setLoading(false);
  }, [period, region, rankBasis]);

  useEffect(() => { load(); }, [load]);

  const t = (ko: string, en: string) => lang === "ko" ? ko : en;

  return (
    <>
      <style>{`
        *{box-sizing:border-box;margin:0;padding:0}
        ${!contained ? "body{background:#060d14!important;overflow-x:hidden}" : ""}
        .pill-row{display:flex;gap:8px;overflow-x:auto;padding-bottom:4px}
        .pill-row::-webkit-scrollbar{display:none}
        @media(min-width:480px){.sm-stat{display:block!important}}
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}}
        .animate-pulse *{animation:pulse 2s cubic-bezier(.4,0,.6,1) infinite}
        ::-webkit-scrollbar{width:4px}
        ::-webkit-scrollbar-thumb{background:rgba(45,212,191,0.3);border-radius:999px}
      `}</style>

      <div style={{ minHeight: contained ? undefined : "100vh", position:"relative", overflowX:"hidden",
        background:"#030712" }}>

        {/* ── 배경 네온 orb ── */}
        {!contained && (
        <div style={{ position:"fixed", inset:0, pointerEvents:"none", zIndex:0, overflow:"hidden" }}>
          <div style={{
            position:"absolute", top:"-10%", left:"50%", transform: "translateX(-50%)",
            width:"120%", height:"60%", borderRadius:"50%",
            background:"radial-gradient(circle at 50% 30%, rgba(16, 185, 129, 0.15) 0%, rgba(5, 150, 105, 0.05) 40%, transparent 70%)",
            filter:"blur(60px)",
          }}/>
          <div style={{
            position:"absolute", bottom:"0%", right:"-20%",
            width:600, height:600, borderRadius:"50%",
            background:"radial-gradient(circle, rgba(52, 211, 153, 0.05) 0%, transparent 60%)",
            filter:"blur(80px)",
          }}/>
        </div>
        )}

        {/* ── Navbar ── */}
        <nav style={{
          position:"sticky", top:0, zIndex:40,
          backdropFilter:"blur(24px)", WebkitBackdropFilter:"blur(24px)",
          background:"rgba(6,13,20,0.88)",
          borderBottom:"1px solid rgba(45,212,191,0.12)",
          boxShadow:"0 1px 0 rgba(45,212,191,0.06)",
        }}>
          <div style={{ maxWidth:680, margin:"0 auto", padding:"0 16px", height:56,
            display:"flex", alignItems:"center", justifyContent:"space-between" }}>
            <div style={{ display:"flex", alignItems:"center", gap:10 }}>
              <Logo />
              <span style={{ fontWeight:900, fontSize:17, letterSpacing:"-0.5px" }}>
                <span style={{ color:"#fff" }}>Shorts</span>
                <span style={{ color:"#2dd4bf", textShadow:"0 0 10px rgba(45,212,191,0.5)" }}>100</span>
              </span>
            </div>
            <button
              onClick={() => setLang(l => l === "ko" ? "en" : "ko")}
              style={{
                fontSize:11, fontWeight:900, padding:"6px 12px", borderRadius:999,
                border:"1px solid rgba(45,212,191,0.35)", color:"#2dd4bf",
                background:"rgba(45,212,191,0.07)", cursor:"pointer",
                boxShadow:"0 0 8px rgba(45,212,191,0.2)",
              }}>
              {lang === "ko" ? "EN" : "한"}
            </button>
          </div>
        </nav>

        {/* ── Content ── */}
        <div style={{ position:"relative", zIndex:1, maxWidth:680, margin:"0 auto", padding:"32px 16px 96px" }}>

          {/* Hero */}
          <div style={{ marginBottom:40 }}>
            <div style={{
              display:"inline-flex", alignItems:"center", gap:8, marginBottom:24,
              background:"rgba(16, 185, 129, 0.15)", border:"1px solid rgba(52, 211, 153, 0.4)",
              borderRadius:999, padding:"6px 16px",
              boxShadow:"0 0 16px rgba(16, 185, 129, 0.2), inset 0 1px 2px rgba(255,255,255,0.1)",
            }}>
              <span style={{ width:8, height:8, borderRadius:"50%", background:"#34d399",
                boxShadow:"0 0 10px #34d399, 0 0 20px #10b981", display:"inline-block",
                animation:"pulse 2s ease-in-out infinite" }} />
              <span style={{ color:"#a7f3d0", fontSize:13, fontWeight:700, letterSpacing:"0.5px" }}>{t("실시간 업데이트", "Live Updates")}</span>
            </div>

            <h1 style={{ fontWeight:900, lineHeight:1.1, letterSpacing:"-1.5px",
              fontSize:"clamp(36px, 9vw, 52px)" }}>
              <span style={{ color:"#ffffff", textShadow:"0 2px 12px rgba(0,0,0,0.5)" }}>{t("유튜브 쇼츠", "YouTube Shorts")}</span><br />
              <span style={{
                background:"linear-gradient(180deg, #a7f3d0 0%, #10b981 100%)",
                WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent",
                filter:"drop-shadow(0 4px 16px rgba(16, 185, 129, 0.6))",
                display: "inline-block",
                marginTop: 4,
              }}>TOP 100</span>
            </h1>
            <p style={{ color:"rgba(255,255,255,0.3)", fontSize:13, marginTop:8 }}>
              {t("지금 가장 뜨는 쇼츠 영상을 한눈에", "The hottest short-form videos right now")}
            </p>
          </div>

          {/* Period filter */}
          <div className="pill-row" style={{ marginBottom:10 }}>
            {PERIODS.map(p => (
              <Pill key={p.key} active={period === p.key} onClick={() => setPeriod(p.key)}>
                {lang === "ko" ? p.ko : p.en}
              </Pill>
            ))}
          </div>

          {/* Region + RankBasis filter */}
          <div className="pill-row" style={{ marginBottom:28 }}>
            {REGIONS.map(r => (
              <Pill key={r.key} active={region === r.key} onClick={() => setRegion(r.key)}>
                {r.flag
                  ? <span style={{ display:"inline-flex", alignItems:"center", gap:4 }}>
                      <img src={`https://flagcdn.com/w20/${r.flag}.png`} alt={r.en}
                        style={{ width:16, height:10, objectFit:"cover", borderRadius:2 }}/>
                      {lang === "ko" ? r.ko : r.en}
                    </span>
                  : (lang === "ko" ? r.ko : r.en)}
              </Pill>
            ))}
            <div style={{ width:1, background:"rgba(45,212,191,0.15)", flexShrink:0, margin:"0 4px" }}/>
            {RANK_BASES.map(b => (
              <Pill key={b.key} active={rankBasis === b.key} onClick={() => setRankBasis(b.key)}>
                {lang === "ko" ? b.ko : b.en}
              </Pill>
            ))}
          </div>

          {/* List header */}
          <div style={{ display:"flex", justifyContent:"space-between", marginBottom:12, padding:"0 4px" }}>
            <span style={{ color:"rgba(45,212,191,0.5)", fontSize:11, fontWeight:700, textTransform:"uppercase", letterSpacing:"0.08em" }}>
              {t("순위", "Rank")} · {PERIODS.find(p => p.key === period)?.[lang]} · {REGIONS.find(r => r.key === region)?.[lang === "ko" ? "ko" : "en"] ?? t("전체","All")}
            </span>
            <span style={{ color:"rgba(255,255,255,0.15)", fontSize:11 }}>
              {loading ? "…" : `${items.length}${t("개","")}`}
            </span>
          </div>

          {/* Ranking list */}
          <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
            {loading
              ? Array.from({length:10}).map((_,i) => <Skeleton key={i}/>)
              : items.length === 0
              ? <p style={{ textAlign:"center", padding:"80px 0", color:"rgba(255,255,255,0.18)", fontSize:13 }}>
                  {t("데이터가 없습니다","No data")}
                </p>
              : items.map(item => <Card key={item.id} item={item} lang={lang}/>)
            }
          </div>

          {!loading && items.length > 0 && (
            <p style={{ textAlign:"center", marginTop:32, color:"rgba(255,255,255,0.1)", fontSize:11 }}>
              {t("카드를 탭하면 YouTube에서 바로 시청합니다","Tap any card to open on YouTube")}
            </p>
          )}
        </div>
      </div>
    </>
  );
}
