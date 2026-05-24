"use client";
/* ProposalF — 다크 사이버
   항상 피치블랙 배경 · 시안 네온 · 강한 글로우 · 사이버펑크 분위기 */
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
  {name:"음악",icon:"🎵"},{name:"게임",icon:"🎮"},{name:"스포츠",icon:"⚽"},
  {name:"코미디",icon:"😂"},{name:"엔터",icon:"🎬"},
];

const CN  = "2px -0.2px 5px rgba(6,182,212,0.20), 3px -0.3px 9px rgba(6,182,212,0.10)";
const CNA = "2px -0.2px 5px rgba(6,182,212,0.55), 3px -0.3px 9px rgba(6,182,212,0.28), 0 0 12px rgba(6,182,212,0.20)";
const SCROLL = "flex gap-1.5 overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]";

function Tile({ name, icon, active, onClick }:{name:string;icon:string;active:boolean;onClick:()=>void}) {
  return (
    <button onClick={onClick} style={{boxShadow: active ? CNA : CN}}
      className={`shrink-0 w-[52px] h-[52px] rounded-xl flex flex-col items-center justify-between py-1.5 px-1 transition-all duration-200 ${
        active ? "bg-cyan-500/55 text-white" : "bg-white/5 text-white/60"
      }`}>
      <span className="text-[10px] font-semibold leading-tight truncate w-full text-center tracking-tight">{name}</span>
      <span className="text-[18px] leading-none">{icon}</span>
    </button>
  );
}

