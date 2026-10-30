import { createAdminClient } from "@/lib/supabase/admin";
import { fail, guardAdmin, json } from "@/lib/admin/api";

export const dynamic = "force-dynamic";

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const g = await guardAdmin(req);
  if (!g.ok) return g.res;
  const { id } = await params;
  if (!/^\d{1,18}$/.test(id)) return fail("not_found", 404);
  const sb = createAdminClient();
  const { data: note } = await sb.from("admin_notes").select("id,admin_id").eq("id", id).maybeSingle();
  if (!note) return fail("not_found", 404);
  if (g.admin.role !== "owner" && note.admin_id !== g.admin.id) return fail("forbidden", 403, { message: "只能刪除自己的備註" });
  const { error } = await sb.from("admin_notes").delete().eq("id", id);
  if (error) return fail("delete_failed", 500);
  return json({ ok: true });
}
