"use client";

import { useParams, useRouter } from "next/navigation";

export default function TermsPage() {
  const params = useParams();
  const router = useRouter();
  const lang = ((params?.locale as string) === "en" ? "en" : "ko") as "en" | "ko";

  return (
    <div className="min-h-screen bg-[#fdf9f5] font-sans max-w-2xl mx-auto">
      <div
        className="sticky top-0 z-40 w-full"
        style={{
          background: "linear-gradient(to bottom,rgba(253,249,245,0.97) 0%,rgba(253,249,245,0.90) 100%)",
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
          boxShadow: "0 4px 20px -5px rgba(0,0,0,0.06)",
        }}
      >
        <div className="flex items-center gap-2 px-4 pt-3 pb-1">
          <span className="text-lg select-none">🔥</span>
          <span className="font-black text-sm text-gray-800 tracking-tight cursor-pointer" onClick={() => router.push(`/${lang}`)}>
            Shorts100
          </span>
          <button
            onClick={() => router.back()}
            className="ml-auto text-[10px] font-bold text-violet-500 px-3 py-1 rounded-full bg-violet-100 hover:bg-violet-200 transition-all"
          >
            {lang === "ko" ? "← 뒤로" : "← Back"}
          </button>
        </div>
        <div className="px-4 pb-2">
          <h1 className="text-sm font-black text-gray-800">
            {lang === "ko" ? "이용약관" : "Terms of Service"}
          </h1>
        </div>
      </div>

      <div className="px-5 py-6 text-gray-700 text-[13px] leading-relaxed space-y-5">
        {lang === "ko" ? (
          <>
            <p className="text-[11px] text-gray-400">최종 수정일: 2026년 5월 27일</p>

            <section>
              <h2 className="font-black text-gray-800 text-sm mb-1">1. 서비스 소개</h2>
              <p>Shorts100(이하 &quot;서비스&quot;)은 유튜브 쇼츠 랭킹 정보 제공 및 쇼츠 영상 다운로드 서비스를 제공합니다.</p>
            </section>

            <section>
              <h2 className="font-black text-gray-800 text-sm mb-1">2. 이용 조건</h2>
              <ul className="list-disc pl-5 space-y-1">
                <li>서비스는 개인적, 비상업적 용도로만 사용할 수 있습니다.</li>
                <li>다운로드한 영상을 무단 재배포하거나 상업적으로 활용하는 것을 금지합니다.</li>
                <li>저작권법을 준수하여야 하며, 저작권 침해에 대한 책임은 이용자에게 있습니다.</li>
              </ul>
            </section>

            <section>
              <h2 className="font-black text-gray-800 text-sm mb-1">3. 크레딧 및 결제</h2>
              <ul className="list-disc pl-5 space-y-1">
                <li>회원가입 시 무료 크레딧 20점이 지급됩니다.</li>
                <li>크레딧은 환불되지 않습니다.</li>
                <li>서비스 운영자는 크레딧 정책을 사전 공지 후 변경할 수 있습니다.</li>
              </ul>
            </section>

            <section>
              <h2 className="font-black text-gray-800 text-sm mb-1">4. 책임 제한</h2>
              <p>서비스는 영상 다운로드의 가용성을 보장하지 않으며, 플랫폼 정책 변경으로 인한 서비스 중단에 대해 책임지지 않습니다.</p>
            </section>

            <section>
              <h2 className="font-black text-gray-800 text-sm mb-1">5. 약관 변경</h2>
              <p>약관은 서비스 내 공지를 통해 변경될 수 있으며, 변경 후 계속 이용 시 동의한 것으로 간주합니다.</p>
            </section>
          </>
        ) : (
          <>
            <p className="text-[11px] text-gray-400">Last updated: May 27, 2026</p>

            <section>
              <h2 className="font-black text-gray-800 text-sm mb-1">1. About the Service</h2>
              <p>Shorts100 (&quot;Service&quot;) provides YouTube Shorts ranking information and video download functionality.</p>
            </section>

            <section>
              <h2 className="font-black text-gray-800 text-sm mb-1">2. Terms of Use</h2>
              <ul className="list-disc pl-5 space-y-1">
                <li>The Service is for personal, non-commercial use only.</li>
                <li>Redistribution or commercial use of downloaded videos is prohibited.</li>
                <li>You are responsible for complying with copyright laws.</li>
              </ul>
            </section>

            <section>
              <h2 className="font-black text-gray-800 text-sm mb-1">3. Credits &amp; Payments</h2>
              <ul className="list-disc pl-5 space-y-1">
                <li>20 free credits are granted upon registration.</li>
                <li>Credits are non-refundable.</li>
                <li>Credit policies may change with prior notice.</li>
              </ul>
            </section>

            <section>
              <h2 className="font-black text-gray-800 text-sm mb-1">4. Limitation of Liability</h2>
              <p>The Service does not guarantee download availability and is not liable for interruptions due to platform policy changes.</p>
            </section>

            <section>
              <h2 className="font-black text-gray-800 text-sm mb-1">5. Changes to Terms</h2>
              <p>Terms may be updated via in-service notices. Continued use after changes constitutes acceptance.</p>
            </section>
          </>
        )}

        <div className="pt-4 border-t border-gray-100 flex gap-4 text-[11px] text-violet-500">
          <button onClick={() => router.push(`/${lang}/privacy`)} className="hover:underline">
            {lang === "ko" ? "개인정보처리방침" : "Privacy Policy"}
          </button>
        </div>
      </div>
    </div>
  );
}
