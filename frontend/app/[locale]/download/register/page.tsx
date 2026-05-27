"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "https://shorts100.firemarkets.net";

export default function RegisterPage() {
  const params = useParams();
  const router = useRouter();
  const lang = ((params?.locale as string) === "en" ? "en" : "ko") as "en" | "ko";

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [age, setAge] = useState("");
  const [gender, setGender] = useState("");
  const [region, setRegion] = useState("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!username.trim() || !password.trim()) {
      setErrorMsg(lang === "ko" ? "사용자 이름과 비밀번호를 입력해주세요." : "Please enter username and password.");
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: username.trim(),
          password: password.trim(),
          name: name.trim() || undefined,
          age: age ? parseInt(age, 10) : undefined,
          gender: gender || undefined,
          region: region || undefined
        })
      });

      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.detail || (lang === "ko" ? "회원가입에 실패했습니다." : "Registration failed."));
        return;
      }

      localStorage.setItem("shorts100_auth_token", data.access_token);
      setSuccessMsg(
        lang === "ko"
          ? "회원가입이 완료되었습니다! 20 크레딧이 지급되었습니다."
          : "Registration successful! +20 credits granted."
      );
      
      // Redirect after 1.5 seconds
      setTimeout(() => {
        router.push(`/${lang}/download`);
      }, 1500);
    } catch {
      setErrorMsg(lang === "ko" ? "네트워크 에러가 발생했습니다." : "A network error occurred.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#fdf9f5] py-12 px-4 font-sans max-w-md mx-auto flex flex-col justify-center">
      <div className="bg-white rounded-3xl p-8 shadow-md border border-gray-100">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="flex justify-center items-center gap-1.5 cursor-pointer mb-2" onClick={() => router.push(`/${lang}/download`)}>
            <span className="text-xl">🔥</span>
            <span className="font-black text-lg text-gray-800 tracking-tight">Shorts100</span>
            <span className="text-xs font-bold text-blue-600">ShortsDown</span>
          </div>
          <h1 className="text-xl font-black text-gray-900">
            {lang === "ko" ? "멤버 회원가입" : "Member Sign Up"}
          </h1>
          <p className="text-xs text-gray-400 mt-1">
            {lang === "ko"
              ? "회원가입 시 무료 다운로드 크레딧 20개가 지급됩니다."
              : "Register to get 20 free download credits immediately."}
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleRegister} className="space-y-4">
          <div>
            <label className="text-[10px] font-bold text-gray-400 block mb-1 uppercase">
              {lang === "ko" ? "사용자 이름" : "Username"}
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full bg-gray-50 border border-gray-200 text-gray-800 rounded-xl px-4 py-3 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              placeholder={lang === "ko" ? "사용자 이름을 입력하세요" : "Enter username"}
              required
            />
          </div>
          <div>
            <label className="text-[10px] font-bold text-gray-400 block mb-1 uppercase">
              {lang === "ko" ? "비밀번호" : "Password"}
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-gray-50 border border-gray-200 text-gray-800 rounded-xl px-4 py-3 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              placeholder={lang === "ko" ? "비밀번호를 입력하세요" : "Enter password"}
              required
            />
          </div>

          <div>
            <label className="text-[10px] font-bold text-gray-400 block mb-1 uppercase">
              {lang === "ko" ? "이름 / 닉네임" : "Name / Nickname"}
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-gray-50 border border-gray-200 text-gray-800 rounded-xl px-4 py-3 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              placeholder={lang === "ko" ? "이름을 입력하세요" : "Enter your name"}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] font-bold text-gray-400 block mb-1 uppercase">
                {lang === "ko" ? "나이" : "Age"}
              </label>
              <input
                type="number"
                value={age}
                onChange={(e) => setAge(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 text-gray-800 rounded-xl px-4 py-3 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                placeholder={lang === "ko" ? "나이" : "Age"}
                min="0"
                max="150"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-gray-400 block mb-1 uppercase">
                {lang === "ko" ? "성별" : "Gender"}
              </label>
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 text-gray-800 rounded-xl px-4 py-3 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              >
                <option value="">{lang === "ko" ? "선택 안함" : "Prefer not to say"}</option>
                <option value="male">{lang === "ko" ? "남성" : "Male"}</option>
                <option value="female">{lang === "ko" ? "여성" : "Female"}</option>
                <option value="other">{lang === "ko" ? "기타" : "Other"}</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-[10px] font-bold text-gray-400 block mb-1 uppercase">
              {lang === "ko" ? "지역 / 국가" : "Region / Country"}
            </label>
            <select
              value={region}
              onChange={(e) => setRegion(e.target.value)}
              className="w-full bg-gray-50 border border-gray-200 text-gray-800 rounded-xl px-4 py-3 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            >
              <option value="">{lang === "ko" ? "선택 안함" : "Select Region"}</option>
              <option value="KR">{lang === "ko" ? "대한민국 (KR)" : "South Korea (KR)"}</option>
              <option value="US">{lang === "ko" ? "미국 (US)" : "United States (US)"}</option>
              <option value="JP">{lang === "ko" ? "일본 (JP)" : "Japan (JP)"}</option>
              <option value="other">{lang === "ko" ? "기타 (Other)" : "Other"}</option>
            </select>
          </div>


          {errorMsg && (
            <div className="p-3.5 bg-red-50 border border-red-100 text-red-700 text-xs font-bold rounded-xl">
              ⚠️ {errorMsg}
            </div>
          )}

          {successMsg && (
            <div className="p-3.5 bg-green-50 border border-green-100 text-green-700 text-xs font-bold rounded-xl">
              ✨ {successMsg}
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white font-bold py-3.5 rounded-xl text-sm transition duration-200 shadow-md flex justify-center items-center"
          >
            {isLoading ? (
              <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
            ) : (
              lang === "ko" ? "가입하기" : "Sign Up"
            )}
          </button>
        </form>

        {/* Footer Link */}
        <div className="text-center mt-6 pt-4 border-t border-gray-100">
          <button
            onClick={() => router.push(`/${lang}/download`)}
            className="text-xs text-gray-500 hover:text-gray-700 font-bold"
          >
            {lang === "ko" ? "← 뒤로 가기 (로그인 페이지)" : "← Back (Login Page)"}
          </button>
        </div>
      </div>
    </div>
  );
}
