"use client";

import { useParams, useRouter } from "next/navigation";

export default function PrivacyPage() {
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
            {lang === "ko" ? "개인정보처리방침" : "Privacy Policy"}
          </h1>
        </div>
      </div>

      <div className="px-5 py-6 prose prose-sm max-w-none text-gray-700 text-[13px] leading-relaxed space-y-5">
        {lang === "ko" ? (
          <>
            <p className="text-[11px] text-gray-400">최종 수정일: 2026년 5월 27일</p>

            <section>
              <h2 className="font-black text-gray-800 text-sm mb-1">1. 수집하는 개인정보</h2>
              <p>Shorts100은 서비스 제공을 위해 다음 정보를 수집합니다:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Google 로그인 시: 이메일, 이름, 프로필 사진 (Google이 제공)</li>
                <li>일반 가입 시: 사용자 이름, 비밀번호(암호화 저장)</li>
                <li>서비스 이용 시: 다운로드 이력, IP 주소(게스트 한도 관리용), 세션 쿠키</li>
              </ul>
            </section>

            <section>
              <h2 className="font-black text-gray-800 text-sm mb-1">2. 개인정보 이용 목적</h2>
              <ul className="list-disc pl-5 space-y-1">
                <li>회원 식별 및 로그인 인증</li>
                <li>다운로드 크레딧(포인트) 관리</li>
                <li>서비스 악용 방지 (게스트 다운로드 횟수 제한)</li>
              </ul>
            </section>

            <section>
              <h2 className="font-black text-gray-800 text-sm mb-1">3. 개인정보 보유 기간</h2>
              <p>회원 탈퇴 시 또는 수집 목적 달성 후 즉시 파기합니다. 다운로드 로그는 최대 7일간 보관 후 자동 삭제됩니다.</p>
            </section>

            <section>
              <h2 className="font-black text-gray-800 text-sm mb-1">4. 제3자 제공</h2>
              <p>수집한 개인정보는 법령에 의한 경우를 제외하고 제3자에게 제공하지 않습니다. Google OAuth 사용 시 Google의 개인정보처리방침이 적용됩니다.</p>
            </section>

            <section>
              <h2 className="font-black text-gray-800 text-sm mb-1">5. 쿠키 및 세션</h2>
              <p>서비스 이용 편의를 위해 세션 쿠키를 사용합니다. 브라우저 설정으로 거부할 수 있으나 일부 기능이 제한될 수 있습니다.</p>
            </section>

            <section>
              <h2 className="font-black text-gray-800 text-sm mb-1">6. 문의</h2>
              <p>개인정보 관련 문의는 서비스 내 문의 채널을 이용해 주세요.</p>
            </section>
          </>
        ) : (
          <>
            <p className="text-[11px] text-gray-400">Last updated: May 27, 2026</p>

            <section>
              <h2 className="font-black text-gray-800 text-sm mb-1">1. Information We Collect</h2>
              <p>Shorts100 collects the following information to provide its services:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Google Sign-In: email, name, profile picture (provided by Google)</li>
                <li>Manual registration: username, password (stored encrypted)</li>
                <li>Service usage: download history, IP address (for guest limits), session cookies</li>
              </ul>
            </section>

            <section>
              <h2 className="font-black text-gray-800 text-sm mb-1">2. How We Use Your Information</h2>
              <ul className="list-disc pl-5 space-y-1">
                <li>User identification and authentication</li>
                <li>Download credit (points) management</li>
                <li>Abuse prevention (guest download limits)</li>
              </ul>
            </section>

            <section>
              <h2 className="font-black text-gray-800 text-sm mb-1">3. Data Retention</h2>
              <p>Data is deleted upon account closure or when the purpose is fulfilled. Download logs are automatically deleted after 7 days.</p>
            </section>

            <section>
              <h2 className="font-black text-gray-800 text-sm mb-1">4. Third Parties</h2>
              <p>We do not share personal data with third parties except as required by law. When using Google OAuth, Google&apos;s Privacy Policy applies.</p>
            </section>

            <section>
              <h2 className="font-black text-gray-800 text-sm mb-1">5. Cookies</h2>
              <p>We use session cookies for service functionality. You may disable them in your browser, but some features may not work.</p>
            </section>

            <section>
              <h2 className="font-black text-gray-800 text-sm mb-1">6. Contact</h2>
              <p>For privacy-related inquiries, please use the contact channel within the service.</p>
            </section>
          </>
        )}
      </div>
    </div>
  );
}
