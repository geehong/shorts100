"use client";
import { useState } from "react";
import { DUMMY, PERIODS, REGIONS, CATEGORIES } from "./dummyData";

export default function ProposalC() {
  const [period, setPeriod] = useState("ALL");
  const [region, setRegion] = useState("🌍전체");
  const [cat, setCat] = useState("전체");
  const [showFilter, setShowFilter] = useState(false);
  const [filterTab, setFilterTab] = useState<"기간"|"지역"|"카테고리">("기간");

  return (
    <div className="relative h-full bg-black overflow-hidden">
      {/* BOX 그리드 */}
      <div className="overflow-y-auto h-full pb-24"
           style={{ paddingTop: "80px" }}> {/* 1위가 중앙에 오도록 상단 여백 */}
        <div className="grid grid-cols-2 gap-0.5 px-0.5">
          {DUMMY.map((item) => (
            <div key={item.rank}
              className={`relative aspect-[9/16] bg-gradient-to-br ${item.thumb} overflow-hidden`}>
              {/* 순위 배지 */}
              <div className={`absolute top-2 left-2 w-7 h-7 rounded-full flex items-center justify-center text-xs font-black shadow-lg z-10 ${
                item.rank === 1 ? "bg-yellow-400 text-gray-900 scale-125" :
                item.rank <= 3 ? "bg-red-500 text-white" : "bg-black/60 text-white"
              }`}>{item.rank}</div>

              {/* 지역 뱃지 */}
              <div className="absolute top-2 right-2 bg-black/50 text-white text-[9px] px-1.5 py-0.5 rounded-full z-10">
                {item.region}
              </div>

              {/* 하단 정보 */}
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black via-black/60 to-transparent px-2 pt-8 pb-2 z-10">
                <p className="text-white/70 text-[9px]">@{item.channel}</p>
                <p className="text-white text-[10px] font-semibold line-clamp-2 leading-tight">{item.title}</p>
                <div className="flex items-center gap-1.5 mt-1 text-[9px] text-white/60">
                  <span>👁 {item.views}</span>
                  <span>· {item.ago}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 상단 오버레이 */}
      <div className="absolute top-0 left-0 right-0 z-20 bg-gradient-to-b from-black/80 to-transparent px-4 pt-2 pb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <span className="text-lg">🔥</span>
            <span className="text-white font-extrabold text-sm">Shorts100</span>
          </div>
          {/* 활성 필터 표시 */}
          <div className="flex gap-1">
            {[period, region !== "🌍전체" ? region : null, cat !== "전체" ? cat : null]
              .filter(Boolean).map((v, i) => (
              <span key={i} className="bg-white/20 text-white text-[10px] px-2 py-0.5 rounded-full">{v}</span>
            ))}
          </div>
        </div>
      </div>

      {/* 우측 카테고리 세로 탭 */}
      <div className="absolute right-2 top-1/2 -translate-y-1/2 z-20 flex flex-col gap-1">
        {["전체","🎮","🎵","😂","🎬","⚽","📚"].map((c, i) => (
          <button key={c}
            onClick={() => setCat(CATEGORIES[i] ?? "전체")}
            className={`w-8 h-8 rounded-full flex items-center justify-center text-sm shadow-lg transition-all ${
              cat === (CATEGORIES[i] ?? "전체")
                ? "bg-red-500 text-white scale-110"
                : "bg-black/50 text-white"
            }`}>
            {c}
          </button>
        ))}
      </div>

      {/* 하단 플로팅 필터 버튼 */}
      <div className="absolute bottom-6 left-0 right-0 z-30 flex justify-center">
        <button
          onClick={() => setShowFilter(!showFilter)}
          className="flex items-center gap-2 bg-white text-gray-900 px-5 py-2.5 rounded-full shadow-2xl font-bold text-sm"
        >
          <span>⚙</span>
          <span>필터</span>
          {(period !== "ALL" || region !== "🌍전체") && (
            <span className="w-2 h-2 bg-red-500 rounded-full" />
          )}
        </button>
      </div>

      {/* 필터 드로어 */}
      {showFilter && (
        <div className="absolute bottom-0 left-0 right-0 z-40 bg-white rounded-t-3xl shadow-2xl pb-8 pt-4">
          <div className="w-10 h-1 bg-gray-300 rounded-full mx-auto mb-4" />

          {/* 필터 탭 */}
          <div className="flex px-4 gap-2 mb-3">
            {(["기간","지역","카테고리"] as const).map((t) => (
              <button key={t} onClick={() => setFilterTab(t)}
                className={`px-3 py-1 rounded-full text-xs font-bold ${
                  filterTab === t ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-600"
                }`}>{t}</button>
            ))}
          </div>

          {/* 필터 옵션 */}
          <div className="flex flex-wrap gap-2 px-4">
            {filterTab === "기간" && PERIODS.map((p) => (
              <button key={p} onClick={() => { setPeriod(p); setShowFilter(false); }}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold ${
                  period === p ? "bg-red-500 text-white" : "bg-gray-100 text-gray-600"
                }`}>{p}</button>
            ))}
            {filterTab === "지역" && REGIONS.map((r) => (
              <button key={r} onClick={() => { setRegion(r); setShowFilter(false); }}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold ${
                  region === r ? "bg-red-500 text-white" : "bg-gray-100 text-gray-600"
                }`}>{r}</button>
            ))}
            {filterTab === "카테고리" && CATEGORIES.map((c) => (
              <button key={c} onClick={() => { setCat(c); setShowFilter(false); }}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold ${
                  cat === c ? "bg-red-500 text-white" : "bg-gray-100 text-gray-600"
                }`}>{c}</button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
