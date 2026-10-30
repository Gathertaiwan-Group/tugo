import { cookies } from "next/headers";
import { createAdminClient } from "@/lib/supabase/admin";
import { ADMIN_COOKIE, SESSION_TTL_SECONDS, createSessionToken } from "@/lib/admin/session";
import { verifyPassword } from "@/lib/admin/password";
import { fail, hasSameOrigin, json, readJsonObject } from "@/lib/admin/api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// best-effort 失敗次數限制（單一 lambda 記憶體，多實例不共享；主要擋單點暴力嘗試）
const FAILS = new Map<string, { n: number; until: number }>();
const WINDOW_MS = 10 * 60 * 1000;
const MAX_FAILS = 8;

function throttleKey(req: Request, email: string) {
  const ip = (req.headers.get("x-forwarded-for") ?? "").split(",")[0].trim() || "local";
  return `${ip}|${email}`;
}
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export async function POST(req: Request) {
  if (!hasSameOrigin(req)) return fail("bad_origin", 403);
  const secret = process.env.ADMIN_SESSION_SECRET;
  if (!secret || secret.length < 32) return fail("not_configured", 500);

  const body = await readJsonObject(req);
  const email = typeof body?.email === "string" ? body.email.trim().toLowerCase().slice(0, 254) : "";
  const password = typeof body?.password === "string" ? body.password.slice(0, 200) : "";
  if (!email || !password) return fail("invalid_credentials", 400);

  const key = throttleKey(req, email);
  const now = Date.now();
  const rec = FAILS.get(key);
  if (rec && rec.until > now && rec.n >= MAX_FAILS) return fail("rate_limited", 429);

  const { data: admin } = await createAdminClient()
    .from("admin_users")
    .select("id,email,password_hash,password_salt,active,session_version")
    .eq("email", email)
    .maybeSingle();

  const ok = !!admin && admin.active && verifyPassword(password, admin.password_salt, admin.password_hash);
  if (!ok || !admin) {
    const cur = rec && rec.until > now ? rec : { n: 0, until: now + WINDOW_MS };
    FAILS.set(key, { n: cur.n + 1, until: cur.until });
    await sleep(300); // 單一錯誤訊息 + 固定延遲：防帳號枚舉、減緩暴力
    return fail("invalid_credentials", 401);
  }
  FAILS.delete(key);

  const token = await createSessionToken(secret, { id: admin.id, email: admin.email, sessionVersion: admin.session_version });
  (await cookies()).set(ADMIN_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_TTL_SECONDS,
  });
  void createAdminClient().from("admin_users").update({ last_login_at: new Date().toISOString() }).eq("id", admin.id).then(
    () => {},
    () => {}
  );
  return json({ ok: true });
}

export async function DELETE(req: Request) {
  if (!hasSameOrigin(req)) return fail("bad_origin", 403);
  (await cookies()).set(ADMIN_COOKIE, "", { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", maxAge: 0 });
  return json({ ok: true });
}
