"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { adminFetch } from "@/components/admin/adminFetch";
import { FULFILLMENT_LABELS, FULFILLMENT_STATUSES, ORDER_STATUSES, ORDER_STATUS_LABELS } from "@/lib/admin/format";

type OrderLike = {
  id: string;
  recipient_name: string;
  phone: string;
  email: string;
  ship_method: string;
  city: string | null;
  address: string | null;
  cvs_store: string | null;
  note: string | null;
  status: string;
  fulfillment_status: string;
  carrier: string | null;
  tracking_no: string | null;
};
const FIELDS = ["recipient_name", "phone", "email", "ship_method", "city", "address", "cvs_store", "note", "status", "fulfillment_status", "carrier", "tracking_no"] as const;
type Field = (typeof FIELDS)[number];

export default function OrderEditForm({ order, readOnly }: { order: OrderLike; readOnly?: boolean }) {
  const router = useRouter();
  const initial = Object.fromEntries(FIELDS.map((f) => [f, order[f] ?? ""])) as Record<Field, string>;
  const [v, setV] = useState(initial);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ kind: "ok" | "err"; text: string } | null>(null);

  const set = (f: Field) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setV((s) => ({ ...s, [f]: e.target.value }));
  const changed = FIELDS.filter((f) => v[f] !== initial[f]);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!changed.length) return;
    setBusy(true);
    setMsg(null);
    const body = Object.fromEntries(changed.map((f) => [f, v[f]]));
    const r = await adminFetch("/api/admin/orders/" + order.id, { method: "PATCH", body });
    setBusy(false);
    if (r.ok) {
      setMsg({ kind: "ok", text: "已儲存" });
      router.refresh();
    } else setMsg({ kind: "err", text: r.message });
  }

  const fid = (f: string) => `of-${f}`;
  return (
    <form onSubmit={save}>
      {msg && (
        <div className="adm-msg" data-kind={msg.kind} role="status">
          {msg.text}
        </div>
      )}
      <fieldset disabled={readOnly || busy} style={{ border: 0, padding: 0, margin: 0 }}>
        <div className="adm-form-grid">
          <div className="adm-field">
            <label className="adm-label" htmlFor={fid("status")}>
              付款狀態
            </label>
            <select id={fid("status")} className="adm-select" value={v.status} onChange={set("status")}>
              {!ORDER_STATUSES.includes(v.status as (typeof ORDER_STATUSES)[number]) && <option value={v.status}>{v.status}</option>}
              {ORDER_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {ORDER_STATUS_LABELS[s]}
                </option>
              ))}
            </select>
          </div>
          <div className="adm-field">
            <label className="adm-label" htmlFor={fid("fulfillment_status")}>
              出貨狀態
            </label>
            <select id={fid("fulfillment_status")} className="adm-select" value={v.fulfillment_status} onChange={set("fulfillment_status")}>
              {FULFILLMENT_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {FULFILLMENT_LABELS[s]}
                </option>
              ))}
            </select>
            <div className="adm-hint">手動改站別會留下一筆「後台手動指定」紀錄</div>
          </div>
          <div className="adm-field">
            <label className="adm-label" htmlFor={fid("carrier")}>
              物流商
            </label>
            <input id={fid("carrier")} className="adm-input" value={v.carrier} onChange={set("carrier")} maxLength={120} placeholder="例：黑貓、7-11" />
          </div>
          <div className="adm-field">
            <label className="adm-label" htmlFor={fid("tracking_no")}>
              物流單號
            </label>
            <input id={fid("tracking_no")} className="adm-input" value={v.tracking_no} onChange={set("tracking_no")} maxLength={120} />
          </div>
          <div className="adm-field">
            <label className="adm-label" htmlFor={fid("recipient_name")}>
              收件人
            </label>
            <input id={fid("recipient_name")} className="adm-input" value={v.recipient_name} onChange={set("recipient_name")} maxLength={60} required />
          </div>
          <div className="adm-field">
            <label className="adm-label" htmlFor={fid("phone")}>
              手機
            </label>
            <input id={fid("phone")} className="adm-input" value={v.phone} onChange={set("phone")} inputMode="tel" maxLength={32} required />
          </div>
          <div className="adm-field">
            <label className="adm-label" htmlFor={fid("email")}>
              Email
            </label>
            <input id={fid("email")} className="adm-input" type="email" value={v.email} onChange={set("email")} required />
          </div>
          <div className="adm-field">
            <label className="adm-label" htmlFor={fid("ship_method")}>
              配送方式
            </label>
            <select id={fid("ship_method")} className="adm-select" value={v.ship_method} onChange={set("ship_method")}>
              <option value="home">宅配到府</option>
              <option value="cvs">超商取貨</option>
            </select>
          </div>
          {v.ship_method === "cvs" ? (
            <div className="adm-field span-2">
              <label className="adm-label" htmlFor={fid("cvs_store")}>
                超商門市
              </label>
              <input id={fid("cvs_store")} className="adm-input" value={v.cvs_store} onChange={set("cvs_store")} maxLength={120} />
            </div>
          ) : (
            <>
              <div className="adm-field">
                <label className="adm-label" htmlFor={fid("city")}>
                  縣市
                </label>
                <input id={fid("city")} className="adm-input" value={v.city} onChange={set("city")} maxLength={120} />
              </div>
              <div className="adm-field">
                <label className="adm-label" htmlFor={fid("address")}>
                  地址
                </label>
                <input id={fid("address")} className="adm-input" value={v.address} onChange={set("address")} maxLength={300} />
              </div>
            </>
          )}
          <div className="adm-field span-2">
            <label className="adm-label" htmlFor={fid("note")}>
              買家備註
            </label>
            <textarea id={fid("note")} className="adm-textarea" value={v.note} onChange={set("note")} maxLength={2000} />
          </div>
        </div>
        {!readOnly && (
          <div className="adm-actions" style={{ marginTop: 14 }}>
            <button className="adm-btn adm-btn--primary" disabled={!changed.length || busy}>
              {busy ? "儲存中…" : changed.length ? `儲存變更（${changed.length}）` : "無變更"}
            </button>
            {changed.length > 0 && (
              <button type="button" className="adm-btn adm-btn--ghost" onClick={() => setV(initial)}>
                還原
              </button>
            )}
          </div>
        )}
      </fieldset>
    </form>
  );
}
