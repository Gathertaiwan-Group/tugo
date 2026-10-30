// 商店篩選（URL searchParams：?q=&sort=&artist=a,b&avail=）。server / client 共用。
import type { LiteProduct } from "./types";

export type Sort = "new" | "pop" | "asc" | "desc";
export type Avail = "all" | "instock" | "preorder";
export type ShopFilter = { q: string; sort: Sort; artists: string[]; avail: Avail };
export type ShopProduct = LiteProduct & { popularity: number; released_at: string; haystack: string };

export const SORTS: [Sort, string][] = [
  ["new", "最新上架"],
  ["pop", "熱門程度"],
  ["asc", "價格：低到高"],
  ["desc", "價格：高到低"],
];
export const AVAILS: [Avail, string][] = [
  ["all", "全部"],
  ["instock", "現貨"],
  ["preorder", "預購"],
];

type SP = Record<string, string | string[] | undefined>;
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";

export function parseShopFilter(sp: SP): ShopFilter {
  const sort = one(sp.sort) as Sort;
  const avail = one(sp.avail) as Avail;
  return {
    q: one(sp.q).slice(0, 100),
    sort: SORTS.some(([k]) => k === sort) ? sort : "new",
    artists: one(sp.artist).split(",").map((s) => s.trim()).filter(Boolean).slice(0, 20),
    avail: AVAILS.some(([k]) => k === avail) ? avail : "all",
  };
}

export function filterToQuery(f: ShopFilter) {
  const p = new URLSearchParams();
  if (f.q.trim()) p.set("q", f.q);
  if (f.sort !== "new") p.set("sort", f.sort);
  if (f.artists.length) p.set("artist", f.artists.join(","));
  if (f.avail !== "all") p.set("avail", f.avail);
  const s = p.toString();
  return s ? `?${s}` : "";
}

export function applyShopFilter(list: ShopProduct[], f: ShopFilter) {
  const q = f.q.trim().toLowerCase();
  let out = list;
  if (q) out = out.filter((p) => p.haystack.includes(q));
  if (f.artists.length) out = out.filter((p) => f.artists.includes(p.artist_id));
  if (f.avail === "instock") out = out.filter((p) => p.status === "instock" || p.status === "limited");
  if (f.avail === "preorder") out = out.filter((p) => p.status === "preorder");
  const sorts: Record<Sort, (a: ShopProduct, b: ShopProduct) => number> = {
    new: (a, b) => b.released_at.localeCompare(a.released_at),
    pop: (a, b) => b.popularity - a.popularity,
    asc: (a, b) => a.price - b.price,
    desc: (a, b) => b.price - a.price,
  };
  return [...out].sort(sorts[f.sort]);
}

export function activeCount(f: ShopFilter) {
  return f.artists.length + (f.avail !== "all" ? 1 : 0) + (f.q.trim() ? 1 : 0);
}
