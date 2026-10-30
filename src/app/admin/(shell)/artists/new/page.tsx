import Link from "next/link";
import { requireAdminPage } from "@/lib/admin/auth";
import { PageHead } from "@/components/admin/ui";
import EntityForm from "@/components/admin/catalog/EntityForm";
import { ARTIST_FIELDS } from "@/components/admin/catalog/fields";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function NewArtistPage() {
  await requireAdminPage("/admin/artists/new");
  return (
    <div className="adm-page">
      <PageHead
        eyebrow="Artists"
        title="新增藝術家"
        sub="建立後即可上傳頭像與封面。"
        actions={
          <Link className="adm-btn adm-btn--ghost" href="/admin/artists">
            ← 藝術家列表
          </Link>
        }
      />
      <EntityForm
        mode="create"
        apiBase="/api/admin/artists"
        detailBase="/admin/artists"
        fields={ARTIST_FIELDS}
        initial={{ id: "", name: "", tags: "", sort: "0", hue: "0", is_demo: false }}
      />
    </div>
  );
}
