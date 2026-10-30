"use client";

import { useRef, useState } from "react";
import { adminFetch } from "@/components/admin/adminFetch";

type Img = { id: number; url: string; label: string | null; sort: number };
const MAX = 4 * 1024 * 1024;
const LABELS = ["情境照", "平拍照", "細節照", "背面／包裝"];

/** 商品圖片管理：上傳（多張依序）、標籤、上移/下移排序（RPC 原子重排）、刪除。第一張為前台主圖。 */
export default function ProductImages({ productId, initial }: { productId: string; initial: Img[] }) {
  const [imgs, setImgs] = useState<Img[]>(initial);
  const [label, setLabel] = useState(LABELS[0]);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ kind: "ok" | "err"; text: string } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const base = `/api/admin/products/${productId}/images`;

  async function upload(files: FileList | null) {
    if (!files?.length) return;
    setBusy(true);
    setMsg(null);
    let added = 0;
    for (const f of Array.from(files)) {
      if (!["image/jpeg", "image/png", "image/webp"].includes(f.type) || f.size > MAX) {
        setMsg({ kind: "err", text: `${f.name}：只接受 4MB 內的 JPG / PNG / WebP` });
        continue;
      }
      const form = new FormData();
      form.set("file", f);
      form.set("label", label);
      const r = await adminFetch<{ image: Img }>(base, { method: "POST", form });
      if (!r.ok) {
        setMsg({ kind: "err", text: `${f.name}：${r.message}` });
        continue;
      }
      added++;
      setImgs((cur) => [...cur, r.data.image]);
    }
    if (fileRef.current) fileRef.current.value = "";
    setBusy(false);
    if (added) setMsg({ kind: "ok", text: `已上傳 ${added} 張` });
  }

  async function move(i: number, d: -1 | 1) {
    const j = i + d;
    if (j < 0 || j >= imgs.length) return;
    const next = [...imgs];
    [next[i], next[j]] = [next[j], next[i]];
    setBusy(true);
    const r = await adminFetch(base, { method: "PATCH", body: { ids: next.map((x) => x.id) } });
    setBusy(false);
    if (!r.ok) return setMsg({ kind: "err", text: r.message });
    setImgs(next);
  }

  async function relabel(img: Img, newLabel: string) {
    const r = await adminFetch(base, { method: "PATCH", body: { imageId: img.id, label: newLabel } });
    if (!r.ok) return setMsg({ kind: "err", text: r.message });
    setImgs((cur) => cur.map((x) => (x.id === img.id ? { ...x, label: newLabel } : x)));
  }

  async function remove(img: Img) {
    if (!window.confirm("確定刪除這張圖片？")) return;
    setBusy(true);
    const r = await adminFetch(base, { method: "DELETE", body: { imageId: img.id } });
    setBusy(false);
    if (!r.ok) return setMsg({ kind: "err", text: r.message });
    setImgs((cur) => cur.filter((x) => x.id !== img.id));
  }

  return (
    <section className="adm-card">
      <h2 className="adm-h2">商品圖片</h2>
      <p className="adm-hint" style={{ marginTop: -6, marginBottom: 12 }}>
        第一張為主圖、第二張為列表 hover 圖。建議 4:5 直式、4MB 以內。
      </p>
      {msg && (
        <div className="adm-msg" data-kind={msg.kind} role={msg.kind === "err" ? "alert" : "status"}>
          {msg.text}
        </div>
      )}
      {imgs.length === 0 ? (
        <div className="adm-empty" style={{ marginBottom: 12 }}>
          尚無圖片，前台顯示條紋佔位圖
        </div>
      ) : (
        <ul className="adm-list" style={{ marginBottom: 12 }}>
          {imgs.map((img, i) => (
            <li key={img.id} style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img className="adm-thumb" src={img.url} alt={img.label ?? `圖片 ${i + 1}`} />
              <div style={{ flex: "1 1 140px", minWidth: 0 }}>
                <div className="adm-small adm-muted">{i === 0 ? "主圖" : `第 ${i + 1} 張`}</div>
                <select
                  className="adm-select"
                  style={{ minHeight: 34, fontSize: 13 }}
                  value={img.label ?? ""}
                  onChange={(e) => relabel(img, e.target.value)}
                  aria-label={`第 ${i + 1} 張圖片標籤`}
                >
                  <option value="">（無標籤）</option>
                  {[...new Set([...LABELS, ...(img.label ? [img.label] : [])])].map((l) => (
                    <option key={l} value={l}>
                      {l}
                    </option>
                  ))}
                </select>
              </div>
              <div className="adm-actions" style={{ gap: 4 }}>
                <button type="button" className="adm-btn adm-btn--ghost adm-btn--sm" disabled={busy || i === 0} onClick={() => move(i, -1)} aria-label="上移">
                  ↑
                </button>
                <button
                  type="button"
                  className="adm-btn adm-btn--ghost adm-btn--sm"
                  disabled={busy || i === imgs.length - 1}
                  onClick={() => move(i, 1)}
                  aria-label="下移"
                >
                  ↓
                </button>
                <button type="button" className="adm-btn adm-btn--danger adm-btn--sm" disabled={busy} onClick={() => remove(img)}>
                  刪除
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
      <div className="adm-form-grid">
        <div className="adm-field">
          <label className="adm-label" htmlFor="pi-label">
            新圖片標籤
          </label>
          <select id="pi-label" className="adm-select" value={label} onChange={(e) => setLabel(e.target.value)}>
            {LABELS.map((l) => (
              <option key={l}>{l}</option>
            ))}
          </select>
        </div>
        <div className="adm-field">
          <label className="adm-label" htmlFor="pi-file">
            選擇圖片（可多選）
          </label>
          <input
            id="pi-file"
            ref={fileRef}
            type="file"
            multiple
            accept="image/jpeg,image/png,image/webp"
            className="adm-input"
            disabled={busy}
            onChange={(e) => upload(e.target.files)}
          />
        </div>
      </div>
      {busy && (
        <p className="adm-small adm-muted" role="status">
          處理中…
        </p>
      )}
    </section>
  );
}
