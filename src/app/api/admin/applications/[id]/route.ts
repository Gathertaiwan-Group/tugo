import { createAdminClient } from "@/lib/supabase/admin";
import { fail, guardAdmin, json, readJsonObject, unknownKey } from "@/lib/admin/api";
import { APPLICATION_STATUSES } from "@/lib/admin/format";

export const dynamic = "force-dynamic";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const g = await guardAdmin(req);
  if (!g.ok) return g.res;
  const { id } = await params;
  if (!/^\d{1,18}$/.test(id)) return fail("not_found", 404);
  const body = await readJsonObject(req);
  if (!body || unknownKey(body, ["status"])) return fail("bad_payload", 400);
  if (typeof body.status !== "string" || !(APPLICATION_STATUSES as readonly string[]).includes(body.status)) {
    return fail("bad_payload", 400, { message: "狀態不正確" });
  }
  const { data, error } = await createAdminClient()
    .from("artist_applications")
    .update({ status: body.status, updated_at: new Date().toISOString(), reviewed_by: g.admin.id })
    .eq("id", id)
    .select("id,status")
    .maybeSingle();
  if (error) return fail("save_failed", 500);
  if (!data) return fail("not_found", 404);
  return json({ ok: true, application: data });
}
