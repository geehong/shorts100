"use client";
import { useState } from "react";
import { DUMMY, PERIODS, REGIONS, CATEGORIES, LANGUAGES } from "./dummyData";

const FILTER_TYPES = ["기간", "지역", "카테고리", "언어"] as const;
type FilterType = typeof FILTER_TYPES[number];

const FILTER_OPTIONS: Record<FilterType, string[]> = {
  "기간": PERIODS,
  "지역": REGIONS,
  "카테고리": CATEGORIES,
  "언어": LANGUAGES,
};

export default function ProposalB() {
  const [activeFilter, setActiveFilter] = useState<FilterType>("기간");
  const [selected, setSelected] = useState<Record<FilterType, string>>({
    "기간": "ALL", "지역": "🌍전체", "카테고리": "전체", "언어": "전체",
  });
  const [layout, setLayout] = useState<"list"|"box">("list");

  return (
    <div className="flex flex-col h-full bg-white">
      {/* 헤더 */}
      <div className="px-4 py-2 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-1">
            <span>🔥</span>
            <span className="font-extrabold text-sm">오늘의 쇼츠 TOP 100</span>
          </div>
          <p className="text-[10px] text-gray-400">지금 가장 핫한 숏폼 영상 모음</p>
        </div>
        <div className="flex gap-1">
          <button onClick={() => setLayout("list")}
            className={`p-1.5 rounded ${layout==="list"?"text-gray-900":"text-gray-300"}`}>≡</button>
          <button onClick={() => setLayout("box")}
            className={`p-1.5 rounded ${layout==="box"?"text-gray-900":"text-gray-300"}`}>⊞</button>
        </div>
      </div>

      {/* 필터 타입 선택 */}
      <div className="flex gap-1 px-3 pb-1">
        {FILTER_TYPES.map((f) => (
          <button key={f} onClick={() => setActiveFilter(f)}
            className={`px-2.5 py-1 rounded-full text-[11px] font-bold transition-all ${
              activeFilter === f
                ? "bg-gray-900 text-white"
                : "bg-gray-100 text-gray-500"
            }`}>
            {f}
            <span className="ml-1 text-[9px] opacity-70">
              {selected[f] === "전체" || selected[f] === "ALL" || selected[f] === "🌍전체" ? "" : "●"}
            </span>
          </button>
        ))}
      </div>

      {/* 필터 옵션 가로 스크롤 */}
      <div className="flex gap-1.5 px-3 pb-2 overflow-x-auto scrollbar-none border-b border-gray-100">
        {FILTER_OPTIONS[activeFilter].map((opt) => (
          <button key={opt}
            onClick={() => setSelected((s) => ({ ...s, [activeFilter]: opt }))}
            className={`shrink-0 px-3 py-1 rounded-full text-[11px] font-semibold transition-all ${
              selected[activeFilter] === opt
                ? "bg-red-500 text-white shadow-sm"
                : "bg-gray-100 text-gray-600"
            }`}>{opt}</button>
        ))}
      </div>

      {/* 활성 필터 뱃지 */}
      <div className="flex gap-1 px-3 py-1.5 overflow-x-auto scrollbar-none">
        {FILTER_TYPES.map((f) => {
          const v = selected[f];
          if (v === "전체" || v === "ALL" || v === "🌍전체") return null;
          return (
            <span key={f} className="shrink-0 flex items-center gap-1 bg-red-50 border border-red-200 text-red-600 text-[10px] px-2 py-0.5 rounded-full">
              {v}
              <button onClick={() => setSelected((s) => ({
                ...s,
                [f]: f==="기간"?"ALL": f==="지역"?"🌍전체":"전체"
              }))} className="text-red-400 font-bold">×</button>
            </span>
          );
        })}
      </div>

      {/* 콘텐츠 */}
      <div className="flex-1 overflow-y-auto">
        {layout === "list" ? (
          <div>
            {DUMMY.map((item) => (
              <div key={item.rank} className="flex items-center gap-3 px-4 py-2.5 border-b border-gray-50">
                <span className={`w-6 text-center text-sm font-bold shrink-0 ${
                  item.rank <= 3 ? "text-red-500" : "text-gray-400"
                }`}>{item.rank}</span>
                <div className={`w-14 h-10 rounded-lg bg-gradient-to-br ${item.thumb} shrink-0`} />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-gray-900 line-clamp-1">{item.title}</p>
                  <p className="text-[10px] text-gray-500">{item.channel}</p>
                  <p className="text-[10px] text-gray-400">
                    👁 {item.views} · ❤️ {item.likes} · {item.ago}
                  </p>
                </div>
                <span className="text-[10px] text-gray-300 bg-gray-100 px-1.5 py-0.5 rounded shrink-0">
                  {item.region}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-0.5 p-0.5">
            {DUMMY.map((item) => (
              <div key={item.rank}
                className={`relative aspect-[9/16] bg-gradient-to-br ${item.thumb} overflow-hidden rounded`}>
                <span className="absolute top-2 left-2 w-6 h-6 rounded-full bg-red-500 flex items-center justify-center text-white text-[10px] font-bold shadow">
                  {item.rank}
                </span>
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-2">
                  <p className="text-white text-[10px] font-semibold line-clamp-2">{item.title}</p>
                  <p className="text-white/70 text-[9px] mt-0.5">{item.channel}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
