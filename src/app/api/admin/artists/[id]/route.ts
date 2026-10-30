import { createAdminClient } from "@/lib/supabase/admin";
import { fail, guardAdmin, json, readJsonObject } from "@/lib/admin/api";
import { ARTIST_LABELS, ARTIST_SPECS, dbErrorMessage, slugOk, validateFields } from "@/lib/admin/catalog";
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
  const v = validateFields(body, ARTIST_SPECS, ARTIST_LABELS, "update");
  if (!v.ok) return fail("bad_payload", 400, { message: v.message });
  if (!Object.keys(v.values).length) return fail("bad_payload", 400, { message: "沒有要更新的欄位" });
  const { data, error } = await createAdminClient().from("artists").update(v.values).eq("id", id).select("id");
  if (error) {
    const e = dbErrorMessage(error);
    return fail(e.error, e.status, { message: e.message });
  }
  if (!data?.length) return fail("not_found", 404);
  revalidatePublic("artist", id);
  return json({ ok: true });
}

export async function DELETE(req: Request, ctx: Ctx) {
  const g = await guardAdmin(req);
  if (!g.ok) return g.res;
  const { id } = await ctx.params;
  if (!slugOk(id)) return fail("not_found", 404);
  const sb = createAdminClient();
  const [a, refs] = await Promise.all([
    sb.from("artists").select("portrait_url,cover_url").eq("id", id).maybeSingle(),
    sb.from("products").select("id", { count: "exact", head: true }).eq("artist_id", id),
  ]);
  if (!a.data) return fail("not_found", 404);
  if ((refs.count ?? 0) > 0) return fail("conflict", 409, { message: `此藝術家仍有 ${refs.count} 件商品，請先移轉或刪除商品。` });
  const { error } = await sb.from("artists").delete().eq("id", id);
  if (error) {
    const e = dbErrorMessage(error);
    return fail(e.error, e.status, { message: e.message });
  }
  await Promise.all([removePublicObject(a.data.portrait_url), removePublicObject(a.data.cover_url)]);
  revalidatePublic("artist", id);
  return json({ ok: true });
}
