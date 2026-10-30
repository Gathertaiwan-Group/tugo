"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { adminFetch } from "@/components/admin/adminFetch";
import { emailToKey, fmtDateTime, fromTaipeiLocalInput, toTaipeiLocalInput } from "@/lib/admin/format";
import {
  FOLLOWUP_PRIORITIES,
  FOLLOWUP_STATUSES,
  FOLLOWUP_STATUS_LABELS,
  PRIORITY_LABELS,
  RELATED_LABELS,
  RELATED_TYPES,
  bucketOf,
  type Bucket,
} from "@/lib/admin/followups";

export type FollowupRow = {
  id: string;
  title: string;
  reason: string | null;
  priority: string;
  status: string;
  assignee_id: string | null;
  due_at: string;
  completed_at: string | null;
  related_type: string | null;
  related_id: string | null;
  customer_email: string | null;
  created_at: string;
};
type Admin = { id: string; name: string };
type Prefill = { title: string; related_type: string; related_id: string; customer_email: string } | null;

const BUCKETS: { key: Bucket; label: string }[] = [
  { key: "overdue", label: "逾期" },
  { key: "today", label: "今天" },
  { key: "week", label: "7 天內" },
  { key: "later", label: "之後" },
];

type FormState = {
  title: string;
  reason: string;
  priority: string;
  status: string;
  assignee_id: string;
  due_local: string;
  related_type: string;
  related_id: string;
  customer_email: string;
};

function defaultDue(): string {
  return toTaipeiLocalInput(new Date(Date.now() + 86_400_000).toISOString());
}

function relatedHref(r: Pick<FollowupRow, "related_type" | "related_id" | "customer_email">): string | null {
  if (!r.related_type || !r.related_id) return r.customer_email ? `/admin/customers/${emailToKey(r.customer_email)}` : null;
  if (r.related_type === "order") return `/admin/orders/${r.related_id}`;
  if (r.related_type === "application") return `/admin/applications/${r.related_id}`;
  return `/admin/customers/${emailToKey(r.related_id)}`;
}

