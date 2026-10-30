import type { Metadata } from "next";
import { SiteShell } from "@/components/site/SiteShell";
import { NotFoundBlock } from "@/components/site/ui";

export const metadata: Metadata = { title: "找不到頁面｜圖個有意思 TUGO STUDIO", robots: { index: false } };

// 全站 404（未匹配任何路由時，由根 layout 渲染，因此自帶前台外框）。
export default function NotFound() {
  return (
    <SiteShell>
      <NotFoundBlock code="ERROR 404" title="這一頁還沒被畫出來。" desc="網址可能有誤，或頁面已經移動。" href="/" cta="回到首頁" />
    </SiteShell>
  );
}
