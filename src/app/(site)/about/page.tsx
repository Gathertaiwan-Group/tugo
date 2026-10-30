import type { Metadata } from "next";
import Link from "next/link";
import { ImageOrPlaceholder } from "@/components/site/ImageOrPlaceholder";
import { getSiteImages } from "@/lib/site/catalog";
import { Eyebrow, btnOutline, btnPrimary } from "@/components/site/ui";

export const metadata: Metadata = {
  title: "關於我們",
  description: "「圖個有意思」是一個替新銳藝術家，把作品變成日常用品的品牌。",
  alternates: { canonical: "/about" },
};

const VALUES = [
  ["01", "創作者優先", "清楚署名、透明的授權範圍與分潤方式，所有條件依合作合約約定，不模糊帶過。"],
  ["02", "把作品做成好東西", "材質、印刷與工法依作品特性挑選；藝術家參與校色與打樣確認。"],
  ["03", "有趣，是認真的", "我們喜歡讓人會心一笑的作品，也用同樣的心情對待每一次出貨與客服。"],
];

export const revalidate = 60;

export default async function AboutPage() {
  const img = (await getSiteImages())["about.main"];
  return (
    <>
      <section className="container-tugo-1200 pt-[clamp(32px,6vw,96px)]">
        <Eyebrow>ABOUT — 關於我們</Eyebrow>
        <h1 className="mb-0 mt-4 font-serif text-[clamp(40px,6vw,84px)] font-bold leading-[1.15] [text-wrap:balance]">
          好作品，
          <br />
          不只值得被看見。
        </h1>
      </section>
      <section className="container-tugo-1200 grid grid-cols-[repeat(auto-fit,minmax(min(100%,360px),1fr))] gap-[clamp(28px,5vw,72px)] py-[clamp(40px,5vw,72px)]">
        <ImageOrPlaceholder src={img?.url} sizes="(min-width: 960px) 50vw, 100vw" hue={45} L={0.86} alt={img?.alt || "工作室或打樣過程照片（示意）"} label="工作室／打樣過程照（待提供）" className="aspect-[4/5] rounded-panel" />
        <div className="flex flex-col justify-center gap-5 text-[16px] leading-[1.95] text-body2">
          <p className="m-0 font-serif text-[clamp(22px,2.4vw,28px)] font-semibold leading-[1.6] text-ink">「圖個有意思」是一個替新銳藝術家，把作品變成日常用品的品牌。</p>
          <p className="m-0">
            名字取自台語與華語裡都常聽到的一句話——做這件事，不為別的，就圖個有意思。但「有意思」不等於隨便：我們認真挑選作品、反覆打樣，並把每一位創作者的名字放在商品最前面。
          </p>
          <p className="m-0">我們相信，作品被穿上、被使用、被送給喜歡的人，就是它最好的展覽。</p>
        </div>
      </section>
      <section className="container-tugo-1200 pb-[clamp(56px,8vw,112px)]">
        <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,280px),1fr))] border-t border-ink">
          {VALUES.map(([n, t, d]) => (
            <div key={n} className="flex flex-col gap-2.5 py-7 pr-6">
              <span className="font-mono text-[12px] font-medium leading-none text-tangerine">{n}</span>
              <h2 className="m-0 font-serif text-[22px] font-bold leading-[1.4]">{t}</h2>
              <p className="m-0 text-[14px] text-body2">{d}</p>
            </div>
          ))}
        </div>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link href="/artists" className={`${btnPrimary} flex-1 min-[440px]:flex-none`}>
            認識藝術家
          </Link>
          <Link href="/collaborate" className={`${btnOutline} flex-1 min-[440px]:flex-none`}>
            成為合作藝術家
          </Link>
        </div>
      </section>
    </>
  );
}
