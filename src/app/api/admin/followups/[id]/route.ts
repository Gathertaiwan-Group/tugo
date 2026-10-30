import { createAdminClient } from "@/lib/supabase/admin";
import { fail, guardAdmin, json, readJsonObject } from "@/lib/admin/api";
import { validateFollowup } from "@/lib/admin/followups";

export const dynamic = "force-dynamic";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const g = await guardAdmin(req);
  if (!g.ok) return g.res;
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) return fail("not_found", 404);
  const body = await readJsonObject(req);
  if (!body || Object.keys(body).length === 0) return fail("bad_payload", 400);
  const v = validateFollowup(body, "update");
  if (!v.ok) return fail("bad_payload", 400, { message: v.message });
  const { data, error } = await createAdminClient()
    .from("followups")
    .update({ ...v.row, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select("*")
    .maybeSingle();
  if (error) return fail("save_failed", 500);
  if (!data) return fail("not_found", 404);
  return json({ ok: true, followup: data });
}
