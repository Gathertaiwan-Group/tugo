import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { ADMIN_COOKIE, readSessionToken } from "@/lib/admin/session";

/**
 * 後台閘門（Edge）：/admin/*、/api/admin/* 需要有效的 tugo_admin cookie（HMAC 簽章 + 未過期）。
 * fail-closed：沒 secret 或沒 token 一律擋 —— 頁面 302 → /admin/login?next=…，API 回 401 JSON。
 * 帳號停用 / session 版本不符（改密碼、改角色）在 server 端 getCurrentAdmin() 查 DB 再擋一次（Edge 不查 DB）。
 * 登入頁與登入 API 放行，避免導向迴圈。
 */
export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  if (pathname === "/admin/login" || pathname === "/api/admin/login") return NextResponse.next();

  const session = await readSessionToken(req.cookies.get(ADMIN_COOKIE)?.value, process.env.ADMIN_SESSION_SECRET);
  if (session) {
    const res = NextResponse.next();
    res.headers.set("X-Robots-Tag", "noindex, nofollow");
    return res;
  }

  if (pathname.startsWith("/api/")) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401, headers: { "Cache-Control": "no-store" } });
  }
  const url = req.nextUrl.clone();
  url.pathname = "/admin/login";
  url.search = "";
  url.searchParams.set("next", pathname);
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/admin", "/admin/:path*", "/api/admin/:path*"],
};
