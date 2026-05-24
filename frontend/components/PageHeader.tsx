"use client";

import { useEffect, useState } from "react";

interface PageHeaderProps {
  title: string;
  subtitle: string;
}

export default function PageHeader({ title, subtitle }: PageHeaderProps) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`sticky top-0 z-40 px-4 py-3 transition-all duration-300 ${
        scrolled
          ? "bg-[#fdf9f5]/70 backdrop-blur-md border-b border-violet-100/50 shadow-sm"
          : "bg-[#fdf9f5] border-b border-violet-100"
      }`}
    >
      <div className="flex items-end gap-2">
        <span className="text-2xl leading-none select-none">🔥</span>
        <div>
          <h1 className="text-base font-extrabold text-gray-800 leading-tight tracking-tight">
            {title}
          </h1>
          <p className="text-[11px] text-violet-400 leading-tight mt-0.5">{subtitle}</p>
        </div>
        <span className="ml-auto text-[10px] font-semibold px-2 py-0.5 rounded-full bg-violet-100 text-violet-500">TOP 100</span>
      </div>
    </header>
  );
}
