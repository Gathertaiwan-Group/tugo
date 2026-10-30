import { createAdminClient } from "@/lib/supabase/admin";
import { guardAdmin } from "@/lib/admin/api";
import { fmtDateTime, taipeiToday } from "@/lib/admin/format";
import { sanitizeSearch } from "@/lib/admin/query";

export const dynamic = "force-dynamic";
export const revalidate = 0;

/** CSV 儲存格：防公式注入（= + - @ tab CR 開頭前加 '），再做 RFC4180 引號跳脫 */
function csvCell(v: string): string {
  const safe = /^[=+\-@\t\r]/.test(v) ? `'${v}` : v;
  return /[",\r\n]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe;
}

// 匯出電子報訂閱者 CSV（UTF-8 BOM，Excel 開中文不亂碼）；可帶 ?q= 與列表相同的搜尋條件
export async function GET(req: Request) {
  const g = await guardAdmin(req);
  if (!g.ok) return g.res;
  const q = sanitizeSearch(new URL(req.url).searchParams.get("q"));
  const sb = createAdminClient();
  const lines = ["email,created_at"];
  const PAGE = 1000;
  for (let from = 0; from < 200_000; from += PAGE) {
    let query = sb.from("newsletter_subscribers").select("id,email,created_at").order("id").range(from, from + PAGE - 1);
    if (q) query = query.ilike("email", `%${q}%`);
    const { data, error } = await query;
    if (error) return new Response("匯出失敗", { status: 500, headers: { "Cache-Control": "no-store" } });
    for (const r of (data ?? []) as { email: string; created_at: string }[]) lines.push(`${csvCell(r.email)},${csvCell(fmtDateTime(r.created_at))}`);
    if (!data || data.length < PAGE) break;
  }
  const body = "﻿" + lines.join("\r\n") + "\r\n";
  return new Response(body, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="tugo-newsletter-${taipeiToday()}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
