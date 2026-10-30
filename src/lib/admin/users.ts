import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";

export type AdminUserRow = {
  id: string;
  email: string;
  name: string | null;
  role: "owner" | "staff";
  active: boolean;
  created_at: string;
  last_login_at: string | null;
};
const COLS = "id,email,name,role,active,created_at,last_login_at";

export async function listAdmins(): Promise<AdminUserRow[]> {
  const { data, error } = await createAdminClient().from("admin_users").select(COLS).order("created_at");
  if (error) throw new Error(`listAdmins: ${error.message}`);
  return (data ?? []) as AdminUserRow[];
}

export async function getAdminRow(id: string) {
  const { data } = await createAdminClient().from("admin_users").select(`${COLS},session_version`).eq("id", id).maybeSingle();
  return (data as (AdminUserRow & { session_version: number }) | null) ?? null;
}

export async function countActiveOwners(): Promise<number> {
  const { count } = await createAdminClient().from("admin_users").select("id", { count: "exact", head: true }).eq("role", "owner").eq("active", true);
  return count ?? 0;
}

export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
