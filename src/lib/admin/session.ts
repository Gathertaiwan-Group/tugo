/**
 * 後台 session token（HMAC-SHA256）。只用 Web Crypto，Edge middleware 與 Node route 共用。
 * cookie 值 = base64url(payload).base64url(HMAC(payload, ADMIN_SESSION_SECRET))
 * payload = { sub, email, ver, iat, exp }；ver = admin_users.session_version（停用/改密碼/改角色時 +1 → 舊 cookie 失效）。
 * middleware 只驗簽章與 exp；「帳號仍啟用、版本相符」由 server 端 getCurrentAdmin() 每次請求查 DB。
 */
export const ADMIN_COOKIE = "tugo_admin";
export const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7; // 7 天

export type AdminSessionPayload = { sub: string; email: string; ver: number; exp: number };

function bytesToBase64Url(bytes: Uint8Array): string {
  let bin = "";
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
function strToBase64Url(s: string): string {
  return bytesToBase64Url(new TextEncoder().encode(s));
}
function base64UrlToStr(b64u: string): string {
  const b64 = b64u.replace(/-/g, "+").replace(/_/g, "/");
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return new TextDecoder().decode(bytes);
}

export function constantTimeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

async function hmacSign(payloadB64: string, secret: string): Promise<string> {
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, [
    "sign",
  ]);
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(payloadB64));
  return bytesToBase64Url(new Uint8Array(sig));
}

export async function createSessionToken(
  secret: string,
  admin: { id: string; email: string; sessionVersion: number },
  ttlSeconds = SESSION_TTL_SECONDS
): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const payload = { sub: admin.id, email: admin.email, ver: admin.sessionVersion, iat: now, exp: now + ttlSeconds };
  const payloadB64 = strToBase64Url(JSON.stringify(payload));
  return `${payloadB64}.${await hmacSign(payloadB64, secret)}`;
}

/** 驗簽章 + exp；失敗一律 null（fail-closed）。 */
export async function readSessionToken(token: string | undefined, secret: string | undefined): Promise<AdminSessionPayload | null> {
  try {
    if (!token || !secret) return null;
    const dot = token.lastIndexOf(".");
    if (dot <= 0) return null;
    const payloadB64 = token.slice(0, dot);
    const sig = token.slice(dot + 1);
    if (!constantTimeEqual(sig, await hmacSign(payloadB64, secret))) return null;
    const p = JSON.parse(base64UrlToStr(payloadB64)) as Partial<AdminSessionPayload>;
    if (typeof p.sub !== "string" || typeof p.email !== "string" || typeof p.ver !== "number") return null;
    if (typeof p.exp !== "number" || p.exp < Math.floor(Date.now() / 1000)) return null;
    return { sub: p.sub, email: p.email, ver: p.ver, exp: p.exp };
  } catch {
    return null;
  }
}
