"use client";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ProductCard } from "./ProductCard";
import { SearchIcon } from "./icons";
import { useScrollLock } from "./useScrollLock";
import { AVAILS, SORTS, activeCount, applyShopFilter, filterToQuery, type ShopFilter, type ShopProduct, type Sort } from "@/lib/site/shop";

type Tab = { name: string; href: string; active: boolean };

export function ShopView({
  products,
  artists,
  tabs,
  initial,
  title,
  en,
}: {
  products: ShopProduct[];
  artists: { id: string; name: string }[];
  tabs: Tab[];
  initial: ShopFilter;
  title: string;
  en: string;
}) {
  const [f, setF] = useState<ShopFilter>(initial);
  const [loading, setLoading] = useState(false);
  const [sheet, setSheet] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const first = useRef(true);

  const update = useCallback((patch: Partial<ShopFilter>) => {
    setF((prev) => ({ ...prev, ...patch }));
    clearTimeout(timer.current);
    setLoading(true);
    timer.current = setTimeout(() => setLoading(false), 320);
  }, []);

  // 篩選狀態同步到 URL（replaceState：不觸發 server 重新渲染）
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    const url = window.location.pathname + filterToQuery(f);
    window.history.replaceState(window.history.state, "", url);
  }, [f]);

  useEffect(() => () => clearTimeout(timer.current), []);

  const closeSheet = useCallback(() => setSheet(false), []);
  useScrollLock(sheet, closeSheet);

  const list = useMemo(() => applyShopFilter(products, f), [products, f]);
  const n = activeCount(f);
  const reset = () => update({ q: "", artists: [], avail: "all" });

  const panel = (idPrefix: string) => (
    <>
      <fieldset className="m-0 flex flex-col gap-0.5 border-0 p-0 nav:gap-2.5">
        <legend className="mb-3 font-mono text-[11px] font-medium leading-none tracking-[.14em] text-muted">AVAILABILITY 供貨狀態</legend>
        {AVAILS.map(([id, name]) => (
          <label key={id} className="flex min-h-11 cursor-pointer items-center gap-2.5 text-[15px] nav:min-h-7 nav:text-[14px]">
            <input
              type="radio"
              name={`${idPrefix}-avail`}
              checked={f.avail === id}
              onChange={() => update({ avail: id })}
              className="h-[18px] w-[18px] accent-forest nav:h-4 nav:w-4"
            />
            {name}
          </label>
        ))}
      </fieldset>
      <fieldset className="m-0 flex flex-col gap-0.5 border-0 p-0 nav:gap-2.5">
        <legend className="mb-3 font-mono text-[11px] font-medium leading-none tracking-[.14em] text-muted">ARTIST 藝術家</legend>
        <div className="grid grid-cols-2 gap-x-3 nav:flex nav:flex-col nav:gap-2.5">
          {artists.map((a) => (
            <label key={a.id} className="flex min-h-11 cursor-pointer items-center gap-2.5 text-[15px] nav:min-h-7 nav:text-[14px]">
              <input
                type="checkbox"
                checked={f.artists.includes(a.id)}
                onChange={() => update({ artists: f.artists.includes(a.id) ? f.artists.filter((x) => x !== a.id) : [...f.artists, a.id] })}
                className="h-[18px] w-[18px] accent-forest nav:h-4 nav:w-4"
              />
              {a.name}
            </label>
          ))}
        </div>
      </fieldset>
    </>
  );

  return (
    <section className="container-tugo pt-[clamp(20px,4vw,56px)]">
      <nav aria-label="麵包屑" className="flex gap-1.5 text-[12px] text-muted">
        <Link href="/" className="-mx-2.5 inline-flex min-h-11 min-w-11 items-center justify-center px-2.5 nav:mx-0 nav:min-h-0 nav:min-w-0 nav:px-0">
          首頁
        </Link>
        <span className="inline-flex items-center" aria-hidden="true">
          /
        </span>
        <span aria-current="page" className="inline-flex items-center">
          {title}
        </span>
      </nav>
      <div className="mb-5 mt-1 flex flex-wrap items-end justify-between gap-x-4 gap-y-1 nav:mb-6 nav:mt-3">
        <div className="flex flex-col gap-1">
          <span className="font-mono text-[11px] font-medium uppercase leading-[1.4] tracking-[.16em] text-muted">{en}</span>
          <h1 className="m-0 font-serif text-[clamp(34px,4.4vw,56px)] font-bold leading-[1.2]">{title}</h1>
        </div>
        <span className="font-mono text-[12px] leading-none text-muted" aria-live="polite">
          {list.length} 件商品
        </span>
      </div>

      <div role="tablist" aria-label="商品分類" className="[scrollbar-width:none] [&::-webkit-scrollbar]:hidden -mx-[clamp(16px,4vw,48px)] mb-5 flex snap-x scroll-px-[clamp(16px,4vw,48px)] gap-2 overflow-x-auto px-[clamp(16px,4vw,48px)] pb-1 nav:mb-6">
        {tabs.map((t) => (
          <Link
            key={t.href}
            href={t.href + filterToQuery({ ...f })}
            role="tab"
            aria-selected={t.active}
            className={`inline-flex min-h-11 shrink-0 snap-start items-center whitespace-nowrap rounded-ctl border px-4 text-[14px] font-medium hover:border-ink ${
              t.active ? "border-ink bg-ink text-paper hover:text-paper" : "border-line-field"
            }`}
          >
            {t.name}
          </Link>
        ))}
      </div>

      <div className="mb-7 flex flex-wrap items-center gap-3 border-y border-line py-3">
        <label className="flex h-11 min-w-0 flex-[1_1_100%] items-center gap-2 rounded-ctl border border-line-field bg-field px-3.5 nav:flex-[1_1_220px]">
          <SearchIcon size={16} color="#5E6158" />
          <input
            type="search"
            inputMode="search"
            enterKeyHint="search"
            value={f.q}
            onChange={(e) => update({ q: e.target.value })}
            placeholder="在此分類中搜尋商品或藝術家"
            aria-label="關鍵字搜尋"
            className="h-11 min-w-0 flex-1 border-0 bg-transparent text-[16px] outline-none nav:h-auto nav:text-[14px]"
          />
        </label>
        <button
          type="button"
          onClick={() => setSheet(true)}
          aria-expanded={sheet}
          aria-controls="filter-sheet"
          className="h-11 flex-1 cursor-pointer rounded-ctl border border-ink bg-transparent px-4 font-medium nav:hidden"
        >
          {n ? `篩選（${n}）` : "篩選"}
        </button>
        <label className="flex flex-1 items-center gap-2 text-[13px] text-muted nav:flex-none">
          <span className="shrink-0">排序</span>
          <select
            value={f.sort}
            onChange={(e) => update({ sort: e.target.value as Sort })}
            className="h-11 w-full min-w-0 cursor-pointer rounded-ctl border border-line-field bg-field px-3 text-[16px] text-ink nav:w-auto nav:text-[14px]"
          >
            {SORTS.map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="grid grid-cols-[minmax(0,1fr)] items-start gap-[clamp(24px,3vw,48px)] pb-[clamp(56px,8vw,112px)] nav:grid-cols-[232px_minmax(0,1fr)]">
        <aside aria-label="篩選條件" className="hidden flex-col gap-7 rounded-card border border-line-card bg-card p-5 nav:flex">
          {panel("d")}
          {n ? (
            <button type="button" onClick={reset} className="h-10 cursor-pointer rounded-ctl border border-ink bg-transparent text-[13px] hover:bg-ink hover:text-paper">
              清除篩選
            </button>
          ) : null}
        </aside>

        <div className="min-w-0">
          {loading ? (
            <div aria-busy="true" aria-label="載入中" className="grid grid-cols-[repeat(auto-fill,minmax(min(46%,220px),1fr))] gap-x-4 gap-y-6">
              {[1, 2, 3, 4, 5, 6].map((k) => (
                <div key={k} className="flex animate-tugo-pulse flex-col gap-2.5">
                  <div className="aspect-[4/5] rounded-card bg-skeleton" />
                  <div className="h-2.5 w-2/5 rounded-chip bg-skeleton" />
                  <div className="h-3.5 w-4/5 rounded-chip bg-skeleton" />
                </div>
              ))}
            </div>
          ) : list.length ? (
            <div className="grid-products">
              {list.map((p, i) => (
                <ProductCard key={p.id} item={p} priority={i < 2} />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3 rounded-panel border border-dashed border-line-field px-6 py-[clamp(40px,6vw,80px)] text-center">
              <span className="font-serif text-[24px] font-bold leading-[1.3]">沒有符合條件的商品</span>
              <p className="m-0 max-w-[28em] text-muted">試試其他關鍵字、放寬篩選條件，或看看其他分類。</p>
              <button type="button" onClick={reset} className="mt-2 h-11 cursor-pointer rounded-ctl border-0 bg-forest px-5 text-paper">
                清除所有篩選
              </button>
            </div>
          )}
        </div>
      </div>

      {sheet ? (
        <div className="fixed inset-0 z-[65] bg-[rgba(36,38,34,.45)] nav:hidden" onClick={closeSheet}>
          <div
            id="filter-sheet"
            role="dialog"
            aria-modal="true"
            aria-label="篩選條件"
            onClick={(e) => e.stopPropagation()}
            className="absolute inset-x-0 bottom-0 flex max-h-[85dvh] animate-[tugoIn_.22s_ease] flex-col rounded-t-panel bg-paper"
          >
            <div className="flex items-center justify-between border-b border-line px-5 py-2">
              <span className="font-serif text-[20px] font-bold">篩選</span>
              <button type="button" onClick={closeSheet} aria-label="關閉篩選" className="-mr-2.5 h-11 w-11 cursor-pointer border-0 bg-transparent text-[24px]">
                ×
              </button>
            </div>
            <div className="flex flex-col gap-6 overflow-y-auto overscroll-contain px-5 py-5">{panel("m")}</div>
            <div className="flex gap-3 border-t border-line bg-card px-5 pb-[calc(16px+env(safe-area-inset-bottom))] pt-4">
              <button type="button" onClick={reset} disabled={!n} className="h-12 flex-1 cursor-pointer rounded-ctl border border-ink bg-transparent disabled:cursor-not-allowed disabled:border-line-field disabled:text-disabled">
                清除篩選
              </button>
              <button type="button" onClick={closeSheet} className="h-12 flex-[2] cursor-pointer rounded-ctl border-0 bg-forest font-medium text-paper">
                顯示 {list.length} 件商品
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
