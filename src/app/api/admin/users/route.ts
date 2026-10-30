import { createAdminClient } from "@/lib/supabase/admin";
import { fail, guardAdmin, json, readJsonObject, unknownKey } from "@/lib/admin/api";
import { hashPassword, passwordProblem } from "@/lib/admin/password";
import { EMAIL_RE, listAdmins } from "@/lib/admin/users";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// 帳號管理：只有 owner 能用（guardAdmin owner:true；寫入另檢查 Origin）
export async function GET(req: Request) {
  const g = await guardAdmin(req, { owner: true });
  if (!g.ok) return g.res;
  return json({ ok: true, users: await listAdmins() });
}

export async function POST(req: Request) {
  const g = await guardAdmin(req, { owner: true });
  if (!g.ok) return g.res;
  const body = await readJsonObject(req);
  if (!body || unknownKey(body, ["email", "name", "password", "role"])) return fail("bad_payload", 400);
  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const name = typeof body.name === "string" ? body.name.trim().slice(0, 60) : "";
  const role = body.role === "owner" ? "owner" : body.role === "staff" || body.role === undefined ? "staff" : null;
  if (!EMAIL_RE.test(email) || email.length > 254) return fail("bad_payload", 400, { message: "Email 格式不正確" });
  if (!role) return fail("bad_payload", 400, { message: "角色不正確" });
  const pwErr = passwordProblem(body.password);
  if (pwErr) return fail("bad_payload", 400, { message: pwErr });
  const { salt, hash } = hashPassword(body.password as string);
  const { data, error } = await createAdminClient()
    .from("admin_users")
    .insert({ email, name: name || null, role, password_hash: hash, password_salt: salt })
    .select("id")
    .single();
  if (error) {
    if (error.code === "23505") return fail("conflict", 409, { message: "此 Email 已有帳號" });
    return fail("create_failed", 500);
  }
  return json({ ok: true, id: data.id }, 201);
}
