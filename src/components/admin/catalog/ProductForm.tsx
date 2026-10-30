"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { adminFetch } from "@/components/admin/adminFetch";

type Lookups = {
  artists: { id: string; name: string }[];
  categories: { id: string; name: string }[];
  collections: { id: string; name: string }[];
  swatches: { name: string; hex: string }[];
  sizes: string[];
};

export type ProductFormValues = {
  name: string;
  slug: string;
  artist_id: string;
  category_id: string;
  collection_id: string;
  price: string;
  stock: string;
  status: string;
  ship_date: string;
  is_new: boolean;
  is_published: boolean;
  is_demo: boolean;
  colors: string[];
  sizes: string[];
  material: string;
  care: string;
  dimensions: string;
  story: string;
  released_at: string;
  popularity: string;
};

const STATUS_OPTIONS = [
  ["instock", "現貨"],
  ["limited", "限量"],
  ["preorder", "預購"],
  ["soldout", "售罄"],
] as const;

function splitList(s: string): string[] {
  return s
    .split(/[,，、\n]/)
    .map((x) => x.trim())
    .filter(Boolean);
}

/** 多選＋自填：預設選項以勾選呈現，不在清單內的值放「其他」欄（逗號分隔）。 */
function MultiPick({
  id,
  label,
  options,
  value,
  onChange,
  swatch,
}: {
  id: string;
  label: string;
  options: string[];
  value: string[];
  onChange: (v: string[]) => void;
  swatch?: Record<string, string>;
}) {
  const extras = value.filter((v) => !options.includes(v));
  const [extraText, setExtraText] = useState(extras.join("、"));
  const picked = value.filter((v) => options.includes(v));
  function toggle(opt: string) {
    const next = picked.includes(opt) ? picked.filter((p) => p !== opt) : [...picked, opt];
    onChange([...options.filter((o) => next.includes(o)), ...splitList(extraText)]);
  }
  return (
    <fieldset className="adm-field span-2" style={{ border: 0, padding: 0, margin: 0 }}>
      <legend className="adm-label">{label}</legend>
      <div className="adm-actions" style={{ gap: 12 }}>
        {options.map((o) => (
          <label key={o} className="adm-check">
            <input type="checkbox" checked={picked.includes(o)} onChange={() => toggle(o)} />
            {swatch?.[o] && (
              <span aria-hidden="true" style={{ width: 14, height: 14, borderRadius: "50%", background: swatch[o], border: "1px solid var(--color-line)" }} />
            )}
            {o}
          </label>
        ))}
      </div>
      <input
        id={id}
        className="adm-input"
        style={{ marginTop: 8 }}
        placeholder="其他（以逗號或頓號分隔）"
        value={extraText}
        onChange={(e) => {
          setExtraText(e.target.value);
          onChange([...picked, ...splitList(e.target.value)]);
        }}
        aria-label={`${label}（其他）`}
      />
    </fieldset>
  );
}

