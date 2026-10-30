import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getCatalogOrNull, getCatalog, toLite } from "@/lib/site/catalog";
import { ImageOrPlaceholder } from "@/components/site/ImageOrPlaceholder";
import { ProductCard } from "@/components/site/ProductCard";
import { CollectionMiniCard, Portrait, artistNames } from "@/components/site/cards";

export const revalidate = 60;
type Props = { params: Promise<{ id: string }> };

export async function generateStaticParams() {
  return ((await getCatalogOrNull())?.collections ?? []).map((c) => ({ id: c.id }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const c = await getCatalog();
  const x = c.collections.find((y) => y.id === id);
  if (!x) return { title: "找不到這個系列", robots: { index: false } };
  const desc = `${x.name}（${x.name_en}）｜${artistNames(x, c)}。${x.concept ?? ""}`;
  return {
    title: `${x.name}｜聯名企劃`,
    description: desc,
    alternates: { canonical: `/collections/${x.id}` },
    openGraph: { title: `${x.name}｜圖個有意思 TUGO STUDIO`, description: desc, type: "website" },
  };
}

const h2 = "m-0 font-serif text-[clamp(22px,2.4vw,30px)] font-bold leading-[1.3]";

export default async function CollectionPage({ params }: Props) {
  const { id } = await params;
  const c = await getCatalog();
  const x = c.collections.find((y) => y.id === id);
  if (!x) notFound();
  const artists = x.artist_ids.map((aid) => c.artists.find((a) => a.id === aid)!).filter(Boolean);
  const products = toLite(c).products.filter((p) => c.products.find((q) => q.id === p.id)?.collection_id === x.id);
  const others = c.collections.filter((y) => y.id !== x.id);

  return (
    <>
      <section className="bg-forest text-paper">
        <div className="container-tugo grid grid-cols-[repeat(auto-fit,minmax(min(100%,420px),1fr))] items-center gap-[clamp(28px,5vw,72px)] py-[clamp(28px,5vw,72px)]">
          <div className="flex flex-col gap-4">
            <nav aria-label="麵包屑" className="flex gap-1.5 text-[12px] text-on-forest-muted">
              <Link href="/collections" className="-mx-2.5 inline-flex min-h-11 min-w-11 items-center justify-center px-2.5 hover:text-white nav:mx-0 nav:min-h-0 nav:min-w-0 nav:px-0">
                聯名企劃
              </Link>
              <span className="inline-flex items-center" aria-hidden="true">
                /
              </span>
              <span aria-current="page" className="inline-flex items-center">
                {x.name}
              </span>
            </nav>
            <span className="font-mono text-[11px] font-medium leading-[1.4] tracking-[.16em] text-on-forest-muted">
              {x.name_en} ・ {x.season}
            </span>
            <h1 className="m-0 font-serif text-[clamp(40px,5.6vw,76px)] font-bold leading-[1.1]">{x.name}</h1>
            <span className="text-[15px] text-on-forest-body">{artistNames(x, c)}</span>
            <p className="m-0 text-[18px] leading-[1.8]">{x.concept}</p>
            <p className="m-0 text-[15px] leading-[1.9] text-on-forest-body">{x.description}</p>
          </div>
          <ImageOrPlaceholder
            src={x.cover_url}
            hue={x.hue}
            L={0.8}
            alt={`${x.name} 系列主視覺（示意）`}
            label="系列主視覺（待提供）"
            priority
            className="aspect-[4/3] rounded-card"
          />
        </div>
      </section>
      <section className="container-tugo pt-[clamp(40px,5vw,72px)]">
        <h2 className={`${h2} mb-5`}>參與藝術家</h2>
        <div className="grid grid-cols-[repeat(auto-fill,minmax(min(100%,320px),1fr))] gap-4">
          {artists.map((a) => (
            <Link key={a.id} href={`/artists/${a.id}`} className="flex items-center gap-4 rounded-card border border-line bg-card p-4 hover:border-forest">
              <Portrait a={a} className="h-16 w-16 shrink-0" />
              <span className="flex min-w-0 flex-col gap-0.5">
                <span className="font-serif text-[18px] font-bold leading-[1.3]">{a.name}</span>
                <span className="text-[13px] text-body2">{a.tagline}</span>
              </span>
            </Link>
          ))}
        </div>
      </section>
      <section className="container-tugo py-[clamp(40px,5vw,72px)]">
        <h2 className={`${h2} mb-6`}>系列商品</h2>
        <div className="grid grid-cols-[repeat(auto-fill,minmax(min(46%,240px),1fr))] gap-x-4 gap-y-6">
          {products.map((p) => (
            <ProductCard key={p.id} item={p} />
          ))}
        </div>
      </section>
      <section className="container-tugo pb-[clamp(56px,8vw,112px)]">
        <h2 className="mb-5 mt-0 font-serif text-[clamp(20px,2vw,26px)] font-bold leading-[1.3]">其他聯名企劃</h2>
        <div className="grid grid-cols-[repeat(auto-fill,minmax(min(100%,320px),1fr))] gap-4">
          {others.map((o) => (
            <CollectionMiniCard key={o.id} c={o} catalog={c} size={88} card={false} />
          ))}
        </div>
      </section>
    </>
  );
}
