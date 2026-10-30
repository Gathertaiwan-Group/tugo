import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

/** 連線健檢：用 service role 數 tugo.products（不回傳任何資料內容）。 */
export async function GET() {
  try {
    const { count, error } = await createAdminClient().from("products").select("id", { count: "exact", head: true });
    if (error) throw error;
    return NextResponse.json({ ok: true, products: count });
  } catch (e) {
    return NextResponse.json({ ok: false, error: e instanceof Error ? e.message : "error" }, { status: 503 });
  }
}
