import Link from "next/link";
import { requireAdminPage } from "@/lib/admin/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { SITE_IMAGE_SLOTS } from "@/lib/admin/siteImageSlots";
import { fmtDateTime } from "@/lib/admin/format";
import { PageHead } from "@/components/admin/ui";
import ImageUploader from "@/components/admin/catalog/ImageUploader";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type Img = { slot_key: string; public_url: string | null; alt: string | null; updated_at: string };

export default async function SiteImagesPage() {
  await requireAdminPage("/admin/site-images");
  const { data } = await createAdminClient().from("site_images").select("slot_key,public_url,alt,updated_at").not("slot_key", "like", "category.%");
  const map = new Map(((data ?? []) as Img[]).map((r) => [r.slot_key, r]));
  const groups = [...new Set(SITE_IMAGE_SLOTS.map((s) => s.group))];
  return (
    <div className="adm-page">
      <PageHead
        eyebrow="Site images"
        title="網站圖片"
        sub={
          <>
            固定版位的主視覺；未上傳的版位前台顯示條紋佔位圖。商品／藝術家／系列圖片請到各自頁面管理，分類圖片在
            <Link href="/admin/categories"> 分類 </Link>頁。
          </>
        }
      />
      <div className="adm-stack">
        {groups.map((g) => (
          <section key={g}>
            <h2 className="adm-h2">{g}</h2>
            <div className="adm-grid-3">
              {SITE_IMAGE_SLOTS.filter((s) => s.group === g).map((s) => {
                const cur = map.get(s.key);
                return (
                  <ImageUploader
                    key={s.key}
                    title={s.label}
                    hint={`${s.hint} · ${s.key}${cur ? ` · 更新 ${fmtDateTime(cur.updated_at)}` : ""}`}
                    aspect={s.aspect}
                    currentUrl={cur?.public_url ?? null}
                    postUrl="/api/admin/site-images"
                    fields={{ slotKey: s.key }}
                    deleteUrl="/api/admin/site-images"
                    deleteBody={{ slotKey: s.key }}
                    slotKey={s.key}
                    alt={cur?.alt ?? null}
                  />
                );
              })}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
