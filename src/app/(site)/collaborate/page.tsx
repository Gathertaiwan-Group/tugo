import type { Metadata } from "next";
import { ApplicationForm } from "@/components/site/ApplicationForm";
import { ImageOrPlaceholder } from "@/components/site/ImageOrPlaceholder";
import { getSiteImages } from "@/lib/site/catalog";

export const metadata: Metadata = {
  title: "藝術家合作",
  description: "你的作品，值得有更多可能。圖個有意思的藝術家合作方案與申請表。",
  alternates: { canonical: "/collaborate" },
};

const h2 = "m-0 mb-7 font-serif text-[clamp(26px,3vw,40px)] font-bold leading-[1.3]";
const VALUES = [
  ["作品保有你的名字", "每件商品清楚署名，並附作品故事與藝術家介紹頁。"],
  ["透明的授權條款", "授權範圍、期間、分潤方式皆以書面合約明訂，簽約前可充分討論。"],
  ["從打樣到出貨", "選材、打樣、生產、倉儲與客服由團隊負責，你參與校色與確認。"],
  ["策展式的露出", "透過聯名企劃、電子報與社群介紹作品；實際曝光方式依企劃內容而定。"],
];
const PLANS = [
  {
    code: "PLAN A ・ EMERGING",
    name: "新銳共創",
    desc: "適合剛開始經營作品、尚無商品化經驗的創作者。由團隊協助挑選適合的作品與品項，小量試製、線上首發。",
    items: ["1–3 款入門品項（貼紙、明信片、托特包等）", "商品化與定價建議", "藝術家個人頁面"],
  },
  {
    code: "PLAN B ・ SIGNATURE",
    name: "藝術家聯名",
    desc: "適合已有穩定風格與受眾的創作者。共同開發一個完整系列，從服飾到生活小物，並有專屬的系列頁面。",
    items: ["4–8 款系列商品共同開發", "藝術家參與打樣與校色", "系列故事頁與首頁專題"],
    hot: true,
  },
  {
    code: "PLAN C ・ LIMITED",
    name: "限定企劃",
    desc: "以主題或展覽為核心的限量計畫，例如簽名編號版畫、展覽周邊、快閃活動商品。",
    items: ["限量版畫／簽名編號品", "展覽或活動周邊", "期間限定販售"],
  },
];
const STEPS = [
  ["提交申請", "填寫下方表單並附作品集連結。"],
  ["作品初審", "團隊評估作品與商品化方向（審核時程將另行通知）。"],
  ["線上會談", "討論合作方案、品項與時程。"],
  ["簽訂合約", "明訂授權範圍、期間與分潤方式。"],
  ["打樣與上架", "確認樣品後生產、拍攝並上架。"],
];
const FAQ = [
  ["需要已經有商品經驗嗎？", "不需要。「新銳共創」方案就是為第一次商品化的創作者設計。"],
  ["作品著作權歸誰？", "著作權仍屬於創作者；我們依合約取得特定商品、期間與通路的使用授權。"],
  ["分潤怎麼計算？保證收入嗎？", "分潤比例與結算方式依合作合約約定。我們不承諾固定收入或保證銷量、曝光。"],
  ["一定要獨家嗎？", "不一定，是否獨家依方案與合約內容而定，簽約前會清楚說明。"],
];

export const revalidate = 60;

