import { SHOW_DEMO_BANNER } from "@/lib/env";
import { getCatalog, getSiteImages, toLite } from "@/lib/site/catalog";
import { SiteProvider } from "./SiteProvider";
import { Header } from "./Header";
import { Footer } from "./Footer";
import { CartDrawer, MobileNav, SearchOverlay, Toast } from "./Overlays";

function DemoBanner() {
  if (!SHOW_DEMO_BANNER) return null;
  return (
    <div role="note" className="bg-ink px-4 py-2 text-center text-[12px] leading-[1.5] text-paper [text-wrap:pretty]">
      <span className="mr-2 font-mono tracking-[.06em] text-tangerine">DEMO</span>
      示意網站｜所有藝術家、作品、商品、價格與庫存皆為虛構資料；未串接金流、物流與會員系統。
    </div>
  );
}

/** 前台外框：跳至主要內容、Demo 橫幅、Header、main、Footer、各覆蓋層。(site)/layout 與全站 404 共用。 */
export async function SiteShell({ children }: { children: React.ReactNode }) {
  const [full, siteImages] = await Promise.all([getCatalog(), getSiteImages()]);
  const catalog = toLite(full, siteImages);
  return (
    <SiteProvider catalog={catalog}>
      <a
        href="#main"
        className="absolute left-[-9999px] top-0 z-[100] rounded-ctl bg-ink px-3 py-2 text-paper focus:left-3 focus:top-3 focus:text-paper"
      >
        跳到主要內容
      </a>
      <div className="flex min-h-dvh flex-col">
        <DemoBanner />
        <Header />
        <main id="main" tabIndex={-1} className="flex-1 outline-none">
          {children}
        </main>
        <Footer />
      </div>
      <MobileNav />
      <SearchOverlay />
      <CartDrawer />
      <Toast />
    </SiteProvider>
  );
}
