import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { clampPage, isYmd, pick, sanitizeSearch } from "@/lib/admin/query";

// ───────────────────────── 欄位驗證（白名單 + 型別） ─────────────────────────

export const SLUG_RE = /^[a-z0-9-]{1,80}$/;

export type FieldSpec =
  | { type: "text"; max: number; required?: boolean; nullable?: boolean }
  | { type: "int"; min: number; max: number; required?: boolean }
  | { type: "bool" }
  | { type: "date"; nullable?: boolean; required?: boolean }
  | { type: "enum"; values: readonly string[]; required?: boolean }
  | { type: "textarr"; maxItems: number; maxLen: number }
  | { type: "slug"; required?: boolean }
  | { type: "ref"; nullable?: boolean; required?: boolean };

export type Validated = { ok: true; values: Record<string, unknown> } | { ok: false; message: string };

/**
 * 依 specs 驗證 body：未知欄位拒絕；create 模式檢查 required；空字串 → null（nullable 欄位）。
 * labels 用來產生中文錯誤訊息。
 */
export function validateFields(
  body: Record<string, unknown>,
  specs: Record<string, FieldSpec>,
  labels: Record<string, string>,
  mode: "create" | "update"
): Validated {
  for (const k of Object.keys(body)) if (!(k in specs)) return { ok: false, message: `不允許的欄位：${k}` };
  const out: Record<string, unknown> = {};
  for (const [key, spec] of Object.entries(specs)) {
    const name = labels[key] ?? key;
    const has = Object.prototype.hasOwnProperty.call(body, key);
    const required = "required" in spec && spec.required;
    if (!has) {
      if (mode === "create" && required) return { ok: false, message: `請填寫${name}` };
      continue;
    }
    const v = body[key];
    switch (spec.type) {
      case "text": {
        if (v === null || v === undefined || (typeof v === "string" && v.trim() === "")) {
          if (required) return { ok: false, message: `請填寫${name}` };
          out[key] = spec.nullable === false ? "" : null;
          break;
        }
        if (typeof v !== "string") return { ok: false, message: `${name}格式不正確` };
        const s = v.trim();
        if (s.length > spec.max) return { ok: false, message: `${name}最多 ${spec.max} 字` };
        out[key] = s;
        break;
      }
      case "int": {
        const n = typeof v === "string" && v.trim() !== "" ? Number(v) : v;
        if (typeof n !== "number" || !Number.isInteger(n)) return { ok: false, message: `${name}必須是整數` };
        if (n < spec.min || n > spec.max) return { ok: false, message: `${name}需介於 ${spec.min}–${spec.max}` };
        out[key] = n;
        break;
      }
      case "bool":
        if (typeof v !== "boolean") return { ok: false, message: `${name}格式不正確` };
        out[key] = v;
        break;
      case "date":
        if (v === null || v === "") {
          if (required || spec.nullable === false) return { ok: false, message: `請填寫${name}` };
          out[key] = null;
          break;
        }
        if (typeof v !== "string" || !isYmd(v)) return { ok: false, message: `${name}需為 YYYY-MM-DD` };
        out[key] = v;
        break;
      case "enum":
        if (typeof v !== "string" || !spec.values.includes(v)) return { ok: false, message: `${name}不在允許值內` };
        out[key] = v;
        break;
      case "textarr": {
        if (!Array.isArray(v)) return { ok: false, message: `${name}格式不正確` };
        const seen = new Set<string>();
        for (const item of v) {
          if (typeof item !== "string") return { ok: false, message: `${name}格式不正確` };
          const s = item.trim();
          if (!s) continue;
          if (s.length > spec.maxLen) return { ok: false, message: `${name}每項最多 ${spec.maxLen} 字` };
          seen.add(s);
        }
        if (seen.size > spec.maxItems) return { ok: false, message: `${name}最多 ${spec.maxItems} 項` };
        out[key] = [...seen];
        break;
      }
      case "slug":
        if (typeof v !== "string" || !SLUG_RE.test(v)) return { ok: false, message: `${name}只能用小寫英數與連字號（1–80 字）` };
        out[key] = v;
        break;
      case "ref":
        if (v === null || v === "") {
          if (required || spec.nullable === false) return { ok: false, message: `請選擇${name}` };
          out[key] = null;
          break;
        }
        if (typeof v !== "string" || !SLUG_RE.test(v)) return { ok: false, message: `${name}格式不正確` };
        out[key] = v;
        break;
    }
  }
  return { ok: true, values: out };
}