export default async function CollaboratePage() {
  const hero = (await getSiteImages())["collaborate.hero"];
  return (
    <>
      <section className="bg-ink text-paper">
        <div className="container-tugo grid grid-cols-[repeat(auto-fit,minmax(min(100%,420px),1fr))] items-end gap-x-[72px] gap-y-8 py-[clamp(40px,7vw,112px)]">
          <div className="flex flex-col gap-4">
            <span className="font-mono text-[11px] font-medium leading-[1.4] tracking-[.16em] text-tangerine">FOR ARTISTS — 藝術家合作</span>
            <h1 className="m-0 font-serif text-[clamp(38px,5.4vw,76px)] font-bold leading-[1.15] [text-wrap:balance]">
              你的作品，
              <br />
              值得有更多可能。
            </h1>
          </div>
          <div className="flex flex-col gap-5">
            <p className="m-0 text-[16px] leading-[1.85] text-line">
              我們負責選品建議、打樣、生產、上架、出貨與客服；你保有作品著作權，持續創作。分潤比例、授權期間與是否獨家，皆依雙方合作合約約定。
            </p>
            <a
              href="#apply"
              className="inline-flex h-[52px] items-center justify-center self-stretch rounded-ctl bg-tangerine px-7 font-bold text-ink hover:bg-tangerine-light hover:text-ink min-[440px]:self-start"
            >
              填寫合作申請 ↓
            </a>
          </div>
        </div>
        {hero ? (
          <div className="container-tugo pb-[clamp(40px,6vw,88px)]">
            <ImageOrPlaceholder src={hero.url} hue={0} alt={hero.alt || "藝術家合作"} sizes="100vw" className="aspect-[16/9] rounded-panel" />
          </div>
        ) : null}
      </section>
      <section className="container-tugo pt-[clamp(48px,6vw,96px)]">
        <h2 className={h2}>我們能一起做的事</h2>
        <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,240px),1fr))] border-t border-ink">
          {VALUES.map(([t, d], i) => (
            <div key={t} className="flex flex-col gap-2 py-6 pr-6">
              <span className="font-mono text-[12px] font-medium leading-none text-forest">VALUE 0{i + 1}</span>
              <h3 className="m-0 text-[18px]">{t}</h3>
              <p className="m-0 text-[14px] text-body2">{d}</p>
            </div>
          ))}
        </div>
      </section>
      <section className="container-tugo pt-[clamp(48px,6vw,96px)]">
        <h2 className={h2}>三種合作方案</h2>
        <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,300px),1fr))] gap-5">
          {PLANS.map((p) => (
            <article
              key={p.code}
              className={`relative flex flex-col gap-3.5 rounded-panel bg-card p-[clamp(22px,3vw,28px)] ${p.hot ? "border-[1.5px] border-forest" : "border border-line"}`}
            >
              {p.hot ? <span className="absolute -top-3 right-5 rounded-badge bg-forest px-2.5 py-1 text-[12px] text-paper">最常見</span> : null}
              <span className="font-mono text-[11px] font-medium leading-none tracking-[.12em] text-muted">{p.code}</span>
              <h3 className="m-0 font-serif text-[26px] font-bold leading-[1.3]">{p.name}</h3>
              <p className="m-0 flex-1 text-[14px] text-body2">{p.desc}</p>
              <ul className="m-0 flex flex-col gap-1 pl-[18px] text-[13px] text-body2">
                {p.items.map((it) => (
                  <li key={it}>{it}</li>
                ))}
              </ul>
              <span className="border-t border-line pt-3 text-[12px] text-muted">分潤比例、授權期間、是否獨家：依合作合約約定</span>
            </article>
          ))}
        </div>
      </section>
      <section className="container-tugo pt-[clamp(48px,6vw,96px)]">
        <h2 className={h2}>合作流程</h2>
        <ol className="m-0 grid list-none grid-cols-[repeat(auto-fit,minmax(min(100%,200px),1fr))] border-t border-ink p-0">
          {STEPS.map(([t, d], i) => (
            <li key={t} className="flex gap-4 border-b border-line py-5 pr-5 min-[440px]:flex-col min-[440px]:gap-1.5 min-[440px]:border-b-0">
              <span className="w-8 shrink-0 font-serif text-[32px] font-bold leading-none text-forest">{i + 1}</span>
              <span className="flex flex-col gap-1.5">
                <strong>{t}</strong>
                <span className="text-[13px] text-body2">{d}</span>
              </span>
            </li>
          ))}
        </ol>
      </section>
      <section className="container-tugo grid grid-cols-[repeat(auto-fit,minmax(min(100%,420px),1fr))] items-start gap-[clamp(32px,5vw,72px)] py-[clamp(48px,6vw,96px)]">
        <div className="flex flex-col gap-2">
          <h2 className="m-0 mb-4 font-serif text-[clamp(26px,3vw,40px)] font-bold leading-[1.3]">常見問題</h2>
          {FAQ.map(([q, a], i) => (
            <div key={q} className={`flex flex-col gap-1.5 border-t py-4 ${i === 0 ? "border-ink" : "border-line"}`}>
              <strong>{q}</strong>
              <span className="text-[14px] text-body2">{a}</span>
            </div>
          ))}
        </div>
        <div id="apply" className="scroll-mt-24 rounded-panel border border-line-card bg-card p-[clamp(20px,4vw,40px)]">
          <ApplicationForm />
        </div>
      </section>
    </>
  );
}
