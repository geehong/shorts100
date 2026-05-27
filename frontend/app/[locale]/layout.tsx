import type { Metadata } from "next";
import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import CookieConsentBanner from "@/components/CookieConsentBanner";
import AdsManager from "@/components/AdsManager";
import "../globals.css";

const SwRegister = () => (
  <script dangerouslySetInnerHTML={{ __html: `
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', function() {
        navigator.serviceWorker.register('/sw.js');
      });
    }
  `}} />
);

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const isKo = locale === "ko";

  const title = isKo
    ? "Shorts100 - 오늘의 쇼츠 TOP 100 및 무료 다운로더"
    : "Shorts100 - Today's Shorts TOP 100 & Free Downloader";

  const description = isKo
    ? "매시간 업데이트되는 실시간 유튜브 쇼츠 순위와 카테고리/국가별 트렌드를 확인해 보세요. 또한 유튜브, 틱톡, 인스타 릴스 동영상을 무료로 분석하고 간편하게 다운로드할 수 있습니다."
    : "Check out hourly updated real-time YouTube Shorts rankings and trends by category/country. You can also analyze and download YouTube, TikTok, and Instagram Reels videos for free.";

  const keywords = isKo
    ? "유튜브 쇼츠, 쇼츠 랭킹, 쇼츠 순위, 쇼츠 다운로드, 인스타 릴스 다운로드, 틱톡 다운로드, Shorts100, 유튜브 인기 영상, 숏폼 다운로더"
    : "YouTube Shorts, Shorts Ranking, YouTube Downloader, Reels Downloader, TikTok Downloader, Shorts100, Trending Short-form Video, Video Downloader";

  return {
    title,
    description,
    keywords,
    metadataBase: new URL("https://shorts100.com"),
    alternates: {
      canonical: `/${locale}`,
      languages: {
        ko: "/ko",
        en: "/en",
      },
    },
    openGraph: {
      title,
      description,
      url: `https://shorts100.com/${locale}`,
      siteName: "Shorts100",
      images: [
        {
          url: "/icons/icon-512.png",
          width: 512,
          height: 512,
          alt: "Shorts100 Icon",
        },
      ],
      locale: isKo ? "ko_KR" : "en_US",
      type: "website",
    },
    twitter: {
      card: "summary",
      title,
      description,
      images: ["/icons/icon-512.png"],
    },
    verification: {
      google: "google74dd62898b34f416",
    },
    appleWebApp: {
      capable: true,
      statusBarStyle: "default",
      title: "Shorts100",
    },
    other: {
      "mobile-web-app-capable": "yes",
      "theme-color": "#7c3aed",
    },
  };
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const messages = await getMessages();

  return (
    <html lang={locale}>
      <head />
      <body>
        <SwRegister />
        <NextIntlClientProvider messages={messages}>
          {children}
          <CookieConsentBanner />
          <AdsManager />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