/** 把 PostgREST 錯誤轉成友善訊息 */
export function dbErrorMessage(err: { code?: string; message?: string } | null | undefined): { status: number; error: string; message: string } {
  if (err?.code === "23505") return { status: 409, error: "conflict", message: "代碼（id / slug）已存在，請換一個" };
  if (err?.code === "23503") return { status: 409, error: "conflict", message: "關聯資料不存在，或仍被其他資料引用" };
  if (err?.code === "23514") return { status: 400, error: "bad_payload", message: "資料不符合限制條件" };
  return { status: 500, error: "db_error", message: "資料庫錯誤，請重試" };
}

// ───────────────────────── 商品 ─────────────────────────

export const PRODUCT_STATUSES = ["instock", "limited", "preorder", "soldout"] as const;

export const PRODUCT_SPECS: Record<string, FieldSpec> = {
  name: { type: "text", max: 120, required: true },
  slug: { type: "slug", required: true },
  artist_id: { type: "ref", required: true, nullable: false },
  category_id: { type: "ref", required: true, nullable: false },
  collection_id: { type: "ref", nullable: true },
  price: { type: "int", min: 0, max: 10_000_000, required: true },
  stock: { type: "int", min: 0, max: 1_000_000 },
  status: { type: "enum", values: PRODUCT_STATUSES },
  ship_date: { type: "date", nullable: true },
  is_new: { type: "bool" },
  is_published: { type: "bool" },
  is_demo: { type: "bool" },
  colors: { type: "textarr", maxItems: 20, maxLen: 40 },
  sizes: { type: "textarr", maxItems: 20, maxLen: 40 },
  material: { type: "text", max: 500 },
  care: { type: "text", max: 1000 },
  dimensions: { type: "text", max: 500 },
  story: { type: "text", max: 4000 },
  released_at: { type: "date", nullable: false },
  popularity: { type: "int", min: 0, max: 1_000_000 },
  hue: { type: "int", min: 0, max: 360 },
};
export const PRODUCT_LABELS: Record<string, string> = {
  name: "商品名稱",
  slug: "網址代稱",
  artist_id: "藝術家",
  category_id: "分類",
  collection_id: "聯名系列",
  price: "價格",
  stock: "庫存",
  status: "供貨狀態",
  ship_date: "預計出貨日",
  is_new: "新品",
  is_published: "上架",
  is_demo: "示意資料",
  colors: "顏色",
  sizes: "尺寸",
  material: "材質",
  care: "保養方式",
  dimensions: "尺寸規格",
  story: "商品故事",
  released_at: "上架日",
  popularity: "熱門度",
  hue: "佔位色相",
};

export const PRODUCT_SORTS = {
  new: { col: "created_at", asc: false, label: "最新建立" },
  released: { col: "released_at", asc: false, label: "上架日新→舊" },
  name: { col: "name", asc: true, label: "名稱" },
  price_asc: { col: "price", asc: true, label: "價格低→高" },
  price_desc: { col: "price", asc: false, label: "價格高→低" },
  stock_asc: { col: "stock", asc: true, label: "庫存少→多" },
  popular: { col: "popularity", asc: false, label: "熱門度" },
} as const;
export type ProductSortKey = keyof typeof PRODUCT_SORTS;

export const PRODUCTS_PER_PAGE = 40;

export type ProductListRow = {
  id: string;
  slug: string;
  name: string;
  price: number;
  stock: number;
  status: string;
  is_new: boolean;
  is_published: boolean;
  is_demo: boolean;
  artist_id: string;
  category_id: string;
  artists: { name: string } | null;
  categories: { name: string } | null;
  product_images: { url: string; sort: number }[];
};

