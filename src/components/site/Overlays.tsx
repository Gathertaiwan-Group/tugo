"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useSite } from "./SiteProvider";
import { NAV } from "./Header";
import { SearchIcon } from "./icons";
import { QtyStepper } from "./QtyStepper";
import { ImageOrPlaceholder } from "./ImageOrPlaceholder";
import { useCartLines } from "./useCartLines";
import { bg, money } from "@/lib/site/format";

/** 開啟時把焦點移到指定元素。 */
function useAutoFocus<T extends HTMLElement>(active: boolean) {
  const ref = useRef<T>(null);
  useEffect(() => {
    if (!active) return;
    const t = setTimeout(() => ref.current?.focus(), 30);
    return () => clearTimeout(t);
  }, [active]);
  return ref;
}

export function MobileNav() {
  const { overlay, closeOverlay, closeForNav, openOverlay, catalog } = useSite();
  const open = overlay === "nav";
  const closeRef = useAutoFocus<HTMLButtonElement>(open);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[60] bg-[rgba(36,38,34,.4)]" onClick={closeOverlay}>
      <nav
        id="mobile-nav"
        aria-label="手機選單"
        role="dialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
        className="absolute bottom-0 left-0 top-0 flex h-dvh w-[min(86vw,360px)] animate-[tugoIn_.2s_ease] flex-col gap-1 overflow-y-auto overscroll-contain bg-paper px-6 pb-[calc(24px+env(safe-area-inset-bottom))] pt-[calc(12px+env(safe-area-inset-top))]"
      >
        <div className="mb-3 flex items-center justify-between">
          <span className="font-mono text-[11px] font-medium leading-none tracking-[.12em] text-muted">MENU</span>
          <button ref={closeRef} type="button" onClick={closeOverlay} aria-label="關閉選單" className="-mr-2.5 h-11 w-11 cursor-pointer border-0 bg-transparent text-[24px]">
            ×
          </button>
        </div>
        {NAV.map((n) => (
          <Link key={n.href} href={n.href} onClick={closeForNav} className="border-b border-line py-3.5 font-serif text-[20px] font-semibold leading-[1.3]">
            {n.name}
          </Link>
        ))}
        <div className="mb-2 mt-6 font-mono text-[11px] font-medium leading-none tracking-[.12em] text-muted">逛商品分類</div>
        <div className="grid grid-cols-2 gap-2">
          {catalog.categories.map((c) => (
            <Link key={c.id} href={`/shop/${c.id}`} onClick={closeForNav} className="flex min-h-12 items-center rounded-ctl border border-line px-3 text-[14px]">
              {c.name}
            </Link>
          ))}
        </div>
        <div className="mt-6 flex gap-2">
          <button type="button" onClick={() => openOverlay("search")} className="h-12 flex-1 cursor-pointer rounded-ctl border border-ink bg-transparent">
            搜尋
          </button>
          <Link href="/account" onClick={closeForNav} className="grid h-12 flex-1 place-items-center rounded-ctl border border-ink">
            會員
          </Link>
        </div>
      </nav>
    </div>
  );
}

