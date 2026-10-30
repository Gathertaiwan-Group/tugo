import Link from "next/link";
import { requireAdminPage } from "@/lib/admin/auth";
import { listOrders, ORDER_SORTS, type OrderSort } from "@/lib/admin/orders";
import { hrefWith, parsePage, pick, sp } from "@/lib/admin/query";
import {
  FULFILLMENT_LABELS,
  FULFILLMENT_STATUSES,
  ORDER_STATUSES,
  ORDER_STATUS_LABELS,
  SHIP_METHOD_LABELS,
  fmtDateTime,
  label,
  money,
} from "@/lib/admin/format";
import { Cell, Empty, PageHead, Pager, Pill } from "@/components/admin/ui";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type SP = Promise<Record<string, string | string[] | undefined>>;
const COLS = "minmax(0,1.3fr) minmax(0,1.4fr) minmax(0,0.8fr) minmax(0,1.3fr) minmax(0,1fr)";

export default async function OrdersPage({ searchParams }: { searchParams: SP }) {
  await requireAdminPage("/admin/orders");
  const raw = await searchParams;
  const params = {
    q: sp(raw.q).slice(0, 80),
    status: sp(raw.status),
    fulfillment: sp(raw.fulfillment),
    from: sp(raw.from),
    to: sp(raw.to),
    sort: pick(sp(raw.sort), Object.keys(ORDER_SORTS) as OrderSort[], "newest"),
    demo: sp(raw.demo) === "1" ? "1" : "",
  };
  const { rows, total, page, pageCount } = await listOrders({ ...params, page: parsePage(sp(raw.page)), demo: params.demo === "1" });
  const linkParams: Record<string, string> = { ...params };

  return (
    <div className="adm-page">
      <PageHead
        eyebrow="Orders"
        title="訂單"
        sub="前台結帳建立的訂單。金流尚未串接時狀態為「待付款」。"
        actions={
          <Link className="adm-btn adm-btn--ghost" href="/admin/scan">
            ▣ 出貨掃描站
          </Link>
        }
      />
      {/* key 讓表單隨網址重建（上一頁/下一頁時欄位值一致） */}
      <form className="adm-filter" method="get" key={JSON.stringify(params)}>
        <div className="adm-field grow">
          <label className="adm-label" htmlFor="o-q">
            搜尋
          </label>
          <input id="o-q" name="q" className="adm-input" defaultValue={params.q} placeholder="訂單號 / 收件人 / Email / 電話" />
        </div>
        <div className="adm-field">
          <label className="adm-label" htmlFor="o-status">
            付款狀態
          </label>
          <select id="o-status" name="status" className="adm-select" defaultValue={params.status}>
            <option value="">全部</option>
            {ORDER_STATUSES.map((s) => (
              <option key={s} value={s}>
                {ORDER_STATUS_LABELS[s]}
              </option>
            ))}
          </select>
        </div>
        <div className="adm-field">
          <label className="adm-label" htmlFor="o-f">
            出貨狀態
          </label>
          <select id="o-f" name="fulfillment" className="adm-select" defaultValue={params.fulfillment}>
            <option value="">全部</option>
            <option value="to_ship">待出貨（未出貨/揀貨/包裝）</option>
            {FULFILLMENT_STATUSES.map((s) => (
              <option key={s} value={s}>
                {FULFILLMENT_LABELS[s]}
              </option>
            ))}
          </select>
        </div>
        <div className="adm-field">
          <label className="adm-label" htmlFor="o-from">
            下單日起
          </label>
          <input id="o-from" type="date" name="from" className="adm-input" defaultValue={params.from} />
        </div>
        <div className="adm-field">
          <label className="adm-label" htmlFor="o-to">
            下單日迄
          </label>
          <input id="o-to" type="date" name="to" className="adm-input" defaultValue={params.to} />
        </div>
        <div className="adm-field">
          <label className="adm-label" htmlFor="o-sort">
            排序
          </label>
          <select id="o-sort" name="sort" className="adm-select" defaultValue={params.sort}>
            {(Object.keys(ORDER_SORTS) as OrderSort[]).map((k) => (
              <option key={k} value={k}>
                {ORDER_SORTS[k].label}
              </option>
            ))}
          </select>
        </div>
        <label className="adm-check" style={{ minHeight: 40 }}>
          <input type="checkbox" name="demo" value="1" defaultChecked={params.demo === "1"} /> 含示意資料
        </label>
        <div className="adm-actions">
          <button className="adm-btn adm-btn--primary">篩選</button>
          <Link className="adm-btn adm-btn--ghost" href="/admin/orders">
            清除
          </Link>
        </div>
      </form>

      {rows.length === 0 ? (
        <Empty>沒有符合條件的訂單</Empty>
      ) : (
        <div className="adm-table" style={{ "--cols": COLS } as React.CSSProperties}>
          <div className="adm-thead">
            <span>訂單編號 / 下單時間</span>
            <span>買家</span>
            <span>金額</span>
            <span>狀態</span>
            <span>配送</span>
          </div>
          {rows.map((o) => (
            <Link key={o.id} href={`/admin/orders/${o.id}`} className="adm-row">
              <Cell label="訂單編號" full>
                <div className="adm-mono" style={{ fontWeight: 600 }}>
                  {o.order_no ?? o.id.slice(0, 8)}
                  {o.is_demo && <span className="adm-pill" style={{ marginLeft: 6 }}>示意</span>}
                </div>
                <div className="adm-muted adm-small">{fmtDateTime(o.created_at)}</div>
              </Cell>
              <Cell label="買家">
                <div>{o.recipient_name}</div>
                <div className="adm-muted adm-small">{o.email}</div>
              </Cell>
              <Cell label="金額">
                <span className="adm-mono">{money(o.total)}</span>
              </Cell>
              <Cell label="狀態">
                <div className="adm-pills">
                  <Pill status={o.status}>{label(ORDER_STATUS_LABELS, o.status)}</Pill>
                  <Pill status={o.fulfillment_status}>{label(FULFILLMENT_LABELS, o.fulfillment_status)}</Pill>
                </div>
              </Cell>
              <Cell label="配送">{label(SHIP_METHOD_LABELS, o.ship_method)}</Cell>
            </Link>
          ))}
        </div>
      )}
      <Pager page={page} pageCount={pageCount} total={total} hrefFor={(p) => hrefWith("/admin/orders", linkParams, { page: p })} />
    </div>
  );
}
