import { createAdminClient } from "@/lib/supabase/admin";
import { fail, guardAdmin, json, readJsonObject } from "@/lib/admin/api";
import { dbErrorMessage, validateFields } from "@/lib/admin/catalog";
import { FAQ_LABELS, FAQ_SPECS } from "@/lib/admin/content";
import { revalidatePublic } from "@/lib/admin/revalidate";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const g = await guardAdmin(req);
  if (!g.ok) return g.res;
  const body = await readJsonObject(req);
  if (!body) return fail("bad_payload", 400);
  const v = validateFields(body, FAQ_SPECS, FAQ_LABELS, "create");
  if (!v.ok) return fail("bad_payload", 400, { message: v.message });
  const { data, error } = await createAdminClient().from("faqs").insert(v.values).select("id").single();
  if (error) {
    const e = dbErrorMessage(error);
    return fail(e.error, e.status, { message: e.message });
  }
  revalidatePublic("content");
  return json({ ok: true, id: data.id }, 201);
}
