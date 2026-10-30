import Link from "next/link";
import { HERO_LAYOUT } from "@/lib/env";
import { getCatalog, getSiteImages, toLite } from "@/lib/site/catalog";
import { ProductCard } from "@/components/site/ProductCard";
import { ImageOrPlaceholder } from "@/components/site/ImageOrPlaceholder";
import { FeaturedArtistCard, artistNames } from "@/components/site/cards";
import { Eyebrow, SectionHead, btnOutline, btnPrimary } from "@/components/site/ui";

export const revalidate = 60;

export default async function Home() {
  const [catalog, img] = await Promise.all([getCatalog(), getSiteImages()]);
  const lite = toLite(catalog, img);
  const newDrops = lite.products
    .filter((p) => p.is_new)
    .sort((a, b) => {
      const ra = catalog.products.find((x) => x.id === a.id)!.released_at;
      const rb = catalog.products.find((x) => x.id === b.id)!.released_at;
      return rb.localeCompare(ra);
    })
    .slice(0, 8);
  const feat = catalog.collections[0];
  const featNames = feat ? artistNames(feat, catalog) : "";

  return (
    <>
      {HERO_LAYOUT === "split" ? (
        <section
          aria-label="主視覺"
          className="container-tugo grid grid-cols-[repeat(auto-fit,minmax(min(100%,440px),1fr))] items-center gap-[clamp(32px,5vw,72px)] pb-[clamp(48px,6vw,88px)] pt-[clamp(28px,5vw,64px)]"
        >
          <div className="flex animate-tugo-in-slow flex-col gap-6 nav:gap-7">
            <Eyebrow>ARTIST × GOODS — 2026 AW</Eyebrow>
            <h1 className="m-0 text-hero-split">
              好作品，
              <br />
              不只值得
              <br />被
              <span className="relative isolate inline-block">
                看見
                <span aria-hidden="true" className="absolute -left-[4%] -right-[4%] bottom-[.08em] -z-10 h-[.18em] rounded-[2px] bg-tangerine" />
              </span>
              。
            </h1>
            <p className="m-0 max-w-[30em] text-[clamp(16px,1.5vw,19px)] text-body2">
              讓創意成為作品，讓作品走進生活。
              <br />
              我們和新銳藝術家一起，把好作品做成可以收藏、穿戴與使用的日常。
            </p>
            <div className="flex flex-wrap gap-3">
              <Link href="/collections" className={`${btnPrimary} flex-1 min-[440px]:flex-none`}>
                探索聯名商品 →
              </Link>
              <Link href="/artists" className={`${btnOutline} flex-1 min-[440px]:flex-none`}>
                認識藝術家
              </Link>
            </div>
          </div>
          <div className="relative">
            <ImageOrPlaceholder
              src={img["home.hero"]?.url}
              hue={285}
              L={0.82}
              alt={img["home.hero"]?.alt || "主視覺：藝術家聯名商品情境攝影（示意佔位）"}
              sizes="(min-width: 960px) 50vw, 100vw"
              label="主視覺｜聯名商品情境攝影（待提供）"
              labelPos="tl"
              priority
              className="aspect-[4/5] max-h-[78svh] w-full rounded-panel"
            />
            {feat ? (
              <Link
                href={`/collections/${feat.id}`}
                className="absolute bottom-6 left-[clamp(-24px,-2vw,0px)] flex max-w-[min(280px,calc(100%-24px))] flex-col gap-0.5 rounded-card border border-line bg-paper px-[18px] py-3.5 shadow-float hover:border-forest"
              >
                <span className="font-mono text-[10px] font-medium leading-[1.4] tracking-[.12em] text-muted">本季聯名 ・ {feat.season}</span>
                <span className="font-serif text-[17px] font-bold leading-[1.4]">{feat.name}</span>
                <span className="text-[13px] text-body2">{featNames}</span>
              </Link>
            ) : null}
          </div>
        </section>
      ) : (
        <section aria-label="主視覺" className="px-[clamp(16px,2vw,24px)] pt-[clamp(12px,2vw,24px)]">
          <ImageOrPlaceholder
            src={img["home.hero_full"]?.url}
            hue={285}
            L={0.82}
            alt={img["home.hero_full"]?.alt || "主視覺：藝術家聯名商品情境攝影（示意佔位）"}
            label="主視覺｜聯名商品全幅攝影（待提供）"
            labelPos="tr"
            decorative
            priority
            className="flex min-h-[min(82svh,760px)] items-end rounded-panel p-[clamp(16px,4vw,48px)]"
          >
            <div className="relative flex max-w-[640px] animate-tugo-in-slow flex-col gap-5 rounded-card bg-paper p-[clamp(24px,4vw,48px)]">
              <Eyebrow>ARTIST × GOODS — 2026 AW</Eyebrow>
              <h1 className="m-0 text-hero-full [text-wrap:balance]">好作品，不只值得被看見。</h1>
              <p className="m-0 text-[17px] text-body2">讓創意成為作品，讓作品走進生活。</p>
              <div className="flex flex-wrap gap-3">
                <Link href="/collections" className={btnPrimary}>
                  探索聯名商品 →
                </Link>
                <Link href="/artists" className={btnOutline}>
                  認識藝術家
                </Link>
              </div>
            </div>
          </ImageOrPlaceholder>
        </section>
      )}

      <section aria-label="商品分類" className="mt-[clamp(24px,4vw,48px)] border-y border-line">
        <div className="container-tugo grid grid-cols-2 min-[540px]:grid-cols-[repeat(auto-fit,minmax(150px,1fr))]">
          {lite.categories.map((c, i) => (
            <Link
              key={c.id}
              href={`/shop/${c.id}`}
              className={`flex items-center justify-between gap-2 border-line px-3 py-5 font-medium transition-colors duration-200 hover:bg-hover-bg hover:text-forest max-[539px]:border-b min-[540px]:border-r ${
                i % 2 === 0 ? "max-[539px]:border-r" : ""
              } ${i >= lite.categories.length - 2 ? "max-[539px]:border-b-0" : ""}`}
            >
              <span>{c.name}</span>
              <span className="font-mono text-[11px] font-normal leading-none text-muted">{c.count}</span>
            </Link>
          ))}
        </div>
      </section>

      <section aria-labelledby="new-drops" className="container-tugo pt-[clamp(56px,8vw,112px)]">
        <SectionHead eyebrow="01 — NEW DROPS" title="新品上市" id="new-drops" link={{ href: "/new", text: "看全部新品 →" }} />
        <div className="grid grid-cols-[repeat(auto-fill,minmax(min(46%,240px),1fr))] gap-x-[clamp(12px,1.6vw,24px)] gap-y-[clamp(16px,2vw,28px)]">
          {newDrops.map((p) => (
            <ProductCard key={p.id} item={p} />
          ))}
        </div>
      </section>

      <section aria-labelledby="feat-artists" className="container-tugo pt-[clamp(56px,8vw,112px)]">
        <SectionHead eyebrow="02 — ARTISTS" title="精選藝術家" id="feat-artists" link={{ href: "/artists", text: "認識所有藝術家 →" }} />
        <div className="grid grid-cols-[repeat(auto-fill,minmax(min(100%,280px),1fr))] gap-6">
          {catalog.artists.slice(0, 4).map((a) => (
            <FeaturedArtistCard key={a.id} a={a} />
          ))}
        </div>
      </section>

      {feat ? (
        <section aria-labelledby="feat-coll" className="mt-[clamp(56px,8vw,112px)] bg-forest text-paper">
          <div className="container-tugo grid grid-cols-[repeat(auto-fit,minmax(min(100%,420px),1fr))] items-center gap-[clamp(32px,5vw,72px)] py-[clamp(40px,6vw,88px)]">
            <ImageOrPlaceholder
              src={feat.cover_url}
              hue={feat.hue}
              L={0.8}
              alt="聯名系列主視覺（示意佔位）"
              label={`系列形象照｜${feat.name}`}
              className="aspect-[3/2] rounded-card"
            />
            <div className="flex flex-col gap-5">
              <span className="font-mono text-[11px] font-medium leading-[1.4] tracking-[.16em] text-on-forest-muted">03 — COLLABORATION ・ {feat.season}</span>
              <h2 id="feat-coll" className="m-0 font-serif text-[clamp(34px,4.4vw,60px)] font-bold leading-[1.15]">
                {feat.name}
                <span className="mt-2 block font-mono text-[14px] font-medium leading-[1.6] tracking-[.1em] text-on-forest-muted">
                  {feat.name_en} — {featNames}
                </span>
              </h2>
              <p className="m-0 max-w-[32em] text-[17px] leading-[1.8]">{feat.concept}</p>
              <p className="m-0 max-w-[34em] text-[15px] leading-[1.8] text-on-forest-body">{feat.description}</p>
              <Link
                href={`/collections/${feat.id}`}
                className="inline-flex h-[52px] items-center self-start rounded-ctl bg-paper px-7 font-medium text-forest hover:bg-white hover:text-forest"
              >
                探索系列 →
              </Link>
            </div>
          </div>
        </section>
      ) : null}

      <section
        aria-labelledby="story"
        className="container-tugo grid grid-cols-[repeat(auto-fit,minmax(min(100%,380px),1fr))] items-start gap-[clamp(32px,5vw,80px)] py-[clamp(56px,8vw,112px)]"
      >
        <div className="flex flex-col gap-3">
          <Eyebrow>04 — OUR STORY</Eyebrow>
          <h2 id="story" className="m-0 font-serif text-[clamp(30px,3.6vw,48px)] font-bold leading-[1.3] [text-wrap:balance]">
            為什麼創作，值得走進日常？
          </h2>
        </div>
        <div className="flex flex-col gap-5 text-[16px] leading-[1.9] text-body2">
          <p className="m-0">很多好作品，被按了讚，然後就被滑走了。我們覺得可惜。</p>
          <p className="m-0">
            「圖個有意思」想做的事很簡單：替作品找到第二個家——一件每天會穿的 T 恤、一個陪你通勤的包、一張掛在床頭的版畫。作品被使用的那一刻，創作者也被記住了。
          </p>
          <p className="m-0">每件商品都署名、說明作品故事，並與藝術家依合約分潤。</p>
          <Link href="/about" className="inline-flex min-h-11 items-end self-start border-b border-ink pb-0.5 font-medium text-ink nav:min-h-0">
            關於我們 →
          </Link>
        </div>
      </section>

      <section aria-labelledby="recruit" className="container-tugo">
        <div className="relative grid grid-cols-[repeat(auto-fit,minmax(min(100%,360px),1fr))] items-end gap-8 overflow-hidden rounded-panel bg-ink p-[clamp(28px,6vw,80px)] text-paper">
          <div className="flex flex-col gap-4">
            <span className="font-mono text-[11px] font-medium leading-[1.4] tracking-[.16em] text-tangerine">FOR ARTISTS — 藝術家招募</span>
            <h2 id="recruit" className="m-0 font-serif text-[clamp(32px,4.2vw,56px)] font-bold leading-[1.2] [text-wrap:balance]">
              你的作品，值得有更多可能。
            </h2>
          </div>
          <div className="flex flex-col gap-5">
            <p className="m-0 text-[16px] leading-[1.8] text-line">
              從選品、打樣、生產到上架與出貨，我們負責把作品做成好商品；你只要繼續創作。分潤與授權條件依合作合約約定。
            </p>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/collaborate"
                className="inline-flex h-[52px] flex-1 items-center justify-center rounded-ctl bg-tangerine px-7 font-bold text-ink hover:bg-tangerine-light hover:text-ink min-[440px]:flex-none"
              >
                了解合作方式 →
              </Link>
              <Link
                href="/collaborate#apply"
                className="inline-flex h-[52px] flex-1 items-center justify-center rounded-ctl border border-muted px-6 text-paper hover:border-paper hover:text-paper min-[440px]:flex-none"
              >
                直接申請
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
