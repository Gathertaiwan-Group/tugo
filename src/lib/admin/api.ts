import "server-only";
import { NextResponse } from "next/server";
import { getCurrentAdmin, type CurrentAdmin } from "@/lib/admin/auth";

/** 後台 API 一律 no-store。 */
export function json(body: unknown, status = 200, extra?: HeadersInit) {
  return NextResponse.json(body, { status, headers: { "Cache-Control": "no-store", ...(extra ?? {}) } });
}
export function fail(error: string, status: number, extra?: Record<string, unknown>) {
  return json({ ok: false, error, ...(extra ?? {}) }, status);
}

/**
 * 同源檢查：Origin header 必須存在且等於本站 origin（缺 Origin 也拒絕）。
 * 寫入型（非 GET/HEAD）請求一律要過；搭配 SameSite=Lax cookie 防 CSRF。
 */
export function hasSameOrigin(req: Request): boolean {
  const origin = req.headers.get("origin");
  if (!origin) return false;
  const self = new URL(req.url).origin;
  if (origin === self) return true;
  // 反向代理（Vercel）情境：以 forwarded host 重組
  const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host");
  const proto = req.headers.get("x-forwarded-proto") ?? new URL(req.url).protocol.replace(":", "");
  return !!host && origin === `${proto}://${host}`;
}

type GuardOk = { ok: true; admin: CurrentAdmin };
type GuardFail = { ok: false; res: NextResponse };

/**
 * 後台 API 的統一閘門：
 *  1) 非 GET/HEAD → 檢查 Origin（403 bad_origin）
 *  2) 讀 cookie + 查 DB（active、session_version）→ 401 unauthorized
 *  3) owner:true → 非 owner 回 403 forbidden
 */
export async function guardAdmin(req: Request, opts: { owner?: boolean } = {}): Promise<GuardOk | GuardFail> {
  const method = req.method.toUpperCase();
  if (method !== "GET" && method !== "HEAD" && !hasSameOrigin(req)) {
    return { ok: false, res: fail("bad_origin", 403) };
  }
  const admin = await getCurrentAdmin();
  if (!admin) return { ok: false, res: fail("unauthorized", 401) };
  if (opts.owner && admin.role !== "owner") return { ok: false, res: fail("forbidden", 403) };
  return { ok: true, admin };
}

/** 讀 JSON body：非物件或解析失敗回 null。 */
export async function readJsonObject(req: Request): Promise<Record<string, unknown> | null> {
  try {
    const v = (await req.json()) as unknown;
    return v && typeof v === "object" && !Array.isArray(v) ? (v as Record<string, unknown>) : null;
  } catch {
    return null;
  }
}

/** 拒絕白名單以外的欄位。回傳第一個未知欄位名或 null。 */
export function unknownKey(body: Record<string, unknown>, allowed: readonly string[]): string | null {
  for (const k of Object.keys(body)) if (!allowed.includes(k)) return k;
  return null;
}
