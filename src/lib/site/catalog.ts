import "server-only";
import { cache } from "react";
import { unstable_cache } from "next/cache";
import { createPublicClient } from "@/lib/supabase/server";
import type { Catalog, LiteCatalog, Product } from "./types";

/**
 * 公開目錄資料（DEMO 只有十幾筆，整包讀進來在記憶體篩選最單純）。
 * unstable_cache 60 秒 + tag `tugo-catalog`：後台可 revalidateTag('tugo-catalog') 立即生效。
 */
const loadCatalog = unstable_cache(
  async (): Promise<Catalog> => {
    const db = createPublicClient();
    const [cats, artists, colls, collArtists, products, images, swatches] = await Promise.all([
      db.from("categories").select("id,name,sort").order("sort"),
      db
        .from("artists")
        .select("id,name,name_en,discipline,tags,tagline,bio,philosophy,instagram,city,hue,portrait_url,cover_url,sort")
        .order("sort"),
      db.from("collections").select("id,name,name_en,season,concept,description,hue,cover_url,sort").order("sort"),
      db.from("collection_artists").select("collection_id,artist_id,sort").order("sort"),
      db
        .from("products")
        .select(
          "id,slug,name,artist_id,category_id,collection_id,price,status,ship_date,is_new,popularity,released_at,colors,sizes,stock,material,care,dimensions,story,hue",
        )
        .eq("is_published", true) // 後台「下架」= is_published=false（0004_admin）
        .order("released_at", { ascending: false }),
      db.from("product_images").select("product_id,url,label,sort").order("sort"),
      db.from("color_swatches").select("name,hex"),
    ]);
    const err = [cats, artists, colls, collArtists, products, images, swatches].find((r) => r.error)?.error;
    if (err) throw new Error(`讀取商品目錄失敗：${err.message}`);

    const published = new Set((products.data ?? []).map((p) => p.id));
    const imgBy = new Map<string, Product["images"]>();
    for (const im of images.data ?? []) {
      if (!published.has(im.product_id)) continue;
      const list = imgBy.get(im.product_id) ?? [];
      list.push({ url: im.url, label: im.label, sort: im.sort });
      imgBy.set(im.product_id, list);
    }
    return {
      categories: cats.data ?? [],
      artists: (artists.data ?? []).map((a) => ({ ...a, tags: a.tags ?? [] })),
      collections: (colls.data ?? []).map((c) => ({
        ...c,
        artist_ids: (collArtists.data ?? []).filter((x) => x.collection_id === c.id).map((x) => x.artist_id),
      })),
      products: (products.data ?? []).map((p) => ({
        ...p,
        colors: p.colors ?? [],
        sizes: p.sizes ?? [],
        images: imgBy.get(p.id) ?? [],
      })) as Product[],
      swatches: Object.fromEntries((swatches.data ?? []).map((s) => [s.name, s.hex])),
    };
  },
  ["tugo-catalog-v1"],
  { revalidate: 60, tags: ["tugo-catalog"] },
);

export const getCatalog = cache(loadCatalog);

/** 給 generateStaticParams／sitemap：建置時連不到 DB（如 CI 假網址）就回 null，頁面改為請求時才產生 */
export async function getCatalogOrNull() {
  try {
    return await getCatalog();
  } catch (e) {
    console.warn("[catalog] 建置時讀取失敗，略過預先產生：", e instanceof Error ? e.message : e);
    return null;
  }
}

/** 後台「網站圖片」slot（tugo.site_images，anon 可讀）：home.hero / home.hero_full / about.main / collaborate.hero / category.<id> … */
export type SiteImage = { url: string; alt: string | null };
export const getSiteImages = unstable_cache(
  async (): Promise<Record<string, SiteImage>> => {
    const { data, error } = await createPublicClient().from("site_images").select("slot_key,public_url,alt");
    if (error) {
      console.error("[site_images]", error.message);
      return {};
    }
    const out: Record<string, SiteImage> = {};
    for (const r of data ?? []) if (r.public_url) out[r.slot_key] = { url: r.public_url, alt: r.alt };
    return out;
  },
  ["tugo-site-images-v1"],
  { revalidate: 60, tags: ["tugo-catalog", "tugo-site-images"] },
);

export function toLite(c: Catalog, siteImages: Record<string, SiteImage> = {}): LiteCatalog {
  return {
    products: c.products.map((p) => ({
      id: p.id,
      slug: p.slug,
      name: p.name,
      artist_id: p.artist_id,
      category_id: p.category_id,
      price: p.price,
      status: p.status,
      ship_date: p.ship_date,
      colors: p.colors,
      sizes: p.sizes,
      hue: p.hue,
      is_new: p.is_new,
      image: p.images[0]?.url ?? null,
    })),
    artists: c.artists.map((a) => ({
      id: a.id,
      name: a.name,
      name_en: a.name_en,
      discipline: a.discipline,
      hue: a.hue,
      portrait_url: a.portrait_url,
    })),
    categories: c.categories.map((cat) => {
      const ps = c.products.filter((p) => p.category_id === cat.id);
      return { ...cat, count: ps.length, hue: ps[0]?.hue ?? 0, image: siteImages[`category.${cat.id}`]?.url ?? null };
    }),
  };
}

export type InfoPage = "shipping" | "returns" | "privacy" | "terms";

export const getFaqs = unstable_cache(
  async () => {
    const { data, error } = await createPublicClient().from("faqs").select("question,answer").order("sort");
    if (error) throw new Error(error.message);
    return data ?? [];
  },
  ["tugo-faqs-v1"],
  { revalidate: 60, tags: ["tugo-catalog"] },
);

export const getInfoSections = unstable_cache(
  async () => {
    const { data, error } = await createPublicClient()
      .from("info_sections")
      .select("page,page_title,heading,body,sort")
      .order("sort");
    if (error) throw new Error(error.message);
    return data ?? [];
  },
  ["tugo-info-v1"],
  { revalidate: 60, tags: ["tugo-catalog"] },
);

export const getSizeChart = unstable_cache(
  async () => {
    const { data, error } = await createPublicClient().from("size_chart").select("size,chest_cm,length_cm").order("sort");
    if (error) throw new Error(error.message);
    return data ?? [];
  },
  ["tugo-size-chart-v1"],
  { revalidate: 60, tags: ["tugo-catalog"] },
);
