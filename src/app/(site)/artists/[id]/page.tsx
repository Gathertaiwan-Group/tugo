import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getCatalogOrNull, getCatalog, toLite } from "@/lib/site/catalog";
import { ImageOrPlaceholder } from "@/components/site/ImageOrPlaceholder";
import { ProductCard } from "@/components/site/ProductCard";
import { CollectionMiniCard, Portrait } from "@/components/site/cards";

export const revalidate = 60;
type Props = { params: Promise<{ id: string }> };

export async function generateStaticParams() {
  return ((await getCatalogOrNull())?.artists ?? []).map((a) => ({ id: a.id }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const a = (await getCatalog()).artists.find((x) => x.id === id);
  if (!a) return { title: "找不到這位藝術家", robots: { index: false } };
  const desc = `${a.name}（${a.name_en}）｜${a.discipline}・${a.city}。${a.tagline ?? ""}`;
  return {
    title: `${a.name}｜認識藝術家`,
    description: desc,
    alternates: { canonical: `/artists/${a.id}` },
    openGraph: { title: `${a.name}｜圖個有意思 TUGO STUDIO`, description: desc, type: "profile" },
  };
}

const h2 = "m-0 font-serif text-[clamp(22px,2.4vw,30px)] font-bold leading-[1.3]";

export default async function ArtistPage({ params }: Props) {
  const { id } = await params;
  const c = await getCatalog();
  const a = c.artists.find((x) => x.id === id);
  if (!a) notFound();
  const lite = toLite(c).products.filter((p) => p.artist_id === a.id);
  const colls = c.collections.filter((x) => x.artist_ids.includes(a.id));

  return (
    <>
      <section className="px-[clamp(16px,2vw,24px)] pt-[clamp(12px,2vw,24px)]">
        <ImageOrPlaceholder
          src={a.cover_url}
          hue={a.hue}
          alt={`${a.name} 作品封面（示意佔位）`}
          label="藝術家封面｜代表作品（待提供）"
          labelPos="tr"
          priority
          className="h-[clamp(200px,36vw,440px)] rounded-panel"
        />
      </section>
      <section className="container-tugo-1200">
        <div className="relative -mt-14 flex flex-wrap items-end gap-x-6 gap-y-3">
          <Portrait a={a} className="aspect-square w-[clamp(112px,14vw,160px)] shrink-0 border-[6px] border-paper" label={`${a.name} 肖像（授權後使用）`} />
          <div className="flex flex-col gap-1.5 pb-2">
            <nav aria-label="麵包屑" className="flex gap-1.5 text-[12px] text-muted">
              <Link href="/artists" className="-mx-2.5 inline-flex min-h-11 min-w-11 items-center justify-center px-2.5 nav:mx-0 nav:min-h-0 nav:min-w-0 nav:px-0">
                認識藝術家
              </Link>
              <span className="inline-flex items-center" aria-hidden="true">
                /
              </span>
              <span aria-current="page" className="inline-flex items-center">
                {a.name}
              </span>
            </nav>
            <h1 className="m-0 font-serif text-[clamp(36px,5vw,60px)] font-bold leading-[1.1]">{a.name}</h1>
            <span className="font-mono text-[13px] font-medium leading-[1.4] tracking-[.06em] text-muted">
              {a.name_en} ・ {a.discipline} ・ {a.city}
            </span>
          </div>
        </div>
        <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,360px),1fr))] gap-[clamp(28px,5vw,72px)] border-b border-line py-[clamp(32px,5vw,64px)]">
          <blockquote className="m-0 font-serif text-[clamp(24px,2.8vw,36px)] font-semibold leading-[1.5] [text-wrap:balance]">
            <span className="text-tangerine">「</span>
            {a.philosophy}
            <span className="text-tangerine">」</span>
          </blockquote>
          <div className="flex flex-col gap-4">
            <span className="font-mono text-[11px] font-medium leading-none tracking-[.14em] text-muted">BIO 簡介</span>
            <p className="m-0 text-[16px] leading-[1.9] text-body2">{a.bio}</p>
            <div className="flex flex-wrap gap-1.5">
              {a.tags.map((t) => (
                <span key={t} className="rounded-badge bg-tag px-2.5 py-1 text-[12px]">
                  {t}
                </span>
              ))}
            </div>
            <span className="text-[13px] text-muted">Instagram：{a.instagram}（示意帳號，未連結）</span>
          </div>
        </div>
        {colls.length ? (
          <div className="pt-[clamp(40px,5vw,64px)]">
            <h2 className={`${h2} mb-5`}>參與的聯名系列</h2>
            <div className="grid grid-cols-[repeat(auto-fill,minmax(min(100%,320px),1fr))] gap-4">
              {colls.map((x) => (
                <CollectionMiniCard key={x.id} c={x} catalog={c} withCount />
              ))}
            </div>
          </div>
        ) : null}
        <div className="pb-[clamp(56px,8vw,112px)] pt-[clamp(40px,5vw,64px)]">
          <h2 className={`${h2} mb-6`}>{a.name} 的商品</h2>
          <div className="grid grid-cols-[repeat(auto-fill,minmax(min(46%,220px),1fr))] gap-x-4 gap-y-6">
            {lite.map((p) => (
              <ProductCard key={p.id} item={p} />
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
