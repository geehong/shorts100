"use client";

import React from "react";
import { useRouter, useParams } from "next/navigation";

interface FooterProps {
  lang?: "ko" | "en";
}

export default function Footer({ lang }: FooterProps) {
  const router = useRouter();
  const params = useParams();
  
  // Resolve locale: prop takes precedence, then URL param, default to "ko"
  const resolvedLang = lang || ((params?.locale as string) === "en" ? "en" : "ko");

  return (
    <footer className="text-center py-8 border-t border-violet-100/50 mx-4 mt-auto">
      <div className="flex justify-center items-center gap-4 text-xs font-bold text-violet-500 mb-3">
        <button
          onClick={() => router.push(`/${resolvedLang}/privacy`)}
          className="hover:text-violet-700 hover:underline transition-colors duration-200"
        >
          {resolvedLang === "ko" ? "개인정보처리방침" : "Privacy Policy"}
        </button>
        <span className="text-gray-300 select-none">|</span>
        <button
          onClick={() => router.push(`/${resolvedLang}/terms`)}
          className="hover:text-violet-700 hover:underline transition-colors duration-200"
        >
          {resolvedLang === "ko" ? "이용약관" : "Terms of Service"}
        </button>
      </div>
      <p className="text-[10px] font-bold text-gray-400">
        © {new Date().getFullYear()} Shorts100. All rights reserved.
      </p>
    </footer>
  );
}
