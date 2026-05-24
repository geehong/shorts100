"use client";
import { useState } from "react";
import { DUMMY } from "./dummyData";

type Layout = "list" | "box";

const REGION_DATA = [
  ["전체","🌍"],["한국","🇰🇷"],["미국","🇺🇸"],["인도","🇮🇳"],
  ["일본","🇯🇵"],["브라질","🇧🇷"],["영국","🇬🇧"],["멕시코","🇲🇽"],
];
const CAT_DATA = [
  ["전체","☰"],["게임","🎮"],["음악","🎵"],["코미디","😂"],
  ["엔터","🎬"],["스포츠","⚽"],["교육","📚"],["동물","🐾"],["라이프","💄"],
];
const PERIOD_DATA = [
  ["오늘","📅"],["주간","📊"],["월간","📆"],["연간","🗓"],["전체","♾"],
];
const SIDE_CATS = [
  { name:"음악", icon:"🎵" },
  { name:"게임", icon:"🎮" },
  { name:"스포츠",icon:"⚽" },
  { name:"코미디",icon:"😂" },
  { name:"엔터", icon:"🎬" },
];

const SCROLL = "flex gap-1.5 overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]";

/* -5도 기울기 그림자: x=cos(-5°)≈0.996, y=sin(-5°)≈-0.087
   2~3px 범위로 축소 */
function neon(r: number, g: number, b: number, strong = false) {
  const a1 = strong ? 0.38 : 0.18;
  const a2 = strong ? 0.16 : 0.08;
  return `2px -0.2px 5px rgba(${r},${g},${b},${a1}), 3px -0.3px 9px rgba(${r},${g},${b},${a2})`;
}

const NEON_BLUE   = neon(59,  130, 246);
const NEON_BLUE_A = neon(59,  130, 246, true);
const NEON_PUR    = neon(139,  92, 246);
const NEON_PUR_A  = neon(139,  92, 246, true);

/* 정사각 타일 */
function Tile({ name, icon, active, dark, onClick }:{
  name:string; icon:string; active:boolean; dark:boolean; onClick:()=>void;
}) {
  const shadow = active
    ? (dark ? NEON_PUR_A : NEON_BLUE_A)
    : (dark ? NEON_PUR   : NEON_BLUE);
  return (
    <button onClick={onClick}
      style={{ boxShadow: shadow }}
      className={`shrink-0 w-[52px] h-[52px] rounded-xl flex flex-col items-center justify-between py-1.5 px-1 transition-all duration-200 ${
        active
          ? dark ? "bg-purple-500/70 text-white" : "bg-blue-500/65 text-white"
          : dark ? "bg-white/10 backdrop-blur-md text-white" : "bg-white/75 backdrop-blur-md text-gray-700"
      }`}>
      <span className="text-[10px] font-semibold leading-tight truncate w-full text-center tracking-tight">{name}</span>
      <span className="text-[18px] leading-none">{icon}</span>
    </button>
  );
}

