import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/env";
import { getCatalog } from "@/lib/site/catalog";

export const revalidate = 3600;

const STATIC_PATHS = ["", "/shop", "/new", "/artists", "/collections", "/about", "/collaborate", "/faq", "/shipping", "/returns", "/privacy", "/terms"];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base: MetadataRoute.Sitemap = STATIC_PATHS.map((p) => ({ url: `${SITE_URL}${p}`, changeFrequency: "weekly", priority: p === "" ? 1 : 0.6 }));
  try {
    const c = await getCatalog();
    return [
      ...base,
      ...c.categories.map((x) => ({ url: `${SITE_URL}/shop/${x.id}`, changeFrequency: "weekly" as const, priority: 0.6 })),
      ...c.products.map((p) => ({ url: `${SITE_URL}/products/${p.slug}`, lastModified: p.released_at, changeFrequency: "weekly" as const, priority: 0.8 })),
      ...c.artists.map((a) => ({ url: `${SITE_URL}/artists/${a.id}`, changeFrequency: "monthly" as const, priority: 0.6 })),
      ...c.collections.map((x) => ({ url: `${SITE_URL}/collections/${x.id}`, changeFrequency: "monthly" as const, priority: 0.7 })),
    ];
  } catch {
    return base;
  }
}
