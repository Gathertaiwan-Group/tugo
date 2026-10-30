import { adminDisplayName, requireAdminPage } from "@/lib/admin/auth";
import { PageHead } from "@/components/admin/ui";
import ChangePasswordForm from "@/components/admin/ChangePasswordForm";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function AccountPage() {
  const me = await requireAdminPage("/admin/account");
  return (
    <div className="adm-page">
      <PageHead eyebrow="My account" title="我的帳號" sub={`${adminDisplayName(me)} · ${me.email} · ${me.role === "owner" ? "擁有者" : "工作人員"}`} />
      <section className="adm-card" style={{ maxWidth: 520 }}>
        <h2 className="adm-h2">變更密碼</h2>
        <ChangePasswordForm />
      </section>
    </div>
  );
}
