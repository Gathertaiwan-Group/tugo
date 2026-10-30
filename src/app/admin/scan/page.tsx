import { adminDisplayName, requireAdminPage } from "@/lib/admin/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import ScanStation, { type RecentScan } from "@/components/admin/ScanStation";

// 不在 (shell) 內：掃描站要全螢幕、不要 AI FAB 擋畫面
export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function ScanPage() {
  const admin = await requireAdminPage("/admin/scan");
  const { data } = await createAdminClient()
    .from("order_events")
    .select("id,station,admin_name,scanned_at,order:orders(order_no,recipient_name)")
    .order("scanned_at", { ascending: false })
    .limit(20);
  const recent = ((data ?? []) as unknown as { id: number; station: string; admin_name: string | null; scanned_at: string; order: { order_no: string | null; recipient_name: string } | null }[]).map(
    (r): RecentScan => ({ id: r.id, station: r.station, adminName: r.admin_name, at: r.scanned_at, orderNo: r.order?.order_no ?? null, name: r.order?.recipient_name ?? null })
  );
  return <ScanStation adminLabel={adminDisplayName(admin)} initialRecent={recent} />;
}
