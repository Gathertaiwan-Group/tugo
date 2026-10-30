"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useSite } from "./SiteProvider";
import { BagIcon, Logo, SearchIcon, UserIcon } from "./icons";
import { ImageOrPlaceholder } from "./ImageOrPlaceholder";

export const NAV = [
  { name: "新品上市", href: "/new", match: (p: string) => p === "/new" },
  { name: "逛商品", href: "/shop", match: (p: string) => p.startsWith("/shop") || p.startsWith("/products"), shop: true },
  { name: "認識藝術家", href: "/artists", match: (p: string) => p.startsWith("/artists") },
  { name: "聯名企劃", href: "/collections", match: (p: string) => p.startsWith("/collections") },
  { name: "關於我們", href: "/about", match: (p: string) => p === "/about" },
  { name: "藝術家合作", href: "/collaborate", match: (p: string) => p === "/collaborate" },
];

export function Header() {
  const pathname = usePathname();
  const { catalog, cartCount, openOverlay, overlay } = useSite();
  const [menu, setMenu] = useState(false);

  useEffect(() => setMenu(false), [pathname]);
  useEffect(() => {
    if (!menu) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setMenu(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [menu]);

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-[rgba(244,239,229,.94)] backdrop-blur-[10px]">
      <div className="container-tugo flex h-14 items-center gap-2 nav:h-[68px] nav:gap-6">
        <button
          type="button"
          onClick={() => openOverlay("nav")}
          aria-label="開啟選單"
          aria-expanded={overlay === "nav"}
          aria-controls="mobile-nav"
          className="-ml-2.5 flex h-11 w-11 shrink-0 cursor-pointer flex-col items-center justify-center gap-[5px] border-0 bg-transparent nav:hidden"
        >
          <span className="block h-[1.5px] w-5 bg-ink" />
          <span className="block h-[1.5px] w-5 bg-ink" />
          <span className="-ml-1.5 block h-[1.5px] w-3.5 self-center bg-ink" />
        </button>
        <Link href="/" aria-label="圖個有意思 TUGO STUDIO 首頁" className="flex min-h-11 shrink-0 items-center gap-2.5">
          <Logo />
          <span className="flex flex-col leading-[1.1]">
            <span className="font-serif text-[17px] font-bold leading-[1.1] tracking-[.06em] nav:text-[18px]">圖個有意思</span>
            <span className="font-mono text-[9px] font-medium leading-[1.4] tracking-[.24em] text-muted">TUGO STUDIO</span>
          </span>
        </Link>

        <nav aria-label="主選單" className="mx-auto hidden items-center gap-1 nav:flex">
          {NAV.map((n) => {
            const active = n.match(pathname);
            const cls = `block whitespace-nowrap border-b-2 px-3 py-[22px] text-[14px] font-medium hover:text-forest ${active ? "border-forest" : "border-transparent"}`;
            if (!n.shop)
              return (
                <Link key={n.href} href={n.href} className={cls} aria-current={active ? "page" : undefined}>
                  {n.name}
                </Link>
              );
            return (
              <div
                key={n.href}
                className="relative"
                onMouseEnter={() => setMenu(true)}
                onMouseLeave={() => setMenu(false)}
                onBlur={(e) => {
                  if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setMenu(false);
                }}
              >
                <Link
                  href={n.href}
                  onFocus={() => setMenu(true)}
                  aria-haspopup="true"
                  aria-expanded={menu}
                  aria-current={active ? "page" : undefined}
                  className={cls}
                >
                  {n.name} <span className="text-[10px] text-muted">▾</span>
                </Link>
                {menu ? (
                  <div className="absolute left-[-12px] top-full grid w-[420px] animate-[tugoIn_.18s_ease] grid-cols-2 gap-1 rounded-card border border-line bg-card p-4 shadow-menu">
                    {catalog.categories.map((c) => (
                      <Link
                        key={c.id}
                        href={`/shop/${c.id}`}
                        onClick={() => setMenu(false)}
                        className="flex items-center gap-3 rounded-ctl p-2 text-[14px] hover:bg-menu-hover hover:text-forest"
                      >
                        <ImageOrPlaceholder src={c.image} hue={c.hue} L={0.88} alt="" decorative sizes="36px" className="h-9 w-9 shrink-0 rounded-badge" />
                        <span className="flex flex-col leading-[1.3]">
                          <span className="font-medium">{c.name}</span>
                          <span className="font-mono text-[11px] leading-[1.3] text-muted">{c.count} items</span>
                        </span>
                      </Link>
                    ))}
                    <Link
                      href="/shop"
                      onClick={() => setMenu(false)}
                      className="col-span-full mt-2 border-t border-line px-2 pb-0.5 pt-2.5 text-[13px] font-medium text-forest"
                    >
                      逛全部商品 →
                    </Link>
                  </div>
                ) : null}
              </div>
            );
          })}
        </nav>

        <div className="ml-auto flex items-center gap-1">
          <button
            type="button"
            onClick={() => openOverlay("search")}
            aria-label="搜尋商品與藝術家"
            className="grid h-11 w-11 cursor-pointer place-items-center rounded-ctl border-0 bg-transparent hover:bg-hover-bg"
          >
            <SearchIcon />
          </button>
          <Link href="/account" aria-label="會員中心" className="grid h-11 w-11 place-items-center rounded-ctl hover:bg-hover-bg max-[379px]:hidden">
            <UserIcon />
          </Link>
          <button
            type="button"
            onClick={() => openOverlay("cart")}
            aria-label={`開啟購物車（${cartCount} 件）`}
            className="relative flex h-11 cursor-pointer items-center gap-2 rounded-ctl border-0 bg-forest px-3 text-[13px] font-medium text-paper hover:bg-forest-dark"
          >
            <BagIcon />
            <span className="font-mono">{cartCount}</span>
            {cartCount > 0 ? <span aria-hidden="true" className="absolute right-1.5 top-1.5 h-[7px] w-[7px] rounded-full bg-tangerine" /> : null}
          </button>
        </div>
      </div>
    </header>
  );
}
