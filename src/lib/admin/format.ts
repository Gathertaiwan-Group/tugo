// 顯示用格式化：台北時間手動 UTC+8（避免 server/client ICU 差異造成 hydration mismatch）。

const TZ_OFFSET_MS = 8 * 60 * 60 * 1000;
const pad = (n: number) => String(n).padStart(2, "0");

function taipeiParts(iso: string | null | undefined) {
  if (!iso) return null;
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return null;
  const d = new Date(t + TZ_OFFSET_MS);
  return { y: d.getUTCFullYear(), m: d.getUTCMonth() + 1, d: d.getUTCDate(), hh: d.getUTCHours(), mm: d.getUTCMinutes(), ss: d.getUTCSeconds() };
}

export function fmtDateTime(iso: string | null | undefined): string {
  const p = taipeiParts(iso);
  return p ? `${p.y}/${pad(p.m)}/${pad(p.d)} ${pad(p.hh)}:${pad(p.mm)}` : "—";
}
export function fmtDate(iso: string | null | undefined): string {
  const p = taipeiParts(iso);
  return p ? `${p.y}/${pad(p.m)}/${pad(p.d)}` : "—";
}
export function fmtClock(iso: string | null | undefined): string {
  const p = taipeiParts(iso);
  return p ? `${pad(p.hh)}:${pad(p.mm)}:${pad(p.ss)}` : "—";
}
/** 台北今天 YYYY-MM-DD */
export function taipeiToday(): string {
  const d = new Date(Date.now() + TZ_OFFSET_MS);
  return d.toISOString().slice(0, 10);
}
/** datetime-local 輸入值（台北時間）↔ ISO */
export function toTaipeiLocalInput(iso: string | null | undefined): string {
  const p = taipeiParts(iso);
  return p ? `${p.y}-${pad(p.m)}-${pad(p.d)}T${pad(p.hh)}:${pad(p.mm)}` : "";
}
export function fromTaipeiLocalInput(v: string): string | null {
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(v)) return null;
  const t = new Date(`${v}:00+08:00`).getTime();
  return Number.isNaN(t) ? null : new Date(t).toISOString();
}

export function money(n: number | null | undefined): string {
  const v = typeof n === "number" && Number.isFinite(n) ? n : 0;
  return `NT$ ${v.toLocaleString("en-US")}`;
}

// ── 訂單狀態 ──
export const ORDER_STATUS_LABELS: Record<string, string> = {
  pending_payment: "待付款",
  paid: "已付款",
  cancelled: "已取消",
  refunded: "已退款",
};
export const ORDER_STATUSES = ["pending_payment", "paid", "cancelled", "refunded"] as const;

export const FULFILLMENT_LABELS: Record<string, string> = {
  unfulfilled: "未出貨",
  picking: "揀貨中",
  packed: "已包裝",
  shipped: "已出貨",
  delivered: "已送達",
  returned: "已退回",
};
export const FULFILLMENT_STATUSES = ["unfulfilled", "picking", "packed", "shipped", "delivered", "returned"] as const;

export const SHIP_METHOD_LABELS: Record<string, string> = { home: "宅配到府", cvs: "超商取貨" };
export const PAY_METHOD_LABELS: Record<string, string> = { card: "信用卡", atm: "ATM 轉帳", cvs: "超商代碼", linepay: "LINE Pay" };

export const PRODUCT_STATUS_LABELS: Record<string, string> = {
  instock: "現貨",
  limited: "限量",
  preorder: "預購",
  soldout: "售罄",
};

export const APPLICATION_STATUS_LABELS: Record<string, string> = {
  pending: "待審核",
  reviewing: "審核中",
  contacted: "已聯繫",
  accepted: "已錄取",
  rejected: "未錄取",
};
export const APPLICATION_STATUSES = ["pending", "reviewing", "contacted", "accepted", "rejected"] as const;

export function label(map: Record<string, string>, key: string | null | undefined): string {
  if (!key) return "—";
  return map[key] ?? key;
}

/** 狀態 → pill 色調 */
export function tone(key: string | null | undefined): "ok" | "warn" | "muted" | "bad" | "info" {
  switch (key) {
    case "paid":
    case "delivered":
    case "accepted":
    case "completed":
    case "instock":
      return "ok";
    case "pending_payment":
    case "pending":
    case "unfulfilled":
    case "limited":
    case "open":
      return "warn";
    case "cancelled":
    case "refunded":
    case "rejected":
    case "soldout":
    case "returned":
      return "bad";
    case "picking":
    case "packed":
    case "shipped":
    case "reviewing":
    case "contacted":
    case "preorder":
      return "info";
    default:
      return "muted";
  }
}

/** email ↔ 網址安全 key（base64url） */
export function emailToKey(email: string): string {
  const bytes = new TextEncoder().encode(email.toLowerCase());
  let bin = "";
  bytes.forEach((b) => (bin += String.fromCharCode(b)));
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
export function keyToEmail(key: string): string | null {
  try {
    const bin = atob(key.replace(/-/g, "+").replace(/_/g, "/"));
    const bytes = Uint8Array.from(bin, (c) => c.charCodeAt(0));
    const s = new TextDecoder().decode(bytes);
    return /^[^\s@]+@[^\s@]+$/.test(s) && s.length <= 254 ? s.toLowerCase() : null;
  } catch {
    return null;
  }
}
