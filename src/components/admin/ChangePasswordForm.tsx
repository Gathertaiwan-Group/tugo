"use client";

import { useState } from "react";
import { adminFetch } from "@/components/admin/adminFetch";

export default function ChangePasswordForm() {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ kind: "ok" | "err"; text: string } | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (next !== confirm) return setMsg({ kind: "err", text: "兩次輸入的新密碼不一致" });
    setBusy(true);
    const r = await adminFetch("/api/admin/me/password", { body: { current, next } });
    setBusy(false);
    if (r.ok) {
      setMsg({ kind: "ok", text: "密碼已更新，其他裝置的登入已失效" });
      setCurrent("");
      setNext("");
      setConfirm("");
    } else setMsg({ kind: "err", text: r.message });
  }
  return (
    <form onSubmit={submit} className="adm-stack">
      {msg && (
        <div className="adm-msg" data-kind={msg.kind} role="status">
          {msg.text}
        </div>
      )}
      <div className="adm-field">
        <label className="adm-label" htmlFor="pw-cur">
          目前密碼
        </label>
        <input id="pw-cur" className="adm-input" type="password" autoComplete="current-password" value={current} onChange={(e) => setCurrent(e.target.value)} required />
      </div>
      <div className="adm-field">
        <label className="adm-label" htmlFor="pw-new">
          新密碼（至少 10 碼）
        </label>
        <input id="pw-new" className="adm-input" type="password" autoComplete="new-password" minLength={10} value={next} onChange={(e) => setNext(e.target.value)} required />
      </div>
      <div className="adm-field">
        <label className="adm-label" htmlFor="pw-cf">
          再輸入一次
        </label>
        <input id="pw-cf" className="adm-input" type="password" autoComplete="new-password" minLength={10} value={confirm} onChange={(e) => setConfirm(e.target.value)} required />
      </div>
      <div>
        <button className="adm-btn adm-btn--primary" disabled={busy}>
          {busy ? "更新中…" : "更新密碼"}
        </button>
      </div>
    </form>
  );
}
