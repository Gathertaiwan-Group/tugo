import "server-only";
import { revalidatePath } from "next/cache";

/**
 * 改動公開內容後讓前台即時更新（前台公開頁 revalidate=60，這裡主動清）。
 * 路徑對照 tugo_handoff README §3 路由表；未知路徑 revalidatePath 不會報錯。
 */
export function revalidatePublic(kind: "product" | "artist" | "collection" | "category" | "content" | "site", slug?: string | null) {
  const paths = new Set<string>(["/"]);
  switch (kind) {
    case "product":
      ["/shop", "/new", "/artists", "/collections"].forEach((p) => paths.add(p));
      if (slug) paths.add(`/products/${slug}`);
      revalidatePath("/shop/[category]", "page");
      revalidatePath("/products/[slug]", "page");
      revalidatePath("/artists/[id]", "page");
      revalidatePath("/collections/[id]", "page");
      break;
    case "artist":
      paths.add("/artists");
      if (slug) paths.add(`/artists/${slug}`);
      revalidatePath("/products/[slug]", "page");
      break;
    case "collection":
      paths.add("/collections");
      if (slug) paths.add(`/collections/${slug}`);
      break;
    case "category":
      paths.add("/shop");
      revalidatePath("/shop/[category]", "page");
      break;
    case "content":
      ["/faq", "/shipping", "/returns", "/privacy", "/terms", "/collaborate"].forEach((p) => paths.add(p));
      break;
    case "site":
      ["/about", "/collaborate"].forEach((p) => paths.add(p));
      break;
  }
  for (const p of paths) revalidatePath(p);
}
