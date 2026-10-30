"use client";

import { useState } from "react";
import { adminFetch } from "@/components/admin/adminFetch";

/** 刪除按鈕：確認 → DELETE → 成功後導向 redirectTo（或整頁重載）；失敗顯示伺服器訊息。 */
export default function DeleteButton({
  url,
  body,
  confirmText,
  redirectTo,
  label = "刪除",
  small = true,
}: {
  url: string;
  body?: Record<string, unknown>;
  confirmText: string;
  redirectTo?: string;
  label?: string;
  small?: boolean;
}) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  async function run() {
    if (!window.confirm(confirmText)) return;
    setBusy(true);
    setErr("");
    const r = await adminFetch(url, { method: "DELETE", body: body ?? {} });
    if (r.ok) {
      if (redirectTo) window.location.replace(redirectTo);
      else window.location.reload();
      return;
    }
    setErr(r.message);
    setBusy(false);
  }
  return (
    <span style={{ display: "inline-flex", flexDirection: "column", gap: 4 }}>
      <button type="button" className={`adm-btn adm-btn--danger${small ? " adm-btn--sm" : ""}`} onClick={run} disabled={busy}>
        {busy ? "處理中…" : label}
      </button>
      {err && (
        <span className="adm-small" style={{ color: "var(--color-error)" }} role="alert">
          {err}
        </span>
      )}
    </span>
  );
}
