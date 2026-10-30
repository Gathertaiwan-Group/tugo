import Link from "next/link";
import { requireAdminPage } from "@/lib/admin/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { sp } from "@/lib/admin/query";
import {
  APPLICATION_STATUS_LABELS,
  FULFILLMENT_LABELS,
  ORDER_STATUS_LABELS,
  fmtDate,
  fmtDateTime,
  label,
  money,
} from "@/lib/admin/format";
import { Empty, PageHead, Pill } from "@/components/admin/ui";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type Dash = {
  orders_today: number;
  orders_month: number;
  revenue_month_paid: number;
  gross_month: number;
  pending_payment: number;
  to_ship: number;
  shipped_in_transit: number;
  applications_pending: number;
  newsletter_total: number;
  newsletter_month: number;
  low_stock: number;
  followups_open: number;
  followups_overdue: number;
  daily: { day: string; orders: number; amount: number }[];
};

export default async function DashboardPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  await requireAdminPage("/admin");
  const raw = await searchParams;
  const demo = sp(raw.demo) === "1";
  const sb = createAdminClient();

  let recentOrders = sb
    .from("orders")
    .select("id,order_no,recipient_name,total,status,fulfillment_status,created_at")
    .order("created_at", { ascending: false })
    .limit(6);
  if (!demo) recentOrders = recentOrders.eq("is_demo", false);
  let lowStock = sb
    .from("products")
    .select("id,name,stock,status")
    .eq("is_published", true)
    .neq("status", "soldout")
    .lte("stock", 3)
    .order("stock")
    .limit(6);
  if (!demo) lowStock = lowStock.eq("is_demo", false);

  const [dashRes, ordersRes, appsRes, lowRes] = await Promise.all([
    sb.rpc("admin_dashboard", { include_demo: demo }),
    recentOrders,
    sb
      .from("artist_applications")
      .select("id,name,discipline,status,created_at")
      .in("status", ["pending", "reviewing"])
      .order("created_at", { ascending: false })
      .limit(5),
    lowStock,
  ]);
  const d = (dashRes.data ?? null) as Dash | null;
  const max = Math.max(1, ...(d?.daily ?? []).map((x) => x.orders));

  const kpis: { label: string; value: string; note?: string; href: string; alert?: boolean }[] = d
    ? [
        { label: "今日訂單", value: String(d.orders_today), href: "/admin/orders" },
        { label: "本月訂單", value: String(d.orders_month), note: `含待付款 ${money(d.gross_month)}`, href: "/admin/orders" },
        { label: "本月營收（已付款）", value: money(d.revenue_month_paid), href: "/admin/orders?status=paid" },
        { label: "待付款", value: String(d.pending_payment), href: "/admin/orders?status=pending_payment" },
        { label: "待出貨", value: String(d.to_ship), href: "/admin/orders?fulfillment=to_ship", alert: d.to_ship > 0 },
        { label: "運送中", value: String(d.shipped_in_transit), href: "/admin/orders?fulfillment=shipped" },
        { label: "待處理合作申請", value: String(d.applications_pending), href: "/admin/applications", alert: d.applications_pending > 0 },
        { label: "電子報訂閱", value: String(d.newsletter_total), note: `本月新增 ${d.newsletter_month}`, href: "/admin/newsletter" },
        { label: "低庫存商品（≤3）", value: String(d.low_stock), href: "/admin/products?status=lowstock", alert: d.low_stock > 0 },
        { label: "逾期回訪", value: String(d.followups_overdue), note: `未完成 ${d.followups_open}`, href: "/admin/followups", alert: d.followups_overdue > 0 },
      ]
    : [];

  return (
    <div className="adm-page">
      <PageHead
        eyebrow="Dashboard"
        title="營運總覽"
        sub={demo ? "含示意資料" : "正式資料（不含示意資料）· 台北時間"}
        actions={
          <Link className="adm-btn adm-btn--ghost adm-btn--sm" href={demo ? "/admin" : "/admin?demo=1"}>
            {demo ? "只看正式資料" : "顯示示意資料"}
          </Link>
        }
      />
      {sp(raw.denied) === "owner" && (
        <div className="adm-msg" data-kind="err">
          該頁面僅限「擁有者」帳號使用。
        </div>
      )}
      {!d && (
        <div className="adm-msg" data-kind="err">
          統計資料讀取失敗，請重新整理。
        </div>
      )}

      <div className="adm-kpis">
        {kpis.map((k) => (
          <Link key={k.label} href={k.href} className="adm-kpi" data-alert={k.alert ? "true" : "false"}>
            <div className="k-label">{k.label}</div>
            <div className="k-value">{k.value}</div>
            {k.note && <div className="k-note">{k.note}</div>}
          </Link>
        ))}
      </div>

      <div className="adm-grid-main">
        <div className="adm-stack">
          <section className="adm-card">
            <h2 className="adm-h2">近 14 天訂單數</h2>
            <div className="adm-bars" role="img" aria-label="近 14 天每日訂單數長條圖">
              {(d?.daily ?? []).map((x) => (
                <div className="adm-bar" key={x.day} title={`${x.day}：${x.orders} 筆 · ${money(x.amount)}`}>
                  <span>{x.orders || ""}</span>
                  <i style={{ height: `${(x.orders / max) * 100}%` }} />
                  <span>{x.day.slice(8)}</span>
                </div>
              ))}
            </div>
          </section>

          <section className="adm-card">
            <div className="adm-head" style={{ marginBottom: 8 }}>
              <h2 className="adm-h2" style={{ margin: 0 }}>
                近期訂單
              </h2>
              <Link className="adm-small" href="/admin/orders">
                全部訂單 →
              </Link>
            </div>
            {(ordersRes.data ?? []).length === 0 ? (
              <Empty>尚無訂單</Empty>
            ) : (
              <ul className="adm-list">
                {(ordersRes.data ?? []).map((o) => (
                  <li key={o.id}>
                    <Link href={`/admin/orders/${o.id}`} style={{ textDecoration: "none", display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
                      <span style={{ minWidth: 0 }}>
                        <span className="adm-mono" style={{ fontWeight: 600 }}>
                          {o.order_no}
                        </span>
                        <span className="adm-muted adm-small"> · {o.recipient_name} · {fmtDateTime(o.created_at)}</span>
                      </span>
                      <span className="adm-pills">
                        <span className="adm-mono">{money(o.total)}</span>
                        <Pill status={o.status}>{label(ORDER_STATUS_LABELS, o.status)}</Pill>
                        <Pill status={o.fulfillment_status}>{label(FULFILLMENT_LABELS, o.fulfillment_status)}</Pill>
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>

        <div className="adm-stack">
          <section className="adm-card">
            <div className="adm-head" style={{ marginBottom: 8 }}>
              <h2 className="adm-h2" style={{ margin: 0 }}>
                待處理合作申請
              </h2>
              <Link className="adm-small" href="/admin/applications">
                全部 →
              </Link>
            </div>
            {(appsRes.data ?? []).length === 0 ? (
              <p className="adm-muted adm-small">目前沒有待處理的申請</p>
            ) : (
              <ul className="adm-list">
                {(appsRes.data ?? []).map((a) => (
                  <li key={a.id}>
                    <Link href={`/admin/applications/${a.id}`} style={{ textDecoration: "none" }}>
                      <strong>{a.name}</strong> <span className="adm-muted adm-small">· {a.discipline} · {fmtDate(a.created_at)}</span>{" "}
                      <Pill status={a.status}>{label(APPLICATION_STATUS_LABELS, a.status)}</Pill>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>
          <section className="adm-card">
            <div className="adm-head" style={{ marginBottom: 8 }}>
              <h2 className="adm-h2" style={{ margin: 0 }}>
                低庫存
              </h2>
              <Link className="adm-small" href="/admin/products">
                商品 →
              </Link>
            </div>
            {(lowRes.data ?? []).length === 0 ? (
              <p className="adm-muted adm-small">沒有低庫存商品{demo ? "" : "（示意商品不計入）"}</p>
            ) : (
              <ul className="adm-list">
                {(lowRes.data ?? []).map((p) => (
                  <li key={p.id}>
                    <Link href={`/admin/products/${p.id}`} style={{ textDecoration: "none" }}>
                      {p.name} <span className="adm-mono adm-muted">· 剩 {p.stock}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
