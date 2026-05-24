"use client";
/* ProposalH — 미니멀 아이콘
   순백 배경 · 아이콘만 원형 버튼(텍스트 없음) · 콤팩트 메뉴 → 콘텐츠 극대화
   플랫 디자인 · 그림자 최소화 */
import { useState } from "react";
import { DUMMY } from "./dummyData";

type Layout = "list" | "box";

/* 아이콘만 — 텍스트 레이블 별도 */
const REGION_ICONS = ["🌍","🇰🇷","🇺🇸","🇮🇳","🇯🇵","🇧🇷","🇬🇧","🇲🇽"];
const CAT_ICONS    = ["☰","🎮","🎵","😂","🎬","⚽","📚","🐾","💄"];
const PERIOD_ICONS = ["📅","📊","📆","🗓","♾"];
const PERIOD_LABELS = ["오늘","주간","월간","연간","전체"];
const SIDE_CATS = [
  {name:"음악",icon:"🎵"},{name:"게임",icon:"🎮"},{name:"스포츠",icon:"⚽"},
  {name:"코미디",icon:"😂"},{name:"엔터",icon:"🎬"},
];

const SCROLL = "flex gap-2 overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]";
const SH = "1px -0.1px 4px rgba(0,0,0,0.07), 2px -0.2px 7px rgba(0,0,0,0.04)";
const SHA = "1px -0.1px 4px rgba(0,0,0,0.14), 2px -0.2px 7px rgba(0,0,0,0.08)";

function IconBtn({ icon, active, onClick }:{icon:string;active:boolean;onClick:()=>void}) {
  return (
    <button onClick={onClick} style={{boxShadow: active ? SHA : SH}}
      className={`shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-xl transition-all duration-200 ${
        active ? "bg-gray-900 text-white" : "bg-gray-50 text-gray-500"
      }`}>
      {icon}
    </button>
  );
}

