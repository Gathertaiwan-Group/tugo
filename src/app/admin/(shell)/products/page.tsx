import Link from "next/link";
import { requireAdminPage } from "@/lib/admin/auth";
import { PRODUCT_SORTS, getLookups, listProducts } from "@/lib/admin/catalog";
import { PRODUCT_STATUS_LABELS, label, money } from "@/lib/admin/format";
import { hrefWith, parsePage, sp } from "@/lib/admin/query";
import { Cell, Empty, PageHead, Pager, Pill } from "@/components/admin/ui";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type SP = Promise<Record<string, string | string[] | undefined>>;

export default async function ProductsPage({ searchParams }: { searchParams: SP }) {
  await requireAdminPage("/admin/products");
  const raw = await searchParams;
  const params = {
    q: sp(raw.q),
    category: sp(raw.category),
    artist: sp(raw.artist),
    status: sp(raw.status),
    published: sp(raw.published),
    sort: sp(raw.sort),
  };
  const [list, lookups] = await Promise.all([listProducts({ ...params, page: parsePage(sp(raw.page)) }), getLookups()]);
  const cols = { "--cols": "64px minmax(0,2.2fr) minmax(0,1.2fr) minmax(0,.9fr) minmax(0,.7fr) minmax(0,1fr)" } as React.CSSProperties;

  return (
    <div className="adm-page">
      <PageHead
        eyebrow="Products"
        title="商品管理"
        sub="價格、庫存、供貨狀態、上下架與圖片。改動後前台會在數秒內更新。"
        actions={
          <Link className="adm-btn adm-btn--primary" href="/admin/products/new">
            ＋ 新增商品
          </Link>
        }
      />
      {/* key：網址變了表單跟著重建，欄位值與網址一致 */}
      <form className="adm-filter" method="get" key={JSON.stringify(params)}>
        <div className="adm-field grow">
          <label className="adm-label" htmlFor="pq">
            搜尋
          </label>
          <input id="pq" name="q" className="adm-input" defaultValue={params.q} placeholder="商品名稱 / slug / 編號" maxLength={40} />
        </div>
        <div className="adm-field">
          <label className="adm-label" htmlFor="pcat">
            分類
          </label>
          <select id="pcat" name="category" className="adm-select" defaultValue={params.category}>
            <option value="">全部</option>
            {lookups.categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
        <div className="adm-field">
          <label className="adm-label" htmlFor="part">
            藝術家
          </label>
          <select id="part" name="artist" className="adm-select" defaultValue={params.artist}>
            <option value="">全部</option>
            {lookups.artists.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </select>
        </div>
        <div className="adm-field">
          <label className="adm-label" htmlFor="pst">
            供貨
          </label>
          <select id="pst" name="status" className="adm-select" defaultValue={params.status}>
            <option value="">全部</option>
            {Object.entries(PRODUCT_STATUS_LABELS).map(([k, l]) => (
              <option key={k} value={k}>
                {l}
              </option>
            ))}
            <option value="lowstock">低庫存（≤3）</option>
          </select>
        </div>
        <div className="adm-field">
          <label className="adm-label" htmlFor="ppub">
            上下架
          </label>
          <select id="ppub" name="published" className="adm-select" defaultValue={params.published}>
            <option value="">全部</option>
            <option value="1">上架中</option>
            <option value="0">已下架</option>
          </select>
        </div>
        <div className="adm-field">
          <label className="adm-label" htmlFor="psort">
            排序
          </label>
          <select id="psort" name="sort" className="adm-select" defaultValue={list.sortKey}>
            {Object.entries(PRODUCT_SORTS).map(([k, s]) => (
              <option key={k} value={k}>
                {s.label}
              </option>
            ))}
          </select>
        </div>
        <div className="adm-actions">
          <button className="adm-btn adm-btn--primary">篩選</button>
          <Link className="adm-btn adm-btn--ghost" href="/admin/products">
            清除
          </Link>
        </div>
      </form>

      {list.error && (
        <div className="adm-msg" data-kind="err" role="alert">
          讀取失敗：{list.error}
        </div>
      )}
      {list.rows.length === 0 ? (
        <Empty>沒有符合條件的商品</Empty>
      ) : (
        <div className="adm-table">
          <div className="adm-thead" style={cols}>
            <span>圖</span>
            <span>商品</span>
            <span>藝術家 · 分類</span>
            <span>價格</span>
            <span>庫存</span>
            <span>狀態</span>
          </div>
          {list.rows.map((p) => {
            const img = p.product_images?.[0]?.url;
            return (
              <Link key={p.id} className="adm-row" style={cols} href={`/admin/products/${p.id}`}>
                <div>
                  {img ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img className="adm-thumb" src={img} alt="" loading="lazy" />
                  ) : (
                    <span className="adm-thumb" style={{ display: "block" }} aria-hidden="true" />
                  )}
                </div>
                <Cell label="商品" full>
                  <div style={{ fontWeight: 600 }}>{p.name}</div>
                  <div className="adm-mono adm-muted">{p.slug}</div>
                </Cell>
                <Cell label="藝術家 · 分類">
                  {p.artists?.name ?? p.artist_id}
                  <div className="adm-small adm-muted">{p.categories?.name ?? p.category_id}</div>
                </Cell>
                <Cell label="價格">
                  <span className="adm-mono">{money(p.price)}</span>
                </Cell>
                <Cell label="庫存">
                  <span className="adm-mono" style={p.stock <= 3 && p.status !== "soldout" ? { color: "var(--color-tangerine)", fontWeight: 700 } : undefined}>
                    {p.stock}
                  </span>
                </Cell>
                <Cell label="狀態">
                  <span className="adm-pills">
                    <Pill status={p.status}>{label(PRODUCT_STATUS_LABELS, p.status)}</Pill>
                    {!p.is_published && <Pill status="cancelled">已下架</Pill>}
                    {p.is_new && <Pill status="ok">NEW</Pill>}
                    {p.is_demo && <Pill>示意</Pill>}
                  </span>
                </Cell>
              </Link>
            );
          })}
        </div>
      )}
      <Pager page={list.page} pageCount={list.pageCount} total={list.total} hrefFor={(pg) => hrefWith("/admin/products", params, { page: pg })} />
    </div>
  );
}
