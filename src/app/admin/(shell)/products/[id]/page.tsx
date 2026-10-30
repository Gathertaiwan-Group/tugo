import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdminPage } from "@/lib/admin/auth";
import { getLookups, getProduct } from "@/lib/admin/catalog";
import { fmtDateTime } from "@/lib/admin/format";
import { PageHead } from "@/components/admin/ui";
import ProductForm from "@/components/admin/catalog/ProductForm";
import ProductImages from "@/components/admin/catalog/ProductImages";
import DeleteButton from "@/components/admin/catalog/DeleteButton";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function ProductDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { id } = await params;
  await requireAdminPage(`/admin/products/${id}`);
  const [data, lookups, sp] = await Promise.all([getProduct(id), getLookups(), searchParams]);
  if (!data) notFound();
  const p = data.product;

  return (
    <div className="adm-page">
      <PageHead
        eyebrow={`Product · ${p.id}`}
        title={p.name}
        sub={
          <>
            建立 {fmtDateTime(p.created_at)} · 最後更新 {fmtDateTime(p.updated_at)} · 已售出品項 {data.orderItemCount} 筆
          </>
        }
        actions={
          <>
            <Link className="adm-btn adm-btn--ghost" href="/admin/products">
              ← 商品列表
            </Link>
            <a className="adm-btn adm-btn--ghost" href={`/products/${p.slug}`} target="_blank" rel="noopener noreferrer">
              前台檢視 ↗
            </a>
          </>
        }
      />
      {sp.created === "1" && (
        <div className="adm-msg" data-kind="ok" role="status">
          商品已建立（目前為{p.is_published ? "上架" : "下架"}狀態）。接著上傳商品圖片。
        </div>
      )}
      <div className="adm-grid-main">
        <ProductForm
          mode="edit"
          productId={p.id}
          lookups={lookups}
          initial={{
            name: p.name,
            slug: p.slug,
            artist_id: p.artist_id,
            category_id: p.category_id,
            collection_id: p.collection_id ?? "",
            price: String(p.price),
            stock: String(p.stock),
            status: p.status,
            ship_date: p.ship_date ?? "",
            is_new: p.is_new,
            is_published: p.is_published,
            is_demo: p.is_demo,
            colors: p.colors ?? [],
            sizes: p.sizes ?? [],
            material: p.material ?? "",
            care: p.care ?? "",
            dimensions: p.dimensions ?? "",
            story: p.story ?? "",
            released_at: p.released_at,
            popularity: String(p.popularity),
          }}
        />
        <div className="adm-stack">
          <ProductImages productId={p.id} initial={data.images} />
          <section className="adm-card">
            <h2 className="adm-h2">刪除商品</h2>
            {data.orderItemCount > 0 ? (
              <p className="adm-small adm-muted" style={{ margin: 0 }}>
                此商品已有訂單紀錄，不能刪除；如不再販售請取消勾選「上架」。
              </p>
            ) : (
              <>
                <p className="adm-small adm-muted" style={{ marginTop: 0 }}>
                  刪除後無法復原，商品圖片也會一併移除。
                </p>
                <DeleteButton url={`/api/admin/products/${p.id}`} confirmText={`確定永久刪除「${p.name}」？`} redirectTo="/admin/products" label="刪除商品" />
              </>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
