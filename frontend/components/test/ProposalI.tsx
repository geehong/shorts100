"use client";
/* ProposalI — 팝 컬러
   흰 배경 · 행마다 다른 액센트 (나라=스카이, 카테고리=에메랄드, 기간=로즈)
   채도 높은 선택 버튼 · 컬러풀 순위 뱃지 */
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
const PERIOD_DATA = [["오늘","📅"],["주간","📊"],["월간","📆"],["연간","🗓"],["전체","♾"]];
const SIDE_CATS = [
  {name:"음악",icon:"🎵",sh:"rgba(16,185,129",sha:"rgba(16,185,129"},
  {name:"게임",icon:"🎮",sh:"rgba(16,185,129",sha:"rgba(16,185,129"},
  {name:"스포츠",icon:"⚽",sh:"rgba(16,185,129",sha:"rgba(16,185,129"},
  {name:"코미디",icon:"😂",sh:"rgba(16,185,129",sha:"rgba(16,185,129"},
  {name:"엔터",icon:"🎬",sh:"rgba(16,185,129",sha:"rgba(16,185,129"},
];

// 각 행별 색상
const SKY  = {sh:"2px -0.2px 5px rgba(14,165,233,0.18),3px -0.3px 9px rgba(14,165,233,0.09)", sha:"2px -0.2px 5px rgba(14,165,233,0.45),3px -0.3px 9px rgba(14,165,233,0.22)", active:"bg-sky-500/70 text-white", inactive:"bg-sky-50 text-sky-600"};
const EMR  = {sh:"2px -0.2px 5px rgba(16,185,129,0.18),3px -0.3px 9px rgba(16,185,129,0.09)", sha:"2px -0.2px 5px rgba(16,185,129,0.45),3px -0.3px 9px rgba(16,185,129,0.22)", active:"bg-emerald-500/70 text-white", inactive:"bg-emerald-50 text-emerald-600"};
const ROSE = {sh:"2px -0.2px 5px rgba(244,63,94,0.18),3px -0.3px 9px rgba(244,63,94,0.09)",  sha:"2px -0.2px 5px rgba(244,63,94,0.45),3px -0.3px 9px rgba(244,63,94,0.22)",   active:"bg-rose-500/70 text-white",    inactive:"bg-rose-50 text-rose-500"};

const SCROLL = "flex gap-1.5 overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]";

function Tile({ name, icon, active, scheme, onClick }:{
  name:string;icon:string;active:boolean;onClick:()=>void;
  scheme:{sh:string;sha:string;active:string;inactive:string};
}) {
  return (
    <button onClick={onClick} style={{boxShadow: active ? scheme.sha : scheme.sh}}
      className={`shrink-0 w-[52px] h-[52px] rounded-xl flex flex-col items-center justify-between py-1.5 px-1 transition-all duration-200 ${
        active ? scheme.active : scheme.inactive
      }`}>
      <span className="text-[10px] font-semibold leading-tight truncate w-full text-center tracking-tight">{name}</span>
      <span className="text-[18px] leading-none">{icon}</span>
    </button>
  );
}

