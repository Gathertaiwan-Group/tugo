import type { Metadata } from "next";
import "./admin.css";

// 後台：不依賴根 layout 的外框（Header/Footer/DemoBanner 由前台 (site) 管）；所有頁面動態、不快取、不收錄。
export const dynamic = "force-dynamic";
export const revalidate = 0;
export const metadata: Metadata = {
  title: "TUGO 管理後台",
  robots: { index: false, follow: false },
};

export default function AdminRootLayout({ children }: { children: React.ReactNode }) {
  return <div className="adm-root">{children}</div>;
}
