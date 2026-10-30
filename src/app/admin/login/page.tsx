import LoginForm from "@/components/admin/LoginForm";

export const dynamic = "force-dynamic";

export default async function AdminLoginPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const sp = await searchParams;
  const raw = typeof sp.next === "string" ? sp.next : "/admin";
  // 只允許站內 /admin 路徑，避免 open redirect
  const next = raw.startsWith("/admin") && !raw.startsWith("//") && !raw.includes("\\") ? raw : "/admin";
  return (
    <div className="adm-login">
      <div className="adm-login-card">
        <div className="adm-eyebrow">TUGO STUDIO · ADMIN</div>
        <h1 className="adm-h1" style={{ marginBottom: 18 }}>
          管理後台登入
        </h1>
        <LoginForm next={next === "/admin/login" ? "/admin" : next} />
      </div>
    </div>
  );
}
