import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Shorts100",
  description: "실시간 유튜브 쇼츠 랭킹",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}