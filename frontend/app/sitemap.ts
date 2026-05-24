import { MetadataRoute } from "next";

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://shorts100.com";
const SSR_BASE = process.env.BACKEND_API_URL ?? "http://shorts100-be:8000";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // 정적 페이지
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${BASE_URL}/ko`, lastModified: new Date(), changeFrequency: "hourly", priority: 1.0 },
    { url: `${BASE_URL}/ko/rising`, lastModified: new Date(), changeFrequency: "hourly", priority: 0.9 },
  ];

  // 동적 영상 페이지 (최근 100개)
  let videoRoutes: MetadataRoute.Sitemap = [];
  try {
    const res = await fetch(`${SSR_BASE}/api/rankings/global?limit=100&offset=0`, {
      next: { revalidate: 3600 },
    });
    if (res.ok) {
      const videos: { id: number; published_at?: string }[] = await res.json();
      videoRoutes = videos.map((v) => ({
        url: `${BASE_URL}/ko/v/${v.id}`,
        lastModified: v.published_at ? new Date(v.published_at) : new Date(),
        changeFrequency: "daily" as const,
        priority: 0.7,
      }));
    }
  } catch {
    // 빌드 타임에 백엔드 없으면 정적 라우트만 반환
  }

  return [...staticRoutes, ...videoRoutes];
}