export async function listProducts(params: {
  q?: string;
  category?: string;
  artist?: string;
  status?: string;
  published?: string;
  sort?: string;
  page: number;
}) {
  const sb = createAdminClient();
  const q = sanitizeSearch(params.q);
  const sortKey = pick(params.sort, Object.keys(PRODUCT_SORTS) as ProductSortKey[], "new");
  const s = PRODUCT_SORTS[sortKey];

  const build = (from: number, to: number) => {
    let query = sb
      .from("products")
      .select(
        "id,slug,name,price,stock,status,is_new,is_published,is_demo,artist_id,category_id,artists(name),categories(name),product_images(url,sort)",
        { count: "exact" }
      )
      .order(s.col, { ascending: s.asc })
      .order("id", { ascending: true })
      .order("sort", { referencedTable: "product_images", ascending: true })
      .limit(1, { referencedTable: "product_images" })
      .range(from, to);
    if (q) query = query.or(`name.ilike.%${q}%,slug.ilike.%${q}%,id.ilike.%${q}%`);
    if (params.category && SLUG_OK(params.category)) query = query.eq("category_id", params.category);
    if (params.artist && SLUG_OK(params.artist)) query = query.eq("artist_id", params.artist);
    if (params.status && (PRODUCT_STATUSES as readonly string[]).includes(params.status)) query = query.eq("status", params.status as never);
    if (params.status === "lowstock") query = query.lte("stock", 3).neq("status", "soldout");
    if (params.published === "1") query = query.eq("is_published", true);
    if (params.published === "0") query = query.eq("is_published", false);
    return query;
  };

  const per = PRODUCTS_PER_PAGE;
  let page = params.page;
  let res = await build((page - 1) * per, page * per - 1);
  const total = res.count ?? 0;
  const clamped = clampPage(page, total, per);
  if (clamped.page !== page) {
    page = clamped.page;
    res = await build((page - 1) * per, page * per - 1);
  }
  return {
    rows: (res.data ?? []) as unknown as ProductListRow[],
    total: res.count ?? total,
    page,
    pageCount: clamped.pageCount,
    sortKey,
    error: res.error?.message ?? null,
  };
}

const SLUG_OK = (s: string) => SLUG_RE.test(s);

export type ProductDetail = {
  id: string;
  slug: string;
  name: string;
  artist_id: string;
  category_id: string;
  collection_id: string | null;
  price: number;
  status: string;
  ship_date: string | null;
  is_new: boolean;
  is_published: boolean;
  is_demo: boolean;
  popularity: number;
  released_at: string;
  colors: string[];
  sizes: string[];
  stock: number;
  material: string | null;
  care: string | null;
  dimensions: string | null;
  story: string | null;
  hue: number;
  created_at: string;
  updated_at: string | null;
};
export type ProductImage = { id: number; url: string; label: string | null; sort: number };

export async function getProduct(id: string): Promise<{ product: ProductDetail; images: ProductImage[]; orderItemCount: number } | null> {
  if (!SLUG_OK(id)) return null;
  const sb = createAdminClient();
  const [p, imgs, oi] = await Promise.all([
    sb.from("products").select("*").eq("id", id).maybeSingle(),
    sb.from("product_images").select("id,url,label,sort").eq("product_id", id).order("sort").order("id"),
    sb.from("order_items").select("id", { count: "exact", head: true }).eq("product_id", id),
  ]);
  if (!p.data) return null;
  return { product: p.data as ProductDetail, images: (imgs.data ?? []) as ProductImage[], orderItemCount: oi.count ?? 0 };
}

export type Lookups = {
  artists: { id: string; name: string }[];
  categories: { id: string; name: string }[];
  collections: { id: string; name: string }[];
  swatches: { name: string; hex: string }[];
  sizes: string[];
};

export async function getLookups(): Promise<Lookups> {
  const sb = createAdminClient();
  const [a, c, col, sw, sz] = await Promise.all([
    sb.from("artists").select("id,name").order("sort").order("name"),
    sb.from("categories").select("id,name").order("sort"),
    sb.from("collections").select("id,name").order("sort"),
    sb.from("color_swatches").select("name,hex").order("name"),
    sb.from("size_chart").select("size,sort").order("sort"),
  ]);
  return {
    artists: (a.data ?? []) as Lookups["artists"],
    categories: (c.data ?? []) as Lookups["categories"],
    collections: (col.data ?? []) as Lookups["collections"],
    swatches: (sw.data ?? []) as Lookups["swatches"],
    sizes: ((sz.data ?? []) as { size: string }[]).map((r) => r.size),
  };
}

