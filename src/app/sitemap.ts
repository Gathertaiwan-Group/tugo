import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/env";

// 骨架：僅列靜態路由。商品 / 藝術家 / 系列的動態路由由前台 agent 補（查 tugo.products / artists / collections）。
const STATIC_PATHS = ["", "/shop", "/new", "/artists", "/collections", "/about", "/collaborate", "/faq", "/shipping", "/returns", "/privacy", "/terms"];

export default function sitemap(): MetadataRoute.Sitemap {
  return STATIC_PATHS.map((p) => ({ url: `${SITE_URL}${p}`, changeFrequency: "weekly", priority: p === "" ? 1 : 0.6 }));
}
