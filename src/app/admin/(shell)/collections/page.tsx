import Link from "next/link";
import { requireAdminPage } from "@/lib/admin/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { productCountsBy, type CollectionRow } from "@/lib/admin/catalog";
import { Cell, Empty, PageHead, Pill } from "@/components/admin/ui";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type Row = Pick<CollectionRow, "id" | "name" | "name_en" | "season" | "cover_url" | "sort" | "is_demo"> & {
  collection_artists: { sort: number; artists: { name: string } | null }[];
};

export default async function CollectionsPage() {
  await requireAdminPage("/admin/collections");
  const [{ data }, counts] = await Promise.all([
    createAdminClient()
      .from("collections")
      .select("id,name,name_en,season,cover_url,sort,is_demo,collection_artists(sort,artists(name))")
      .order("sort")
      .limit(500),
    productCountsBy("collection_id"),
  ]);
  const rows = (data ?? []) as unknown as Row[];
  const cols = { "--cols": "64px minmax(0,1.8fr) minmax(0,1.6fr) minmax(0,.8fr) minmax(0,.6fr)" } as React.CSSProperties;
  return (
    <div className="adm-page">
      <PageHead
        eyebrow="Collections"
        title="聯名系列"
        sub="系列資料、封面與參與藝術家。"
        actions={
          <Link className="adm-btn adm-btn--primary" href="/admin/collections/new">
            ＋ 新增系列
          </Link>
        }
      />
      {rows.length === 0 ? (
        <Empty>尚無聯名系列</Empty>
      ) : (
        <div className="adm-table">
          <div className="adm-thead" style={cols}>
            <span>封面</span>
            <span>系列</span>
            <span>參與藝術家</span>
            <span>季度</span>
            <span>商品數</span>
          </div>
          {rows.map((c) => (
            <Link key={c.id} href={`/admin/collections/${c.id}`} className="adm-row" style={cols}>
              <div>
                {c.cover_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img className="adm-thumb" src={c.cover_url} alt="" loading="lazy" />
                ) : (
                  <span className="adm-thumb" style={{ display: "block" }} aria-hidden="true" />
                )}
              </div>
              <Cell label="系列" full>
                <div style={{ fontWeight: 600 }}>
                  {c.name} {c.is_demo && <Pill>示意</Pill>}
                </div>
                <div className="adm-small adm-muted">
                  {c.name_en ?? ""} <span className="adm-mono">/{c.id}</span>
                </div>
              </Cell>
              <Cell label="參與藝術家">
                {[...(c.collection_artists ?? [])]
                  .sort((x, y) => x.sort - y.sort)
                  .map((x) => x.artists?.name)
                  .filter(Boolean)
                  .join("、") || "—"}
              </Cell>
              <Cell label="季度">{c.season ?? "—"}</Cell>
              <Cell label="商品數">
                <span className="adm-mono">{counts[c.id] ?? 0}</span>
              </Cell>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
