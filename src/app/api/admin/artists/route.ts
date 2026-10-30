import { createAdminClient } from "@/lib/supabase/admin";
import { fail, guardAdmin, json, readJsonObject } from "@/lib/admin/api";
import { ARTIST_LABELS, ARTIST_SPECS, dbErrorMessage, validateFields } from "@/lib/admin/catalog";
import { revalidatePublic } from "@/lib/admin/revalidate";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const g = await guardAdmin(req);
  if (!g.ok) return g.res;
  const body = await readJsonObject(req);
  if (!body) return fail("bad_payload", 400);
  const v = validateFields(body, ARTIST_SPECS, ARTIST_LABELS, "create");
  if (!v.ok) return fail("bad_payload", 400, { message: v.message });
  const { error } = await createAdminClient().from("artists").insert(v.values);
  if (error) {
    const e = dbErrorMessage(error);
    return fail(e.error, e.status, { message: e.message });
  }
  revalidatePublic("artist", v.values.id as string);
  return json({ ok: true, id: v.values.id }, 201);
}
