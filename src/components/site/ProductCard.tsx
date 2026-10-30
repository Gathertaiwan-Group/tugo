"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSite } from "./SiteProvider";
import { ImageOrPlaceholder } from "./ImageOrPlaceholder";
import { badgeOf, bg, money, needsOptions } from "@/lib/site/format";
import type { LiteProduct } from "@/lib/site/types";

/** 商品卡（prototype/ProductCard.dc.html）。手機版：價格與按鈕上下排、按鈕滿寬 44px 高。 */
export function ProductCard({ item, priority }: { item: LiteProduct; priority?: boolean }) {
  const { catalog, favs, toggleFav, addToCart } = useSite();
  const router = useRouter();
  const artist = catalog.artists.find((a) => a.id === item.artist_id);
  const href = `/products/${item.slug}`;
  const faved = favs.includes(item.id);
  const soldout = item.status === "soldout";
  const needOpt = needsOptions(item);
  const badge = badgeOf(item);
  const addLabel = soldout ? "已售罄" : needOpt ? "選擇規格" : item.status === "preorder" ? "預購" : "加入購物車";

  const onAdd = () => {
    if (soldout) return;
    if (needOpt) return router.push(href);
    addToCart(item, item.colors[0] ?? "", item.sizes[0] ?? "", 1);
  };

  return (
    <article className="flex min-w-0 flex-col gap-1 text-ink nav:gap-3">
      <div className="relative">
        <Link href={href} aria-label={item.name} className="group relative block aspect-[4/5] overflow-hidden rounded-card">
          <ImageOrPlaceholder
            src={item.image}
            hue={item.hue}
            label={`情境照｜${item.name.slice(0, 10)}`}
            alt=""
            decorative
            priority={priority}
            sizes="(min-width: 960px) 25vw, 50vw"
            className="absolute inset-0"
          />
          <div
            aria-hidden="true"
            className="absolute inset-0 opacity-0 transition-opacity duration-[350ms] ease-out group-hover:opacity-100"
            style={{ background: bg(item.hue + 20, 45, 0.83) }}
          >
            <span className="absolute bottom-2.5 left-2.5 rounded-chip bg-[rgba(244,239,229,.9)] px-[7px] py-1 font-mono text-[10px] font-medium leading-[1.3] tracking-[.04em]">平拍照</span>
          </div>
          {badge ? (
            <span
              className="absolute left-2.5 top-2.5 rounded-badge border px-[9px] py-1.5 text-[11px] font-semibold leading-none tracking-[.06em]"
              style={{ background: badge.bg, color: badge.color, borderColor: badge.border }}
            >
              {badge.text}
            </span>
          ) : null}
        </Link>
        <button
          type="button"
          onClick={() => toggleFav(item.id)}
          aria-label={faved ? "取消收藏" : "加入收藏"}
          aria-pressed={faved}
          className="group/fav absolute right-1 top-1 grid h-11 w-11 cursor-pointer place-items-center rounded-ctl border-0 bg-transparent p-0"
        >
          <span className="grid h-9 w-9 place-items-center rounded-ctl bg-[rgba(244,239,229,.92)] text-[17px] leading-none text-forest transition-transform duration-200 group-hover/fav:scale-[1.08]">
            {faved ? "♥" : "♡"}
          </span>
        </button>
      </div>
      <div className="flex min-w-0 flex-col gap-1">
        <Link href={`/artists/${item.artist_id}`} className="flex min-h-11 min-w-11 items-center self-start text-[12px] tracking-[.02em] text-muted hover:text-forest nav:min-h-0 nav:min-w-0 nav:py-0.5">
          {artist?.name}
        </Link>
        <Link href={href} className="-mt-1 flex min-h-11 items-center text-[15px] font-medium leading-[1.45] [text-wrap:pretty] hover:text-forest nav:mt-0 nav:block nav:min-h-0">
          {item.name}
        </Link>
        <div className="flex flex-col items-stretch gap-2 nav:mt-1 nav:flex-row nav:items-center nav:justify-between">
          <span className="font-mono text-[14px] font-medium leading-none">{money(item.price)}</span>
          <button
            type="button"
            onClick={onAdd}
            disabled={soldout}
            className={`h-11 cursor-pointer whitespace-nowrap rounded-ctl border bg-transparent px-3 text-[13px] font-medium leading-none transition-colors duration-200 nav:h-8 nav:text-[12px] ${
              soldout
                ? "cursor-not-allowed border-soldout-bg text-disabled"
                : "border-forest text-forest hover:border-forest hover:bg-forest hover:text-paper"
            }`}
          >
            {addLabel}
          </button>
        </div>
      </div>
    </article>
  );
}
