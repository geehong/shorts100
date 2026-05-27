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

export const metadata: Metadata = {
  title: "Shorts100 - 오늘의 쇼츠 TOP 100",
  description: "지금 가장 핫한 유튜브 숏폼 영상 랭킹",
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
