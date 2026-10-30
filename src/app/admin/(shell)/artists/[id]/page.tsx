import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdminPage } from "@/lib/admin/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { slugOk, type ArtistRow } from "@/lib/admin/catalog";
import { PageHead } from "@/components/admin/ui";
import EntityForm from "@/components/admin/catalog/EntityForm";
import ImageUploader from "@/components/admin/catalog/ImageUploader";
import DeleteButton from "@/components/admin/catalog/DeleteButton";
import { ARTIST_FIELDS } from "@/components/admin/catalog/fields";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function ArtistDetailPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const { id } = await params;
  await requireAdminPage(`/admin/artists/${id}`);
  if (!slugOk(id)) notFound();
  const sb = createAdminClient();
  const [{ data }, refs, sp] = await Promise.all([
    sb.from("artists").select("*").eq("id", id).maybeSingle(),
    sb.from("products").select("id", { count: "exact", head: true }).eq("artist_id", id),
    searchParams,
  ]);
  if (!data) notFound();
  const a = data as ArtistRow;
  const productCount = refs.count ?? 0;
  const s = (x: string | null) => x ?? "";

  return (
    <div className="adm-page">
      <PageHead
        eyebrow={`Artist · ${a.id}`}
        title={a.name}
        sub={`${productCount} 件商品`}
        actions={
          <>
            <Link className="adm-btn adm-btn--ghost" href="/admin/artists">
              ← 藝術家列表
            </Link>
            <Link className="adm-btn adm-btn--ghost" href={`/admin/products?artist=${a.id}`}>
              查看商品
            </Link>
            <a className="adm-btn adm-btn--ghost" href={`/artists/${a.id}`} target="_blank" rel="noopener noreferrer">
              前台檢視 ↗
            </a>
          </>
        }
      />
      {sp.created === "1" && (
        <div className="adm-msg" data-kind="ok" role="status">
          藝術家已建立，接著上傳頭像與封面。
        </div>
      )}
      <div className="adm-grid-main">
        <EntityForm
          mode="edit"
          id={a.id}
          apiBase="/api/admin/artists"
          detailBase="/admin/artists"
          fields={ARTIST_FIELDS}
          initial={{
            id: a.id,
            name: a.name,
            name_en: s(a.name_en),
            discipline: s(a.discipline),
            city: s(a.city),
            instagram: s(a.instagram),
            tags: (a.tags ?? []).join("、"),
            tagline: s(a.tagline),
            philosophy: s(a.philosophy),
            bio: s(a.bio),
            sort: String(a.sort),
            hue: String(a.hue),
            is_demo: a.is_demo,
          }}
        />
        <div className="adm-stack">
          <ImageUploader
            title="頭像"
            hint="正方形，建議 800×800"
            aspect="1 / 1"
            currentUrl={a.portrait_url}
            postUrl={`/api/admin/artists/${a.id}/image`}
            fields={{ kind: "portrait" }}
            deleteUrl={`/api/admin/artists/${a.id}/image`}
            deleteBody={{ kind: "portrait" }}
          />
          <ImageUploader
            title="封面"
            hint="橫式 5:4（列表卡片）／詳情頁上緣，建議 2000×1600"
            aspect="5 / 4"
            currentUrl={a.cover_url}
            postUrl={`/api/admin/artists/${a.id}/image`}
            fields={{ kind: "cover" }}
            deleteUrl={`/api/admin/artists/${a.id}/image`}
            deleteBody={{ kind: "cover" }}
          />
          <section className="adm-card">
            <h2 className="adm-h2">刪除藝術家</h2>
            {productCount > 0 ? (
              <p className="adm-small adm-muted" style={{ margin: 0 }}>
                仍有 {productCount} 件商品，請先移轉或刪除商品。
              </p>
            ) : (
              <DeleteButton url={`/api/admin/artists/${a.id}`} confirmText={`確定永久刪除藝術家「${a.name}」？`} redirectTo="/admin/artists" label="刪除藝術家" />
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
