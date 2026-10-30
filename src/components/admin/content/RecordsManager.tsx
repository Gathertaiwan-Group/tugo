"use client";

import { useState } from "react";
import { adminFetch } from "@/components/admin/adminFetch";

/** FAQ / 條款段落共用：每筆一張可編輯卡（儲存 / 刪除）＋ 底部新增表單。 */
export type RecField = { key: string; label: string; kind: "text" | "textarea" | "int"; max?: number; rows?: number };
type Rec = { id: number } & Record<string, string | number | null>;

function toPayload(fields: RecField[], v: Record<string, string>, fixed: Record<string, string>) {
  const out: Record<string, unknown> = { ...fixed };
  for (const f of fields) out[f.key] = f.kind === "int" ? Number(v[f.key] || 0) : v[f.key];
  return out;
}

function Fields({ prefix, fields, v, set }: { prefix: string; fields: RecField[]; v: Record<string, string>; set: (k: string, val: string) => void }) {
  return (
    <div className="adm-form-grid">
      {fields.map((f) => (
        <div key={f.key} className={`adm-field${f.kind === "textarea" ? " span-2" : ""}`}>
          <label className="adm-label" htmlFor={`${prefix}-${f.key}`}>
            {f.label}
          </label>
          {f.kind === "textarea" ? (
            <textarea
              id={`${prefix}-${f.key}`}
              className="adm-textarea"
              style={{ minHeight: (f.rows ?? 5) * 22 }}
              maxLength={f.max}
              value={v[f.key] ?? ""}
              onChange={(e) => set(f.key, e.target.value)}
            />
          ) : (
            <input
              id={`${prefix}-${f.key}`}
              className="adm-input"
              inputMode={f.kind === "int" ? "numeric" : undefined}
              maxLength={f.max}
              value={v[f.key] ?? ""}
              onChange={(e) => set(f.key, f.kind === "int" ? e.target.value.replace(/[^\d]/g, "") : e.target.value)}
            />
          )}
        </div>
      ))}
    </div>
  );
}

function RecCard({ rec, fields, apiBase, fixed, title }: { rec: Rec; fields: RecField[]; apiBase: string; fixed: Record<string, string>; title: string }) {
  const [v, setV] = useState<Record<string, string>>(Object.fromEntries(fields.map((f) => [f.key, rec[f.key] == null ? "" : String(rec[f.key])])));
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ kind: "ok" | "err"; text: string } | null>(null);
  async function save() {
    setBusy(true);
    const r = await adminFetch(`${apiBase}/${rec.id}`, { method: "PATCH", body: toPayload(fields, v, fixed) });
    setBusy(false);
    setMsg(r.ok ? { kind: "ok", text: "已儲存" } : { kind: "err", text: r.message });
  }
  async function remove() {
    if (!window.confirm(`確定刪除「${title}」？`)) return;
    setBusy(true);
    const r = await adminFetch(`${apiBase}/${rec.id}`, { method: "DELETE", body: {} });
    setBusy(false);
    if (r.ok) window.location.reload();
    else setMsg({ kind: "err", text: r.message });
  }
  return (
    <article className="adm-card">
      {msg && (
        <div className="adm-msg" data-kind={msg.kind} role={msg.kind === "err" ? "alert" : "status"}>
          {msg.text}
        </div>
      )}
      <Fields prefix={`rec-${rec.id}`} fields={fields} v={v} set={(k, val) => setV((p) => ({ ...p, [k]: val }))} />
      <div className="adm-actions" style={{ marginTop: 12 }}>
        <button type="button" className="adm-btn adm-btn--primary adm-btn--sm" disabled={busy} onClick={save}>
          儲存
        </button>
        <button type="button" className="adm-btn adm-btn--danger adm-btn--sm" disabled={busy} onClick={remove}>
          刪除
        </button>
      </div>
    </article>
  );
}

export default function RecordsManager({
  records,
  fields,
  apiBase,
  fixed = {},
  titleKey,
  newDefaults = {},
  emptyText,
}: {
  records: Rec[];
  fields: RecField[];
  apiBase: string;
  fixed?: Record<string, string>;
  titleKey: string;
  newDefaults?: Record<string, string>;
  emptyText: string;
}) {
  const nextSort = String(records.reduce((m, r) => Math.max(m, Number(r.sort ?? 0)), -1) + 1);
  const [nv, setNv] = useState<Record<string, string>>({ ...newDefaults, sort: nextSort });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  async function add(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setErr("");
    const r = await adminFetch(apiBase, { method: "POST", body: toPayload(fields, nv, fixed) });
    setBusy(false);
    if (r.ok) window.location.reload();
    else setErr(r.message);
  }
  return (
    <div className="adm-stack">
      {records.length === 0 ? <div className="adm-empty">{emptyText}</div> : records.map((r) => <RecCard key={r.id} rec={r} fields={fields} apiBase={apiBase} fixed={fixed} title={String(r[titleKey] ?? r.id)} />)}
      <form className="adm-card" onSubmit={add} style={{ borderStyle: "dashed" }}>
        <h2 className="adm-h2">新增一筆</h2>
        {err && (
          <div className="adm-msg" data-kind="err" role="alert">
            {err}
          </div>
        )}
        <Fields prefix="rec-new" fields={fields} v={nv} set={(k, val) => setNv((p) => ({ ...p, [k]: val }))} />
        <div className="adm-actions" style={{ marginTop: 12 }}>
          <button className="adm-btn adm-btn--primary" disabled={busy}>
            新增
          </button>
        </div>
      </form>
    </div>
  );
}
