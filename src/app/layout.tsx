import type { Metadata } from "next";
import { Noto_Sans_TC, Noto_Serif_TC, JetBrains_Mono } from "next/font/google";
import { DemoBanner } from "@/components/DemoBanner";
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

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-TW" className={`${sans.variable} ${serif.variable} ${mono.variable}`}>
      <body>
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-50 focus:rounded-ctl focus:bg-ink focus:px-4 focus:py-2 focus:text-paper"
        >
          跳至主要內容
        </a>
        <DemoBanner />
        <main id="main">{children}</main>
      </body>
    </html>
  );
}
