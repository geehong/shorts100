import { MetadataRoute } from "next";

export const dynamic = "force-dynamic";

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://shorts100.com";
const SSR_BASE = process.env.BACKEND_API_URL ?? "http://shorts100-be:8000";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const locales = ["ko", "en"];
  
  // 정적 페이지
  const staticRoutes: MetadataRoute.Sitemap = [];
  
  for (const locale of locales) {
    staticRoutes.push(
      {
        url: `${BASE_URL}/${locale}`,
        lastModified: new Date(),
        changeFrequency: "hourly",
        priority: 1.0,
        alternates: {
          languages: {
            ko: `${BASE_URL}/ko`,
            en: `${BASE_URL}/en`,
          },
        },
      },
      {
        url: `${BASE_URL}/${locale}/rising`,
        lastModified: new Date(),
        changeFrequency: "hourly",
        priority: 0.8,
        alternates: {
          languages: {
            ko: `${BASE_URL}/ko/rising`,
            en: `${BASE_URL}/en/rising`,
          },
        },
      },
      {
        url: `${BASE_URL}/${locale}/download`,
        lastModified: new Date(),
        changeFrequency: "daily",
        priority: 0.8,
        alternates: {
          languages: {
            ko: `${BASE_URL}/ko/download`,
            en: `${BASE_URL}/en/download`,
          },
        },
      },
      {
        url: `${BASE_URL}/${locale}/terms`,
        lastModified: new Date(),
        changeFrequency: "monthly",
        priority: 0.3,
        alternates: {
          languages: {
            ko: `${BASE_URL}/ko/terms`,
            en: `${BASE_URL}/en/terms`,
          },
        },
      },
      {
        url: `${BASE_URL}/${locale}/privacy`,
        lastModified: new Date(),
        changeFrequency: "monthly",
        priority: 0.3,
        alternates: {
          languages: {
            ko: `${BASE_URL}/ko/privacy`,
            en: `${BASE_URL}/en/privacy`,
          },
        },
      }
    );
  }

  // 동적 영상 페이지 (최근 100개)
  let videoRoutes: MetadataRoute.Sitemap = [];
  try {
    const res = await fetch(`${SSR_BASE}/api/rankings/global?limit=100&offset=0`, {
      next: { revalidate: 3600 },
    });
    if (res.ok) {
      const videos: { id: number; published_at?: string }[] = await res.json();
      for (const v of videos) {
        for (const locale of locales) {
          videoRoutes.push({
            url: `${BASE_URL}/${locale}/v/${v.id}`,
            lastModified: v.published_at ? new Date(v.published_at) : new Date(),
            changeFrequency: "daily" as const,
            priority: 0.7,
            alternates: {
              languages: {
                ko: `${BASE_URL}/ko/v/${v.id}`,
                en: `${BASE_URL}/en/v/${v.id}`,
              },
            },
          });
        }
      }
    }
  } catch (err) {
    console.error("Sitemap fetch error:", err);
  }

  return [...staticRoutes, ...videoRoutes];
}
