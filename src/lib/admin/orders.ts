import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { clampPage, digitsOnly, isYmd, sanitizeSearch } from "@/lib/admin/query";
import { FULFILLMENT_STATUSES, ORDER_STATUSES } from "@/lib/admin/format";
import { STATION_LABELS, isStation, type StationKey } from "@/lib/admin/barcode";

export const ORDERS_PER_PAGE = 30;

// 列表只撈顯示欄位
const LIST_COLUMNS =
  "id,order_no,recipient_name,email,phone,ship_method,pay_method,total,status,fulfillment_status,created_at,is_demo";

export type OrderListRow = {
  id: string;
  order_no: string | null;
  recipient_name: string;
  email: string;
  phone: string;
  ship_method: string;
  pay_method: string;
  total: number;
  status: string;
  fulfillment_status: string;
  created_at: string;
  is_demo: boolean;
};

export const ORDER_SORTS = {
  newest: { col: "created_at", asc: false, label: "最新下單" },
  oldest: { col: "created_at", asc: true, label: "最早下單" },
  total_desc: { col: "total", asc: false, label: "金額高→低" },
  total_asc: { col: "total", asc: true, label: "金額低→高" },
} as const;
export type OrderSort = keyof typeof ORDER_SORTS;

export type OrderListQuery = {
  q: string;
  status: string; // "" | ORDER_STATUSES
  fulfillment: string; // "" | FULFILLMENT_STATUSES | "to_ship"
  from: string;
  to: string;
  sort: OrderSort;
  page: number;
  demo: boolean;
};

export async function listOrders(query: OrderListQuery): Promise<{ rows: OrderListRow[]; total: number; page: number; pageCount: number }> {
  const sb = createAdminClient();
  const build = () => {
    let qb = sb.from("orders").select(LIST_COLUMNS, { count: "exact" });
    if (!query.demo) qb = qb.eq("is_demo", false);
    if ((ORDER_STATUSES as readonly string[]).includes(query.status)) qb = qb.eq("status", query.status);
    if (query.fulfillment === "to_ship") qb = qb.in("fulfillment_status", ["unfulfilled", "picking", "packed"]).not("status", "in", "(cancelled,refunded)");
    else if ((FULFILLMENT_STATUSES as readonly string[]).includes(query.fulfillment)) qb = qb.eq("fulfillment_status", query.fulfillment);
    if (isYmd(query.from)) qb = qb.gte("created_at", `${query.from}T00:00:00+08:00`);
    if (isYmd(query.to)) qb = qb.lte("created_at", `${query.to}T23:59:59.999+08:00`);
    const q = sanitizeSearch(query.q);
    if (q) {
      // sanitize 會把 . 換成空白：以 % 接回，讓完整 email 也能比對
      const like = `%${q.replace(/ /g, "%")}%`;
      const ors = [`order_no.ilike.${like}`, `recipient_name.ilike.${like}`, `email.ilike.${like}`, `phone.ilike.${like}`];
      const digits = digitsOnly(q);
      if (digits.length >= 4 && digits !== q) ors.push(`phone.ilike.%${digits}%`);
      qb = qb.or(ors.join(","));
    }
    const s = ORDER_SORTS[query.sort];
    return qb.order(s.col, { ascending: s.asc }).order("id", { ascending: true });
  };

  const from = (query.page - 1) * ORDERS_PER_PAGE;
  const first = await build().range(from, from + ORDERS_PER_PAGE - 1);
  let { data, error } = first;
  const total = first.count ?? 0;
  const clamped = clampPage(query.page, total, ORDERS_PER_PAGE);
  // 超頁（或 PostgREST 416）→ 夾到最後一頁重查
  if ((error || (data?.length ?? 0) === 0) && total > 0 && clamped.page !== query.page) {
    const f2 = (clamped.page - 1) * ORDERS_PER_PAGE;
    ({ data, error } = await build().range(f2, f2 + ORDERS_PER_PAGE - 1));
  }
  if (error) throw new Error(`listOrders: ${error.message}`);
  return { rows: (data ?? []) as OrderListRow[], total, page: clamped.page, pageCount: clamped.pageCount };
}

export type OrderDetail = OrderListRow & {
  user_id: string | null;
  city: string | null;
  address: string | null;
  cvs_store: string | null;
  note: string | null;
  subtotal: number;
  shipping_fee: number;
  carrier: string | null;
  tracking_no: string | null;
  shipped_at: string | null;
  delivered_at: string | null;
  updated_at: string | null;
};
export type OrderItemRow = {
  id: number;
  product_id: string | null;
  color: string | null;
  size: string | null;
  qty: number;
  unit_price: number;
  product: { name: string; slug: string; artist: { name: string } | null } | null;
};
export type OrderEventRow = { id: number; station: StationKey; admin_name: string | null; note: string | null; scanned_at: string };

export const isUuid = (s: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s);

export async function getOrder(id: string): Promise<OrderDetail | null> {
  if (!isUuid(id)) return null;
  const { data, error } = await createAdminClient()
    .from("orders")
    .select(
      `${LIST_COLUMNS},user_id,city,address,cvs_store,note,subtotal,shipping_fee,carrier,tracking_no,shipped_at,delivered_at,updated_at`
    )
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(`getOrder: ${error.message}`);
  return (data as OrderDetail | null) ?? null;
}

export async function getOrderItems(orderId: string): Promise<OrderItemRow[]> {
  const { data, error } = await createAdminClient()
    .from("order_items")
    .select("id,product_id,color,size,qty,unit_price,product:products(name,slug,artist:artists(name))")
    .eq("order_id", orderId)
    .order("id");
  if (error) throw new Error(`getOrderItems: ${error.message}`);
  return (data ?? []) as unknown as OrderItemRow[];
}