export default function ProposalH() {
  const [layout, setLayout] = useState<Layout>("list");
  const [regionIdx, setRegionIdx] = useState(0);
  const [catIdx, setCatIdx]       = useState(0);
  const [periodIdx, setPeriodIdx] = useState(4); // 전체
  const MENU_H = 190;

  return (
    <div className="relative h-full overflow-hidden bg-white">

      <div className="absolute inset-0 overflow-y-auto [&::-webkit-scrollbar]:hidden"
           style={{paddingTop:`${MENU_H+12}px`,paddingBottom:"80px"}}>
        {layout==="list" ? <HList /> : <HBox />}
      </div>

      {/* 상단 메뉴 — 콤팩트 */}
      <div className="absolute top-0 left-0 right-0 z-20"
        style={{height:`${MENU_H}px`,
          background:"linear-gradient(to bottom,rgba(255,255,255,0.98) 0%,rgba(255,255,255,0.92) 85%,transparent 100%)",
          backdropFilter:"blur(18px)",WebkitBackdropFilter:"blur(18px)"}}>

        <div className="flex items-center gap-2 px-4 pt-2 pb-2">
          <span className="text-base">🔥</span>
          <span className="font-black text-sm text-gray-900 tracking-tight">Shorts100</span>
          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">TOP 100</span>
        </div>

        {/* 나라 */}
        <div className="px-4 mb-2">
          <div className={SCROLL}>
            {REGION_ICONS.map((ic,i)=>(
              <IconBtn key={i} icon={ic} active={regionIdx===i} onClick={()=>setRegionIdx(i)}/>
            ))}
          </div>
        </div>

        {/* 카테고리 */}
        <div className="px-4 mb-2">
          <div className={SCROLL}>
            {CAT_ICONS.map((ic,i)=>(
              <IconBtn key={i} icon={ic} active={catIdx===i} onClick={()=>setCatIdx(i)}/>
            ))}
          </div>
        </div>

        {/* 기간 — 아이콘+텍스트 가로 균등 */}
        <div className="px-4">
          <div className="flex justify-between">
            {PERIOD_ICONS.map((ic,i)=>(
              <button key={i} onClick={()=>setPeriodIdx(i)}
                style={{boxShadow: periodIdx===i ? SHA : SH}}
                className={`w-[52px] h-[40px] rounded-xl flex flex-col items-center justify-center gap-0.5 transition-all duration-200 ${
                  periodIdx===i ? "bg-gray-900 text-white" : "bg-gray-50 text-gray-500"
                }`}>
                <span className="text-[15px] leading-none">{ic}</span>
                <span className="text-[9px] font-semibold">{PERIOD_LABELS[i]}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 우측 사이드 */}
      <div className="absolute bottom-12 right-3 z-30 flex flex-col items-center gap-2">
        {SIDE_CATS.map((c,i)=>(
          <button key={c.name} onClick={()=>setCatIdx(i+1)}
            style={{boxShadow: catIdx===i+1 ? SHA : SH}}
            className={`w-10 h-10 rounded-full flex flex-col items-center justify-center gap-0.5 transition-all duration-200 ${
              catIdx===i+1?"bg-gray-900 text-white":"bg-gray-50 text-gray-500"
            }`}>
            <span className="text-base leading-none">{c.icon}</span>
            <span className="text-[8px] font-semibold leading-none">{c.name}</span>
          </button>
        ))}
        <div className="w-6 h-px my-0.5 bg-gray-200" />
        {(["list","box"] as Layout[]).map((key)=>(
          <button key={key} onClick={()=>setLayout(key)}
            style={{boxShadow: layout===key ? SHA : SH}}
            className={`w-10 h-10 rounded-full flex items-center justify-center text-lg transition-all ${
              layout===key?"bg-gray-900 text-white":"bg-gray-50 text-gray-400"
            }`}>
            {key==="list"?"≡":"⊞"}
          </button>
        ))}
      </div>

      <div className="absolute bottom-2 left-0 right-0 z-30 flex justify-center">
        <div className="w-28 h-1 rounded-full bg-gray-200" />
      </div>
    </div>
  );
}

function HList() {
  return (
    <div className="px-3 space-y-1.5 pb-2">
      {DUMMY.map((item)=>(
        <div key={item.rank} style={{boxShadow:"1px -0.1px 4px rgba(0,0,0,0.06),2px -0.2px 7px rgba(0,0,0,0.03)"}}
          className="flex items-center gap-3 bg-white rounded-2xl px-3 py-2.5 border border-gray-50">
          <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black shrink-0 ${
            item.rank===1?"bg-yellow-400 text-white":item.rank===2?"bg-gray-300 text-gray-600":item.rank===3?"bg-amber-500 text-white":"bg-gray-100 text-gray-400"
          }`}>{item.rank}</span>
          <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${item.thumb} shrink-0`}/>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-gray-900 line-clamp-1">{item.title}</p>
            <p className="text-[10px] text-gray-400 mt-0.5">{item.channel}</p>
            <div className="flex gap-1.5 mt-0.5 text-[10px] text-gray-400">
              <span>👁 {item.views}</span><span>❤️ {item.likes}</span>
              <span className="bg-gray-100 text-gray-500 px-1 rounded-md text-[9px]">{item.region}</span>
            </div>
          </div>
          <span className="text-gray-300 text-xs shrink-0">▶</span>
        </div>
      ))}
    </div>
  );
}

function HBox() {
  return (
    <div className="grid grid-cols-2 gap-2 px-2">
      {DUMMY.map((item)=>(
        <div key={item.rank}
          style={{boxShadow:"1px -0.1px 4px rgba(0,0,0,0.08),2px -0.2px 7px rgba(0,0,0,0.04)"}}
          className={`relative aspect-[9/16] bg-gradient-to-br ${item.thumb} overflow-hidden rounded-2xl`}>
          <div className={`absolute top-2 left-2 w-7 h-7 rounded-full flex items-center justify-center text-xs font-black z-10 ${
            item.rank===1?"bg-yellow-400 text-gray-900 scale-125":item.rank<=3?"bg-gray-900 text-white":"bg-black/50 text-white"
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
