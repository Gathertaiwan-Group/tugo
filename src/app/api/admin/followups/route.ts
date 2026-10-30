import { createAdminClient } from "@/lib/supabase/admin";
import { fail, guardAdmin, json, readJsonObject } from "@/lib/admin/api";
import { validateFollowup } from "@/lib/admin/followups";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const g = await guardAdmin(req);
  if (!g.ok) return g.res;
  const body = await readJsonObject(req);
  if (!body) return fail("bad_payload", 400);
  const v = validateFollowup(body, "create");
  if (!v.ok) return fail("bad_payload", 400, { message: v.message });
  const { data, error } = await createAdminClient()
    .from("followups")
    .insert({ ...v.row, created_by: g.admin.id })
    .select("*")
    .single();
  if (error) return fail("save_failed", 500);
  return json({ ok: true, followup: data }, 201);
}
