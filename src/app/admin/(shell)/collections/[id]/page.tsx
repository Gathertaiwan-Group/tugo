import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdminPage } from "@/lib/admin/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { getLookups, slugOk, type CollectionRow } from "@/lib/admin/catalog";
import { PageHead } from "@/components/admin/ui";
import EntityForm from "@/components/admin/catalog/EntityForm";
import ImageUploader from "@/components/admin/catalog/ImageUploader";
import DeleteButton from "@/components/admin/catalog/DeleteButton";
import { collectionFields } from "@/components/admin/catalog/fields";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function CollectionDetailPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const { id } = await params;
  await requireAdminPage(`/admin/collections/${id}`);
  if (!slugOk(id)) notFound();
  const sb = createAdminClient();
  const [{ data }, links, refs, lookups, sp] = await Promise.all([
    sb.from("collections").select("*").eq("id", id).maybeSingle(),
    sb.from("collection_artists").select("artist_id,sort").eq("collection_id", id).order("sort"),
    sb.from("products").select("id", { count: "exact", head: true }).eq("collection_id", id),
    getLookups(),
    searchParams,
  ]);
  if (!data) notFound();
  const c = data as CollectionRow;
  const productCount = refs.count ?? 0;
  const s = (x: string | null) => x ?? "";

  return (
    <div className="adm-page">
      <PageHead
        eyebrow={`Collection · ${c.id}`}
        title={c.name}
        sub={`${productCount} 件商品`}
        actions={
          <>
            <Link className="adm-btn adm-btn--ghost" href="/admin/collections">
              ← 系列列表
            </Link>
            <a className="adm-btn adm-btn--ghost" href={`/collections/${c.id}`} target="_blank" rel="noopener noreferrer">
              前台檢視 ↗
            </a>
          </>
        }
      />
      {sp.created === "1" && (
        <div className="adm-msg" data-kind="ok" role="status">
          系列已建立，接著上傳封面。
        </div>
      )}
      <div className="adm-grid-main">
        <EntityForm
          mode="edit"
          id={c.id}
          apiBase="/api/admin/collections"
          detailBase="/admin/collections"
          fields={collectionFields(lookups.artists)}
          initial={{
            id: c.id,
            name: c.name,
            name_en: s(c.name_en),
            season: s(c.season),
            concept: s(c.concept),
            description: s(c.description),
            artist_ids: ((links.data ?? []) as { artist_id: string }[]).map((l) => l.artist_id),
            sort: String(c.sort),
            hue: String(c.hue),
            is_demo: c.is_demo,
          }}
        />
        <div className="adm-stack">
          <ImageUploader
            title="系列封面"
            hint="橫式 16:10，建議 2000×1250"
            aspect="16 / 10"
            currentUrl={c.cover_url}
            postUrl={`/api/admin/collections/${c.id}/image`}
            deleteUrl={`/api/admin/collections/${c.id}/image`}
          />
          <section className="adm-card">
            <h2 className="adm-h2">刪除系列</h2>
            {productCount > 0 ? (
              <p className="adm-small adm-muted" style={{ margin: 0 }}>
                仍有 {productCount} 件商品屬於此系列，請先在商品頁把系列改為「無」。
              </p>
            ) : (
              <DeleteButton url={`/api/admin/collections/${c.id}`} confirmText={`確定永久刪除系列「${c.name}」？`} redirectTo="/admin/collections" label="刪除系列" />
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
