"use client";
import { useState } from "react";
import ProposalD from "./ProposalD";
import ProposalE from "./ProposalE";
import ProposalF from "./ProposalF";
import ProposalG from "./ProposalG";
import ProposalH from "./ProposalH";
import ProposalI from "./ProposalI";

const PROPOSALS = [
  { id:"D", label:"D (기본)",  desc:"아이폰 아쿠아 · 투명 상단 · 네온 그림자" },
  { id:"E", label:"E 아이보리", desc:"크림 배경 · 원형 pill · 바이올렛 액센트" },
  { id:"F", label:"F 사이버",   desc:"피치블랙 · 시안 네온 · 사이버펑크" },
  { id:"G", label:"G 골드나잇", desc:"딥네이비 · 골드 네온 · 고급스러운" },
  { id:"H", label:"H 미니멀",   desc:"순백 · 아이콘만 · 콤팩트 메뉴" },
  { id:"I", label:"I 팝컬러",   desc:"흰 배경 · 행별 3색 · 컬러풀 뱃지" },
];

export default function UIProposals() {
  const [active, setActive] = useState("D");

  return (
    <div className="min-h-screen bg-gray-100">
      {/* 선택 바 */}
      <div className="sticky top-0 z-50 bg-gray-900 text-white px-4 py-2 flex gap-1.5 items-center flex-wrap">
        <span className="text-xs text-gray-400 mr-1 shrink-0">UI 안:</span>
        {PROPOSALS.map((p) => (
          <button key={p.id} onClick={() => setActive(p.id)}
            className={`px-3 py-1 rounded-full text-xs font-bold transition-all shrink-0 ${
              active === p.id ? "bg-red-500 text-white" : "bg-gray-700 text-gray-300"
            }`}>
            {p.label}
          </button>
        ))}
        <span className="ml-auto text-[10px] text-gray-500 shrink-0">
          {PROPOSALS.find((p) => p.id === active)?.desc}
        </span>
      </div>

      {/* 폰 프레임 */}
      <div className="flex justify-center py-6 px-4">
        <div className="relative w-[393px] bg-white shadow-2xl rounded-[48px] overflow-hidden border-4 border-gray-800"
             style={{ minHeight: "852px" }}>

          {/* 상단 노치 */}
          <div className="absolute top-0 left-0 right-0 h-10 bg-black z-50 flex items-center justify-center rounded-t-[44px]">
            <div className="w-24 h-5 bg-gray-900 rounded-full" />
          </div>

          {/* 콘텐츠 영역 */}
          <div className="pt-10 overflow-y-auto" style={{ height: "852px" }}>
            {active === "D" && <ProposalD />}
            {active === "E" && <ProposalE />}
            {active === "F" && <ProposalF />}
            {active === "G" && <ProposalG />}
            {active === "H" && <ProposalH />}
            {active === "I" && <ProposalI />}
          </div>

          {/* 엄지 도달 영역 */}
          <div className="absolute left-0 right-0 pointer-events-none border-y-2 border-dashed border-green-400/40 bg-green-400/5 z-40"
            style={{ top: "380px", height: "180px" }}>
            <span className="absolute right-2 top-1 text-[9px] text-green-500/60 font-medium">
              👍 엄지 편안 구역
            </span>
          </div>
        </div>
      </div>

      {/* 설명 카드 */}
      <div className="max-w-[420px] mx-auto px-4 pb-8 space-y-2">
        {PROPOSALS.map((p) => (
          <div key={p.id} onClick={() => setActive(p.id)}
            className={`rounded-2xl p-3.5 cursor-pointer transition-all border-2 ${
              active === p.id ? "border-red-400 bg-red-50" : "border-gray-200 bg-white"
            }`}>
            <div className="flex items-center gap-2">
              <span className={`text-sm font-extrabold ${active === p.id ? "text-red-500" : "text-gray-700"}`}>
                {p.label}
              </span>
              <span className="text-xs text-gray-500">{p.desc}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
