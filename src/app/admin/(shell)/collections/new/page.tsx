import Link from "next/link";
import { requireAdminPage } from "@/lib/admin/auth";
import { getLookups } from "@/lib/admin/catalog";
import { PageHead } from "@/components/admin/ui";
import EntityForm from "@/components/admin/catalog/EntityForm";
import { collectionFields } from "@/components/admin/catalog/fields";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function NewCollectionPage() {
  await requireAdminPage("/admin/collections/new");
  const { artists } = await getLookups();
  return (
    <div className="adm-page">
      <PageHead
        eyebrow="Collections"
        title="新增聯名系列"
        sub="建立後即可上傳封面。"
        actions={
          <Link className="adm-btn adm-btn--ghost" href="/admin/collections">
            ← 系列列表
          </Link>
        }
      />
      <EntityForm
        mode="create"
        apiBase="/api/admin/collections"
        detailBase="/admin/collections"
        fields={collectionFields(artists)}
        initial={{ id: "", name: "", artist_ids: [], sort: "0", hue: "0", is_demo: false }}
      />
    </div>
  );
}
