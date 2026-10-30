import { createAdminClient } from "@/lib/supabase/admin";
import { fail, guardAdmin, json, readJsonObject } from "@/lib/admin/api";
import { CATEGORY_LABELS, CATEGORY_SPECS, dbErrorMessage, slugOk, validateFields } from "@/lib/admin/catalog";
import { revalidatePublic } from "@/lib/admin/revalidate";
import { removePublicObject } from "@/lib/admin/upload";

export const dynamic = "force-dynamic";
type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(req: Request, ctx: Ctx) {
  const g = await guardAdmin(req);
  if (!g.ok) return g.res;
  const { id } = await ctx.params;
  if (!slugOk(id)) return fail("not_found", 404);
  const body = await readJsonObject(req);
  if (!body) return fail("bad_payload", 400);
  if ("id" in body) return fail("bad_payload", 400, { message: "代碼建立後不可修改" });
  const v = validateFields(body, CATEGORY_SPECS, CATEGORY_LABELS, "update");
  if (!v.ok) return fail("bad_payload", 400, { message: v.message });
  if (!Object.keys(v.values).length) return fail("bad_payload", 400, { message: "沒有要更新的欄位" });
  const { data, error } = await createAdminClient().from("categories").update(v.values).eq("id", id).select("id");
  if (error) {
    const e = dbErrorMessage(error);
    return fail(e.error, e.status, { message: e.message });
  }
  if (!data?.length) return fail("not_found", 404);
  revalidatePublic("category");
  return json({ ok: true });
}

export async function DELETE(req: Request, ctx: Ctx) {
  const g = await guardAdmin(req);
  if (!g.ok) return g.res;
  const { id } = await ctx.params;
  if (!slugOk(id)) return fail("not_found", 404);
  const sb = createAdminClient();
  const refs = await sb.from("products").select("id", { count: "exact", head: true }).eq("category_id", id);
  if ((refs.count ?? 0) > 0) return fail("conflict", 409, { message: `此分類仍有 ${refs.count} 件商品，請先移轉商品。` });
  const { data, error } = await sb.from("categories").delete().eq("id", id).select("id");
  if (error) {
    const e = dbErrorMessage(error);
    return fail(e.error, e.status, { message: e.message });
  }
  if (!data?.length) return fail("not_found", 404);
  // 一併清掉分類圖片 slot
  const slot = await sb.from("site_images").select("public_url").eq("slot_key", `category.${id}`).maybeSingle();
  if (slot.data) {
    await sb.from("site_images").delete().eq("slot_key", `category.${id}`);
    await removePublicObject(slot.data.public_url);
  }
  revalidatePublic("category");
  return json({ ok: true });
}
