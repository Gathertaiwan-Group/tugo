import { notFound } from "next/navigation";
import { requireAdminPage } from "@/lib/admin/auth";
import { getOrder, getOrderItems } from "@/lib/admin/orders";
import { STATIONS, STATION_LABELS, code128cSvg, encodeBarcode, encodeOrderBarcode } from "@/lib/admin/barcode";
import { ORDER_STATUS_LABELS, PAY_METHOD_LABELS, SHIP_METHOD_LABELS, fmtDateTime, label, money } from "@/lib/admin/format";
import PrintButton from "@/components/admin/PrintButton";

export const dynamic = "force-dynamic";
export const revalidate = 0;

// SVG 只由純數字 payload 產生（code128cSvg 內部驗證 ^\d+$），可安全 inline
function Barcode({ payload, caption, heightMm = 12 }: { payload: string; caption: string; heightMm?: number }) {
  return (
    <figure>
      <div dangerouslySetInnerHTML={{ __html: code128cSvg(payload, { heightMm }) }} />
      <figcaption>{caption}</figcaption>
    </figure>
  );
}

/** A4 出貨單（給買家/裝箱）＋ 揀貨單（倉庫用，含各站條碼）。照 Nina A4 手法：mm 單位、print-color-adjust、.no-print。 */
export default async function PrintOrderPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await requireAdminPage(`/admin/print/order/${id}`);
  const order = await getOrder(id);
  if (!order) notFound();
  const items = await getOrderItems(order.id);
  const orderNo = order.order_no ?? order.id;
  const mainCode = order.order_no ? encodeOrderBarcode(order.order_no) : null;
  const shipTo =
    order.ship_method === "cvs" ? `超商取貨：${order.cvs_store ?? "—"}` : `${order.city ?? ""}${order.address ?? ""}` || "—";

  return (
    <div className="print-wrap">
      <div className="print-toolbar no-print">
        <a className="adm-btn adm-btn--ghost adm-btn--sm" href={`/admin/orders/${order.id}`}>
          ← 回訂單
        </a>
        <PrintButton />
        <span className="adm-muted adm-small">列印設定：A4、縮放 100%、邊界「無」</span>
      </div>

      {/* 第 1 頁：出貨單 */}
      <section className="a4" aria-label="出貨單">
        <div className="a4-head">
          <div>
            <div style={{ fontSize: "9pt", letterSpacing: ".14em" }}>圖個有意思 TUGO STUDIO</div>
            <h1>出貨單</h1>
            <div>訂單編號：{orderNo}</div>
            <div>下單時間：{fmtDateTime(order.created_at)}</div>
          </div>
          {mainCode ? (
            <div className="bc" style={{ marginTop: 0, display: "block" }}>
              <Barcode payload={mainCode.payload} caption={mainCode.caption} heightMm={14} />
            </div>
          ) : (
            <div>條碼不可用（訂單編號格式不符）</div>
          )}
        </div>
        <div className="a4-grid">
          <div className="box">
            <b>收件人</b>
            <div>{order.recipient_name}</div>
            <div>{order.phone}</div>
            <div>{shipTo}</div>
          </div>
          <div className="box">
            <b>配送 / 付款</b>
            <div>
              {label(SHIP_METHOD_LABELS, order.ship_method)}
              {order.carrier ? ` · ${order.carrier}` : ""}
              {order.tracking_no ? ` · ${order.tracking_no}` : ""}
            </div>
            <div>
              {label(PAY_METHOD_LABELS, order.pay_method)} · {label(ORDER_STATUS_LABELS, order.status)}
            </div>
          </div>
        </div>
        <table>
          <thead>
            <tr>
              <th style={{ width: "8mm" }}>#</th>
              <th>品名</th>
              <th style={{ width: "34mm" }}>規格</th>
              <th style={{ width: "14mm" }} className="num">
                數量
              </th>
              <th style={{ width: "26mm" }} className="num">
                單價
              </th>
              <th style={{ width: "28mm" }} className="num">
                小計
              </th>
            </tr>
          </thead>
          <tbody>
            {items.map((it, i) => (
              <tr key={it.id}>
                <td>{i + 1}</td>
                <td>
                  {it.product?.name ?? it.product_id ?? "—"}
                  {it.product?.artist?.name ? <div style={{ fontSize: "8.5pt" }}>{it.product.artist.name}</div> : null}
                </td>
                <td>{[it.color, it.size].filter(Boolean).join("／") || "單一規格"}</td>
                <td className="num">{it.qty}</td>
                <td className="num">{money(it.unit_price)}</td>
                <td className="num">{money(it.qty * it.unit_price)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <td colSpan={5} className="num">
                小計
              </td>
              <td className="num">{money(order.subtotal)}</td>
            </tr>
            <tr>
              <td colSpan={5} className="num">
                運費
              </td>
              <td className="num">{money(order.shipping_fee)}</td>
            </tr>
            <tr>
              <td colSpan={5} className="num">
                <b>總計</b>
              </td>
              <td className="num">
                <b>{money(order.total)}</b>
              </td>
            </tr>
          </tfoot>
        </table>
        {order.note && (
          <div className="box" style={{ marginTop: "5mm" }}>
            <b>買家備註</b>
            <div style={{ whiteSpace: "pre-wrap" }}>{order.note}</div>
          </div>
        )}
        <p style={{ marginTop: "8mm", fontSize: "9pt" }}>謝謝你支持新銳藝術家。商品如有問題，請於到貨 7 日內與我們聯繫。</p>
      </section>

      {/* 第 2 頁：揀貨單（倉庫內部） */}
      <section className="a4" aria-label="揀貨單">
        <div className="a4-head">
          <div>
            <h1>揀貨單</h1>
            <div>訂單編號：{orderNo}</div>
            <div>
              收件人：{order.recipient_name} · {label(SHIP_METHOD_LABELS, order.ship_method)}
            </div>
            <div>列印時間：{fmtDateTime(new Date().toISOString())}</div>
          </div>
        </div>
        <table>
          <thead>
            <tr>
              <th style={{ width: "10mm" }}>揀</th>
              <th>品名 / 商品編號</th>
              <th style={{ width: "40mm" }}>規格</th>
              <th style={{ width: "16mm" }} className="num">
                數量
              </th>
            </tr>
          </thead>
          <tbody>
            {items.map((it) => (
              <tr key={it.id}>
                <td>
                  <span className="check" />
                </td>
                <td>
                  {it.product?.name ?? "—"}
                  <div style={{ fontSize: "8.5pt", fontFamily: "var(--font-mono)" }}>{it.product_id ?? ""}</div>
                </td>
                <td>{[it.color, it.size].filter(Boolean).join("／") || "單一規格"}</td>
                <td className="num" style={{ fontSize: "13pt" }}>
                  <b>{it.qty}</b>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <p style={{ marginTop: "6mm", fontSize: "9.5pt" }}>完成每個步驟後，於「出貨掃描站」掃描對應條碼：</p>
        {order.order_no ? (
          <div className="bc">
            {STATIONS.map((s) => {
              const code = encodeBarcode(order.order_no!, s);
              return code ? <Barcode key={s} payload={code.payload} caption={code.caption} /> : null;
            })}
          </div>
        ) : (
          <p>條碼不可用（訂單編號格式不符）</p>
        )}
        <p style={{ fontSize: "8.5pt", marginTop: "4mm" }}>站別：{STATIONS.map((s) => STATION_LABELS[s]).join(" → ")}</p>
      </section>
    </div>
  );
}
