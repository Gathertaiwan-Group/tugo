import "server-only";
import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { ADMIN_COOKIE, readSessionToken } from "@/lib/admin/session";

export type AdminRole = "owner" | "staff";
export type CurrentAdmin = { id: string; email: string; name: string | null; role: AdminRole };

/**
 * 目前登入的管理員（每個請求查一次 DB，React.cache 去重）。
 * 必須同時滿足：簽章有效未過期、帳號存在且 active、session_version 與 token 的 ver 相同。
 * → 停用帳號、改密碼、改角色後，舊 cookie 下一個請求立即失效。
 */
export const getCurrentAdmin = cache(async (): Promise<CurrentAdmin | null> => {
  const store = await cookies();
  const session = await readSessionToken(store.get(ADMIN_COOKIE)?.value, process.env.ADMIN_SESSION_SECRET);
  if (!session) return null;
  if (!/^[0-9a-f-]{36}$/i.test(session.sub)) return null;
  const { data, error } = await createAdminClient()
    .from("admin_users")
    .select("id,email,name,role,active,session_version")
    .eq("id", session.sub)
    .maybeSingle();
  if (error || !data || !data.active || data.session_version !== session.ver) return null;
  return { id: data.id, email: data.email, name: data.name, role: data.role === "owner" ? "owner" : "staff" };
});

/** 後台頁面用：未登入（或已停用）→ 導去登入頁。 */
export async function requireAdminPage(next = "/admin"): Promise<CurrentAdmin> {
  const admin = await getCurrentAdmin();
  if (!admin) redirect(`/admin/login?next=${encodeURIComponent(next)}`);
  return admin;
}

/** 只有 owner 能看的頁面：staff → 回總覽。 */
export async function requireOwnerPage(next = "/admin"): Promise<CurrentAdmin> {
  const admin = await requireAdminPage(next);
  if (admin.role !== "owner") redirect("/admin?denied=owner");
  return admin;
}

export function adminDisplayName(a: Pick<CurrentAdmin, "name" | "email">): string {
  return a.name?.trim() || a.email;
}
