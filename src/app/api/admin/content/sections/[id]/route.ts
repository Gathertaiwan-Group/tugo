import { createAdminClient } from "@/lib/supabase/admin";
import { fail, guardAdmin, json, readJsonObject } from "@/lib/admin/api";
import { dbErrorMessage, validateFields } from "@/lib/admin/catalog";
import { SECTION_LABELS, SECTION_SPECS } from "@/lib/admin/content";
import { revalidatePublic } from "@/lib/admin/revalidate";

export const dynamic = "force-dynamic";
type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(req: Request, ctx: Ctx) {
  const g = await guardAdmin(req);
  if (!g.ok) return g.res;
  const { id } = await ctx.params;
  if (!/^\d{1,18}$/.test(id)) return fail("not_found", 404);
  const body = await readJsonObject(req);
  if (!body) return fail("bad_payload", 400);
  const v = validateFields(body, SECTION_SPECS, SECTION_LABELS, "update");
  if (!v.ok) return fail("bad_payload", 400, { message: v.message });
  if (!Object.keys(v.values).length) return fail("bad_payload", 400);
  const { data, error } = await createAdminClient().from("info_sections").update(v.values).eq("id", Number(id)).select("id");
  if (error) {
    const e = dbErrorMessage(error);
    return fail(e.error, e.status, { message: e.message });
  }
  if (!data?.length) return fail("not_found", 404);
  revalidatePublic("content");
  return json({ ok: true });
}

export async function DELETE(req: Request, ctx: Ctx) {
  const g = await guardAdmin(req);
  if (!g.ok) return g.res;
  const { id } = await ctx.params;
  if (!/^\d{1,18}$/.test(id)) return fail("not_found", 404);
  const { data, error } = await createAdminClient().from("info_sections").delete().eq("id", Number(id)).select("id");
  if (error) return fail("db_error", 500);
  if (!data?.length) return fail("not_found", 404);
  revalidatePublic("content");
  return json({ ok: true });
}
