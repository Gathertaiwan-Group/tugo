import Link from "next/link";
import { requireAdminPage } from "@/lib/admin/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { productCountsBy, type ArtistRow } from "@/lib/admin/catalog";
import { Cell, Empty, PageHead, Pill } from "@/components/admin/ui";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function ArtistsPage() {
  await requireAdminPage("/admin/artists");
  const [{ data }, counts] = await Promise.all([
    createAdminClient().from("artists").select("id,name,name_en,discipline,city,portrait_url,sort,is_demo").order("sort").order("name").limit(500),
    productCountsBy("artist_id"),
  ]);
  const rows = (data ?? []) as Pick<ArtistRow, "id" | "name" | "name_en" | "discipline" | "city" | "portrait_url" | "sort" | "is_demo">[];
  const cols = { "--cols": "64px minmax(0,2fr) minmax(0,1.4fr) minmax(0,.7fr) minmax(0,.7fr)" } as React.CSSProperties;
  return (
    <div className="adm-page">
      <PageHead
        eyebrow="Artists"
        title="藝術家"
        sub="藝術家資料、頭像與封面。刪除前需先移除其商品。"
        actions={
          <Link className="adm-btn adm-btn--primary" href="/admin/artists/new">
            ＋ 新增藝術家
          </Link>
        }
      />
      {rows.length === 0 ? (
        <Empty>尚無藝術家</Empty>
      ) : (
        <div className="adm-table">
          <div className="adm-thead" style={cols}>
            <span>頭像</span>
            <span>名稱</span>
            <span>類型 · 城市</span>
            <span>商品數</span>
            <span>排序</span>
          </div>
          {rows.map((a) => (
            <Link key={a.id} href={`/admin/artists/${a.id}`} className="adm-row" style={cols}>
              <div>
                {a.portrait_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img className="adm-thumb" style={{ borderRadius: "50%" }} src={a.portrait_url} alt="" loading="lazy" />
                ) : (
                  <span className="adm-thumb" style={{ display: "block", borderRadius: "50%" }} aria-hidden="true" />
                )}
              </div>
              <Cell label="名稱" full>
                <div style={{ fontWeight: 600 }}>
                  {a.name} {a.is_demo && <Pill>示意</Pill>}
                </div>
                <div className="adm-small adm-muted">
                  {a.name_en ?? ""} <span className="adm-mono">/{a.id}</span>
                </div>
              </Cell>
              <Cell label="類型 · 城市">
                {[a.discipline, a.city].filter(Boolean).join(" · ") || "—"}
              </Cell>
              <Cell label="商品數">
                <span className="adm-mono">{counts[a.id] ?? 0}</span>
              </Cell>
              <Cell label="排序">
                <span className="adm-mono">{a.sort}</span>
              </Cell>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
