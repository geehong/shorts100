"use client";
import { useState } from "react";
import { DUMMY, PERIODS, REGIONS, CATEGORIES } from "./dummyData";

export default function ProposalA() {
  const [period, setPeriod] = useState("ALL");
  const [region, setRegion] = useState("🌍전체");
  const [cat, setCat] = useState("전체");

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* 헤더 (최소) */}
      <div className="bg-white px-4 pt-2 pb-1 flex items-center justify-between border-b border-gray-100">
        <div className="flex items-center gap-1.5">
          <span className="text-lg">🔥</span>
          <span className="font-extrabold text-sm text-gray-900">Shorts100</span>
        </div>
        <div className="flex gap-2 text-gray-400 text-xs">
          <button>≡</button>
          <button>⊞</button>
        </div>
      </div>

      {/* 스크롤 콘텐츠 */}
      <div className="flex-1 overflow-y-auto pb-36">
        {/* 지역 필터 */}
        <div className="flex gap-1.5 px-3 py-2 overflow-x-auto scrollbar-none">
          {REGIONS.map((r) => (
            <button key={r} onClick={() => setRegion(r)}
              className={`shrink-0 px-2.5 py-1 rounded-full text-[11px] font-semibold transition-all ${
                region === r ? "bg-red-500 text-white" : "bg-white text-gray-600 border border-gray-200"
              }`}>{r}</button>
          ))}
        </div>

        {/* 카테고리 필터 */}
        <div className="flex gap-1.5 px-3 pb-2 overflow-x-auto scrollbar-none">
          {CATEGORIES.map((c) => (
            <button key={c} onClick={() => setCat(c)}
              className={`shrink-0 px-2.5 py-1 rounded-full text-[11px] font-semibold transition-all ${
                cat === c ? "bg-gray-800 text-white" : "bg-white text-gray-600 border border-gray-200"
              }`}>{c}</button>
          ))}
        </div>

        {/* 랭킹 리스트 */}
        <div className="px-3 space-y-2">
          {DUMMY.map((item) => (
            <div key={item.rank}
              className="bg-white rounded-xl flex items-center gap-3 px-3 py-2.5 shadow-sm">
              <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                item.rank === 1 ? "bg-yellow-400 text-white" :
                item.rank === 2 ? "bg-gray-300 text-gray-700" :
                item.rank === 3 ? "bg-amber-600 text-white" : "bg-gray-100 text-gray-500"
              }`}>{item.rank}</span>
              <div className={`w-12 h-9 rounded-lg bg-gradient-to-br ${item.thumb} shrink-0`} />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-gray-900 line-clamp-1">{item.title}</p>
                <p className="text-[10px] text-gray-500 mt-0.5">{item.channel}</p>
                <p className="text-[10px] text-gray-400">조회 {item.views} · {item.ago}</p>
              </div>
              <span className="text-gray-300 text-xs shrink-0">▶</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── 하단 고정 네비 ── */}
      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-[393px] bg-white border-t border-gray-100 shadow-lg z-30">
        {/* 기간 탭 */}
        <div className="flex">
          {PERIODS.map((p) => (
            <button key={p} onClick={() => setPeriod(p)}
              className={`flex-1 py-2.5 text-[11px] font-bold tracking-wide transition-colors ${
                period === p ? "text-red-500 border-t-2 border-red-500" : "text-gray-400"
              }`}>{p}</button>
          ))}
        </div>
        {/* 홈바 */}
        <div className="flex justify-center pb-1 pt-0.5">
          <div className="w-28 h-1 bg-gray-300 rounded-full" />
        </div>
      </div>
    </div>
  );
}
