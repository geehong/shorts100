"use client";
/* ProposalE — 소프트 아이보리
   따뜻한 크림 배경 · 원형 pill 버튼 · 바이올렛 액센트 · 네온 없이 부드러운 그림자 */
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

const SH  = "2px -0.2px 5px rgba(109,40,217,0.12), 3px -0.3px 9px rgba(109,40,217,0.06)";
const SHA = "2px -0.2px 5px rgba(109,40,217,0.28), 3px -0.3px 9px rgba(109,40,217,0.14)";
const SCROLL = "flex gap-1.5 overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]";

function Tile({ name, icon, active, onClick }:{name:string;icon:string;active:boolean;onClick:()=>void}) {
  return (
    <button onClick={onClick} style={{boxShadow: active ? SHA : SH}}
      className={`shrink-0 w-[52px] h-[52px] rounded-full flex flex-col items-center justify-between py-1.5 px-1 transition-all duration-200 ${
        active ? "bg-violet-500/60 text-white" : "bg-white/85 text-gray-500"
      }`}>
      <span className="text-[10px] font-semibold leading-tight truncate w-full text-center">{name}</span>
      <span className="text-[18px] leading-none">{icon}</span>
    </button>
  );
}

export default function ProposalE() {
  const [layout, setLayout] = useState<Layout>("list");
  const [region, setRegion] = useState("전체");
  const [cat, setCat]       = useState("전체");
  const [period, setPeriod] = useState("전체");
  const MENU_H = 242;

  return (
    <div className="relative h-full overflow-hidden"
      style={{background:"linear-gradient(160deg,#fdf9f5 0%,#f8f3ed 50%,#f3eee7 100%)"}}>

      <div className="absolute inset-0 overflow-y-auto [&::-webkit-scrollbar]:hidden"
           style={{paddingTop:`${MENU_H+16}px`,paddingBottom:"80px"}}>
        {layout==="list" ? <EList /> : <EBox />}
      </div>

      {/* 상단 메뉴 */}
      <div className="absolute top-0 left-0 right-0 z-20"
        style={{height:`${MENU_H}px`,
          background:"linear-gradient(to bottom,rgba(253,249,245,0.97) 0%,rgba(253,249,245,0.88) 80%,transparent 100%)",
          backdropFilter:"blur(20px)",WebkitBackdropFilter:"blur(20px)"}}>

        <div className="flex items-center gap-2 px-4 pt-2 pb-1">
          <span className="text-base">🔥</span>
          <span className="font-black text-sm text-gray-800 tracking-tight">Shorts100</span>
          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-violet-100 text-violet-500">TOP 100</span>
        </div>

        <div className="px-4 mb-1.5">
          <p className="text-[9px] font-bold mb-1 tracking-widest uppercase text-violet-300">나라</p>
          <div className={SCROLL}>
            {REGION_DATA.map(([n,i])=><Tile key={n} name={n} icon={i} active={region===n} onClick={()=>setRegion(n)}/>)}
          </div>
        </div>
        <div className="px-4 mb-1.5">
          <p className="text-[9px] font-bold mb-1 tracking-widest uppercase text-violet-300">카테고리</p>
          <div className={SCROLL}>
            {CAT_DATA.map(([n,i])=><Tile key={n} name={n} icon={i} active={cat===n} onClick={()=>setCat(n)}/>)}
          </div>
        </div>
        <div className="px-4">
          <p className="text-[9px] font-bold mb-1 tracking-widest uppercase text-violet-300">기간</p>
          <div className="flex justify-between">
            {PERIOD_DATA.map(([n,i])=><Tile key={n} name={n} icon={i} active={period===n} onClick={()=>setPeriod(n)}/>)}
          </div>
        </div>
      </div>

      {/* 우측 사이드 */}
      <div className="absolute bottom-12 right-3 z-30 flex flex-col items-center gap-2">
        {SIDE_CATS.map((c)=>(
          <button key={c.name} onClick={()=>setCat(c.name)}
            style={{boxShadow: cat===c.name ? SHA : SH}}
            className={`w-10 h-10 rounded-full flex flex-col items-center justify-center gap-0.5 transition-all duration-200 ${
              cat===c.name?"bg-violet-500/60 text-white":"bg-white/85 text-gray-500"
            }`}>
            <span className="text-base leading-none">{c.icon}</span>
            <span className="text-[8px] font-semibold leading-none">{c.name}</span>
          </button>
        ))}
        <div className="w-6 h-px my-0.5 bg-violet-200" />
        {(["list","box"] as Layout[]).map((key)=>(
          <button key={key} onClick={()=>setLayout(key)}
            style={{boxShadow: layout===key ? SHA : SH}}
            className={`w-10 h-10 rounded-full flex items-center justify-center text-lg transition-all ${
              layout===key?"bg-violet-500/60 text-white":"bg-white/85 text-gray-400"
            }`}>
            {key==="list"?"≡":"⊞"}
          </button>
        ))}
      </div>

      <div className="absolute bottom-2 left-0 right-0 z-30 flex justify-center">
        <div className="w-28 h-1 rounded-full bg-violet-100" />
      </div>
    </div>
  );
}

function EList() {
  return (
    <div className="px-3 space-y-2 pb-2">
      {DUMMY.map((item)=>(
        <div key={item.rank} style={{boxShadow:"2px -0.2px 5px rgba(109,40,217,0.10),3px -0.3px 9px rgba(109,40,217,0.05)"}}
          className="flex items-center gap-3 bg-white/85 rounded-2xl px-3 py-2.5">
          <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black shrink-0 ${
            item.rank===1?"bg-yellow-400 text-white":item.rank===2?"bg-gray-300 text-gray-600":item.rank===3?"bg-amber-500 text-white":"bg-violet-50 text-violet-400"
          }`}>{item.rank}</span>
          <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${item.thumb} shrink-0`}/>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-gray-800 line-clamp-1">{item.title}</p>
            <p className="text-[10px] text-gray-400 mt-0.5">{item.channel}</p>
            <div className="flex gap-1.5 mt-0.5 text-[10px] text-gray-400">
              <span>👁 {item.views}</span><span>❤️ {item.likes}</span>
              <span className="bg-violet-50 text-violet-400 px-1 rounded-md text-[9px]">{item.region}</span>
            </div>
          </div>
          <span className="text-violet-300 text-xs shrink-0">▶</span>
        </div>
      ))}
    </div>
  );
}

function EBox() {
  return (
    <div className="grid grid-cols-2 gap-2 px-2">
      {DUMMY.map((item)=>(
        <div key={item.rank}
          style={{boxShadow:"2px -0.2px 5px rgba(109,40,217,0.14),3px -0.3px 9px rgba(109,40,217,0.07)"}}
          className={`relative aspect-[9/16] bg-gradient-to-br ${item.thumb} overflow-hidden rounded-2xl`}>
          <div className={`absolute top-2 left-2 w-7 h-7 rounded-full flex items-center justify-center text-xs font-black z-10 ${
            item.rank===1?"bg-yellow-400 text-gray-900 scale-125":item.rank<=3?"bg-red-500 text-white":"bg-white/40 backdrop-blur-sm text-white"
          }`}>{item.rank}</div>
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/75 via-black/40 to-transparent px-2 pt-8 pb-2.5 z-10">
            <p className="text-white/60 text-[9px]">@{item.channel}</p>
            <p className="text-white text-[10px] font-semibold line-clamp-2 leading-snug">{item.title}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
