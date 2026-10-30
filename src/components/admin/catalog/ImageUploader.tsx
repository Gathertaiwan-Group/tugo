"use client";

import { useRef, useState } from "react";
import { adminFetch } from "@/components/admin/adminFetch";

const MAX = 4 * 1024 * 1024;
const TYPES = ["image/jpeg", "image/png", "image/webp"];

/**
 * 單張圖片上傳卡：預覽、選檔（先在前端檢查類型與 4MB）、上傳、清除。
 * - postUrl 收 FormData（file + fields）
 * - slotKey 有值時顯示替代文字欄（網站圖片 / 分類圖片），可單獨更新
 */
export default function ImageUploader({
  title,
  hint,
  currentUrl,
  aspect = "4 / 3",
  postUrl,
  fields,
  deleteUrl,
  deleteBody,
  slotKey,
  alt,
}: {
  title: string;
  hint?: string;
  currentUrl: string | null;
  aspect?: string;
  postUrl: string;
  fields?: Record<string, string>;
  deleteUrl?: string;
  deleteBody?: Record<string, unknown>;
  slotKey?: string;
  alt?: string | null;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [url, setUrl] = useState(currentUrl);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [altText, setAltText] = useState(alt ?? "");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ kind: "ok" | "err"; text: string } | null>(null);

  function choose(f: File | null) {
    setMsg(null);
    if (preview) URL.revokeObjectURL(preview);
    if (!f) {
      setFile(null);
      setPreview(null);
      return;
    }
    if (!TYPES.includes(f.type)) return setMsg({ kind: "err", text: "只接受 JPG / PNG / WebP" });
    if (f.size > MAX) return setMsg({ kind: "err", text: "圖片超過 4MB" });
    setFile(f);
    setPreview(URL.createObjectURL(f));
  }

  async function upload() {
    if (!file) return;
    setBusy(true);
    const form = new FormData();
    form.set("file", file);
    for (const [k, v] of Object.entries(fields ?? {})) form.set(k, v);
    if (slotKey) form.set("alt", altText);
    const r = await adminFetch<{ url: string }>(postUrl, { method: "POST", form });
    setBusy(false);
    if (!r.ok) return setMsg({ kind: "err", text: r.message });
    setUrl(r.data.url);
    choose(null);
    if (inputRef.current) inputRef.current.value = "";
    setMsg({ kind: "ok", text: "已上傳，前台會在數秒內更新" });
  }

  async function clear() {
    if (!deleteUrl || !window.confirm(`確定清除「${title}」的圖片？前台會改回佔位圖。`)) return;
    setBusy(true);
    const r = await adminFetch(deleteUrl, { method: "DELETE", body: deleteBody ?? {} });
    setBusy(false);
    if (!r.ok) return setMsg({ kind: "err", text: r.message });
    setUrl(null);
    setMsg({ kind: "ok", text: "已清除" });
  }

  async function saveAlt() {
    if (!slotKey) return;
    setBusy(true);
    const r = await adminFetch("/api/admin/site-images", { method: "PATCH", body: { slotKey, alt: altText } });
    setBusy(false);
    setMsg(r.ok ? { kind: "ok", text: "替代文字已更新" } : { kind: "err", text: r.message });
  }

  const shown = preview ?? url;
  const inputId = `img-${(slotKey ?? postUrl + JSON.stringify(fields ?? {})).replace(/[^a-zA-Z0-9]/g, "-")}`;

  return (
    <div className="adm-card" style={{ display: "grid", gap: 10 }}>
      <div>
        <div style={{ fontWeight: 700 }}>{title}</div>
        {hint && <div className="adm-hint">{hint}</div>}
      </div>
      <div
        style={{
          aspectRatio: aspect,
          maxHeight: 260,
          width: "100%",
          borderRadius: 8,
          overflow: "hidden",
          background: "repeating-linear-gradient(135deg, var(--color-skeleton) 0 10px, var(--color-tag) 10px 20px)",
          display: "grid",
          placeItems: "center",
        }}
      >
        {shown ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={shown} alt={altText || title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        ) : (
          <span className="adm-small adm-muted">尚未設定（前台顯示佔位圖）</span>
        )}
      </div>
      {preview && <div className="adm-small adm-muted">預覽中：按「確認上傳」才會套用</div>}
      {msg && (
        <div className="adm-msg" data-kind={msg.kind} role={msg.kind === "err" ? "alert" : "status"} style={{ margin: 0 }}>
          {msg.text}
        </div>
      )}
      {slotKey && (
        <div className="adm-field">
          <label className="adm-label" htmlFor={`${inputId}-alt`}>
            替代文字（alt）
          </label>
          <input id={`${inputId}-alt`} className="adm-input" value={altText} maxLength={200} onChange={(e) => setAltText(e.target.value)} />
        </div>
      )}
      <input
        ref={inputRef}
        id={inputId}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="adm-input"
        onChange={(e) => choose(e.target.files?.[0] ?? null)}
        aria-label={`${title} 選擇圖片`}
      />
      <div className="adm-actions">
        <button type="button" className="adm-btn adm-btn--primary adm-btn--sm" disabled={!file || busy} onClick={upload}>
          {busy ? "處理中…" : "確認上傳"}
        </button>
        {slotKey && url && (
          <button type="button" className="adm-btn adm-btn--ghost adm-btn--sm" disabled={busy} onClick={saveAlt}>
            更新替代文字
          </button>
        )}
        {deleteUrl && url && (
          <button type="button" className="adm-btn adm-btn--danger adm-btn--sm" disabled={busy} onClick={clear}>
            清除
          </button>
        )}
      </div>
    </div>
  );
}
