import { createAdminClient } from "@/lib/supabase/admin";
import { fail, guardAdmin, json } from "@/lib/admin/api";

export const dynamic = "force-dynamic";
type Ctx = { params: Promise<{ id: string }> };

// 刪除單一訂閱者（例：本人要求取消訂閱）
export async function DELETE(req: Request, ctx: Ctx) {
  const g = await guardAdmin(req);
  if (!g.ok) return g.res;
  const { id } = await ctx.params;
  if (!/^\d{1,18}$/.test(id)) return fail("not_found", 404);
  const { data, error } = await createAdminClient().from("newsletter_subscribers").delete().eq("id", Number(id)).select("id");
  if (error) return fail("db_error", 500);
  if (!data?.length) return fail("not_found", 404);
  return json({ ok: true });
}
