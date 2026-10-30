import Link from "next/link";
import { ImageOrPlaceholder } from "./ImageOrPlaceholder";
import { btnSmallOutline } from "./ui";
import { bg } from "@/lib/site/format";
import type { Artist, Catalog, Collection } from "@/lib/site/types";

export function artistNames(c: Collection, catalog: Catalog) {
  return c.artist_ids.map((id) => catalog.artists.find((a) => a.id === id)?.name).filter(Boolean).join(" × ");
}

export function Portrait({ a, className, label }: { a: Artist; className: string; label?: string }) {
  return (
    <ImageOrPlaceholder
      src={a.portrait_url}
      hue={a.hue + 30}
      angle={90}
      L={0.8}
      alt={label ?? `${a.name} 肖像（授權後使用）`}
      decorative={!label}
      sizes="160px"
      className={`rounded-full ${className}`}
    />
  );
}

/** 首頁「精選藝術家」卡片 */
export function FeaturedArtistCard({ a }: { a: Artist }) {
  const href = `/artists/${a.id}`;
  return (
    <article className="flex flex-col gap-4 rounded-panel border border-line-card bg-card px-3 pb-5 pt-3 transition-[transform,box-shadow] duration-[250ms] hover:-translate-y-[3px] hover:shadow-card-hover">
      <Link href={href} aria-label={`${a.name} 代表作品`} className="relative block">
        <ImageOrPlaceholder src={a.cover_url} hue={a.hue} alt="" decorative label="代表作品" labelPos="tl" sizes="(min-width:960px) 25vw, 100vw" className="aspect-[5/4] rounded-[10px]" />
        <span className="absolute -bottom-[22px] left-4 block h-14 w-14 rounded-full border-[3px] border-card" style={{ background: bg(a.hue + 30, 90, 0.8) }} />
      </Link>
      <div className="flex flex-col gap-1.5 px-1 pt-4">
        <div className="flex flex-wrap items-baseline gap-2">
          <Link href={href} className="inline-flex min-h-11 min-w-11 items-center font-serif text-[20px] font-bold leading-[1.3] nav:min-h-0 nav:min-w-0">
            {a.name}
          </Link>
          <span className="font-mono text-[11px] leading-none text-muted">{a.name_en}</span>
        </div>
        <span className="text-[12px] font-medium text-forest">
          {a.discipline}・{a.city}
        </span>
        <p className="m-0 text-[14px] text-body2 [text-wrap:pretty]">{a.tagline}</p>
      </div>
      <Link href={href} className={`mx-1 ${btnSmallOutline}`}>
        查看作品 →
      </Link>
    </article>
  );
}

/** 藝術家詳情「參與的聯名系列」/ 系列詳情「其他聯名企劃」小卡 */
export function CollectionMiniCard({ c, catalog, withCount, size = 96, card = true }: { c: Collection; catalog: Catalog; withCount?: boolean; size?: number; card?: boolean }) {
  const count = catalog.products.filter((p) => p.collection_id === c.id).length;
  return (
    <Link
      href={`/collections/${c.id}`}
      className={`flex items-center gap-4 rounded-card border border-line p-3 hover:border-forest ${card ? "bg-card" : ""}`}
    >
      <span className="block shrink-0" style={{ width: size }}>
        <ImageOrPlaceholder src={c.cover_url} hue={c.hue} L={0.8} alt="" decorative sizes="96px" className="aspect-square rounded-ctl" />
      </span>
      <span className="flex min-w-0 flex-col gap-0.5">
        <span className="font-serif text-[18px] font-bold leading-[1.3]">{c.name}</span>
        <span className="text-[13px] text-muted">
          {artistNames(c, catalog)}
          {withCount ? `・${count} 件作品` : ""}
        </span>
      </span>
    </Link>
  );
}
