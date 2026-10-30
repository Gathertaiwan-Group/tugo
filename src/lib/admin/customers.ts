// 客戶樣貌 PATCH 驗證（純函式）。
export const CUSTOMER_TIERS = ["vip", "regular", "watch"] as const;
export const CUSTOMER_TIER_LABELS: Record<string, string> = { vip: "VIP", regular: "一般", watch: "需留意" };

const LIST_FIELDS = ["tags", "preferred_artists", "preferred_categories"] as const;
const SHORT_FIELDS = ["display_name", "phone", "source_channel", "size_pref"] as const;
const LONG_FIELDS = ["ai_summary", "service_notes"] as const;
export const CUSTOMER_PATCH_FIELDS = [...LIST_FIELDS, ...SHORT_FIELDS, ...LONG_FIELDS, "tier"] as const;

export type CustomerPatch = Partial<{
  display_name: string | null;
  phone: string | null;
  source_channel: string | null;
  size_pref: string | null;
  ai_summary: string | null;
  service_notes: string | null;
  tier: (typeof CUSTOMER_TIERS)[number];
  tags: string[];
  preferred_artists: string[];
  preferred_categories: string[];
}>;

function cleanList(v: unknown): string[] | null {
  const arr = Array.isArray(v) ? v : typeof v === "string" ? v.split(/[,，、\n]/) : null;
  if (!arr) return null;
  const out: string[] = [];
  for (const item of arr) {
    if (typeof item !== "string") return null;
    const s = item.trim();
    if (!s) continue;
    if (s.length > 80) return null;
    if (!out.includes(s)) out.push(s);
  }
  return out.length > 12 ? null : out;
}

export function validateCustomerPatch(body: Record<string, unknown>): { ok: true; patch: CustomerPatch } | { ok: false; message: string } {
  const patch: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(body)) {
    if (!(CUSTOMER_PATCH_FIELDS as readonly string[]).includes(k)) return { ok: false, message: `不允許的欄位：${k}` };
    if ((LIST_FIELDS as readonly string[]).includes(k)) {
      const list = cleanList(v);
      if (!list) return { ok: false, message: "清單欄位最多 12 項、每項 80 字內" };
      patch[k] = list;
    } else if ((SHORT_FIELDS as readonly string[]).includes(k) || (LONG_FIELDS as readonly string[]).includes(k)) {
      if (v !== null && typeof v !== "string") return { ok: false, message: `${k} 格式不正確` };
      const s = typeof v === "string" ? v.trim() : "";
      const max = (LONG_FIELDS as readonly string[]).includes(k) ? 2000 : 120;
      if (s.length > max) return { ok: false, message: `${k} 超過 ${max} 字` };
      if (k === "phone" && s && !/^[0-9+\-() ]{1,32}$/.test(s)) return { ok: false, message: "電話格式不正確" };
      patch[k] = s || null;
    } else if (k === "tier") {
      if (typeof v !== "string" || !(CUSTOMER_TIERS as readonly string[]).includes(v)) return { ok: false, message: "客戶等級不正確" };
      patch[k] = v;
    }
  }
  return { ok: true, patch: patch as CustomerPatch };
}

/** ilike 精確比對（跳脫 % _ \），用於大小寫不敏感的 email 比對。 */
export function ilikeExact(s: string): string {
  return s.replace(/[\\%_]/g, (c) => `\\${c}`);
}
