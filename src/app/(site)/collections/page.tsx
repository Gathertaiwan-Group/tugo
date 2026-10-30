import type { Metadata } from "next";
import Link from "next/link";
import { getCatalog } from "@/lib/site/catalog";
import { ImageOrPlaceholder } from "@/components/site/ImageOrPlaceholder";
import { artistNames } from "@/components/site/cards";
import { Eyebrow } from "@/components/site/ui";

export const revalidate = 60;
export const metadata: Metadata = {
  title: "聯名企劃",
  description: "一個主題，幾種觀點。圖個有意思的藝術家聯名系列。",
  alternates: { canonical: "/collections" },
};

export default async function CollectionsPage() {
  const c = await getCatalog();
  return (
    <section className="container-tugo pb-[clamp(56px,8vw,112px)] pt-[clamp(28px,5vw,72px)]">
      <div className="mb-8 flex flex-col gap-2 nav:mb-10">
        <Eyebrow>COLLECTIONS — 聯名企劃</Eyebrow>
        <h1 className="m-0 font-serif text-[clamp(36px,5vw,64px)] font-bold leading-[1.15]">一個主題，幾種觀點。</h1>
      </div>
      <div className="flex flex-col gap-[clamp(32px,5vw,64px)]">
        {c.collections.map((x, i) => (
          <Link
            key={x.id}
            href={`/collections/${x.id}`}
            className="group grid grid-cols-[repeat(auto-fit,minmax(min(100%,380px),1fr))] items-center gap-[clamp(16px,4vw,56px)] border-t border-ink pt-6"
          >
            <ImageOrPlaceholder
              src={x.cover_url}
              hue={x.hue}
              L={0.8}
              alt={`${x.name} 系列形象照（示意）`}
              className="aspect-[16/10] rounded-card transition-transform duration-[400ms] group-hover:scale-[1.01]"
            />
            <div className="flex flex-col gap-3">
              <span className="font-mono text-[12px] font-medium leading-none text-muted">
                0{i + 1} ・ {x.season} ・ {c.products.filter((p) => p.collection_id === x.id).length} 件作品
              </span>
              <span className="font-serif text-[clamp(30px,3.6vw,48px)] font-bold leading-[1.2]">{x.name}</span>
              <span className="font-mono text-[13px] font-medium leading-[1.4] tracking-[.08em] text-forest">
                {x.name_en} — {artistNames(x, c)}
              </span>
              <p className="m-0 max-w-[30em] text-[16px] text-body2">{x.concept}</p>
              <span className="mt-2 font-medium">探索系列 →</span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
