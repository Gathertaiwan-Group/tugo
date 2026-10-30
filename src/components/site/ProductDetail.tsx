"use client";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { useSite } from "./SiteProvider";
import { ImageOrPlaceholder } from "./ImageOrPlaceholder";
import { QtyStepper } from "./QtyStepper";
import { Breadcrumb } from "./ui";
import { useScrollLock } from "./useScrollLock";
import { badgeOf, money, statusText } from "@/lib/site/format";
import type { Product } from "@/lib/site/types";

type Img = { label: string; url: string | null; hue: number; angle: number; L: number };

const PLACEHOLDERS: [string, number, number, number][] = [
  ["情境照", 135, 0.86, 0],
  ["平拍照", 45, 0.84, 15],
  ["細節照", 90, 0.8, -15],
  ["背面／包裝", 0, 0.88, 30],
];

export function ProductDetail({
  product: p,
  artist,
  categoryName,
  swatches,
  sizeChart,
}: {
  product: Product;
  artist: { id: string; name: string };
  categoryName: string;
  swatches: Record<string, string>;
  sizeChart: { size: string; chest_cm: number | null; length_cm: number | null }[];
}) {
  const { productById, addToCart, favs, toggleFav } = useSite();
  const [color, setColor] = useState(p.colors.length === 1 ? p.colors[0] : "");
  const [size, setSize] = useState(p.sizes.length === 1 ? p.sizes[0] : "");
  const [qty, setQty] = useState(1);
  const [img, setImg] = useState(0);
  const [err, setErr] = useState("");
  const [zoom, setZoom] = useState(false);
  const [tab, setTab] = useState<"story" | "material" | "ship">("story");
  const [chart, setChart] = useState(false);
  const [ctaVisible, setCtaVisible] = useState(true);
  const ctaRef = useRef<HTMLDivElement>(null);
  const optsRef = useRef<HTMLDivElement>(null);

  const imgs: Img[] = PLACEHOLDERS.map(([label, angle, L, dh], i) => ({
    label: p.images[i]?.label || label,
    url: p.images[i]?.url ?? null,
    hue: p.hue + dh,
    angle,
    L,
  }));
  const main = imgs[img];
  const soldout = p.status === "soldout";
  const faved = favs.includes(p.id);
  const badge = badgeOf(p);
  const st = statusText(p);
  const total = money(p.price * qty);
  const addText = soldout ? "已售罄" : p.status === "preorder" ? `預購・${total}` : `加入購物車・${total}`;
  const shortText = soldout ? "已售罄" : p.status === "preorder" ? "預購" : "加入購物車";

  const add = () => {
    if (soldout) return;
    let e = "";
    if (p.colors.length && !color) e = "請先選擇顏色";
    else if (p.sizes.length && !size) e = "請先選擇尺寸";
    setErr(e);
    if (e) {
      optsRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
    const lite = productById.get(p.id);
    if (lite) addToCart(lite, color, size, qty);
  };

  // 手機版底部固定購物列：主 CTA 不在畫面上時出現
  useEffect(() => {
    const el = ctaRef.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(([en]) => setCtaVisible(en.isIntersecting), {
      threshold: 0,
    });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  // 讓 Footer / Toast 讓出底部列的高度（僅手機）
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 959.98px)");
    const apply = () => document.documentElement.style.setProperty("--bottom-bar", mq.matches ? "76px" : "0px");
    apply();
    mq.addEventListener("change", apply);
    return () => {
      mq.removeEventListener("change", apply);
      document.documentElement.style.removeProperty("--bottom-bar");
    };
  }, []);

  const closeZoom = useCallback(() => setZoom(false), []);
  useScrollLock(zoom, closeZoom);
  useEffect(() => {
    if (!zoom) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") setImg((i) => (i + 3) % 4);
      if (e.key === "ArrowRight") setImg((i) => (i + 1) % 4);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [zoom]);
  const touchX = useRef<number | null>(null);

  return (
    <section className="container-tugo pt-[clamp(12px,3vw,40px)]">
      <Breadcrumb
        className="mb-3 nav:mb-5"
        items={[{ name: "首頁", href: "/" }, { name: "逛商品", href: "/shop" }, { name: categoryName, href: `/shop/${p.category_id}` }, { name: p.name }]}
      />
      <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,420px),1fr))] items-start gap-[clamp(24px,4vw,64px)]">
        {/* 圖片 */}
        <div className="flex flex-col gap-3">
          <div className="relative">
            <button
              type="button"
              onClick={() => setZoom(true)}
              aria-label="放大檢視商品圖"
              className="relative block aspect-[4/5] w-full cursor-zoom-in overflow-hidden rounded-panel border-0 p-0"
            >
              <ImageOrPlaceholder src={main.url} hue={main.hue} angle={main.angle} L={main.L} alt={`${main.label}｜${p.name}`} decorative priority sizes="(min-width:960px) 50vw, 100vw" className="absolute inset-0" />
              <span className="absolute bottom-3.5 left-3.5 max-w-[calc(100%-130px)] truncate rounded-[5px] bg-[rgba(244,239,229,.92)] px-[9px] py-[5px] text-left font-mono text-[11px] font-medium leading-[1.3]">
                {main.label}｜{p.name}
              </span>
              <span className="absolute bottom-3.5 right-3.5 rounded-[5px] bg-ink px-[9px] py-[5px] font-mono text-[11px] font-medium leading-[1.3] text-paper">⤢ 點擊放大</span>
            </button>
            {badge ? (
              <span
                className="absolute left-3.5 top-3.5 rounded-badge border px-2.5 py-[7px] text-[12px] font-semibold leading-none"
                style={{ background: badge.bg, color: badge.color, borderColor: badge.border }}
              >
                {badge.text}
              </span>
            ) : null}
          </div>
          <div className="grid grid-cols-4 gap-2.5">
            {imgs.map((im, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setImg(i)}
                aria-label={im.label}
                aria-pressed={img === i}
                className={`relative aspect-square cursor-pointer overflow-hidden rounded-[10px] border-2 p-0 ${img === i ? "border-ink" : "border-transparent"}`}
              >
                <ImageOrPlaceholder src={im.url} hue={im.hue} angle={im.angle} L={im.L} alt="" decorative sizes="120px" className="absolute inset-0" />
                <span className="absolute bottom-1 left-1 rounded-[3px] bg-[rgba(244,239,229,.9)] px-1 py-0.5 font-mono text-[9px] font-medium leading-[1.2]">{im.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* 資訊 */}
        <div className="flex flex-col gap-[22px] nav:sticky nav:top-24">
          <div className="flex flex-col gap-2">
            <Link href={`/artists/${artist.id}`} className="inline-flex min-h-11 items-center self-start text-[14px] font-medium text-forest nav:min-h-0">
              {artist.name} →
            </Link>
            <h1 className="m-0 font-serif text-[clamp(26px,3.2vw,40px)] font-bold leading-[1.3] [text-wrap:balance]">{p.name}</h1>
            <span className="font-mono text-[22px] font-medium leading-[1.3]">{money(p.price)}</span>
            <span className="flex items-center gap-2 text-[13px] text-body2">
              <span aria-hidden="true" className={`h-2 w-2 shrink-0 rounded-full ${soldout ? "bg-soldout-bg" : "bg-forest"}`} />
              {st}
            </span>
          </div>

          <div ref={optsRef} className="flex scroll-mt-24 flex-col gap-[22px]">
            {p.colors.length ? (
              <fieldset className="m-0 flex flex-col gap-2.5 border-0 p-0">
                <legend className="mb-2.5 text-[13px]">
                  顏色：<strong>{color || "未選擇"}</strong>
                </legend>
                <div className="flex flex-wrap gap-2.5">
                  {p.colors.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => {
                        setColor(c);
                        setErr("");
                      }}
                      aria-pressed={color === c}
                      aria-label={c}
                      className={`flex h-11 cursor-pointer items-center gap-2 rounded-ctl border-[1.5px] bg-field pl-2 pr-3.5 text-[13px] ${color === c ? "border-ink" : "border-line-field"}`}
                    >
                      <span className="h-6 w-6 rounded-full border border-line-field" style={{ background: swatches[c] || "#ccc" }} />
                      {c}
                    </button>
                  ))}
                </div>
              </fieldset>
            ) : null}

            {p.sizes.length ? (
              <fieldset className="m-0 flex flex-col gap-2.5 border-0 p-0">
                <legend className="mb-2.5 text-[13px]">
                  尺寸：<strong>{size || "未選擇"}</strong>
                </legend>
                <div className="flex flex-wrap gap-2">
                  {p.sizes.map((z) => (
                    <button
                      key={z}
                      type="button"
                      onClick={() => {
                        setSize(z);
                        setErr("");
                      }}
                      aria-pressed={size === z}
                      className={`h-11 min-w-[52px] cursor-pointer rounded-ctl border-[1.5px] px-3.5 font-mono text-[14px] font-medium leading-none ${
                        size === z ? "border-ink bg-ink text-paper" : "border-line-field bg-transparent text-ink"
                      }`}
                    >
                      {z}
                    </button>
                  ))}
                </div>
                {p.category_id === "tees" ? (
                  <>
                    <button
                      type="button"
                      onClick={() => setChart((v) => !v)}
                      aria-expanded={chart}
                      aria-controls="size-chart"
                      className="inline-flex min-h-11 cursor-pointer items-center self-start border-0 bg-transparent p-0 text-[13px] text-forest underline nav:min-h-0 nav:py-1"
                    >
                      {chart ? "收起尺寸表" : "查看尺寸表"}
                    </button>
                    {chart ? (
                      <div id="size-chart" className="w-full max-w-[360px] animate-tugo-in overflow-x-auto">
                        <table className="w-full border-collapse text-[13px]">
                          <caption className="sr-only">T 恤尺寸表（單位：公分）</caption>
                          <thead>
                            <tr className="border-b border-ink">
                              <th scope="col" className="px-1 py-2 text-left">尺寸</th>
                              <th scope="col" className="px-1 py-2 text-left">胸寬 cm</th>
                              <th scope="col" className="px-1 py-2 text-left">衣長 cm</th>
                            </tr>
                          </thead>
                          <tbody>
                            {sizeChart.map((r) => (
                              <tr key={r.size} className="border-b border-line font-mono">
                                <th scope="row" className="px-1 py-2 text-left font-normal">{r.size}</th>
                                <td className="px-1 py-2">{r.chest_cm}</td>
                                <td className="px-1 py-2">{r.length_cm}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : null}
                  </>
                ) : null}
              </fieldset>
            ) : null}
          </div>

          <div ref={ctaRef} className="flex flex-col gap-2.5">
            <div className="flex flex-wrap gap-2.5">
              <div className="order-1">
                <QtyStepper qty={qty} size="lg" onDec={() => setQty((q) => Math.max(1, q - 1))} onInc={() => setQty((q) => Math.min(10, q + 1))} />
              </div>
              <button
                type="button"
                onClick={add}
                disabled={soldout}
                className={`order-3 h-[52px] basis-full cursor-pointer rounded-ctl border-0 text-[15px] font-medium transition-[filter] duration-200 nav:order-2 nav:flex-[1_1_220px] nav:basis-auto ${
                  soldout ? "cursor-not-allowed bg-soldout-bg text-muted" : "bg-forest text-paper hover:brightness-[1.12]"
                }`}
              >
                {addText}
              </button>
              <button
                type="button"
                onClick={() => toggleFav(p.id)}
                aria-pressed={faved}
                className="order-2 h-[52px] flex-1 cursor-pointer rounded-ctl border border-ink bg-transparent px-4 text-[14px] text-forest nav:order-3 nav:flex-none"
              >
                {faved ? "♥ 已收藏" : "♡ 收藏"}
              </button>
            </div>
            {err ? (
              <p role="alert" className="m-0 text-[13px] font-medium text-error">
                ⚠ {err}
              </p>
            ) : null}
          </div>

          <ul className="m-0 flex list-none flex-col gap-1.5 border-t border-line p-0 pt-4 text-[13px] text-body2">
            <li>・現貨 3 個工作天內出貨；滿 NT$1,500 免運（示意規則）</li>
            <li>
              ・七天猶豫期，詳見{" "}
              <Link href="/returns" className="underline">
                退換貨政策
              </Link>
            </li>
            <li>・每件商品皆署名藝術家，並依合作合約分潤</li>
          </ul>

          <div>
            <div role="tablist" aria-label="商品資訊" className="flex gap-5 border-b border-line">
              {(
                [
                  ["story", "商品故事"],
                  ["material", "材質與保養"],
                  ["ship", "出貨與退換貨"],
                ] as const
              ).map(([id, name]) => (
                <button
                  key={id}
                  type="button"
                  role="tab"
                  id={`tab-${id}`}
                  aria-selected={tab === id}
                  aria-controls="tab-panel"
                  onClick={() => setTab(id)}
                  className={`-mb-px min-h-11 cursor-pointer border-0 border-b-2 bg-transparent px-0 py-3 text-[14px] font-medium ${tab === id ? "border-ink text-ink" : "border-transparent text-muted"}`}
                >
                  {name}
                </button>
              ))}
            </div>
            <div id="tab-panel" role="tabpanel" aria-labelledby={`tab-${tab}`} className="py-4 text-[14px] leading-[1.9] text-body2">
              {tab === "story" ? <p className="m-0">{p.story}</p> : null}
              {tab === "material" ? (
                <p className="m-0">
                  <strong>材質：</strong>
                  {p.material}
                  <br />
                  <strong>尺寸：</strong>
                  {p.dimensions}
                  <br />
                  <strong>保養：</strong>
                  {p.care}
                </p>
              ) : null}
              {tab === "ship" ? (
                <p className="m-0">
                  {st}。可選宅配到府或超商取貨（物流待串接）。收到商品後七天猶豫期內可申請退貨，商品須保持全新狀態，詳見{" "}
                  <Link href="/shipping" className="underline">
                    配送說明
                  </Link>
                  。
                </p>
              ) : null}
            </div>
          </div>
        </div>
      </div>

      {/* 手機版底部固定購物列 */}
      <div
        aria-hidden={ctaVisible}
        className={`fixed inset-x-0 bottom-0 z-30 border-t border-line bg-[rgba(244,239,229,.97)] px-4 pb-[calc(10px+env(safe-area-inset-bottom))] pt-2.5 backdrop-blur-[10px] transition-transform duration-200 nav:hidden ${
          ctaVisible ? "pointer-events-none translate-y-full" : "translate-y-0"
        }`}
      >
        <div className="mx-auto flex max-w-[560px] items-center gap-3">
          <div className="flex min-w-0 flex-1 flex-col leading-tight">
            <span className="truncate text-[12px] text-muted">
              {p.name}
              {color || size ? `・${[color, size].filter(Boolean).join("／")}` : ""}
            </span>
            <span className="font-mono text-[17px] font-medium">
              {total}
              {qty > 1 ? <span className="ml-1 text-[12px] text-muted">× {qty}</span> : null}
            </span>
          </div>
          <button
            type="button"
            onClick={add}
            disabled={soldout}
            tabIndex={ctaVisible ? -1 : 0}
            className={`h-12 shrink-0 cursor-pointer rounded-ctl border-0 px-6 text-[15px] font-medium ${soldout ? "cursor-not-allowed bg-soldout-bg text-muted" : "bg-forest text-paper"}`}
          >
            {shortText}
          </button>
        </div>
      </div>

      {zoom ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="商品圖放大檢視"
          onClick={closeZoom}
          className="fixed inset-0 z-[80] flex animate-tugo-in items-center justify-center bg-[rgba(36,38,34,.92)] p-[clamp(16px,4vw,48px)]"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            onTouchStart={(e) => (touchX.current = e.touches[0].clientX)}
            onTouchEnd={(e) => {
              if (touchX.current == null) return;
              const dx = e.changedTouches[0].clientX - touchX.current;
              if (Math.abs(dx) > 40) setImg((i) => (dx > 0 ? (i + 3) % 4 : (i + 1) % 4));
              touchX.current = null;
            }}
            className="relative aspect-[4/5] w-[min(100%,calc(min(88dvh,1000px)*0.8))] overflow-hidden rounded-card"
          >
            <ImageOrPlaceholder src={main.url} hue={main.hue} angle={main.angle} L={main.L} alt={`${main.label}｜${p.name}`} sizes="100vw" className="absolute inset-0" />
            <span className="absolute left-4 top-4 rounded-badge bg-[rgba(244,239,229,.92)] px-2.5 py-1.5 font-mono text-[12px] font-medium leading-[1.3]">
              {main.label}・{img + 1} / 4
            </span>
            <button type="button" onClick={() => setImg((i) => (i + 3) % 4)} aria-label="上一張" className="absolute left-3 top-1/2 h-12 w-12 -translate-y-1/2 cursor-pointer rounded-ctl border-0 bg-paper text-[20px]">
              ←
            </button>
            <button type="button" onClick={() => setImg((i) => (i + 1) % 4)} aria-label="下一張" className="absolute right-3 top-1/2 h-12 w-12 -translate-y-1/2 cursor-pointer rounded-ctl border-0 bg-paper text-[20px]">
              →
            </button>
            <button type="button" onClick={closeZoom} aria-label="關閉" autoFocus className="absolute right-3 top-3 h-11 w-11 cursor-pointer rounded-ctl border-0 bg-ink text-[22px] text-paper">
              ×
            </button>
          </div>
        </div>
      ) : null}
    </section>
  );
}
