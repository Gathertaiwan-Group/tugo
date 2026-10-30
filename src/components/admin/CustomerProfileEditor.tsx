"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { adminFetch } from "@/components/admin/adminFetch";
import { CUSTOMER_TIERS, CUSTOMER_TIER_LABELS } from "@/lib/admin/customers";

type Profile = {
  display_name: string;
  phone: string;
  tier: string;
  tags: string[];
  source_channel: string;
  preferred_artists: string[];
  preferred_categories: string[];
  size_pref: string;
  ai_summary: string;
  service_notes: string;
};

const LIST_KEYS = ["tags", "preferred_artists", "preferred_categories"] as const;

export default function CustomerProfileEditor({ customerKey, initial }: { customerKey: string; initial: Profile }) {
  const router = useRouter();
  const [f, setF] = useState({
    ...initial,
    tags: initial.tags.join("、"),
    preferred_artists: initial.preferred_artists.join("、"),
    preferred_categories: initial.preferred_categories.join("、"),
  });
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ kind: "ok" | "err"; text: string } | null>(null);

  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setF((cur) => ({ ...cur, [k]: e.target.value }));

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    const body: Record<string, unknown> = { ...f };
    for (const k of LIST_KEYS) {
      body[k] = String(f[k])
        .split(/[,，、\n]/)
        .map((s) => s.trim())
        .filter(Boolean);
    }
    const r = await adminFetch(`/api/admin/customers/${customerKey}`, { method: "PATCH", body });
    setBusy(false);
    if (!r.ok) return setMsg({ kind: "err", text: r.message });
    setMsg({ kind: "ok", text: "已儲存客戶樣貌" });
    router.refresh();
  }

  const field = (k: keyof typeof f, lab: string, opts: { hint?: string; long?: boolean; max?: number } = {}) => (
    <div className={`adm-field${opts.long ? " span-2" : ""}`}>
      <label className="adm-label" htmlFor={`cp-${k}`}>
        {lab}
      </label>
      {opts.long ? (
        <textarea id={`cp-${k}`} className="adm-textarea" maxLength={2000} value={String(f[k])} onChange={set(k)} />
      ) : (
        <input id={`cp-${k}`} className="adm-input" maxLength={opts.max ?? 120} value={String(f[k])} onChange={set(k)} />
      )}
      {opts.hint && <div className="adm-hint">{opts.hint}</div>}
    </div>
  );

  return (
    <section className="adm-card">
      <h2 className="adm-h2">客戶樣貌與偏好</h2>
      {msg && (
        <div className="adm-msg" data-kind={msg.kind} role="status">
          {msg.text}
        </div>
      )}
      <form onSubmit={save} className="adm-form-grid">
        {field("display_name", "稱呼（覆蓋訂單姓名）")}
        {field("phone", "電話", { max: 32 })}
        <div className="adm-field">
          <label className="adm-label" htmlFor="cp-tier">
            等級
          </label>
          <select id="cp-tier" className="adm-select" value={f.tier} onChange={set("tier")}>
            {CUSTOMER_TIERS.map((t) => (
              <option key={t} value={t}>
                {CUSTOMER_TIER_LABELS[t]}
              </option>
            ))}
          </select>
        </div>
        {field("source_channel", "來源通路", { hint: "例：IG、市集、朋友介紹" })}
        {field("tags", "標籤", { hint: "以頓號或逗號分隔，最多 12 個", max: 1200 })}
        {field("preferred_artists", "偏好藝術家", { hint: "以頓號或逗號分隔", max: 1200 })}
        {field("preferred_categories", "偏好品類", { hint: "以頓號或逗號分隔", max: 1200 })}
        {field("size_pref", "尺寸／規格偏好")}
        {field("ai_summary", "客戶摘要", { long: true })}
        {field("service_notes", "服務注意事項", { long: true })}
        <div className="span-2">
          <button className="adm-btn adm-btn--primary" disabled={busy}>
            {busy ? "儲存中…" : "儲存"}
          </button>
        </div>
      </form>
    </section>
  );
}