export default function FollowupBoard({ tab, rows, admins, prefill }: { tab: string; rows: FollowupRow[]; admins: Admin[]; prefill: Prefill }) {
  const router = useRouter();
  const [editing, setEditing] = useState<string | "new" | null>(prefill ? "new" : null);
  const [form, setForm] = useState<FormState>(() => ({
    title: prefill?.title ?? "",
    reason: "",
    priority: "medium",
    status: "open",
    assignee_id: "",
    due_local: defaultDue(),
    related_type: prefill?.related_type ?? "",
    related_id: prefill?.related_id ?? "",
    customer_email: prefill?.customer_email ?? "",
  }));
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ kind: "ok" | "err"; text: string } | null>(null);
  const adminName = useMemo(() => new Map(admins.map((a) => [a.id, a.name])), [admins]);

  const buckets = useMemo(() => {
    const now = Date.now();
    const m: Record<Bucket, FollowupRow[]> = { overdue: [], today: [], week: [], later: [] };
    for (const r of rows) m[bucketOf(r.due_at, now)].push(r);
    return m;
  }, [rows]);

  function startNew() {
    setForm({ title: "", reason: "", priority: "medium", status: "open", assignee_id: "", due_local: defaultDue(), related_type: "", related_id: "", customer_email: "" });
    setEditing("new");
    setMsg(null);
  }
  function startEdit(r: FollowupRow) {
    setForm({
      title: r.title,
      reason: r.reason ?? "",
      priority: r.priority,
      status: r.status,
      assignee_id: r.assignee_id ?? "",
      due_local: toTaipeiLocalInput(r.due_at),
      related_type: r.related_type ?? "",
      related_id: r.related_id ?? "",
      customer_email: r.customer_email ?? "",
    });
    setEditing(r.id);
    setMsg(null);
    requestAnimationFrame(() => document.getElementById("fu-form")?.scrollIntoView({ behavior: "smooth", block: "start" }));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const due = fromTaipeiLocalInput(form.due_local);
    if (!due) return setMsg({ kind: "err", text: "請填寫到期時間" });
    const body = {
      title: form.title,
      reason: form.reason,
      priority: form.priority,
      status: form.status,
      assignee_id: form.assignee_id,
      due_at: due,
      related_type: form.related_type,
      related_id: form.related_type ? form.related_id : "",
      customer_email: form.customer_email,
    };
    setBusy(true);
    setMsg(null);
    const r =
      editing === "new"
        ? await adminFetch("/api/admin/followups", { body })
        : await adminFetch(`/api/admin/followups/${editing}`, { method: "PATCH", body });
    setBusy(false);
    if (!r.ok) return setMsg({ kind: "err", text: r.message });
    setEditing(null);
    setMsg({ kind: "ok", text: "已儲存" });
    if (prefill) router.replace("/admin/followups");
    else router.refresh();
  }

  async function setStatus(id: string, status: string) {
    const r = await adminFetch(`/api/admin/followups/${id}`, { method: "PATCH", body: { status } });
    if (!r.ok) return setMsg({ kind: "err", text: r.message });
    router.refresh();
  }

  const set = (k: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const card = (r: FollowupRow) => {
    const href = relatedHref(r);
    return (
      <article key={r.id} className="adm-fu" data-priority={r.priority}>
        <div style={{ fontWeight: 600, overflowWrap: "anywhere" }}>{r.title}</div>
        {r.reason && <div className="adm-small adm-muted" style={{ overflowWrap: "anywhere", whiteSpace: "pre-wrap" }}>{r.reason}</div>}
        <div className="adm-small adm-muted" style={{ marginTop: 4 }}>
          到期 {fmtDateTime(r.due_at)} · 優先 {PRIORITY_LABELS[r.priority] ?? r.priority}
          {r.assignee_id ? ` · ${adminName.get(r.assignee_id) ?? "（已停用帳號）"}` : " · 未指派"}
        </div>
        {r.completed_at && <div className="adm-small adm-muted">完成於 {fmtDateTime(r.completed_at)}</div>}
        {href && (
          <div className="adm-small" style={{ marginTop: 4, overflowWrap: "anywhere" }}>
            <Link href={href}>
              → {r.related_type ? RELATED_LABELS[r.related_type] : "客戶"}
              {r.customer_email ? ` · ${r.customer_email}` : ""}
            </Link>
          </div>
        )}
        <div className="adm-actions" style={{ marginTop: 8 }}>
          {r.status === "open" ? (
            <button type="button" className="adm-btn adm-btn--primary adm-btn--sm" onClick={() => setStatus(r.id, "completed")}>
              完成
            </button>
          ) : (
            <button type="button" className="adm-btn adm-btn--ghost adm-btn--sm" onClick={() => setStatus(r.id, "open")}>
              重新開啟
            </button>
          )}
          <button type="button" className="adm-btn adm-btn--ghost adm-btn--sm" onClick={() => startEdit(r)}>
            編輯
          </button>
        </div>
      </article>
    );
  };

  return (
    <div className="adm-stack">
      {msg && (
        <div className="adm-msg" data-kind={msg.kind} role="status">
          {msg.text}
        </div>
      )}
      {editing ? (
        <section className="adm-card" id="fu-form">
          <h2 className="adm-h2">{editing === "new" ? "新增回訪" : "編輯回訪"}</h2>
          <form onSubmit={submit} className="adm-form-grid">
            <div className="adm-field span-2">
              <label className="adm-label" htmlFor="fu-title">
                標題 *
              </label>
              <input id="fu-title" className="adm-input" required maxLength={160} value={form.title} onChange={set("title")} />
            </div>
            <div className="adm-field span-2">
              <label className="adm-label" htmlFor="fu-reason">
                原因／內容
              </label>
              <textarea id="fu-reason" className="adm-textarea" maxLength={1000} value={form.reason} onChange={set("reason")} />
            </div>
            <div className="adm-field">
              <label className="adm-label" htmlFor="fu-due">
                到期（台北時間）*
              </label>
              <input id="fu-due" className="adm-input" type="datetime-local" required value={form.due_local} onChange={set("due_local")} />
            </div>
            <div className="adm-field">
              <label className="adm-label" htmlFor="fu-pri">
                優先級
              </label>
              <select id="fu-pri" className="adm-select" value={form.priority} onChange={set("priority")}>
                {FOLLOWUP_PRIORITIES.map((p) => (
                  <option key={p} value={p}>
                    {PRIORITY_LABELS[p]}
                  </option>
                ))}
              </select>
            </div>
            <div className="adm-field">
              <label className="adm-label" htmlFor="fu-assignee">
                負責人
              </label>
              <select id="fu-assignee" className="adm-select" value={form.assignee_id} onChange={set("assignee_id")}>
                <option value="">未指派</option>
                {admins.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="adm-field">
              <label className="adm-label" htmlFor="fu-status">
                狀態
              </label>
              <select id="fu-status" className="adm-select" value={form.status} onChange={set("status")}>
                {FOLLOWUP_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {FOLLOWUP_STATUS_LABELS[s]}
                  </option>
                ))}
              </select>
            </div>
            <div className="adm-field">
              <label className="adm-label" htmlFor="fu-rt">
                關聯類型
              </label>
              <select id="fu-rt" className="adm-select" value={form.related_type} onChange={set("related_type")}>
                <option value="">無</option>
                {RELATED_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {RELATED_LABELS[t]}
                  </option>
                ))}
              </select>
            </div>
            <div className="adm-field">
              <label className="adm-label" htmlFor="fu-rid">
                關聯編號
              </label>
              <input id="fu-rid" className="adm-input" maxLength={254} disabled={!form.related_type} value={form.related_id} onChange={set("related_id")} />
              <div className="adm-hint">訂單 UUID／申請編號／客戶 Email</div>
            </div>
            <div className="adm-field span-2">
              <label className="adm-label" htmlFor="fu-email">
                客戶 Email
              </label>
              <input id="fu-email" className="adm-input" type="email" maxLength={254} value={form.customer_email} onChange={set("customer_email")} />
            </div>
            <div className="span-2 adm-actions">
              <button className="adm-btn adm-btn--primary" disabled={busy}>
                {busy ? "儲存中…" : "儲存"}
              </button>
              <button type="button" className="adm-btn adm-btn--ghost" onClick={() => setEditing(null)}>
                取消
              </button>
            </div>
          </form>
        </section>
      ) : (
        <div>
          <button type="button" className="adm-btn adm-btn--primary" onClick={startNew}>
            ＋ 新增回訪
          </button>
        </div>
      )}

      {tab === "open" ? (
        <div className="adm-board">
          {BUCKETS.map((b) => (
            <section key={b.key} className="adm-board-col">
              <h3>
                {b.label}（{buckets[b.key].length}）
              </h3>
              {buckets[b.key].length === 0 ? <p className="adm-small adm-muted" style={{ margin: "0 4px 6px" }}>無</p> : buckets[b.key].map(card)}
            </section>
          ))}
        </div>
      ) : rows.length === 0 ? (
        <div className="adm-empty">沒有{FOLLOWUP_STATUS_LABELS[tab]}的項目</div>
      ) : (
        <div className="adm-grid-3">{rows.map(card)}</div>
      )}
    </div>
  );
}
