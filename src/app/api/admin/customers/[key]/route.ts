import { createAdminClient } from "@/lib/supabase/admin";
import { fail, guardAdmin, json, readJsonObject } from "@/lib/admin/api";
import { keyToEmail } from "@/lib/admin/format";
import { validateCustomerPatch } from "@/lib/admin/customers";

export const dynamic = "force-dynamic";

export async function PATCH(req: Request, { params }: { params: Promise<{ key: string }> }) {
  const g = await guardAdmin(req);
  if (!g.ok) return g.res;
  const { key } = await params;
  const email = keyToEmail(key);
  if (!email) return fail("not_found", 404);
  const body = await readJsonObject(req);
  if (!body) return fail("bad_payload", 400);
  const v = validateCustomerPatch(body);
  if (!v.ok) return fail("bad_payload", 400, { message: v.message });

  const sb = createAdminClient();
  const { data: exists } = await sb.from("admin_customers").select("email").eq("email", email).maybeSingle();
  if (!exists) return fail("not_found", 404, { message: "找不到這位客戶" });

  const { data, error } = await sb
    .from("customer_profiles")
    .upsert({ email, ...v.patch, updated_at: new Date().toISOString() }, { onConflict: "email" })
    .select("*")
    .single();
  if (error) return fail("save_failed", 500);
  return json({ ok: true, profile: data });
}
