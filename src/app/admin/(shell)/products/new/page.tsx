import Link from "next/link";
import { requireAdminPage } from "@/lib/admin/auth";
import { getLookups } from "@/lib/admin/catalog";
import { taipeiToday } from "@/lib/admin/format";
import { PageHead } from "@/components/admin/ui";
import ProductForm from "@/components/admin/catalog/ProductForm";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function NewProductPage() {
  await requireAdminPage("/admin/products/new");
  const lookups = await getLookups();
  return (
    <div className="adm-page">
      <PageHead
        eyebrow="Products"
        title="新增商品"
        sub="建立後即可上傳商品圖片。"
        actions={
          <Link className="adm-btn adm-btn--ghost" href="/admin/products">
            ← 商品列表
          </Link>
        }
      />
      <ProductForm
        mode="create"
        lookups={lookups}
        initial={{
          name: "",
          slug: "",
          artist_id: "",
          category_id: "",
          collection_id: "",
          price: "",
          stock: "0",
          status: "instock",
          ship_date: "",
          is_new: true,
          is_published: false,
          is_demo: false,
          colors: [],
          sizes: [],
          material: "",
          care: "",
          dimensions: "",
          story: "",
          released_at: taipeiToday(),
          popularity: "0",
        }}
      />
    </div>
  );
}
