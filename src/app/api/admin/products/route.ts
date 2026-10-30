import { createAdminClient } from "@/lib/supabase/admin";
import { fail, guardAdmin, json, readJsonObject } from "@/lib/admin/api";
import { PRODUCT_LABELS, PRODUCT_SPECS, dbErrorMessage, newProductId, validateFields } from "@/lib/admin/catalog";
import { revalidatePublic } from "@/lib/admin/revalidate";

export const dynamic = "force-dynamic";

// 新增商品
export async function POST(req: Request) {
  const g = await guardAdmin(req);
  if (!g.ok) return g.res;
  const body = await readJsonObject(req);
  if (!body) return fail("bad_payload", 400);
  const v = validateFields(body, PRODUCT_SPECS, PRODUCT_LABELS, "create");
  if (!v.ok) return fail("bad_payload", 400, { message: v.message });
  const id = newProductId();
  const { error } = await createAdminClient()
    .from("products")
    .insert({ ...v.values, id, updated_at: new Date().toISOString() });
  if (error) {
    const e = dbErrorMessage(error);
    return fail(e.error, e.status, { message: e.message });
  }
  revalidatePublic("product", v.values.slug as string);
  return json({ ok: true, id }, 201);
}
