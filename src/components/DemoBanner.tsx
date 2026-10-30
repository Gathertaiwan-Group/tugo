import { SHOW_DEMO_BANNER } from "@/lib/env";

export function DemoBanner() {
  if (!SHOW_DEMO_BANNER) return null;
  return (
    <div className="bg-ink text-paper">
      <div className="container-tugo flex items-center gap-3 py-2 text-[12px] leading-snug">
        <span className="font-mono font-medium tracking-[0.16em] text-tangerine">DEMO</span>
        <span>示意網站｜所有藝術家、作品、商品、價格與庫存皆為虛構資料；未串接金流、物流與會員系統。</span>
      </div>
    </div>
  );
}