export default function ProductForm({ mode, productId, initial, lookups }: { mode: "create" | "edit"; productId?: string; initial: ProductFormValues; lookups: Lookups }) {
  const router = useRouter();
  const [v, setV] = useState<ProductFormValues>(initial);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ kind: "ok" | "err"; text: string } | null>(null);
  const set = <K extends keyof ProductFormValues>(k: K, val: ProductFormValues[K]) => setV((p) => ({ ...p, [k]: val }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    const payload = {
      name: v.name,
      slug: v.slug.trim(),
      artist_id: v.artist_id,
      category_id: v.category_id,
      collection_id: v.collection_id || null,
      price: Number(v.price),
      stock: Number(v.stock || 0),
      status: v.status,
      ship_date: v.ship_date || null,
      is_new: v.is_new,
      is_published: v.is_published,
      is_demo: v.is_demo,
      colors: v.colors,
      sizes: v.sizes,
      material: v.material,
      care: v.care,
      dimensions: v.dimensions,
      story: v.story,
      released_at: v.released_at,
      popularity: Number(v.popularity || 0),
    };
    if (!Number.isInteger(payload.price) || payload.price < 0) return setMsg({ kind: "err", text: "價格必須是 0 以上的整數" });
    if (!Number.isInteger(payload.stock) || payload.stock < 0) return setMsg({ kind: "err", text: "庫存必須是 0 以上的整數" });
    setBusy(true);
    const r =
      mode === "create"
        ? await adminFetch<{ id: string }>("/api/admin/products", { method: "POST", body: payload })
        : await adminFetch(`/api/admin/products/${productId}`, { method: "PATCH", body: payload });
    setBusy(false);
    if (!r.ok) return setMsg({ kind: "err", text: r.message });
    if (mode === "create") {
      window.location.replace(`/admin/products/${(r.data as { id: string }).id}?created=1`);
      return;
    }
    setMsg({ kind: "ok", text: "已儲存，前台會在數秒內更新" });
    router.refresh();
  }

  const swatchMap = Object.fromEntries(lookups.swatches.map((s) => [s.name, s.hex]));

  return (
    <form onSubmit={submit} className="adm-card" noValidate>
      {msg && (
        <div className="adm-msg" data-kind={msg.kind} role={msg.kind === "err" ? "alert" : "status"}>
          {msg.text}
        </div>
      )}
      <div className="adm-form-grid">
        <div className="adm-field span-2">
          <label className="adm-label" htmlFor="pf-name">
            商品名稱 *
          </label>
          <input id="pf-name" className="adm-input" required maxLength={120} value={v.name} onChange={(e) => set("name", e.target.value)} />
        </div>
        <div className="adm-field">
          <label className="adm-label" htmlFor="pf-slug">
            網址代稱（slug）*
          </label>
          <input
            id="pf-slug"
            className="adm-input adm-mono"
            required
            pattern="[a-z0-9-]{1,80}"
            maxLength={80}
            value={v.slug}
            onChange={(e) => set("slug", e.target.value.toLowerCase())}
          />
          <div className="adm-hint">小寫英數與連字號；前台網址 /products/{v.slug || "…"}</div>
        </div>
        <div className="adm-field">
          <label className="adm-label" htmlFor="pf-price">
            價格（NT$，整數）*
          </label>
          <input id="pf-price" className="adm-input" inputMode="numeric" required value={v.price} onChange={(e) => set("price", e.target.value.replace(/[^\d]/g, ""))} />
        </div>
        <div className="adm-field">
          <label className="adm-label" htmlFor="pf-artist">
            藝術家 *
          </label>
          <select id="pf-artist" className="adm-select" required value={v.artist_id} onChange={(e) => set("artist_id", e.target.value)}>
            <option value="">請選擇</option>
            {lookups.artists.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </select>
        </div>
        <div className="adm-field">
          <label className="adm-label" htmlFor="pf-cat">
            分類 *
          </label>
          <select id="pf-cat" className="adm-select" required value={v.category_id} onChange={(e) => set("category_id", e.target.value)}>
            <option value="">請選擇</option>
            {lookups.categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
        <div className="adm-field">
          <label className="adm-label" htmlFor="pf-col">
            聯名系列
          </label>
          <select id="pf-col" className="adm-select" value={v.collection_id} onChange={(e) => set("collection_id", e.target.value)}>
            <option value="">（無）</option>
            {lookups.collections.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
        <div className="adm-field">
          <label className="adm-label" htmlFor="pf-status">
            供貨狀態
          </label>
          <select id="pf-status" className="adm-select" value={v.status} onChange={(e) => set("status", e.target.value)}>
            {STATUS_OPTIONS.map(([k, l]) => (
              <option key={k} value={k}>
                {l}
              </option>
            ))}
          </select>
        </div>
        <div className="adm-field">
          <label className="adm-label" htmlFor="pf-stock">
            庫存
          </label>
          <input id="pf-stock" className="adm-input" inputMode="numeric" value={v.stock} onChange={(e) => set("stock", e.target.value.replace(/[^\d]/g, ""))} />
        </div>
        <div className="adm-field">
          <label className="adm-label" htmlFor="pf-ship">
            預計出貨日（預購用）
          </label>
          <input id="pf-ship" type="date" className="adm-input" value={v.ship_date} onChange={(e) => set("ship_date", e.target.value)} />
        </div>
        <div className="adm-field">
          <label className="adm-label" htmlFor="pf-released">
            上架日
          </label>
          <input id="pf-released" type="date" className="adm-input" required value={v.released_at} onChange={(e) => set("released_at", e.target.value)} />
        </div>
        <div className="adm-field">
          <label className="adm-label" htmlFor="pf-pop">
            熱門度（排序用）
          </label>
          <input id="pf-pop" className="adm-input" inputMode="numeric" value={v.popularity} onChange={(e) => set("popularity", e.target.value.replace(/[^\d]/g, ""))} />
        </div>
        <div className="adm-field span-2 adm-actions" style={{ gap: 18 }}>
          <label className="adm-check">
            <input type="checkbox" checked={v.is_published} onChange={(e) => set("is_published", e.target.checked)} />
            上架（前台可見）
          </label>
          <label className="adm-check">
            <input type="checkbox" checked={v.is_new} onChange={(e) => set("is_new", e.target.checked)} />
            新品（NEW）
          </label>
          <label className="adm-check">
            <input type="checkbox" checked={v.is_demo} onChange={(e) => set("is_demo", e.target.checked)} />
            示意資料
          </label>
        </div>
        <MultiPick id="pf-colors" label="顏色" options={lookups.swatches.map((s) => s.name)} swatch={swatchMap} value={v.colors} onChange={(x) => set("colors", x)} />
        <MultiPick id="pf-sizes" label="尺寸" options={lookups.sizes} value={v.sizes} onChange={(x) => set("sizes", x)} />
        <div className="adm-field">
          <label className="adm-label" htmlFor="pf-material">
            材質
          </label>
          <input id="pf-material" className="adm-input" maxLength={500} value={v.material} onChange={(e) => set("material", e.target.value)} />
        </div>
        <div className="adm-field">
          <label className="adm-label" htmlFor="pf-dim">
            尺寸規格
          </label>
          <input id="pf-dim" className="adm-input" maxLength={500} value={v.dimensions} onChange={(e) => set("dimensions", e.target.value)} />
        </div>
        <div className="adm-field span-2">
          <label className="adm-label" htmlFor="pf-care">
            保養方式
          </label>
          <textarea id="pf-care" className="adm-textarea" maxLength={1000} value={v.care} onChange={(e) => set("care", e.target.value)} />
        </div>
        <div className="adm-field span-2">
          <label className="adm-label" htmlFor="pf-story">
            商品故事
          </label>
          <textarea id="pf-story" className="adm-textarea" style={{ minHeight: 140 }} maxLength={4000} value={v.story} onChange={(e) => set("story", e.target.value)} />
        </div>
      </div>
      <div className="adm-actions" style={{ marginTop: 16 }}>
        <button className="adm-btn adm-btn--primary" disabled={busy}>
          {busy ? "儲存中…" : mode === "create" ? "建立商品" : "儲存變更"}
        </button>
      </div>
    </form>
  );
}