export default function ProposalI() {
  const [layout, setLayout] = useState<Layout>("list");
  const [region, setRegion] = useState("전체");
  const [cat, setCat]       = useState("전체");
  const [period, setPeriod] = useState("전체");
  const MENU_H = 242;

  return (
    <div className="relative h-full overflow-hidden bg-white">

      <div className="absolute inset-0 overflow-y-auto [&::-webkit-scrollbar]:hidden"
           style={{paddingTop:`${MENU_H+16}px`,paddingBottom:"80px"}}>
        {layout==="list" ? <IList /> : <IBox />}
      </div>

      {/* 상단 메뉴 */}
      <div className="absolute top-0 left-0 right-0 z-20"
        style={{height:`${MENU_H}px`,
          background:"linear-gradient(to bottom,rgba(255,255,255,0.98) 0%,rgba(255,255,255,0.90) 80%,transparent 100%)",
          backdropFilter:"blur(18px)",WebkitBackdropFilter:"blur(18px)"}}>

        <div className="flex items-center gap-2 px-4 pt-2 pb-1">
          <span className="text-base">🔥</span>
          <span className="font-black text-sm text-gray-900 tracking-tight">Shorts100</span>
          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-rose-50 text-rose-500">TOP 100</span>
        </div>

        <div className="px-4 mb-1.5">
          <p className="text-[9px] font-bold mb-1 tracking-widest uppercase text-sky-400">나라</p>
          <div className={SCROLL}>
            {REGION_DATA.map(([n,i])=><Tile key={n} name={n} icon={i} active={region===n} scheme={SKY} onClick={()=>setRegion(n)}/>)}
          </div>
        </div>
        <div className="px-4 mb-1.5">
          <p className="text-[9px] font-bold mb-1 tracking-widest uppercase text-emerald-400">카테고리</p>
          <div className={SCROLL}>
            {CAT_DATA.map(([n,i])=><Tile key={n} name={n} icon={i} active={cat===n} scheme={EMR} onClick={()=>setCat(n)}/>)}
          </div>
        </div>
        <div className="px-4">
          <p className="text-[9px] font-bold mb-1 tracking-widest uppercase text-rose-400">기간</p>
          <div className="flex justify-between">
            {PERIOD_DATA.map(([n,i])=><Tile key={n} name={n} icon={i} active={period===n} scheme={ROSE} onClick={()=>setPeriod(n)}/>)}
          </div>
        </div>
      </div>

      {/* 우측 사이드 */}
      <div className="absolute bottom-12 right-3 z-30 flex flex-col items-center gap-2">
        {SIDE_CATS.map((c)=>(
          <button key={c.name} onClick={()=>setCat(c.name)}
            style={{boxShadow: cat===c.name ? EMR.sha : EMR.sh}}
            className={`w-10 h-10 rounded-xl flex flex-col items-center justify-center gap-0.5 transition-all duration-200 ${
              cat===c.name ? EMR.active : EMR.inactive
            }`}>
            <span className="text-base leading-none">{c.icon}</span>
            <span className="text-[8px] font-semibold leading-none">{c.name}</span>
          </button>
        ))}
        <div className="w-6 h-px my-0.5 bg-gray-100" />
        {(["list","box"] as Layout[]).map((key)=>(
          <button key={key} onClick={()=>setLayout(key)}
            style={{boxShadow: layout===key ? SKY.sha : SKY.sh}}
            className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg transition-all ${
              layout===key ? SKY.active : "bg-sky-50 text-sky-400"
            }`}>
            {key==="list"?"≡":"⊞"}
          </button>
        ))}
      </div>

      <div className="absolute bottom-2 left-0 right-0 z-30 flex justify-center">
        <div className="w-28 h-1 rounded-full bg-gray-100" />
      </div>
    </div>
  );
}

const RANK_COLORS = [
  "bg-gradient-to-br from-yellow-400 to-orange-400 text-white",
  "bg-gradient-to-br from-gray-300 to-gray-400 text-white",
  "bg-gradient-to-br from-amber-500 to-orange-600 text-white",
  "bg-gradient-to-br from-sky-400 to-blue-500 text-white",
  "bg-gradient-to-br from-emerald-400 to-green-500 text-white",
];

function IList() {
  return (
    <div className="px-3 space-y-2 pb-2">
      {DUMMY.map((item)=>(
        <div key={item.rank}
          style={{boxShadow:"2px -0.2px 5px rgba(0,0,0,0.06),3px -0.3px 9px rgba(0,0,0,0.03)"}}
          className="flex items-center gap-3 bg-white rounded-2xl px-3 py-2.5 border border-gray-50">
          <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black shrink-0 ${
            RANK_COLORS[item.rank-1] ?? "bg-gray-100 text-gray-400"
          }`}>{item.rank}</span>
          <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${item.thumb} shrink-0`}/>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-gray-900 line-clamp-1">{item.title}</p>
            <p className="text-[10px] text-gray-400 mt-0.5">{item.channel}</p>
            <div className="flex gap-1.5 mt-0.5 text-[10px] text-gray-400">
              <span>👁 {item.views}</span><span>❤️ {item.likes}</span>
              <span className="bg-sky-50 text-sky-500 px-1 rounded-md text-[9px]">{item.region}</span>
            </div>
          </div>
          <span className="text-rose-300 text-xs shrink-0">▶</span>
        </div>
      ))}
    </div>
  );
}

function IBox() {
  return (
    <div className="grid grid-cols-2 gap-2 px-2">
      {DUMMY.map((item)=>(
        <div key={item.rank}
          style={{boxShadow:"2px -0.2px 5px rgba(0,0,0,0.08),3px -0.3px 9px rgba(0,0,0,0.04)"}}
          className={`relative aspect-[9/16] bg-gradient-to-br ${item.thumb} overflow-hidden rounded-2xl`}>
          <div className={`absolute top-2 left-2 w-7 h-7 rounded-full flex items-center justify-center text-xs font-black z-10 ${
            RANK_COLORS[item.rank-1] ?? "bg-black/50 backdrop-blur-sm text-white"
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
