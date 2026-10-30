import AdminShell from "@/components/admin/AdminShell";
import { adminDisplayName, requireAdminPage } from "@/lib/admin/auth";

export const dynamic = "force-dynamic";
export const revalidate = 0;

// 殼放在 layout：換頁時側欄不重掛，只換右側內容。登入頁與掃描站刻意不在這個 group。
export default async function ShellLayout({ children }: { children: React.ReactNode }) {
  const admin = await requireAdminPage();
  return (
    <AdminShell adminName={adminDisplayName(admin)} role={admin.role}>
      {children}
    </AdminShell>
  );
}
