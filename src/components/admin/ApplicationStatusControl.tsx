"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { adminFetch } from "@/components/admin/adminFetch";
import { APPLICATION_STATUSES, APPLICATION_STATUS_LABELS } from "@/lib/admin/format";

export default function ApplicationStatusControl({ id, status }: { id: string; status: string }) {
  const router = useRouter();
  const [value, setValue] = useState(status);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ kind: "ok" | "err"; text: string } | null>(null);

  async function save() {
    setBusy(true);
    setMsg(null);
    const r = await adminFetch(`/api/admin/applications/${id}`, { method: "PATCH", body: { status: value } });
    setBusy(false);
    if (!r.ok) return setMsg({ kind: "err", text: r.message });
    setMsg({ kind: "ok", text: "已更新狀態" });
    router.refresh();
  }

  return (
    <div className="adm-stack" style={{ gap: 10 }}>
      {msg && (
        <div className="adm-msg" data-kind={msg.kind} role="status">
          {msg.text}
        </div>
      )}
      <label className="adm-label" htmlFor="app-status">
        狀態
      </label>
      <select id="app-status" className="adm-select" value={value} onChange={(e) => setValue(e.target.value)}>
        {APPLICATION_STATUSES.map((s) => (
          <option key={s} value={s}>
            {APPLICATION_STATUS_LABELS[s]}
          </option>
        ))}
      </select>
      <div>
        <button className="adm-btn adm-btn--primary adm-btn--sm" onClick={save} disabled={busy || value === status}>
          {busy ? "儲存中…" : "更新狀態"}
        </button>
      </div>
    </div>
  );
}
