import type { Metadata } from "next";
import { Noto_Sans_TC, Noto_Serif_TC, JetBrains_Mono } from "next/font/google";
import { SITE_URL } from "@/lib/env";
import "./globals.css";

const sans = Noto_Sans_TC({ weight: ["400", "500", "700"], variable: "--font-noto-sans-tc", display: "swap", preload: false });
const serif = Noto_Serif_TC({ weight: ["600", "700"], variable: "--font-noto-serif-tc", display: "swap", preload: false });
const mono = JetBrains_Mono({ weight: ["400", "500"], subsets: ["latin"], variable: "--font-jetbrains-mono", display: "swap" });

const TITLE = "圖個有意思 TUGO STUDIO｜好作品，不只值得被看見。";
const DESC = "圖個有意思｜新銳藝術家 × 原創周邊商品。讓創意成為作品，讓作品走進生活。";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: TITLE,
  description: DESC,
  openGraph: { title: TITLE, description: DESC, type: "website", locale: "zh_TW" },
};

// 前台外框（DemoBanner / Header / Footer / <main>）在 src/app/(site)/layout.tsx；/admin 不吃前台外框。
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-TW" className={`${sans.variable} ${serif.variable} ${mono.variable}`}>
      <body>{children}</body>
    </html>
  );
}
