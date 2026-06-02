import type { Metadata } from "next";
import Head from "next/head";
import "./globals.css";

export const metadata: Metadata = {
  title: "Shorts100 – Short Video Rankings",
  description: "실시간 유튜브 쇼츠 랭킹 서비스를 제공하는 Shorts100",
};

const PAGE_TITLE = "Shorts100 – Short Video Rankings";
const PAGE_DESC  = "실시간 유튜브 쇼츠 랭킹 서비스를 제공하는 Shorts100";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <Head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;700&display=swap" rel="stylesheet" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="description" content={PAGE_DESC} />
        <meta property="og:title" content={PAGE_TITLE} />
        <meta property="og:description" content={PAGE_DESC} />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://shorts100.com" />
        <meta property="og:image" content="/og-image.png" />
        <title>{PAGE_TITLE}</title>
      </Head>
      <body>{children}</body>
    </html>
  );
}