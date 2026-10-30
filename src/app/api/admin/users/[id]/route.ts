import { createAdminClient } from "@/lib/supabase/admin";
import { fail, guardAdmin, json, readJsonObject, unknownKey } from "@/lib/admin/api";
import { hashPassword, passwordProblem } from "@/lib/admin/password";
import { countActiveOwners, getAdminRow } from "@/lib/admin/users";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * 修改管理員：{ name?, role?, active?, password? }（只有 owner）。
 * - 不能停用 / 降級自己；不能讓系統沒有任何啟用中的 owner。
 * - 停用、改角色、重設密碼 → session_version +1，對方已發的 cookie 下一個請求立即失效。
 */
export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const g = await guardAdmin(req, { owner: true });
  if (!g.ok) return g.res;
  const { id } = await ctx.params;
  const body = await readJsonObject(req);
  if (!body || unknownKey(body, ["name", "role", "active", "password"]) || Object.keys(body).length === 0) return fail("bad_payload", 400);
  const target = await getAdminRow(id);
  if (!target) return fail("not_found", 404);

  const patch: Record<string, unknown> = {};
  let bump = false;
  if ("name" in body) {
    if (body.name !== null && typeof body.name !== "string") return fail("bad_payload", 400);
    patch.name = typeof body.name === "string" && body.name.trim() ? body.name.trim().slice(0, 60) : null;
  }
  if ("role" in body) {
    if (body.role !== "owner" && body.role !== "staff") return fail("bad_payload", 400, { message: "角色不正確" });
    if (body.role !== target.role) {
      if (target.id === g.admin.id) return fail("bad_payload", 400, { message: "不能變更自己的角色" });
      if (target.role === "owner" && target.active && (await countActiveOwners()) <= 1) return fail("bad_payload", 400, { message: "至少要保留一位啟用中的擁有者" });
      patch.role = body.role;
      bump = true;
    }
  }
  if ("active" in body) {
    if (typeof body.active !== "boolean") return fail("bad_payload", 400);
    if (body.active !== target.active) {
      if (target.id === g.admin.id) return fail("bad_payload", 400, { message: "不能停用自己" });
      if (!body.active && target.role === "owner" && (await countActiveOwners()) <= 1) return fail("bad_payload", 400, { message: "至少要保留一位啟用中的擁有者" });
      patch.active = body.active;
      bump = true;
    }
  }
  if ("password" in body) {
    const pwErr = passwordProblem(body.password);
    if (pwErr) return fail("bad_payload", 400, { message: pwErr });
    const { salt, hash } = hashPassword(body.password as string);
    patch.password_hash = hash;
    patch.password_salt = salt;
    bump = true;
  }
  if (bump) patch.session_version = target.session_version + 1;
  if (Object.keys(patch).length === 0) return json({ ok: true, unchanged: true });

  const { error } = await createAdminClient().from("admin_users").update(patch).eq("id", id);
  if (error) return fail("update_failed", 500);
  return json({ ok: true });
}
