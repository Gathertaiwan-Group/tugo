import { requireAdminPage } from "@/lib/admin/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { productCountsBy } from "@/lib/admin/catalog";
import { PageHead } from "@/components/admin/ui";
import CategoriesManager from "@/components/admin/catalog/CategoriesManager";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function CategoriesPage() {
  await requireAdminPage("/admin/categories");
  const sb = createAdminClient();
  const [cats, imgs, counts] = await Promise.all([
    sb.from("categories").select("id,name,sort").order("sort"),
    sb.from("site_images").select("slot_key,public_url,alt").like("slot_key", "category.%"),
    productCountsBy("category_id"),
  ]);
  const imgMap = new Map(((imgs.data ?? []) as { slot_key: string; public_url: string | null; alt: string | null }[]).map((r) => [r.slot_key, r]));
  const categories = ((cats.data ?? []) as { id: string; name: string; sort: number }[]).map((c) => ({
    ...c,
    count: counts[c.id] ?? 0,
    image: imgMap.get(`category.${c.id}`)?.public_url ?? null,
    alt: imgMap.get(`category.${c.id}`)?.alt ?? null,
  }));
  return (
    <div className="adm-page">
      <PageHead eyebrow="Categories" title="商品分類" sub="分類名稱、排序與分類圖片（圖片存於網站圖片 slot category.<代碼>）。" />
      <CategoriesManager categories={categories} />
    </div>
  );
}
