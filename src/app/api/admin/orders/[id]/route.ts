import { createAdminClient } from "@/lib/supabase/admin";
import { fail, guardAdmin, json, readJsonObject } from "@/lib/admin/api";
import { adminDisplayName } from "@/lib/admin/auth";
import { getOrder, isUuid, validateOrderPatch } from "@/lib/admin/orders";
import { isStation } from "@/lib/admin/barcode";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const g = await guardAdmin(req);
  if (!g.ok) return g.res;
  const { id } = await ctx.params;
  const order = await getOrder(id);
  if (!order) return fail("not_found", 404);
  return json({ ok: true, order });
}

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const g = await guardAdmin(req);
  if (!g.ok) return g.res;
  const { id } = await ctx.params;
  if (!isUuid(id)) return fail("not_found", 404);
  const body = await readJsonObject(req);
  if (!body) return fail("bad_payload", 400);
  const v = validateOrderPatch(body);
  if (!v.ok) return fail("bad_payload", 400, { field: v.field, message: v.message });

  const before = await getOrder(id);
  if (!before) return fail("not_found", 404);
  if (before.is_demo) return fail("demo_read_only", 403, { message: "示意訂單僅供檢視" });

  const now = new Date().toISOString();
  const patch: Record<string, string | null> = { ...v.patch, updated_at: now };
  const nextF = v.patch.fulfillment_status;
  const fChanged = typeof nextF === "string" && nextF !== before.fulfillment_status;
  if (fChanged && nextF === "shipped" && !before.shipped_at) patch.shipped_at = now;
  if (fChanged && nextF === "delivered") {
    if (!before.delivered_at) patch.delivered_at = now;
    if (!before.shipped_at) patch.shipped_at = now;
  }

  const sb = createAdminClient();
  const { error } = await sb.from("orders").update(patch).eq("id", id);
  if (error) return fail("update_failed", 500);

  // 手動指定出貨站別：值真的變了且是合法站別才補一筆事件（稽核用）
  if (fChanged && isStation(nextF)) {
    await sb.from("order_events").insert({ order_id: id, station: nextF, admin_id: g.admin.id, admin_name: adminDisplayName(g.admin), note: "後台手動指定" });
  }
  return json({ ok: true, order: await getOrder(id) });
}
