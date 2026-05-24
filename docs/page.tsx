"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";

export default function RisingPage() {
  const [rankings, setRankings] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchRisingRankings = async () => {
    setLoading(true);
    try {
      // T37에서 만든 백엔드 API 호출
      const res = await fetch(`http://localhost:8002/api/rankings/rising?limit=50`);
      const data = await res.json();
      setRankings(data);
    } catch (error) {
      console.error("Rising fetch error:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRisingRankings();
  }, []);

  return (
    <main className="min-h-screen bg-gray-50 pb-20">
      {/* 헤더 */}
      <header className="sticky top-0 z-10 border-b bg-white/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-2xl items-center justify-between px-4 py-3">
          <h1 className="text-xl font-bold tracking-tight text-red-600">Shorts100</h1>
          <nav className="flex gap-4 text-sm font-medium text-gray-600">
            <a href="/" className="hover:text-gray-900">Global</a>
            <span className="text-red-600 font-bold">Rising Star</span>
          </nav>
        </div>
      </header>

      {/* 랭킹 리스트 */}
      <div className="mx-auto max-w-2xl px-4 py-6">
        <div className="mb-6">
          <h2 className="text-lg font-bold text-gray-900">급상승 라이징 스타</h2>
          <p className="text-sm text-gray-500">최근 7일 내 업로드된 영상 중 가장 빠르게 성장 중인 쇼츠</p>
        </div>

        {loading && rankings.length === 0 ? (
          <div className="flex h-40 items-center justify-center text-gray-400">분석 중...</div>
        ) : (
          <div className="grid gap-4">
            {rankings.map((item: any) => (
              <div key={item.id} className="group relative flex overflow-hidden rounded-xl border bg-white shadow-sm transition-all hover:border-red-200 hover:shadow-md">
                <div className="absolute left-0 top-0 z-[1] flex h-8 w-8 items-center justify-center bg-red-600 font-bold text-white rounded-br-lg">
                  {item.position}
                </div>
                
                <div className="relative aspect-[9/16] w-32 shrink-0 bg-gray-200">
                  <Image src={item.thumbnail_url} alt={item.title} fill className="object-cover" sizes="128px" />
                </div>

                <div className="flex flex-col justify-between p-4 flex-1">
                  <div>
                    <h3 className="line-clamp-2 font-semibold text-gray-900 leading-snug">{item.title}</h3>
                    <p className="mt-1 text-sm text-gray-500">{item.channel_title}</p>
                  </div>
                  <div className="flex items-center justify-between text-sm text-gray-400">
                    <span className="text-xs text-orange-500 font-medium">🔥 {item.view_count.toLocaleString()} views</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}