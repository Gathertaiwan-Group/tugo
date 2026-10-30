import { createAdminClient } from "@/lib/supabase/admin";
import { fail, guardAdmin, json, readJsonObject } from "@/lib/admin/api";
import { COLLECTION_LABELS, COLLECTION_SPECS, dbErrorMessage, slugOk, validateFields } from "@/lib/admin/catalog";
import { revalidatePublic } from "@/lib/admin/revalidate";
import { removePublicObject } from "@/lib/admin/upload";
import { setCollectionArtists } from "../artists";

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
  const v = validateFields(body, COLLECTION_SPECS, COLLECTION_LABELS, "update");
  if (!v.ok) return fail("bad_payload", 400, { message: v.message });
  const { artist_ids, ...values } = v.values;
  const sb = createAdminClient();
  const exists = await sb.from("collections").select("id").eq("id", id).maybeSingle();
  if (!exists.data) return fail("not_found", 404);
  if (Object.keys(values).length) {
    const { error } = await sb.from("collections").update(values).eq("id", id);
    if (error) {
      const e = dbErrorMessage(error);
      return fail(e.error, e.status, { message: e.message });
    }
  }
  if (Array.isArray(artist_ids)) {
    const r = await setCollectionArtists(id, artist_ids as string[]);
    if (!r.ok) return fail("bad_payload", 400, { message: r.message });
  }
  revalidatePublic("collection", id);
  return json({ ok: true });
}

export async function DELETE(req: Request, ctx: Ctx) {
  const g = await guardAdmin(req);
  if (!g.ok) return g.res;
  const { id } = await ctx.params;
  if (!slugOk(id)) return fail("not_found", 404);
  const sb = createAdminClient();
  const [c, refs] = await Promise.all([
    sb.from("collections").select("cover_url").eq("id", id).maybeSingle(),
    sb.from("products").select("id", { count: "exact", head: true }).eq("collection_id", id),
  ]);
  if (!c.data) return fail("not_found", 404);
  if ((refs.count ?? 0) > 0) return fail("conflict", 409, { message: `此系列仍有 ${refs.count} 件商品，請先把商品移出系列。` });
  const { error } = await sb.from("collections").delete().eq("id", id);
  if (error) {
    const e = dbErrorMessage(error);
    return fail(e.error, e.status, { message: e.message });
  }
  await removePublicObject(c.data.cover_url);
  revalidatePublic("collection", id);
  return json({ ok: true });
}
