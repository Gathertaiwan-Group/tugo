import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdminPage } from "@/lib/admin/auth";
import { getOrder, getOrderEvents, getOrderItems } from "@/lib/admin/orders";
import { listNotes } from "@/lib/admin/notes";
import { STATION_LABELS } from "@/lib/admin/barcode";
import {
  FULFILLMENT_LABELS,
  ORDER_STATUS_LABELS,
  PAY_METHOD_LABELS,
  SHIP_METHOD_LABELS,
  emailToKey,
  fmtDateTime,
  label,
  money,
} from "@/lib/admin/format";
import { PageHead, Pill } from "@/components/admin/ui";
import NotesPanel from "@/components/admin/NotesPanel";
import OrderEditForm from "@/components/admin/OrderEditForm";

// 動態且不快取：Next Data Cache 曾讓後台顯示舊資料（Nina 踩過的坑），這裡明確關掉
export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await requireAdminPage(`/admin/orders/${id}`);
  const order = await getOrder(id);
  if (!order) notFound();
  const [items, events, notes] = await Promise.all([getOrderItems(order.id), getOrderEvents(order.id), listNotes("order", order.id)]);
  const itemsTotal = items.reduce((s, i) => s + i.qty * i.unit_price, 0);
  const followupHref = `/admin/followups?new=1&related_type=order&related_id=${encodeURIComponent(order.id)}&customer_email=${encodeURIComponent(
    order.email
  )}&title=${encodeURIComponent(`訂單 ${order.order_no ?? ""} 追蹤`)}`;

  return (
    <div className="adm-page">
      <p className="adm-small" style={{ margin: "0 0 8px" }}>
        <Link href="/admin/orders">← 訂單列表</Link>
      </p>
      <PageHead
        eyebrow="Order"
        title={order.order_no ?? order.id}
        sub={
          <>
            下單 {fmtDateTime(order.created_at)}
            {order.updated_at ? ` · 最後更新 ${fmtDateTime(order.updated_at)}` : ""}
          </>
        }
        actions={
          <>
            <Pill status={order.status}>{label(ORDER_STATUS_LABELS, order.status)}</Pill>
            <Pill status={order.fulfillment_status}>{label(FULFILLMENT_LABELS, order.fulfillment_status)}</Pill>
            <a className="adm-btn adm-btn--ghost adm-btn--sm" href={`/admin/print/order/${order.id}`} target="_blank" rel="noopener">
              🖨 出貨單／揀貨單
            </a>
            <Link className="adm-btn adm-btn--ghost adm-btn--sm" href={followupHref}>
              ＋ 新增回訪
            </Link>
          </>
        }
      />
      {order.is_demo && (
        <div className="adm-msg" data-kind="info">
          示意訂單 · 僅供檢視，無法修改
        </div>
      )}

      <div className="adm-grid-main">
        <div className="adm-stack">
          <section className="adm-card">
            <h2 className="adm-h2">訂購品項</h2>
            {items.length === 0 ? (
              <p className="adm-muted">此訂單沒有品項資料</p>
            ) : (
              <ul className="adm-list">
                {items.map((it) => (
                  <li key={it.id} style={{ display: "flex", gap: 12, justifyContent: "space-between", flexWrap: "wrap" }}>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontWeight: 600 }}>
                        {it.product?.name ?? it.product_id ?? "（商品已刪除）"}
                        {it.product_id && (
                          <Link className="adm-small" style={{ marginLeft: 6 }} href={`/admin/products/${it.product_id}`}>
                            商品 →
                          </Link>
                        )}
                      </div>
                      <div className="adm-muted adm-small">
                        {it.product?.artist?.name ? `${it.product.artist.name} · ` : ""}
                        {[it.color, it.size].filter(Boolean).join("／") || "單一規格"}
                      </div>
                    </div>
                    <div className="adm-mono" style={{ textAlign: "right" }}>
                      {money(it.unit_price)} × {it.qty}
                      <div style={{ fontWeight: 600 }}>{money(it.unit_price * it.qty)}</div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
            <dl className="adm-dl" style={{ marginTop: 12 }}>
              <dt>小計</dt>
              <dd className="adm-mono">
                {money(order.subtotal)}
                {items.length > 0 && itemsTotal !== order.subtotal ? `（品項合計 ${money(itemsTotal)}，不一致）` : ""}
              </dd>
              <dt>運費</dt>
              <dd className="adm-mono">{money(order.shipping_fee)}</dd>
              <dt>總計</dt>
              <dd className="adm-mono" style={{ fontWeight: 700 }}>
                {money(order.total)}
              </dd>
              <dt>付款方式</dt>
              <dd>{label(PAY_METHOD_LABELS, order.pay_method)}</dd>
            </dl>
          </section>

          <section className="adm-card">
            <h2 className="adm-h2">收件與出貨資料</h2>
            <OrderEditForm order={order} readOnly={order.is_demo} />
          </section>
        </div>

        <div className="adm-stack">
          <section className="adm-card">
            <h2 className="adm-h2">買家</h2>
            <dl className="adm-dl">
              <dt>收件人</dt>
              <dd>{order.recipient_name}</dd>
              <dt>Email</dt>
              <dd>
                <Link href={`/admin/customers/${emailToKey(order.email)}`}>{order.email}</Link>
              </dd>
              <dt>電話</dt>
              <dd>{order.phone}</dd>
              <dt>配送</dt>
              <dd>
                {label(SHIP_METHOD_LABELS, order.ship_method)}
                {order.ship_method === "cvs" ? ` · ${order.cvs_store ?? "—"}` : ` · ${order.city ?? ""}${order.address ?? ""}`}
              </dd>
              <dt>買家備註</dt>
              <dd>{order.note || "—"}</dd>
              <dt>會員</dt>
              <dd>{order.user_id ? "會員下單" : "訪客結帳"}</dd>
            </dl>
          </section>

          <section className="adm-card">
            <h2 className="adm-h2">出貨進度紀錄</h2>
            {events.length === 0 ? (
              <p className="adm-muted adm-small">尚無掃描或手動紀錄。可到「出貨掃描站」掃描出貨單上的條碼。</p>
            ) : (
              <ul className="adm-timeline">
                {events.map((e) => (
                  <li key={e.id}>
                    <strong>{STATION_LABELS[e.station] ?? e.station}</strong>
                    <div className="adm-muted adm-small">
                      {fmtDateTime(e.scanned_at)} · {e.admin_name ?? "—"}
                      {e.note ? ` · ${e.note}` : ""}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <NotesPanel subjectType="order" subjectId={order.id} initialNotes={notes} title="內部備註" />
        </div>
      </div>
    </div>
  );
}
