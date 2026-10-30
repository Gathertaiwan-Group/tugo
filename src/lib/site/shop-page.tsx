import "server-only";
import { getCatalog, toLite } from "./catalog";
import { parseShopFilter, type ShopProduct } from "./shop";
import { ShopView } from "@/components/site/ShopView";

type SP = Record<string, string | string[] | undefined>;

/** /shop、/shop/[category]、/new 共用（README §5.2）。 */
export async function ShopPage({ mode, categoryId, searchParams }: { mode: "all" | "category" | "new"; categoryId?: string; searchParams: SP }) {
  const catalog = await getCatalog();
  const lite = toLite(catalog);
  const cat = categoryId ? catalog.categories.find((c) => c.id === categoryId) : undefined;
  const artistName = (id: string) => catalog.artists.find((a) => a.id === id)?.name ?? "";
  const products: ShopProduct[] = catalog.products
    .filter((p) => (!cat || p.category_id === cat.id) && (mode !== "new" || p.is_new))
    .map((p) => {
      const l = lite.products.find((x) => x.id === p.id)!;
      return { ...l, popularity: p.popularity, released_at: p.released_at, haystack: (p.name + artistName(p.artist_id) + (p.story ?? "")).toLowerCase() };
    });
  const tabs = [
    { name: "全部", href: mode === "new" ? "/new" : "/shop", active: mode !== "category" },
    ...catalog.categories.map((c) => ({ name: c.name, href: `/shop/${c.id}`, active: c.id === cat?.id })),
  ];
  const title = mode === "new" ? "新品上市" : cat ? cat.name : "逛商品";
  const en = mode === "new" ? "New Drops" : cat ? `Shop / ${cat.id}` : "All Goods";
  const initial = parseShopFilter(searchParams);
  return (
    <ShopView
      key={JSON.stringify(initial)}
      products={products}
      artists={catalog.artists.map((a) => ({ id: a.id, name: a.name }))}
      tabs={tabs}
      initial={initial}
      title={title}
      en={en}
    />
  );
}