export default function ProposalF() {
  const [layout, setLayout] = useState<Layout>("list");
  const [region, setRegion] = useState("전체");
  const [cat, setCat]       = useState("전체");
  const [period, setPeriod] = useState("전체");
  const MENU_H = 242;

  return (
    <div className="relative h-full overflow-hidden"
      style={{background:"#060a0f"}}>

      {/* 배경 그리드 효과 */}
      <div className="absolute inset-0 opacity-[0.04]"
        style={{backgroundImage:"linear-gradient(rgba(6,182,212,1) 1px,transparent 1px),linear-gradient(90deg,rgba(6,182,212,1) 1px,transparent 1px)",backgroundSize:"40px 40px"}}/>

      <div className="absolute inset-0 overflow-y-auto [&::-webkit-scrollbar]:hidden"
           style={{paddingTop:`${MENU_H+16}px`,paddingBottom:"80px"}}>
        {layout==="list" ? <FList /> : <FBox />}
      </div>

      {/* 상단 메뉴 */}
      <div className="absolute top-0 left-0 right-0 z-20"
        style={{height:`${MENU_H}px`,
          background:"linear-gradient(to bottom,rgba(6,10,15,0.96) 0%,rgba(6,10,15,0.85) 80%,transparent 100%)",
          backdropFilter:"blur(20px)",WebkitBackdropFilter:"blur(20px)"}}>

        <div className="flex items-center gap-2 px-4 pt-2 pb-1">
          <span className="text-base">⚡</span>
          <span className="font-black text-sm text-cyan-400 tracking-tight">Shorts100</span>
          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-cyan-500/15 text-cyan-400">TOP 100</span>
        </div>

        <div className="px-4 mb-1.5">
          <p className="text-[9px] font-bold mb-1 tracking-widest uppercase text-cyan-800">나라</p>
          <div className={SCROLL}>
            {REGION_DATA.map(([n,i])=><Tile key={n} name={n} icon={i} active={region===n} onClick={()=>setRegion(n)}/>)}
          </div>
        </div>
        <div className="px-4 mb-1.5">
          <p className="text-[9px] font-bold mb-1 tracking-widest uppercase text-cyan-800">카테고리</p>
          <div className={SCROLL}>
            {CAT_DATA.map(([n,i])=><Tile key={n} name={n} icon={i} active={cat===n} onClick={()=>setCat(n)}/>)}
          </div>
        </div>
        <div className="px-4">
          <p className="text-[9px] font-bold mb-1 tracking-widest uppercase text-cyan-800">기간</p>
          <div className="flex justify-between">
            {PERIOD_DATA.map(([n,i])=><Tile key={n} name={n} icon={i} active={period===n} onClick={()=>setPeriod(n)}/>)}
          </div>
        </div>
      </div>

      {/* 우측 사이드 */}
      <div className="absolute bottom-12 right-3 z-30 flex flex-col items-center gap-2">
        {SIDE_CATS.map((c)=>(
          <button key={c.name} onClick={()=>setCat(c.name)}
            style={{boxShadow: cat===c.name ? CNA : CN}}
            className={`w-10 h-10 rounded-xl flex flex-col items-center justify-center gap-0.5 transition-all duration-200 ${
              cat===c.name?"bg-cyan-500/55 text-white":"bg-white/5 text-white/50"
            }`}>
            <span className="text-base leading-none">{c.icon}</span>
            <span className="text-[8px] font-semibold leading-none">{c.name}</span>
          </button>
        ))}
        <div className="w-6 h-px my-0.5 bg-cyan-900" />
        {(["list","box"] as Layout[]).map((key)=>(
          <button key={key} onClick={()=>setLayout(key)}
            style={{boxShadow: layout===key ? CNA : CN}}
            className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg transition-all ${
              layout===key?"bg-cyan-500/55 text-white":"bg-white/5 text-white/40"
            }`}>
            {key==="list"?"≡":"⊞"}
          </button>
        ))}
      </div>

      <div className="absolute bottom-2 left-0 right-0 z-30 flex justify-center">
        <div className="w-28 h-1 rounded-full bg-cyan-900/50" />
      </div>
    </div>
  );
}

function FList() {
  return (
    <div className="px-3 space-y-2 pb-2">
      {DUMMY.map((item)=>(
        <div key={item.rank}
          style={{boxShadow:"2px -0.2px 5px rgba(6,182,212,0.14),3px -0.3px 9px rgba(6,182,212,0.07)"}}
          className="flex items-center gap-3 bg-white/5 rounded-2xl px-3 py-2.5 border border-white/5">
          <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black shrink-0 ${
            item.rank===1?"bg-yellow-400 text-gray-900":item.rank===2?"bg-gray-500 text-white":item.rank===3?"bg-amber-500 text-white":"bg-cyan-900/60 text-cyan-400"
          }`}>{item.rank}</span>
          <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${item.thumb} shrink-0`}/>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-white/90 line-clamp-1">{item.title}</p>
            <p className="text-[10px] text-white/40 mt-0.5">{item.channel}</p>
            <div className="flex gap-1.5 mt-0.5 text-[10px] text-white/40">
              <span>👁 {item.views}</span><span>❤️ {item.likes}</span>
              <span className="bg-cyan-900/40 text-cyan-400 px-1 rounded-md text-[9px]">{item.region}</span>
            </div>
          </div>
          <span className="text-cyan-600 text-xs shrink-0">▶</span>
        </div>
      ))}
    </div>
  );
}

function FBox() {
  return (
    <div className="grid grid-cols-2 gap-2 px-2">
      {DUMMY.map((item)=>(
        <div key={item.rank}
          style={{boxShadow:"2px -0.2px 5px rgba(6,182,212,0.18),3px -0.3px 9px rgba(6,182,212,0.09)"}}
          className={`relative aspect-[9/16] bg-gradient-to-br ${item.thumb} overflow-hidden rounded-2xl`}>
          <div className={`absolute top-2 left-2 w-7 h-7 rounded-full flex items-center justify-center text-xs font-black z-10 ${
            item.rank===1?"bg-yellow-400 text-gray-900 scale-125":item.rank<=3?"bg-red-500 text-white":"bg-black/60 text-white"
          }`}>{item.rank}</div>
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/85 via-black/50 to-transparent px-2 pt-8 pb-2.5 z-10">
            <p className="text-cyan-400/70 text-[9px]">@{item.channel}</p>
            <p className="text-white text-[10px] font-semibold line-clamp-2 leading-snug">{item.title}</p>
            <p className="text-white/40 text-[9px] mt-0.5">👁 {item.views}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