export async function getOrderEvents(orderId: string): Promise<OrderEventRow[]> {
  const { data, error } = await createAdminClient()
    .from("order_events")
    .select("id,station,admin_name,note,scanned_at")
    .eq("order_id", orderId)
    .order("scanned_at", { ascending: false })
    .limit(100);
  if (error) throw new Error(`getOrderEvents: ${error.message}`);
  return (data ?? []) as OrderEventRow[];
}

// ── 編輯（PATCH 白名單 + 驗證） ──
export const ORDER_PATCH_FIELDS = [
  "recipient_name",
  "phone",
  "email",
  "ship_method",
  "city",
  "address",
  "cvs_store",
  "note",
  "status",
  "fulfillment_status",
  "carrier",
  "tracking_no",
] as const;
export type OrderPatch = Partial<Record<(typeof ORDER_PATCH_FIELDS)[number], string | null>>;

export function validateOrderPatch(body: Record<string, unknown>): { ok: true; patch: OrderPatch } | { ok: false; field: string; message: string } {
  const patch: OrderPatch = {};
  for (const [k, raw] of Object.entries(body)) {
    if (!(ORDER_PATCH_FIELDS as readonly string[]).includes(k)) return { ok: false, field: k, message: `不允許的欄位：${k}` };
    if (raw !== null && typeof raw !== "string") return { ok: false, field: k, message: "格式錯誤" };
    const v = typeof raw === "string" ? raw.trim() : null;
    const key = k as keyof OrderPatch;
    switch (key) {
      case "recipient_name":
        if (!v || v.length > 60) return { ok: false, field: k, message: "收件人姓名必填，最多 60 字" };
        patch[key] = v;
        break;
      case "phone":
        if (!v || !/^[0-9+\-() ]{6,32}$/.test(v)) return { ok: false, field: k, message: "電話格式不正確" };
        patch[key] = v;
        break;
      case "email":
        if (!v || v.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) return { ok: false, field: k, message: "Email 格式不正確" };
        patch[key] = v;
        break;
      case "ship_method":
        if (v !== "home" && v !== "cvs") return { ok: false, field: k, message: "配送方式不正確" };
        patch[key] = v;
        break;
      case "status":
        if (!v || !(ORDER_STATUSES as readonly string[]).includes(v)) return { ok: false, field: k, message: "付款狀態不正確" };
        patch[key] = v;
        break;
      case "fulfillment_status":
        if (!v || !(FULFILLMENT_STATUSES as readonly string[]).includes(v)) return { ok: false, field: k, message: "出貨狀態不正確" };
        patch[key] = v;
        break;
      case "note":
        if (v && v.length > 2000) return { ok: false, field: k, message: "備註最多 2000 字" };
        patch[key] = v || null;
        break;
      case "address":
        if (v && v.length > 300) return { ok: false, field: k, message: "地址最多 300 字" };
        patch[key] = v || null;
        break;
      default:
        if (v && v.length > 120) return { ok: false, field: k, message: "最多 120 字" };
        patch[key] = v || null;
    }
  }
  if (Object.keys(patch).length === 0) return { ok: false, field: "", message: "沒有要更新的欄位" };
  return { ok: true, patch };
}

// ── 出貨進度：事件為真相來源，orders.fulfillment_status 是快取 ──
const RANK: Record<StationKey, number> = { picking: 1, packed: 2, shipped: 3, delivered: 4 };

/** 由事件推導出貨狀態：任一 delivered → delivered；否則取「最新事件」的站別；無事件 → null（不覆寫）。 */
export function deriveFulfillment(events: { station: string; scanned_at: string }[]): StationKey | null {
  const valid = events.filter((e) => isStation(e.station)) as { station: StationKey; scanned_at: string }[];
  if (!valid.length) return null;
  if (valid.some((e) => e.station === "delivered")) return "delivered";
  const latest = [...valid].sort((a, b) => (a.scanned_at < b.scanned_at ? 1 : a.scanned_at > b.scanned_at ? -1 : RANK[b.station] - RANK[a.station]))[0];
  return latest.station;
}

/** 新增一筆站別事件並回寫 orders 的出貨快取。重讀事件失敗時不覆寫（避免進度倒退）。 */
export async function recordStationEvent(
  orderId: string,
  station: StationKey,
  admin: { id: string; name: string },
  note: string | null
): Promise<{ fulfillment: string | null }> {
  const sb = createAdminClient();
  const { error: insErr } = await sb.from("order_events").insert({ order_id: orderId, station, admin_id: admin.id, admin_name: admin.name, note });
  if (insErr) throw new Error(`recordStationEvent insert: ${insErr.message}`);
  const { data: events, error: evErr } = await sb.from("order_events").select("station,scanned_at").eq("order_id", orderId);
  if (evErr || !events) return { fulfillment: null };
  const derived = deriveFulfillment(events);
  if (!derived) return { fulfillment: null };
  const now = new Date().toISOString();
  const patch: Record<string, string> = { fulfillment_status: derived, updated_at: now };
  if (derived === "shipped") patch.shipped_at = now;
  if (derived === "delivered") patch.delivered_at = now;
  const { data: cur } = await sb.from("orders").select("shipped_at,delivered_at").eq("id", orderId).maybeSingle();
  if (derived === "shipped" && cur?.shipped_at) delete patch.shipped_at;
  if (derived === "delivered") {
    if (cur?.delivered_at) delete patch.delivered_at;
    if (!cur?.shipped_at) patch.shipped_at = now;
  }
  await sb.from("orders").update(patch).eq("id", orderId);
  return { fulfillment: derived };
}

export { STATION_LABELS };
