import type { Metadata } from "next";
import { getCatalog } from "@/lib/site/catalog";
import { ArtistsView } from "@/components/site/ArtistsView";
import { Eyebrow } from "@/components/site/ui";

export const revalidate = 60;
export const metadata: Metadata = {
  title: "認識藝術家",
  description: "作品背後，是一個人。認識圖個有意思合作的新銳藝術家。",
  alternates: { canonical: "/artists" },
};

export default async function ArtistsPage() {
  const c = await getCatalog();
  const rows = c.artists.map((a) => {
    const works = c.products.filter((p) => p.artist_id === a.id);
    return {
      id: a.id,
      name: a.name,
      en: a.name_en ?? "",
      city: a.city ?? "",
      disc: a.discipline ?? "",
      line: a.tagline ?? "",
      tags: a.tags,
      hue: a.hue,
      count: works.length,
      works: works.slice(0, 3).map((w) => ({ hue: w.hue })),
    };
  });
  return (
    <section className="container-tugo pb-[clamp(56px,8vw,112px)] pt-[clamp(28px,5vw,72px)]">
      <div className="mb-7 grid grid-cols-[repeat(auto-fit,minmax(min(100%,380px),1fr))] items-end gap-x-16 gap-y-4 nav:mb-9">
        <div className="flex flex-col gap-2">
          <Eyebrow>ARTISTS — 認識藝術家</Eyebrow>
          <h1 className="m-0 font-serif text-[clamp(36px,5vw,64px)] font-bold leading-[1.15]">
            作品背後，
            <br />
            是一個人。
          </h1>
        </div>
        <p className="m-0 max-w-[30em] text-[16px] text-body2">每一件商品都來自一位創作者的觀察與堅持。先認識他們，再決定要把哪一件帶回家。</p>
      </div>
      <ArtistsView artists={rows} />
    </section>
  );
}
