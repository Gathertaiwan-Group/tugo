import { createAdminClient } from "@/lib/supabase/admin";
import { fail, guardAdmin, json, readJsonObject } from "@/lib/admin/api";
import { PRODUCT_LABELS, PRODUCT_SPECS, dbErrorMessage, slugOk, validateFields } from "@/lib/admin/catalog";
import { revalidatePublic } from "@/lib/admin/revalidate";
import { removePublicObject } from "@/lib/admin/upload";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

// 更新商品（部分欄位；含上下架、庫存、價格）
export async function PATCH(req: Request, ctx: Ctx) {
  const g = await guardAdmin(req);
  if (!g.ok) return g.res;
  const { id } = await ctx.params;
  if (!slugOk(id)) return fail("not_found", 404);
  const body = await readJsonObject(req);
  if (!body) return fail("bad_payload", 400);
  const v = validateFields(body, PRODUCT_SPECS, PRODUCT_LABELS, "update");
  if (!v.ok) return fail("bad_payload", 400, { message: v.message });
  if (!Object.keys(v.values).length) return fail("bad_payload", 400, { message: "沒有要更新的欄位" });

  const sb = createAdminClient();
  const before = await sb.from("products").select("slug").eq("id", id).maybeSingle();
  if (!before.data) return fail("not_found", 404);
  const { error } = await sb
    .from("products")
    .update({ ...v.values, updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) {
    const e = dbErrorMessage(error);
    return fail(e.error, e.status, { message: e.message });
  }
  revalidatePublic("product", before.data.slug);
  if (typeof v.values.slug === "string" && v.values.slug !== before.data.slug) revalidatePublic("product", v.values.slug);
  return json({ ok: true });
}

// 刪除商品：已有訂單品項引用 → 拒絕（建議改下架）
export async function DELETE(req: Request, ctx: Ctx) {
  const g = await guardAdmin(req);
  if (!g.ok) return g.res;
  const { id } = await ctx.params;
  if (!slugOk(id)) return fail("not_found", 404);
  const sb = createAdminClient();
  const [p, oi, imgs] = await Promise.all([
    sb.from("products").select("slug").eq("id", id).maybeSingle(),
    sb.from("order_items").select("id", { count: "exact", head: true }).eq("product_id", id),
    sb.from("product_images").select("url").eq("product_id", id),
  ]);
  if (!p.data) return fail("not_found", 404);
  if ((oi.count ?? 0) > 0) {
    return fail("conflict", 409, { message: `此商品已有 ${oi.count} 筆訂單品項，不能刪除；請改為「下架」。` });
  }
  const { error } = await sb.from("products").delete().eq("id", id);
  if (error) {
    const e = dbErrorMessage(error);
    return fail(e.error, e.status, { message: e.message });
  }
  await Promise.all(((imgs.data ?? []) as { url: string }[]).map((r) => removePublicObject(r.url)));
  revalidatePublic("product", p.data.slug);
  return json({ ok: true });
}
