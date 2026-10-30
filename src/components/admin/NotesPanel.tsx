"use client";

import { useState } from "react";
import { adminFetch } from "@/components/admin/adminFetch";
import { fmtDateTime } from "@/lib/admin/format";

export type NoteItem = { id: number; body: string; admin_id: string | null; admin_name: string | null; created_at: string };

/** 內部備註（訂單 / 合作申請 / 客戶共用）。只在後台顯示，不會給顧客看到。 */
export default function NotesPanel({
  subjectType,
  subjectId,
  initialNotes,
  title = "內部備註",
}: {
  subjectType: "order" | "application" | "customer";
  subjectId: string;
  initialNotes: NoteItem[];
  title?: string;
}) {
  const [notes, setNotes] = useState<NoteItem[]>(initialNotes);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  async function add(e: React.FormEvent) {
    e.preventDefault();
    const body = text.trim();
    if (!body) return;
    setBusy(true);
    setErr("");
    const r = await adminFetch<{ note: NoteItem }>("/api/admin/notes", { body: { subject_type: subjectType, subject_id: subjectId, body } });
    setBusy(false);
    if (!r.ok) return setErr(r.message);
    setNotes((n) => [r.data.note, ...n]);
    setText("");
  }

  async function remove(id: number) {
    if (!window.confirm("確定刪除這則備註？")) return;
    const r = await adminFetch(`/api/admin/notes/${id}`, { method: "DELETE" });
    if (!r.ok) return setErr(r.message);
    setNotes((n) => n.filter((x) => x.id !== id));
  }

  return (
    <section className="adm-card">
      <h2 className="adm-h2">{title}</h2>
      {err && (
        <div className="adm-msg" data-kind="err" role="alert">
          {err}
        </div>
      )}
      <form onSubmit={add} className="adm-stack" style={{ gap: 8, marginBottom: 12 }}>
        <label className="adm-sr" htmlFor={`note-${subjectType}`}>
          新增備註
        </label>
        <textarea
          id={`note-${subjectType}`}
          className="adm-textarea"
          maxLength={2000}
          placeholder="只有後台看得到的備註…"
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
        <div>
          <button className="adm-btn adm-btn--primary adm-btn--sm" disabled={busy || !text.trim()}>
            {busy ? "儲存中…" : "新增備註"}
          </button>
        </div>
      </form>
      {notes.length === 0 ? (
        <p className="adm-muted adm-small">尚無備註</p>
      ) : (
        <ul className="adm-list">
          {notes.map((n) => (
            <li key={n.id}>
              <div style={{ whiteSpace: "pre-wrap", overflowWrap: "anywhere" }}>{n.body}</div>
              <div className="adm-small adm-muted" style={{ display: "flex", gap: 8, alignItems: "center", marginTop: 4 }}>
                <span>
                  {n.admin_name ?? "—"} · {fmtDateTime(n.created_at)}
                </span>
                <button type="button" className="adm-btn adm-btn--ghost adm-btn--sm" style={{ minHeight: 26 }} onClick={() => remove(n.id)}>
                  刪除
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
