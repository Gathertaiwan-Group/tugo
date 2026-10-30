import { requireOwnerPage } from "@/lib/admin/auth";
import { listAdmins } from "@/lib/admin/users";
import { PageHead } from "@/components/admin/ui";
import UsersManager from "@/components/admin/UsersManager";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function UsersPage() {
  const me = await requireOwnerPage("/admin/users");
  const users = await listAdmins();
  return (
    <div className="adm-page">
      <PageHead eyebrow="Accounts" title="管理員帳號" sub="只有「擁有者」能新增、停用、改角色或重設密碼。停用或重設後，對方的登入會立即失效。" />
      <UsersManager initialUsers={users} meId={me.id} />
    </div>
  );
}
