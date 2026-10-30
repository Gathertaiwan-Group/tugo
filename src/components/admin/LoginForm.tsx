"use client";

import { useState } from "react";

export default function LoginForm({ next }: { next: string }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setErr("");
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string };
      if (res.ok && data.ok) {
        // 整頁跳轉：避免 client router 快取住登入前「導去登入頁」的預取結果
        window.location.replace(next);
        return;
      }
      setErr(data.error === "rate_limited" ? "嘗試次數過多，請 10 分鐘後再試" : data.error === "not_configured" ? "後台尚未設定完成" : "Email 或密碼錯誤");
    } catch {
      setErr("網路錯誤，請稍後再試");
    }
    setBusy(false);
  }

  return (
    <form onSubmit={submit} className="adm-stack">
      {err && (
        <div className="adm-msg" data-kind="err" role="alert">
          {err}
        </div>
      )}
      <div className="adm-field">
        <label className="adm-label" htmlFor="login-email">
          Email
        </label>
        <input id="login-email" className="adm-input" type="email" autoComplete="username" required value={email} onChange={(e) => setEmail(e.target.value)} />
      </div>
      <div className="adm-field">
        <label className="adm-label" htmlFor="login-pw">
          密碼
        </label>
        <input
          id="login-pw"
          className="adm-input"
          type="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </div>
      <button className="adm-btn adm-btn--primary" disabled={busy}>
        {busy ? "登入中…" : "登入"}
      </button>
    </form>
  );
}
