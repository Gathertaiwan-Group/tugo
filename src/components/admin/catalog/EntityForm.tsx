"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { adminFetch } from "@/components/admin/adminFetch";

/**
 * 通用表單（藝術家 / 聯名系列）：依 fields 定義渲染，送出時把 tags 類欄位拆成陣列、數字欄位轉 int。
 * create → POST apiBase，成功後導到 detailBase/<id>；edit → PATCH apiBase/<id>。
 */
export type EntityField = {
  key: string;
  label: string;
  kind: "text" | "textarea" | "int" | "bool" | "list" | "slug" | "multi";
  required?: boolean;
  max?: number;
  hint?: string;
  span?: boolean;
  options?: { value: string; label: string }[];
};

type Values = Record<string, string | boolean | string[]>;

export default function EntityForm({
  mode,
  id,
  apiBase,
  detailBase,
  fields,
  initial,
  submitLabel,
}: {
  mode: "create" | "edit";
  id?: string;
  apiBase: string;
  detailBase: string;
  fields: EntityField[];
  initial: Values;
  submitLabel?: string;
}) {
  const router = useRouter();
  const [v, setV] = useState<Values>(initial);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ kind: "ok" | "err"; text: string } | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    const payload: Record<string, unknown> = {};
    for (const f of fields) {
      if (f.kind === "slug" && mode === "edit") continue;
      const val = v[f.key];
      if (f.kind === "int") {
        const s = String(val ?? "").trim();
        if (s === "") continue;
        const n = Number(s);
        if (!Number.isInteger(n)) return setMsg({ kind: "err", text: `${f.label}必須是整數` });
        payload[f.key] = n;
      } else if (f.kind === "list") {
        payload[f.key] = String(val ?? "")
          .split(/[,，、\n]/)
          .map((x) => x.trim())
          .filter(Boolean);
      } else payload[f.key] = val;
    }
    setBusy(true);
    const r =
      mode === "create"
        ? await adminFetch<{ id: string }>(apiBase, { method: "POST", body: payload })
        : await adminFetch(`${apiBase}/${id}`, { method: "PATCH", body: payload });
    setBusy(false);
    if (!r.ok) return setMsg({ kind: "err", text: r.message });
    if (mode === "create") {
      window.location.replace(`${detailBase}/${(r.data as { id: string }).id}?created=1`);
      return;
    }
    setMsg({ kind: "ok", text: "已儲存，前台會在數秒內更新" });
    router.refresh();
  }

  return (
    <form onSubmit={submit} className="adm-card" noValidate>
      {msg && (
        <div className="adm-msg" data-kind={msg.kind} role={msg.kind === "err" ? "alert" : "status"}>
          {msg.text}
        </div>
      )}
      <div className="adm-form-grid">
        {fields.map((f) => {
          const fid = `ef-${f.key}`;
          const cls = `adm-field${f.span || f.kind === "textarea" || f.kind === "multi" ? " span-2" : ""}`;
          if (f.kind === "bool")
            return (
              <div key={f.key} className={cls}>
                <label className="adm-check">
                  <input type="checkbox" checked={Boolean(v[f.key])} onChange={(e) => setV((p) => ({ ...p, [f.key]: e.target.checked }))} />
                  {f.label}
                </label>
              </div>
            );
          if (f.kind === "multi") {
            const sel = (v[f.key] as string[]) ?? [];
            return (
              <fieldset key={f.key} className={cls} style={{ border: 0, padding: 0, margin: 0 }}>
                <legend className="adm-label">{f.label}</legend>
                <div className="adm-actions" style={{ gap: 12 }}>
                  {(f.options ?? []).map((o) => (
                    <label key={o.value} className="adm-check">
                      <input
                        type="checkbox"
                        checked={sel.includes(o.value)}
                        onChange={() =>
                          setV((p) => {
                            const cur = (p[f.key] as string[]) ?? [];
                            return { ...p, [f.key]: cur.includes(o.value) ? cur.filter((x) => x !== o.value) : [...cur, o.value] };
                          })
                        }
                      />
                      {o.label}
                    </label>
                  ))}
                </div>
                {f.hint && <div className="adm-hint">{f.hint}</div>}
              </fieldset>
            );
          }
          const disabled = f.kind === "slug" && mode === "edit";
          return (
            <div key={f.key} className={cls}>
              <label className="adm-label" htmlFor={fid}>
                {f.label}
                {f.required ? " *" : ""}
              </label>
              {f.kind === "textarea" ? (
                <textarea id={fid} className="adm-textarea" maxLength={f.max} value={String(v[f.key] ?? "")} onChange={(e) => setV((p) => ({ ...p, [f.key]: e.target.value }))} />
              ) : (
                <input
                  id={fid}
                  className={`adm-input${f.kind === "slug" ? " adm-mono" : ""}`}
                  inputMode={f.kind === "int" ? "numeric" : undefined}
                  maxLength={f.max}
                  disabled={disabled}
                  required={f.required}
                  value={String(v[f.key] ?? "")}
                  onChange={(e) =>
                    setV((p) => ({ ...p, [f.key]: f.kind === "slug" ? e.target.value.toLowerCase() : f.kind === "int" ? e.target.value.replace(/[^\d]/g, "") : e.target.value }))
                  }
                />
              )}
              {(f.hint || disabled) && <div className="adm-hint">{disabled ? "代碼建立後不可修改（會影響前台網址）" : f.hint}</div>}
            </div>
          );
        })}
      </div>
      <div className="adm-actions" style={{ marginTop: 16 }}>
        <button className="adm-btn adm-btn--primary" disabled={busy}>
          {busy ? "儲存中…" : (submitLabel ?? (mode === "create" ? "建立" : "儲存變更"))}
        </button>
      </div>
    </form>
  );
}
