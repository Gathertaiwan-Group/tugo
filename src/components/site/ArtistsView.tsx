"use client";
import Link from "next/link";
import { useMemo, useState } from "react";
import { SearchIcon } from "./icons";
import { bg } from "@/lib/site/format";
import { btnSmallOutline } from "./ui";

export type ArtistRow = {
  id: string;
  name: string;
  en: string;
  city: string;
  disc: string;
  line: string;
  tags: string[];
  hue: number;
  count: number;
  works: { hue: number }[];
};

export function ArtistsView({ artists }: { artists: ArtistRow[] }) {
  const [q, setQ] = useState("");
  const [tag, setTag] = useState("全部");
  const tags = useMemo(() => ["全部", ...new Set(artists.flatMap((a) => a.tags))], [artists]);
  const s = q.trim().toLowerCase();
  const list = artists.filter((a) => (tag === "全部" || a.tags.includes(tag)) && (!s || (a.name + a.en + a.disc + a.line).toLowerCase().includes(s)));

  return (
    <>
      <div className="mb-8 flex flex-wrap items-center gap-3 border-y border-line py-3">
        <label className="flex h-11 min-w-0 flex-[1_1_240px] items-center gap-2 rounded-ctl border border-line-field bg-field px-3.5">
          <SearchIcon size={16} color="#5E6158" />
          <input
            type="search"
            inputMode="search"
            enterKeyHint="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="搜尋藝術家姓名、創作類型"
            aria-label="搜尋藝術家"
            className="min-w-0 flex-1 border-0 bg-transparent text-[16px] outline-none nav:text-[14px]"
          />
        </label>
        <div className="-mx-[clamp(16px,4vw,48px)] flex w-[calc(100%+2*clamp(16px,4vw,48px))] gap-2 overflow-x-auto px-[clamp(16px,4vw,48px)] [scrollbar-width:none] nav:mx-0 nav:w-auto nav:flex-wrap nav:overflow-visible nav:px-0 [&::-webkit-scrollbar]:hidden">
          {tags.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTag(t)}
              aria-pressed={tag === t}
              className={`h-11 shrink-0 cursor-pointer whitespace-nowrap rounded-ctl border px-3.5 text-[13px] nav:h-9 ${tag === t ? "border-ink bg-ink text-paper" : "border-line-field bg-transparent text-ink"}`}
            >
              {t}
            </button>
          ))}
        </div>
        <span className="ml-auto font-mono text-[12px] leading-none text-muted" aria-live="polite">
          {list.length} 位藝術家
        </span>
      </div>
      {list.length ? (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(min(100%,340px),1fr))] gap-7">
          {list.map((a) => {
            const href = `/artists/${a.id}`;
            return (
              <article key={a.id} className="flex flex-col gap-4 border-t-2 border-ink pt-4">
                <div className="flex items-center gap-3.5">
                  <span role="img" aria-label={`${a.name} 肖像（授權後使用）`} className="h-14 w-14 shrink-0 rounded-full" style={{ background: bg(a.hue + 30, 90, 0.8) }} />
                  <div className="flex min-w-0 flex-col leading-[1.35]">
                    <Link href={href} className="inline-flex min-h-11 items-center self-start font-serif text-[22px] font-bold leading-[1.3] nav:min-h-0">
                      {a.name}
                    </Link>
                    <span className="font-mono text-[11px] leading-[1.3] text-muted">
                      {a.en} ・ {a.city}
                    </span>
                  </div>
                </div>
                <Link href={href} aria-label={`${a.name} 代表作品`} className="grid aspect-[3/2] grid-cols-[2fr_1fr] grid-rows-2 gap-1.5">
                  {a.works.slice(0, 3).map((w, i) => (
                    <span key={i} className={`min-h-0 rounded-ctl ${i === 0 ? "row-span-2" : ""}`} style={{ background: bg(w.hue, 45) }} />
                  ))}
                </Link>
                <div className="flex flex-wrap gap-1.5">
                  {a.tags.map((t) => (
                    <span key={t} className="rounded-badge bg-tag px-2.5 py-[3px] text-[12px]">
                      {t}
                    </span>
                  ))}
                  <span className="px-2.5 py-[3px] text-[12px] text-muted">{a.count} 件商品</span>
                </div>
                <p className="m-0 text-[14px] text-body2">{a.line}</p>
                <Link href={href} className={btnSmallOutline}>
                  查看作品 →
                </Link>
              </article>
            );
          })}
        </div>
      ) : (
        <div className="flex flex-col items-center gap-3 rounded-panel border border-dashed border-line-field px-6 py-16 text-center">
          <span className="font-serif text-[22px] font-bold leading-[1.3]">找不到符合的藝術家</span>
          <button
            type="button"
            onClick={() => {
              setQ("");
              setTag("全部");
            }}
            className="h-11 cursor-pointer rounded-ctl border-0 bg-forest px-5 text-paper"
          >
            清除搜尋
          </button>
        </div>
      )}
    </>
  );
}
