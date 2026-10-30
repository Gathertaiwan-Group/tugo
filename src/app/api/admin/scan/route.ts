import { createAdminClient } from "@/lib/supabase/admin";
import { fail, guardAdmin, json, readJsonObject, unknownKey } from "@/lib/admin/api";
import { adminDisplayName } from "@/lib/admin/auth";
import { STATION_LABELS, isStation, parseScanInput } from "@/lib/admin/barcode";
import { recordStationEvent } from "@/lib/admin/orders";

export const dynamic = "force-dynamic";
export const revalidate = 0;

// best-effort token bucket（容量 10、每 0.5 秒回 1；單一 lambda 記憶體，多實例不共享，只防卡鍵連發）
const BUCKETS = new Map<string, { tokens: number; at: number }>();
function allow(key: string): boolean {
  const now = Date.now();
  const b = BUCKETS.get(key) ?? { tokens: 10, at: now };
  const tokens = Math.min(10, b.tokens + (now - b.at) / 500);
  if (tokens < 1) {
    BUCKETS.set(key, { tokens, at: now });
    return false;
  }
  BUCKETS.set(key, { tokens: tokens - 1, at: now });
  return true;
}

export async function POST(req: Request) {
  const g = await guardAdmin(req);
  if (!g.ok) return g.res;
  if (!allow(g.admin.id)) return fail("rate_limited", 429);

  const body = await readJsonObject(req);
  if (!body || unknownKey(body, ["raw", "fallbackStation"])) return fail("bad_payload", 400);
  const raw = typeof body.raw === "string" ? body.raw : "";
  if (!raw.trim() || raw.length > 64 || /[\u0000-\u001f\u007f]/.test(raw)) return fail("bad_payload", 400);
  const fallback = isStation(body.fallbackStation) ? body.fallbackStation : null;

  const parsed = parseScanInput(raw);
  if (!parsed) return fail("bad_payload", 400);
  const station = parsed.station ?? fallback;
  if (!station) return fail("bad_payload", 400, { message: "請先選擇站別" });

  const sb = createAdminClient();
  const { data: order } = await sb
    .from("orders")
    .select("id,order_no,recipient_name,status,is_demo")
    .eq("order_no", parsed.orderNo)
    .maybeSingle();
  if (!order) return fail("order_not_found", 404);
  if (order.is_demo) return fail("demo_read_only", 403);
  if (order.status === "cancelled" || order.status === "refunded") return fail("order_cancelled", 409);

  // 同站最早事件只用來標 duplicate（不擋：重掃照樣記錄）
  const { data: first } = await sb
    .from("order_events")
    .select("scanned_at,admin_name")
    .eq("order_id", order.id)
    .eq("station", station)
    .order("scanned_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  try {
    const result = await recordStationEvent(order.id, station, { id: g.admin.id, name: adminDisplayName(g.admin) }, "掃描");
    // 回應刻意不含電話/地址/email（倉庫螢幕半公開）
    return json({
      ok: true,
      duplicate: !!first,
      firstAt: first?.scanned_at ?? null,
      firstAdminName: first?.admin_name ?? null,
      station,
      stationLabel: STATION_LABELS[station],
      fulfillment: result.fulfillment,
      order: { order_no: order.order_no, recipient_name: order.recipient_name },
    });
  } catch {
    return fail("scan_failed", 500);
  }
}
