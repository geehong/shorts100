"use client";

import Image from "next/image";
import { buildYouTubeDeepLink, openDeepLink } from "@/lib/deeplink";
import { formatCount } from "@/lib/format";
import { useRouter, useParams } from "next/navigation";

export interface RankingItem {
  id: number;
  title: string;
  channel_title: string;
  thumbnail_url: string | null;
  view_count: number;
  like_count?: number;
  score: number;
  position: number;
  platform_video_id: string;
  category?: string | null;
  published_at?: string | null;
  
  // 역사 차트 관련 변동 표시용 필드
  prev_position?: number | null;
  peak_position?: number | null;
  weeks_on_chart?: number | null;
  view_delta?: number | null;
}

interface VideoCardProps {
  item: RankingItem;
}

export default function VideoCard({ item }: VideoCardProps) {
  const router = useRouter();
  const params = useParams();
  const locale = (params?.locale as string) || "ko";

  const handleClick = () => {
    router.push(`/${locale}/v/${item.id}`);
  };

  return (
    <article
      role="article"
      aria-labelledby={`video-title-${item.id}`}
      aria-describedby={`video-stats-${item.id}`}
      className="flex items-center gap-3 px-4 py-3 border-b border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors"
      onClick={handleClick}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          handleClick();
        }
      }}
      tabIndex={0}
    >
      {/* 순위 */}
      <span
        aria-label={`현재 순위 ${item.position}위`}
        className="w-8 text-center text-lg font-bold text-gray-400 shrink-0"
      >
        {item.position}
      </span>

      {/* 썸네일 */}
      <div className="relative w-20 h-14 shrink-0 rounded overflow-hidden bg-gray-200">
        {item.thumbnail_url ? (
          <Image
            src={item.thumbnail_url}
            alt={item.title}
            fill
            className="object-cover"
            loading={item.position <= 3 ? "eager" : "lazy"}
            sizes="80px"
          />
        ) : (
          <div className="w-full h-full bg-gray-300" />
        )}
      </div>

      {/* 정보 */}
      <div className="flex-1 min-w-0">
        <h3
          id={`video-title-${item.id}`}
          className="text-sm font-semibold text-gray-900 line-clamp-2 leading-snug"
        >
          {item.title}
        </h3>
        <p className="text-xs text-gray-500 mt-0.5 truncate">{item.channel_title}</p>
        <div
          id={`video-stats-${item.id}`}
          className="flex items-center gap-3 mt-1"
        >
          <span
            aria-label={`조회수 ${item.view_count.toLocaleString()}`}
            className="text-xs text-gray-400"
          >
            👁 {formatCount(item.view_count)}
          </span>
          {item.like_count !== undefined && (
            <span
              aria-label={`좋아요 ${item.like_count.toLocaleString()}`}
              className="text-xs text-gray-400"
            >
              ❤️ {formatCount(item.like_count)}
            </span>
          )}
        </div>
      </div>

      {/* 외부 링크 아이콘 */}
      <span className="text-gray-300 shrink-0 text-sm">▶</span>
    </article>
  );
}
