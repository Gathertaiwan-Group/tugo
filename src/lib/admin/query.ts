// 列表查詢共用：搜尋清洗、分頁夾限、排序白名單。純函式（server/client 皆可）。

/**
 * 搜尋字串清洗後才可放進 PostgREST or()/ilike：service role 繞過 RLS，這是注入防護。
 * 移除 , . ( ) * \ % " ' : 與控制字元，限 40 字。
 */
export function sanitizeSearch(raw: unknown, max = 40): string {
  if (typeof raw !== "string") return "";
  return raw
    .replace(/[\u0000-\u001f\u007f,.()*\\%"':]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, max);
}

/** 只留數字（電話搜尋用）。 */
export function digitsOnly(s: string): string {
  return s.replace(/\D/g, "");
}

export function parsePage(raw: unknown): number {
  const n = Number(typeof raw === "string" ? raw : 1);
  return Number.isFinite(n) && n >= 1 ? Math.floor(n) : 1;
}

export function clampPage(page: number, total: number, perPage: number): { page: number; pageCount: number } {
  const pageCount = Math.max(1, Math.ceil(total / perPage));
  return { page: Math.min(Math.max(1, page), pageCount), pageCount };
}

export function pick<T extends string>(raw: unknown, allowed: readonly T[], fallback: T): T {
  return typeof raw === "string" && (allowed as readonly string[]).includes(raw) ? (raw as T) : fallback;
}

/** 從 Next searchParams 取單一字串。 */
export function sp(v: string | string[] | undefined): string {
  return Array.isArray(v) ? (v[0] ?? "") : (v ?? "");
}

/** 產生保留其他參數的分頁網址。 */
export function hrefWith(base: string, params: Record<string, string>, patch: Record<string, string | number | null>): string {
  const u = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) if (v) u.set(k, v);
  for (const [k, v] of Object.entries(patch)) {
    if (v === null || v === "") u.delete(k);
    else u.set(k, String(v));
  }
  const s = u.toString();
  return s ? `${base}?${s}` : base;
}

/** YYYY-MM-DD 嚴格驗證（含回推檢查偽日期）。 */
export function isYmd(s: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return false;
  const d = new Date(`${s}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === s;
}