export default function ProposalD() {
  const [layout, setLayout] = useState<Layout>("list");
  const [region, setRegion] = useState("전체");
  const [cat, setCat]       = useState("전체");
  const [period, setPeriod] = useState("전체");

  const isBox     = layout === "box";
  const MENU_H    = 242;
  const CONTENT_TOP = MENU_H + 16;

  return (
    <div className="relative h-full overflow-hidden"
      style={{
        background: isBox
          ? "linear-gradient(160deg,#0f0c29,#302b63,#24243e)"
          : "linear-gradient(160deg,#dbeafe 0%,#eff6ff 45%,#f8faff 100%)",
      }}>

      {/* 콘텐츠 */}
      <div className="absolute inset-0 overflow-y-auto [&::-webkit-scrollbar]:hidden"
           style={{ paddingTop: `${CONTENT_TOP}px`, paddingBottom: "80px" }}>
        {isBox ? <BoxContent /> : <ListContent isBox={isBox} />}
      </div>

      {/* 상단 글래스 메뉴 */}
      <div className="absolute top-0 left-0 right-0 z-20"
        style={{
          height: `${MENU_H}px`,
          background: isBox
            ? "linear-gradient(to bottom,rgba(15,12,41,0.92) 0%,rgba(15,12,41,0.80) 80%,transparent 100%)"
            : "linear-gradient(to bottom,rgba(219,234,254,0.97) 0%,rgba(239,246,255,0.93) 80%,transparent 100%)",
          backdropFilter: "blur(18px)",
          WebkitBackdropFilter: "blur(18px)",
        }}>

        {/* 타이틀 */}
        <div className="flex items-center gap-2 px-4 pt-2 pb-1">
          <span className="text-base">🔥</span>
          <span className={`font-black text-sm tracking-tight ${isBox?"text-white":"text-gray-900"}`}>Shorts100</span>
          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${isBox?"bg-white/10 text-white/50":"bg-blue-100 text-blue-500"}`}>TOP 100</span>
        </div>

        {/* 나라 */}
        <div className="px-4 mb-1.5">
          <p className={`text-[9px] font-bold mb-1 tracking-widest uppercase ${isBox?"text-white/30":"text-blue-400"}`}>나라</p>
          <div className={SCROLL}>
            {REGION_DATA.map(([n,i]) => (
              <Tile key={n} name={n} icon={i} active={region===n} dark={isBox} onClick={()=>setRegion(n)}/>
            ))}
          </div>
        </div>

        {/* 카테고리 */}
        <div className="px-4 mb-1.5">
          <p className={`text-[9px] font-bold mb-1 tracking-widest uppercase ${isBox?"text-white/30":"text-blue-400"}`}>카테고리</p>
          <div className={SCROLL}>
            {CAT_DATA.map(([n,i]) => (
              <Tile key={n} name={n} icon={i} active={cat===n} dark={isBox} onClick={()=>setCat(n)}/>
            ))}
          </div>
        </div>

        {/* 기간 — justify-between 균등분배 (타일 크기 유지) */}
        <div className="px-4">
          <p className={`text-[9px] font-bold mb-1 tracking-widest uppercase ${isBox?"text-white/30":"text-blue-400"}`}>기간</p>
          <div className="flex justify-between">
            {PERIOD_DATA.map(([n,i]) => (
              <Tile key={n} name={n} icon={i} active={period===n} dark={isBox} onClick={()=>setPeriod(n)}/>
            ))}
          </div>
        </div>
      </div>

      {/* 우측 사이드 */}
      <div className="absolute bottom-12 right-3 z-30 flex flex-col items-center gap-2">
        {SIDE_CATS.map((c) => (
          <button key={c.name} onClick={() => setCat(c.name)}
            style={{ boxShadow: cat===c.name ? (isBox?NEON_PUR_A:NEON_BLUE_A) : (isBox?NEON_PUR:NEON_BLUE) }}
            className={`w-10 h-10 rounded-2xl flex flex-col items-center justify-center gap-0.5 transition-all duration-200 ${
              cat===c.name
                ? isBox?"bg-purple-500 text-white scale-110":"bg-blue-500 text-white scale-110"
                : isBox?"bg-white/10 backdrop-blur-md text-white":"bg-white/75 backdrop-blur-md text-gray-600"
            }`}>
            <span className="text-base leading-none">{c.icon}</span>
            <span className="text-[8px] font-semibold leading-none">{c.name}</span>
          </button>
        ))}

        <div className={`w-6 h-px my-0.5 ${isBox?"bg-white/20":"bg-blue-200"}`} />

        {/* 레이아웃 토글 */}
        {([
          { key:"list" as Layout, svg: (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="w-4 h-4">
              <line x1="3" y1="6"  x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>
            </svg>
          )},
          { key:"box" as Layout, svg: (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
              <rect x="3"  y="3"  width="8" height="8" rx="1.5"/>
              <rect x="13" y="3"  width="8" height="8" rx="1.5"/>
              <rect x="3"  y="13" width="8" height="8" rx="1.5"/>
              <rect x="13" y="13" width="8" height="8" rx="1.5"/>
            </svg>
          )},
        ] as const).map(({ key, svg }) => (
          <button key={key} onClick={() => setLayout(key)}
            style={{ boxShadow: layout===key ? (isBox?NEON_PUR_A:NEON_BLUE_A) : (isBox?NEON_PUR:NEON_BLUE) }}
            className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-all duration-200 ${
              layout===key
                ? isBox?"bg-purple-500 text-white":"bg-blue-500 text-white"
                : isBox?"bg-white/10 text-white":"bg-white/75 text-gray-500"
            }`}>
            {svg}
          </button>
        ))}
      </div>

      {/* 홈바 */}
      <div className="absolute bottom-2 left-0 right-0 z-30 flex justify-center">
        <div className={`w-28 h-1 rounded-full ${isBox?"bg-white/20":"bg-blue-200/60"}`} />
      </div>
    </div>
  );
}

