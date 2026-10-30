"use client";
import Link from "next/link";
import { useSite } from "./SiteProvider";
import { useCartLines } from "./useCartLines";
import { QtyStepper } from "./QtyStepper";
import { ImageOrPlaceholder } from "./ImageOrPlaceholder";
import { money } from "@/lib/site/format";

export function CartView() {
  const { cartReady, setQty, removeLine } = useSite();
  const c = useCartLines("home");

  return (
    <section className="container-tugo-1200 pb-[clamp(56px,8vw,112px)] pt-[clamp(24px,5vw,72px)]">
      <h1 className="mb-6 mt-0 font-serif text-[clamp(32px,4vw,52px)] font-bold leading-[1.2] nav:mb-7">購物車</h1>
      {!cartReady ? (
        <div className="h-40 animate-tugo-pulse rounded-panel bg-skeleton" aria-busy="true" aria-label="載入中" />
      ) : c.lines.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-panel border border-dashed border-line-field px-6 py-16 text-center">
          <span className="font-serif text-[22px] font-bold leading-[1.3]">購物車是空的</span>
          <p className="m-0 text-muted">先去看看這季的新作品吧。</p>
          <Link href="/new" className="inline-flex h-12 items-center rounded-ctl bg-forest px-6 text-paper hover:text-paper">
            逛新品
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 items-start gap-[clamp(24px,4vw,56px)] nav:grid-cols-[minmax(0,1fr)_360px]">
          <div className="min-w-0 border-t border-ink">
            {c.lines.map((l) => (
              <div key={l.key} className="flex gap-4 border-b border-line py-5">
                <Link href={`/products/${l.product.slug}`} aria-label={l.product.name} className="block w-[84px] shrink-0 nav:w-24">
                  <ImageOrPlaceholder src={l.product.image} hue={l.product.hue} alt="" decorative sizes="96px" className="aspect-[4/5] rounded-ctl" />
                </Link>
                <div className="flex min-w-0 flex-1 flex-col gap-1">
                  <span className="text-[12px] text-muted">{l.artistName}</span>
                  <Link href={`/products/${l.product.slug}`} className="font-medium">
                    {l.product.name}
                  </Link>
                  <span className="text-[13px] text-body2">
                    {l.variant}・{l.shipText}
                  </span>
                  <div className="mt-auto flex flex-wrap items-center justify-between gap-3 pt-2">
                    <QtyStepper qty={l.qty} onDec={() => setQty(l.key, -1)} onInc={() => setQty(l.key, 1)} decLabel="減少" incLabel="增加" />
                    <span className="font-mono text-[15px] font-medium leading-none">{money(l.lineTotal)}</span>
                    <button
                      type="button"
                      onClick={() => removeLine(l.key)}
                      className="min-h-11 cursor-pointer border-0 bg-transparent px-1 text-[13px] text-muted underline"
                    >
                      移除
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <aside className="flex flex-col gap-3 rounded-panel border border-line-card bg-card p-6 nav:sticky nav:top-24">
            <h2 className="mb-1 mt-0 font-serif text-[20px] font-bold leading-[1.3]">訂單摘要</h2>
            <div className="flex justify-between text-[14px]">
              <span>小計</span>
              <span className="font-mono">{c.subText}</span>
            </div>
            <div className="flex justify-between text-[14px]">
              <span>運費（預估宅配）</span>
              <span className="font-mono">{c.shipText}</span>
            </div>
            {c.freeHint ? <span className="rounded-badge bg-success-bg px-2.5 py-1.5 text-[12px] text-forest">{c.freeHint}</span> : null}
            <div className="flex justify-between border-t border-line pt-3 text-[16px] font-bold">
              <span>合計</span>
              <span className="font-mono">{c.totalText}</span>
            </div>
            <Link href="/checkout" className="grid h-[52px] place-items-center rounded-ctl bg-forest font-medium text-paper hover:bg-forest-dark hover:text-paper">
              前往結帳
            </Link>
            <Link href="/shop" className="inline-flex min-h-11 items-center justify-center text-[13px] underline">
              繼續購物
            </Link>
          </aside>
        </div>
      )}
    </section>
  );
}
