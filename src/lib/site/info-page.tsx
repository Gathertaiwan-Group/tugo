import "server-only";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getInfoSections, type InfoPage as Page } from "./catalog";

const ORDER: Page[] = ["shipping", "returns", "privacy", "terms"];
export const INFO_TITLES: Record<Page, string> = { shipping: "配送說明", returns: "退換貨政策", privacy: "隱私權政策", terms: "服務條款" };

/** /shipping /returns /privacy /terms 共用版型（README §5.7）。 */
export async function InfoPage({ page }: { page: Page }) {
  const all = await getInfoSections();
  const sections = all.filter((s) => s.page === page);
  if (!sections.length) notFound();
  const title = sections[0].page_title || INFO_TITLES[page];
  return (
    <section className="container-tugo-1100 grid grid-cols-1 items-start gap-6 py-[clamp(24px,6vw,96px)] nav:grid-cols-[220px_minmax(0,1fr)] nav:gap-10">
      <nav
        aria-label="客服與條款"
        className="-mx-[clamp(16px,4vw,48px)] flex gap-1 overflow-x-auto px-[clamp(16px,4vw,48px)] [scrollbar-width:none] nav:mx-0 nav:max-w-[240px] nav:flex-col nav:overflow-visible nav:px-0 [&::-webkit-scrollbar]:hidden"
      >
        {ORDER.map((k) => (
          <Link
            key={k}
            href={`/${k}`}
            aria-current={k === page ? "page" : undefined}
            className={`inline-flex min-h-11 shrink-0 items-center whitespace-nowrap rounded-ctl px-3.5 text-[14px] font-medium ${k === page ? "bg-forest text-paper hover:text-paper" : "text-ink"}`}
          >
            {INFO_TITLES[k]}
          </Link>
        ))}
        <Link href="/faq" className="inline-flex min-h-11 shrink-0 items-center whitespace-nowrap px-3.5 text-[14px]">
          常見問題
        </Link>
      </nav>
      <article className="flex min-w-0 flex-col gap-7">
        <h1 className="m-0 font-serif text-[clamp(32px,4vw,52px)] font-bold leading-[1.2]">{title}</h1>
        <p role="note" className="m-0 rounded-ctl bg-tag px-3.5 py-2.5 text-[13px]">
          本頁為示意文案，正式上線前需經法務確認。
        </p>
        {sections.map((s) => (
          <div key={s.heading} className="flex flex-col gap-2 border-t border-line pt-5">
            <h2 className="m-0 text-[18px]">{s.heading}</h2>
            <p className="m-0 text-[15px] leading-[1.9] text-body2">{s.body}</p>
          </div>
        ))}
      </article>
    </section>
  );
}
