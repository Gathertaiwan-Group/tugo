import { cookies } from "next/headers";
import { createAdminClient } from "@/lib/supabase/admin";
import { fail, guardAdmin, json, readJsonObject, unknownKey } from "@/lib/admin/api";
import { hashPassword, passwordProblem, verifyPassword } from "@/lib/admin/password";
import { ADMIN_COOKIE, SESSION_TTL_SECONDS, createSessionToken } from "@/lib/admin/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** 變更自己的密碼：驗證目前密碼 → 更新 → session_version +1（其他裝置登出）→ 重發本裝置 cookie。 */
export async function POST(req: Request) {
  const g = await guardAdmin(req);
  if (!g.ok) return g.res;
  const body = await readJsonObject(req);
  if (!body || unknownKey(body, ["current", "next"])) return fail("bad_payload", 400);
  const current = typeof body.current === "string" ? body.current : "";
  const pwErr = passwordProblem(body.next);
  if (pwErr) return fail("bad_payload", 400, { message: pwErr });
  const sb = createAdminClient();
  const { data: row } = await sb.from("admin_users").select("id,email,password_hash,password_salt,session_version").eq("id", g.admin.id).single();
  if (!row || !verifyPassword(current, row.password_salt, row.password_hash)) return fail("bad_payload", 400, { message: "目前密碼不正確" });
  const { salt, hash } = hashPassword(body.next as string);
  const ver = row.session_version + 1;
  const { error } = await sb.from("admin_users").update({ password_hash: hash, password_salt: salt, session_version: ver }).eq("id", row.id);
  if (error) return fail("update_failed", 500);
  const secret = process.env.ADMIN_SESSION_SECRET!;
  (await cookies()).set(ADMIN_COOKIE, await createSessionToken(secret, { id: row.id, email: row.email, sessionVersion: ver }), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_TTL_SECONDS,
  });
  return json({ ok: true });
}
