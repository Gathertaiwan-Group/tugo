import { createAdminClient } from "@/lib/supabase/admin";
import { fail, guardAdmin, json } from "@/lib/admin/api";
import { slugOk } from "@/lib/admin/catalog";
import { revalidatePublic } from "@/lib/admin/revalidate";
import { UPLOAD_ERROR_MESSAGES, removePublicObject, uploadPublicImage } from "@/lib/admin/upload";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
type Ctx = { params: Promise<{ id: string }> };

// 上傳系列封面（FormData：file）
export async function POST(req: Request, ctx: Ctx) {
  const g = await guardAdmin(req);
  if (!g.ok) return g.res;
  const { id } = await ctx.params;
  if (!slugOk(id)) return fail("not_found", 404);
  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return fail("bad_payload", 400);
  }
  const sb = createAdminClient();
  const { data: cur } = await sb.from("collections").select("cover_url").eq("id", id).maybeSingle();
  if (!cur) return fail("not_found", 404);
  const up = await uploadPublicImage("tugo-artist-images", `collections/${id}`, form.get("file"));
  if (!up.ok) return fail(up.error, 400, { message: UPLOAD_ERROR_MESSAGES[up.error] });
  const { error } = await sb.from("collections").update({ cover_url: up.image.publicUrl }).eq("id", id);
  if (error) {
    await removePublicObject(up.image.publicUrl);
    return fail("db_error", 500, { message: "儲存失敗，請重試" });
  }
  await removePublicObject(cur.cover_url);
  revalidatePublic("collection", id);
  return json({ ok: true, url: up.image.publicUrl });
}

export async function DELETE(req: Request, ctx: Ctx) {
  const g = await guardAdmin(req);
  if (!g.ok) return g.res;
  const { id } = await ctx.params;
  if (!slugOk(id)) return fail("not_found", 404);
  const sb = createAdminClient();
  const { data: cur } = await sb.from("collections").select("cover_url").eq("id", id).maybeSingle();
  if (!cur) return fail("not_found", 404);
  const { error } = await sb.from("collections").update({ cover_url: null }).eq("id", id);
  if (error) return fail("db_error", 500);
  await removePublicObject(cur.cover_url);
  revalidatePublic("collection", id);
  return json({ ok: true });
}
