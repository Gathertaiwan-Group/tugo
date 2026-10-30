"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { adminFetch } from "@/components/admin/adminFetch";
import { fmtDateTime } from "@/lib/admin/format";
import { Cell, Pill } from "@/components/admin/ui";

type User = { id: string; email: string; name: string | null; role: "owner" | "staff"; active: boolean; created_at: string; last_login_at: string | null };
const COLS = "minmax(0,1.6fr) minmax(0,0.8fr) minmax(0,1fr) minmax(0,0.7fr) minmax(0,1.6fr)";

export default function UsersManager({ initialUsers, meId }: { initialUsers: User[]; meId: string }) {
  const router = useRouter();
  const [form, setForm] = useState({ email: "", name: "", password: "", role: "staff" });
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ kind: "ok" | "err"; text: string } | null>(null);

  async function create(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const r = await adminFetch("/api/admin/users", { body: form });
    setBusy(false);
    if (r.ok) {
      setMsg({ kind: "ok", text: `已新增 ${form.email}` });
      setForm({ email: "", name: "", password: "", role: "staff" });
      router.refresh();
    } else setMsg({ kind: "err", text: r.message });
  }

  async function patch(u: User, body: Record<string, unknown>, done: string) {
    setMsg(null);
    const r = await adminFetch(`/api/admin/users/${u.id}`, { method: "PATCH", body });
    if (r.ok) {
      setMsg({ kind: "ok", text: done });
      router.refresh();
    } else setMsg({ kind: "err", text: r.message });
  }

  function resetPassword(u: User) {
    const pw = window.prompt(`為 ${u.email} 設定新密碼（至少 10 碼）。設定後對方需用新密碼重新登入。`);
    if (pw) void patch(u, { password: pw }, `已重設 ${u.email} 的密碼`);
  }

  return (
    <div className="adm-stack">
      {msg && (
        <div className="adm-msg" data-kind={msg.kind} role="status">
          {msg.text}
        </div>
      )}
      <div className="adm-table" style={{ "--cols": COLS } as React.CSSProperties}>
        <div className="adm-thead">
          <span>管理員</span>
          <span>角色</span>
          <span>最後登入</span>
          <span>狀態</span>
          <span>操作</span>
        </div>
        {initialUsers.map((u) => {
          const me = u.id === meId;
          return (
            <div key={u.id} className="adm-row">
              <Cell label="管理員" full>
                <strong>{u.name || "（未命名）"}</strong>
                {me && <span className="adm-muted adm-small">（你）</span>}
                <div className="adm-muted adm-small">{u.email}</div>
              </Cell>
              <Cell label="角色">
                <select
                  className="adm-select"
                  aria-label={`${u.email} 的角色`}
                  value={u.role}
                  disabled={me}
                  onChange={(e) => void patch(u, { role: e.target.value }, `已變更 ${u.email} 的角色`)}
                >
                  <option value="owner">擁有者</option>
                  <option value="staff">工作人員</option>
                </select>
              </Cell>
              <Cell label="最後登入">
                <span className="adm-small">{fmtDateTime(u.last_login_at)}</span>
              </Cell>
              <Cell label="狀態">
                <Pill status={u.active ? "paid" : "cancelled"}>{u.active ? "啟用" : "停用"}</Pill>
              </Cell>
              <Cell label="操作" full>
                <div className="adm-actions">
                  {!me && (
                    <button
                      type="button"
                      className={`adm-btn adm-btn--sm ${u.active ? "adm-btn--danger" : "adm-btn--ghost"}`}
                      onClick={() => void patch(u, { active: !u.active }, u.active ? `已停用 ${u.email}（登入立即失效）` : `已啟用 ${u.email}`)}
                    >
                      {u.active ? "停用" : "啟用"}
                    </button>
                  )}
                  <button type="button" className="adm-btn adm-btn--ghost adm-btn--sm" onClick={() => resetPassword(u)}>
                    重設密碼
                  </button>
                </div>
              </Cell>
            </div>
          );
        })}
      </div>

      <section className="adm-card">
        <h2 className="adm-h2">新增管理員</h2>
        <form onSubmit={create}>
          <div className="adm-form-grid">
            <div className="adm-field">
              <label className="adm-label" htmlFor="nu-email">
                Email
              </label>
              <input id="nu-email" className="adm-input" type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </div>
            <div className="adm-field">
              <label className="adm-label" htmlFor="nu-name">
                姓名（選填）
              </label>
              <input id="nu-name" className="adm-input" maxLength={60} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div className="adm-field">
              <label className="adm-label" htmlFor="nu-pw">
                初始密碼（至少 10 碼）
              </label>
              <input
                id="nu-pw"
                className="adm-input"
                type="password"
                autoComplete="new-password"
                minLength={10}
                required
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
              />
            </div>
            <div className="adm-field">
              <label className="adm-label" htmlFor="nu-role">
                角色
              </label>
              <select id="nu-role" className="adm-select" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
                <option value="staff">工作人員</option>
                <option value="owner">擁有者</option>
              </select>
            </div>
          </div>
          <div className="adm-actions" style={{ marginTop: 14 }}>
            <button className="adm-btn adm-btn--primary" disabled={busy}>
              {busy ? "新增中…" : "新增管理員"}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