/* 리스트 뷰 */
function ListContent({ isBox }: { isBox: boolean }) {
  const shadow = neon(59, 130, 246);
  return (
    <div className="px-3 space-y-2 pb-2">
      {DUMMY.map((item) => (
        <div key={item.rank}
          style={{ boxShadow: shadow }}
          className="flex items-center gap-3 bg-white/75 backdrop-blur-sm rounded-2xl px-3 py-2.5">
          <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black shrink-0 ${
            item.rank===1?"bg-yellow-400 text-gray-900":
            item.rank===2?"bg-gray-300 text-gray-600":
            item.rank===3?"bg-amber-500 text-white":"bg-gray-100 text-gray-500"
          }`} style={{ boxShadow: item.rank<=3 ? neon(251,191,36,true) : "none" }}>
            {item.rank}
          </span>
          <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${item.thumb} shrink-0`}
               style={{ boxShadow: neon(99,102,241) }} />
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-gray-900 line-clamp-1 tracking-tight">{item.title}</p>
            <p className="text-[10px] text-gray-400 mt-0.5">{item.channel}</p>
            <div className="flex items-center gap-1.5 mt-0.5 text-[10px] text-gray-400">
              <span>👁 {item.views}</span>
              <span>❤️ {item.likes}</span>
              <span className="bg-blue-50 text-blue-400 px-1 rounded-md text-[9px] font-medium">{item.region}</span>
            </div>
          </div>
          <span className="text-blue-300 text-xs shrink-0">▶</span>
        </div>
      ))}
    </div>
  );
}

/* 박스 뷰 */
function BoxContent() {
  return (
    <div className="grid grid-cols-2 gap-2 px-2">
      {DUMMY.map((item) => (
        <div key={item.rank}
          style={{ boxShadow: neon(139, 92, 246) }}
          className={`relative aspect-[9/16] bg-gradient-to-br ${item.thumb} overflow-hidden rounded-2xl`}>
          <div className={`absolute top-2 left-2 w-7 h-7 rounded-full flex items-center justify-center text-xs font-black shadow-lg z-10 ${
            item.rank===1?"bg-yellow-400 text-gray-900 scale-125":
            item.rank<=3?"bg-red-500 text-white":"bg-black/50 backdrop-blur-sm text-white"
          }`}>{item.rank}</div>
          <div className="absolute top-2 right-2 bg-black/30 backdrop-blur-sm text-white text-[9px] px-1.5 py-0.5 rounded-full z-10">
            {item.region}
          </div>
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent px-2 pt-8 pb-2.5 z-10">
            <p className="text-white/60 text-[9px]">@{item.channel}</p>
            <p className="text-white text-[10px] font-semibold line-clamp-2 leading-snug">{item.title}</p>
            <p className="text-white/50 text-[9px] mt-0.5">👁 {item.views}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
