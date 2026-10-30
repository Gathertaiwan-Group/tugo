import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getCatalog, getSizeChart, toLite } from "@/lib/site/catalog";
import { money } from "@/lib/site/format";
import { ProductDetail } from "@/components/site/ProductDetail";
import { ProductCard } from "@/components/site/ProductCard";
import { Portrait } from "@/components/site/cards";

export const revalidate = 60;

type Props = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  return (await getCatalog()).products.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const c = await getCatalog();
  const p = c.products.find((x) => x.slug === slug);
  if (!p) return { title: "找不到這件商品", robots: { index: false } };
  const a = c.artists.find((x) => x.id === p.artist_id);
  const desc = `${a?.name ?? ""}｜${p.name}・${money(p.price)}。${p.story ?? ""}`.slice(0, 150);
  return {
    title: `${p.name}｜${a?.name ?? ""}`,
    description: desc,
    alternates: { canonical: `/products/${p.slug}` },
    openGraph: {
      title: `${p.name}｜圖個有意思 TUGO STUDIO`,
      description: desc,
      type: "website",
      images: p.images[0]?.url ? [{ url: p.images[0].url }] : undefined,
    },
  };
}

const grid = "grid grid-cols-[repeat(auto-fill,minmax(min(46%,220px),1fr))] gap-x-4 gap-y-6";
const h2 = "m-0 font-serif text-[clamp(22px,2.4vw,30px)] font-bold leading-[1.3]";

export default async function ProductPage({ params }: Props) {
  const { slug } = await params;
  const [c, sizeChart] = await Promise.all([getCatalog(), getSizeChart()]);
  const p = c.products.find((x) => x.slug === slug);
  if (!p) notFound();
  const a = c.artists.find((x) => x.id === p.artist_id)!;
  const cat = c.categories.find((x) => x.id === p.category_id);
  const coll = p.collection_id ? c.collections.find((x) => x.id === p.collection_id) : undefined;
  const lite = toLite(c).products;
  const L = (id: string) => lite.find((x) => x.id === id)!;

  const same = c.products.filter((x) => x.artist_id === p.artist_id && x.id !== p.id);
  const sameColl = coll ? c.products.filter((x) => x.collection_id === coll.id && x.id !== p.id && x.artist_id !== p.artist_id) : [];
  const used = new Set([p.id, ...same.map((x) => x.id), ...sameColl.map((x) => x.id)]);
  const maybe = c.products.filter((x) => !used.has(x.id) && x.status !== "soldout").sort((x, y) => y.popularity - x.popularity);

  return (
    <>
      <ProductDetail
        key={p.id}
        product={p}
        artist={{ id: a.id, name: a.name }}
        categoryName={cat?.name ?? ""}
        swatches={c.swatches}
        sizeChart={sizeChart}
      />
      <section aria-label="關於藝術家" className="container-tugo mt-[clamp(48px,6vw,96px)]">
        <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,300px),1fr))] items-center gap-8 rounded-panel border border-line-card bg-card p-[clamp(20px,4vw,48px)]">
          <div className="flex items-center gap-5">
            <Portrait a={a} className="h-20 w-20 shrink-0 nav:h-24 nav:w-24" label="藝術家肖像（授權後使用）" />
            <div className="flex flex-col gap-1">
              <span className="font-mono text-[11px] font-medium leading-none tracking-[.14em] text-muted">ABOUT THE ARTIST</span>
              <span className="font-serif text-[26px] font-bold leading-[1.3]">{a.name}</span>
              <span className="text-[13px] text-forest">
                {a.discipline}・{a.city}
              </span>
            </div>
          </div>
          <div className="flex flex-col gap-3">
            <p className="m-0 text-[15px] leading-[1.8] text-body2">{a.bio}</p>
            <Link href={`/artists/${a.id}`} className="inline-flex min-h-11 items-end self-start border-b border-ink pb-0.5 font-medium nav:min-h-0">
              看 {a.name} 的所有作品 →
            </Link>
          </div>
        </div>
      </section>
      {same.length ? (
        <section className="container-tugo pt-[clamp(48px,6vw,88px)]">
          <h2 className={`${h2} mb-6`}>同藝術家作品</h2>
          <div className={grid}>
            {same.slice(0, 4).map((x) => (
              <ProductCard key={x.id} item={L(x.id)} />
            ))}
          </div>
        </section>
      ) : null}
      {coll && sameColl.length ? (
        <section className="container-tugo pt-[clamp(48px,6vw,88px)]">
          <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
            <h2 className={h2}>同系列：{coll.name}</h2>
            <Link href={`/collections/${coll.id}`} className="inline-flex min-h-11 items-center text-[14px] font-medium nav:min-h-0">
              看完整系列 →
            </Link>
          </div>
          <div className={grid}>
            {sameColl.slice(0, 4).map((x) => (
              <ProductCard key={x.id} item={L(x.id)} />
            ))}
          </div>
        </section>
      ) : null}
      <section className="container-tugo pb-[clamp(56px,8vw,112px)] pt-[clamp(48px,6vw,88px)]">
        <h2 className={`${h2} mb-6`}>你可能也會喜歡</h2>
        <div className={grid}>
          {maybe.slice(0, 4).map((x) => (
            <ProductCard key={x.id} item={L(x.id)} />
          ))}
        </div>
      </section>
    </>
  );
}
