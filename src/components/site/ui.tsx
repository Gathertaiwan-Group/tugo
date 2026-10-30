import Link from "next/link";

/** 404 區塊（全站 / 商品 / 藝術家 / 系列共用版型）。 */
export function NotFoundBlock({
  code,
  title,
  desc,
  href,
  cta,
  titleClass = "text-[clamp(32px,4vw,48px)]",
}: {
  code: string;
  title: string;
  desc?: string;
  href: string;
  cta: string;
  titleClass?: string;
}) {
  return (
    <section className="mx-auto flex max-w-[720px] flex-col items-center gap-4 px-6 py-[clamp(64px,10vw,140px)] text-center">
      <span className="font-mono text-[12px] font-medium leading-none text-muted">{code}</span>
      <h1 className={`m-0 font-serif font-bold leading-[1.3] ${titleClass}`}>{title}</h1>
      {desc ? <p className="m-0 text-muted">{desc}</p> : null}
      <Link href={href} className="inline-flex h-12 items-center rounded-ctl bg-forest px-6 text-paper hover:bg-forest-dark hover:text-paper">
        {cta}
      </Link>
    </section>
  );
}

export function Eyebrow({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <span className={`font-mono text-[11px] font-medium leading-[1.4] tracking-[.16em] text-muted ${className}`}>{children}</span>;
}

export function Breadcrumb({ items, className = "" }: { items: { name: string; href?: string }[]; className?: string }) {
  return (
    <nav aria-label="麵包屑" className={`text-[12px] text-muted ${className}`}>
      <ol className="m-0 flex list-none flex-wrap items-center gap-x-1.5 p-0">
        {items.map((it, i) => (
          <li key={i} className="flex items-center gap-1.5">
            {i > 0 ? <span aria-hidden="true">/</span> : null}
            {it.href ? (
              <Link href={it.href} className="-mx-2.5 inline-flex min-h-11 min-w-11 items-center justify-center px-2.5 nav:mx-0 nav:min-h-0 nav:min-w-0 nav:px-0">
                {it.name}
              </Link>
            ) : (
              <span aria-current="page" className="text-ink">
                {it.name}
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}

/** 區塊標題列：eyebrow + H2 + 右側連結 */
export function SectionHead({ eyebrow, title, id, link }: { eyebrow: string; title: string; id: string; link?: { href: string; text: string } }) {
  return (
    <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
      <div className="flex flex-col gap-2">
        <Eyebrow>{eyebrow}</Eyebrow>
        <h2 id={id} className="m-0 text-h2">
          {title}
        </h2>
      </div>
      {link ? (
        <Link href={link.href} className="inline-flex min-h-11 items-end border-b border-ink pb-0.5 font-medium nav:min-h-0">
          {link.text}
        </Link>
      ) : null}
    </div>
  );
}

export const btnPrimary =
  "inline-flex h-[52px] items-center justify-center rounded-ctl bg-forest px-7 font-medium text-paper transition-[transform,background] duration-200 hover:-translate-y-0.5 hover:bg-forest-dark hover:text-paper";
export const btnOutline =
  "inline-flex h-[52px] items-center justify-center rounded-ctl border border-ink px-7 font-medium transition-colors duration-200 hover:bg-ink hover:text-paper";
export const btnSmallOutline =
  "inline-flex min-h-11 items-center self-start rounded-ctl border border-ink px-3.5 text-[13px] font-medium hover:bg-ink hover:text-paper nav:min-h-0 nav:py-2";