export function SearchOverlay() {
  const { overlay, closeOverlay, closeForNav, catalog } = useSite();
  const open = overlay === "search";
  const [q, setQ] = useState("");
  const inputRef = useAutoFocus<HTMLInputElement>(open);
  const router = useRouter();

  useEffect(() => {
    if (open) setQ("");
  }, [open]);

  if (!open) return null;
  const sq = q.trim().toLowerCase();
  const artistName = (id: string) => catalog.artists.find((a) => a.id === id)?.name ?? "";
  const products = sq ? catalog.products.filter((p) => (p.name + artistName(p.artist_id)).toLowerCase().includes(sq)).slice(0, 6) : [];
  const artists = sq ? catalog.artists.filter((a) => (a.name + (a.name_en ?? "") + (a.discipline ?? "")).toLowerCase().includes(sq)) : [];
  const empty = !!sq && !products.length && !artists.length;

  const submit = () => {
    closeForNav();
    router.push(q.trim() ? `/shop?q=${encodeURIComponent(q.trim())}` : "/shop");
  };

  return (
    <div className="fixed inset-0 z-[70] bg-[rgba(36,38,34,.45)]" onClick={closeOverlay}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label="搜尋"
        onClick={(e) => e.stopPropagation()}
        className="max-h-[85dvh] animate-[tugoIn_.2s_ease] overflow-y-auto overscroll-contain bg-paper pt-[env(safe-area-inset-top)]"
      >
        <div className="mx-auto max-w-[960px] px-[clamp(16px,4vw,48px)] pb-8 pt-4 nav:pt-6">
          <form
            role="search"
            onSubmit={(e) => {
              e.preventDefault();
              submit();
            }}
            className="flex items-center gap-3 border-b-2 border-ink pb-2"
          >
            <SearchIcon size={22} />
            <input
              ref={inputRef}
              id="tugo-search"
              type="search"
              inputMode="search"
              enterKeyHint="search"
              autoComplete="off"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="搜尋商品、藝術家，例如：饅頭、版畫"
              aria-label="搜尋關鍵字"
              className="min-w-0 flex-1 border-0 bg-transparent py-2 text-[clamp(18px,2.4vw,24px)] font-medium leading-[1.4] outline-none [&::-webkit-search-cancel-button]:hidden"
            />
            <button type="button" onClick={closeOverlay} aria-label="關閉搜尋" className="-mr-2 h-11 w-11 shrink-0 cursor-pointer border-0 bg-transparent text-[24px]">
              ×
            </button>
          </form>
          {sq ? (
            <div className="mt-5 flex flex-col gap-5">
              {artists.length ? (
                <div className="flex flex-wrap gap-2">
                  {artists.map((a) => (
                    <Link
                      key={a.id}
                      href={`/artists/${a.id}`}
                      onClick={closeForNav}
                      className="flex min-h-11 items-center gap-2.5 rounded-full border border-line-field py-1.5 pl-1.5 pr-3.5 text-[14px] hover:border-forest"
                    >
                      <span className="h-7 w-7 shrink-0 rounded-full" style={{ background: bg(a.hue + 30, 90, 0.8) }} />
                      {a.name}
                      <span className="text-[12px] text-muted">{a.discipline}</span>
                    </Link>
                  ))}
                </div>
              ) : null}
              {products.length ? (
                <div className="grid grid-cols-[repeat(auto-fill,minmax(min(100%,260px),1fr))] gap-2">
                  {products.map((p) => (
                    <Link key={p.id} href={`/products/${p.slug}`} onClick={closeForNav} className="flex items-center gap-3 rounded-ctl p-2 hover:bg-hover-bg">
                      <ImageOrPlaceholder src={p.image} hue={p.hue} alt="" decorative sizes="52px" className="h-16 w-[52px] shrink-0 rounded-badge" />
                      <span className="flex min-w-0 flex-col leading-[1.4]">
                        <span className="text-[14px] font-medium">{p.name}</span>
                        <span className="text-[12px] text-muted">
                          {artistName(p.artist_id)}・{money(p.price)}
                        </span>
                      </span>
                    </Link>
                  ))}
                </div>
              ) : null}
              {empty ? <p className="m-0 text-muted">找不到「{q}」相關結果，換個關鍵字試試，或從下方分類開始逛。</p> : null}
              <p className="m-0 font-mono text-[12px] leading-[1.4] text-muted">按 Enter 查看全部搜尋結果 ・ Esc 關閉</p>
            </div>
          ) : null}
          <div className="mt-5 flex flex-wrap gap-2">
            {catalog.categories.map((c) => (
              <Link
                key={c.id}
                href={`/shop/${c.id}`}
                onClick={closeForNav}
                className="inline-flex min-h-11 items-center rounded-ctl border border-line-field px-3.5 text-[13px] hover:border-forest hover:text-forest"
              >
                {c.name}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export function CartDrawer() {
  const { overlay, closeOverlay, closeForNav, cartCount, setQty, removeLine } = useSite();
  const open = overlay === "cart";
  const closeRef = useAutoFocus<HTMLButtonElement>(open);
  const c = useCartLines("home");
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[75] bg-[rgba(36,38,34,.45)]" onClick={closeOverlay}>
      <aside
        role="dialog"
        aria-modal="true"
        aria-label="購物車"
        onClick={(e) => e.stopPropagation()}
        className="absolute bottom-0 right-0 top-0 flex h-dvh w-[min(100vw,420px)] animate-[tugoIn_.22s_ease] flex-col bg-paper"
      >
        <div className="flex items-center justify-between border-b border-line px-5 pb-3 pt-[calc(12px+env(safe-area-inset-top))]">
          <h2 className="m-0 font-serif text-[20px] font-bold leading-[1.3]">
            購物車 <span className="font-mono text-[13px] font-normal text-muted">({cartCount})</span>
          </h2>
          <button ref={closeRef} type="button" onClick={closeOverlay} aria-label="關閉購物車" className="-mr-2.5 h-11 w-11 cursor-pointer border-0 bg-transparent text-[24px]">
            ×
          </button>
        </div>
        {c.lines.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 p-6 text-center">
            <span className="font-serif text-[20px] font-bold leading-[1.3]">購物車是空的</span>
            <span className="text-[14px] text-muted">挑一件喜歡的作品帶回家吧。</span>
            <Link href="/new" onClick={closeForNav} className="inline-flex h-11 items-center rounded-ctl bg-forest px-5 text-paper hover:text-paper">
              逛新品
            </Link>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto overscroll-contain px-5">
              {c.lines.map((l) => (
                <div key={l.key} className="flex gap-3.5 border-b border-line py-4">
                  <Link href={`/products/${l.product.slug}`} onClick={closeForNav} aria-label={l.product.name} className="block w-[76px] shrink-0">
                    <ImageOrPlaceholder src={l.product.image} hue={l.product.hue} alt="" decorative sizes="76px" className="aspect-[4/5] w-full rounded-ctl" />
                  </Link>
                  <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                    <Link href={`/products/${l.product.slug}`} onClick={closeForNav} className="text-[14px] font-medium leading-[1.4]">
                      {l.product.name}
                    </Link>
                    <span className="text-[12px] text-muted">
                      {l.variant}・{l.shipText}
                    </span>
                    <div className="mt-2 flex items-center justify-between gap-2">
                      <QtyStepper qty={l.qty} onDec={() => setQty(l.key, -1)} onInc={() => setQty(l.key, 1)} decLabel="減少" incLabel="增加" />
                      <span className="font-mono text-[13px] font-medium leading-none">{money(l.lineTotal)}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeLine(l.key)}
                      className="inline-flex min-h-11 cursor-pointer items-center self-start border-0 bg-transparent p-0 text-[12px] text-muted underline"
                    >
                      移除
                    </button>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex flex-col gap-2.5 border-t border-line bg-card px-5 pb-[calc(20px+env(safe-area-inset-bottom))] pt-4">
              {c.freeHint ? <span className="text-[12px] text-forest">{c.freeHint}</span> : null}
              <div className="flex justify-between font-bold">
                <span>小計</span>
                <span className="font-mono">{c.subText}</span>
              </div>
              <Link href="/checkout" onClick={closeForNav} className="grid h-[50px] place-items-center rounded-ctl bg-forest font-medium text-paper hover:bg-forest-dark hover:text-paper">
                前往結帳
              </Link>
              <Link href="/cart" onClick={closeForNav} className="inline-flex min-h-11 items-center justify-center text-[13px] underline">
                查看購物車
              </Link>
            </div>
          </>
        )}
      </aside>
    </div>
  );
}

export function Toast() {
  const { toast, openOverlay } = useSite();
  if (!toast) return null;
  return (
    <div
      role="status"
      className="fixed bottom-[calc(24px+var(--bottom-bar,0px)+env(safe-area-inset-bottom))] left-1/2 z-[90] flex max-w-[calc(100vw-32px)] -translate-x-1/2 items-center gap-3 rounded-[10px] bg-ink py-1 pl-[18px] pr-1 text-[14px] text-paper shadow-toast"
    >
      {toast}
      <button type="button" onClick={() => openOverlay("cart")} className="h-11 shrink-0 cursor-pointer border-0 bg-transparent px-3 font-bold text-tangerine">
        查看
      </button>
    </div>
  );
}
