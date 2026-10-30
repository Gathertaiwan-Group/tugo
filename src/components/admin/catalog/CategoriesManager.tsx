"use client";

import { useState } from "react";
import { adminFetch } from "@/components/admin/adminFetch";
import ImageUploader from "@/components/admin/catalog/ImageUploader";

type Cat = { id: string; name: string; sort: number; count: number; image: string | null; alt: string | null };

function Row({ c }: { c: Cat }) {
  const [name, setName] = useState(c.name);
  const [sort, setSort] = useState(String(c.sort));
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ kind: "ok" | "err"; text: string } | null>(null);

  async function save() {
    setBusy(true);
    const r = await adminFetch(`/api/admin/categories/${c.id}`, { method: "PATCH", body: { name, sort: Number(sort || 0) } });
    setBusy(false);
    setMsg(r.ok ? { kind: "ok", text: "已儲存" } : { kind: "err", text: r.message });
  }
  async function remove() {
    if (!window.confirm(`確定刪除分類「${c.name}」？`)) return;
    setBusy(true);
    const r = await adminFetch(`/api/admin/categories/${c.id}`, { method: "DELETE", body: {} });
    setBusy(false);
    if (r.ok) window.location.reload();
    else setMsg({ kind: "err", text: r.message });
  }

  return (
    <div className="adm-grid-main" style={{ borderTop: "1px solid var(--color-line-card)", paddingTop: 16 }}>
      <div className="adm-stack" style={{ gap: 10 }}>
        <div className="adm-small adm-muted">
          代碼 <span className="adm-mono">{c.id}</span> · {c.count} 件商品 · 前台 /shop/{c.id}
        </div>
        {msg && (
          <div className="adm-msg" data-kind={msg.kind} role={msg.kind === "err" ? "alert" : "status"} style={{ margin: 0 }}>
            {msg.text}
          </div>
        )}
        <div className="adm-form-grid">
          <div className="adm-field">
            <label className="adm-label" htmlFor={`cat-name-${c.id}`}>
              名稱
            </label>
            <input id={`cat-name-${c.id}`} className="adm-input" maxLength={40} value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="adm-field">
            <label className="adm-label" htmlFor={`cat-sort-${c.id}`}>
              排序（小→大）
            </label>
            <input id={`cat-sort-${c.id}`} className="adm-input" inputMode="numeric" value={sort} onChange={(e) => setSort(e.target.value.replace(/[^\d]/g, ""))} />
          </div>
        </div>
        <div className="adm-actions">
          <button type="button" className="adm-btn adm-btn--primary adm-btn--sm" disabled={busy} onClick={save}>
            儲存
          </button>
          <button type="button" className="adm-btn adm-btn--danger adm-btn--sm" disabled={busy || c.count > 0} onClick={remove} title={c.count > 0 ? "仍有商品，不能刪除" : undefined}>
            刪除
          </button>
        </div>
      </div>
      <ImageUploader
        title={`${c.name} 分類圖片`}
        hint="分類列 / 分類頁使用，建議 1:1"
        aspect="1 / 1"
        currentUrl={c.image}
        postUrl="/api/admin/site-images"
        fields={{ slotKey: `category.${c.id}` }}
        deleteUrl="/api/admin/site-images"
        deleteBody={{ slotKey: `category.${c.id}` }}
        slotKey={`category.${c.id}`}
        alt={c.alt}
      />
    </div>
  );
}

export default function CategoriesManager({ categories }: { categories: Cat[] }) {
  const [id, setId] = useState("");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  async function add(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setErr("");
    const sort = categories.reduce((m, c) => Math.max(m, c.sort), -1) + 1;
    const r = await adminFetch("/api/admin/categories", { method: "POST", body: { id: id.trim(), name, sort } });
    setBusy(false);
    if (r.ok) window.location.reload();
    else setErr(r.message);
  }

  return (
    <div className="adm-stack">
      <form className="adm-card" onSubmit={add}>
        <h2 className="adm-h2">新增分類</h2>
        {err && (
          <div className="adm-msg" data-kind="err" role="alert">
            {err}
          </div>
        )}
        <div className="adm-form-grid">
          <div className="adm-field">
            <label className="adm-label" htmlFor="cat-new-id">
              代碼（網址，小寫英數）*
            </label>
            <input id="cat-new-id" className="adm-input adm-mono" required pattern="[a-z0-9-]{1,80}" value={id} onChange={(e) => setId(e.target.value.toLowerCase())} />
          </div>
          <div className="adm-field">
            <label className="adm-label" htmlFor="cat-new-name">
              名稱 *
            </label>
            <input id="cat-new-name" className="adm-input" required maxLength={40} value={name} onChange={(e) => setName(e.target.value)} />
          </div>
        </div>
        <div className="adm-actions" style={{ marginTop: 12 }}>
          <button className="adm-btn adm-btn--primary" disabled={busy || !id || !name}>
            新增
          </button>
        </div>
      </form>
      <div className="adm-card adm-stack">
        <h2 className="adm-h2" style={{ margin: 0 }}>
          全部分類（{categories.length}）
        </h2>
        {categories.map((c) => (
          <Row key={c.id} c={c} />
        ))}
      </div>
    </div>
  );
}