/** 新商品 id：p + base36 時間 + 3 碼亂數（不暴露在網址上，slug 才是公開網址）。 */
export function newProductId(): string {
  return `p${Date.now().toString(36)}${Math.random().toString(36).slice(2, 5)}`;
}

// ───────────────────────── 藝術家 / 系列 / 分類 ─────────────────────────

export const ARTIST_SPECS: Record<string, FieldSpec> = {
  id: { type: "slug", required: true },
  name: { type: "text", max: 80, required: true },
  name_en: { type: "text", max: 80 },
  discipline: { type: "text", max: 80 },
  tags: { type: "textarr", maxItems: 12, maxLen: 30 },
  tagline: { type: "text", max: 200 },
  bio: { type: "text", max: 4000 },
  philosophy: { type: "text", max: 1000 },
  instagram: { type: "text", max: 120 },
  city: { type: "text", max: 60 },
  hue: { type: "int", min: 0, max: 360 },
  sort: { type: "int", min: 0, max: 100000 },
  is_demo: { type: "bool" },
};
export const ARTIST_LABELS: Record<string, string> = {
  id: "代碼（網址）",
  name: "名稱",
  name_en: "英文名",
  discipline: "創作類型",
  tags: "標籤",
  tagline: "一句話介紹",
  bio: "簡介",
  philosophy: "創作理念",
  instagram: "Instagram",
  city: "城市",
  hue: "佔位色相",
  sort: "排序",
  is_demo: "示意資料",
};

export const COLLECTION_SPECS: Record<string, FieldSpec> = {
  id: { type: "slug", required: true },
  name: { type: "text", max: 80, required: true },
  name_en: { type: "text", max: 80 },
  season: { type: "text", max: 60 },
  concept: { type: "text", max: 300 },
  description: { type: "text", max: 4000 },
  hue: { type: "int", min: 0, max: 360 },
  sort: { type: "int", min: 0, max: 100000 },
  is_demo: { type: "bool" },
  artist_ids: { type: "textarr", maxItems: 20, maxLen: 80 },
};
export const COLLECTION_LABELS: Record<string, string> = {
  id: "代碼（網址）",
  name: "系列名稱",
  name_en: "英文名",
  season: "季度",
  concept: "概念",
  description: "介紹",
  hue: "佔位色相",
  sort: "排序",
  is_demo: "示意資料",
  artist_ids: "參與藝術家",
};

export const CATEGORY_SPECS: Record<string, FieldSpec> = {
  id: { type: "slug", required: true },
  name: { type: "text", max: 40, required: true },
  sort: { type: "int", min: 0, max: 100000 },
};
export const CATEGORY_LABELS: Record<string, string> = { id: "代碼", name: "名稱", sort: "排序" };

export type ArtistRow = {
  id: string;
  name: string;
  name_en: string | null;
  discipline: string | null;
  tags: string[];
  tagline: string | null;
  bio: string | null;
  philosophy: string | null;
  instagram: string | null;
  city: string | null;
  hue: number;
  portrait_url: string | null;
  cover_url: string | null;
  sort: number;
  is_demo: boolean;
  created_at: string;
};

export type CollectionRow = {
  id: string;
  name: string;
  name_en: string | null;
  season: string | null;
  concept: string | null;
  description: string | null;
  hue: number;
  cover_url: string | null;
  sort: number;
  is_demo: boolean;
};

/** 依 id 計數 products（藝術家 / 系列 / 分類的引用數；一次撈欄位在記憶體計數，商品量級小） */
export async function productCountsBy(col: "artist_id" | "collection_id" | "category_id"): Promise<Record<string, number>> {
  const { data } = await createAdminClient().from("products").select(col);
  const out: Record<string, number> = {};
  for (const r of (data ?? []) as Record<string, string | null>[]) {
    const k = r[col];
    if (k) out[k] = (out[k] ?? 0) + 1;
  }
  return out;
}

export function slugOk(s: unknown): s is string {
  return typeof s === "string" && SLUG_RE.test(s);
}
