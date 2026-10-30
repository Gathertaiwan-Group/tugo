"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import AdminAiAssistant from "@/components/admin/AdminAiAssistant";
import { reloadIfCurrentPage } from "@/components/admin/reloadIfCurrentPage";

type NavItem = { href: string; label: string; ic: string; ownerOnly?: boolean };
const NAV: { group: string; items: NavItem[] }[] = [
  {
    group: "營運",
    items: [
      { href: "/admin", label: "營運總覽", ic: "▦" },
      { href: "/admin/orders", label: "訂單", ic: "▥" },
      { href: "/admin/scan", label: "出貨掃描站", ic: "▣" },
      { href: "/admin/followups", label: "追蹤與回訪", ic: "✓" },
    ],
  },
  {
    group: "客戶",
    items: [
      { href: "/admin/customers", label: "客戶知識庫", ic: "◉" },
      { href: "/admin/knowledge", label: "服務知識庫", ic: "⌕" },
      { href: "/admin/applications", label: "合作申請", ic: "✉" },
      { href: "/admin/newsletter", label: "電子報訂閱", ic: "✦" },
    ],
  },
  {
    group: "商品與內容",
    items: [
      { href: "/admin/products", label: "商品", ic: "◧" },
      { href: "/admin/artists", label: "藝術家", ic: "✎" },
      { href: "/admin/collections", label: "聯名系列", ic: "◫" },
      { href: "/admin/categories", label: "分類", ic: "≡" },
      { href: "/admin/site-images", label: "網站圖片", ic: "▧" },
      { href: "/admin/content", label: "FAQ 與條款", ic: "¶" },
    ],
  },
  { group: "系統", items: [{ href: "/admin/users", label: "管理員帳號", ic: "♙", ownerOnly: true }] },
];

const isActive = (href: string, pathname: string) => (href === "/admin" ? pathname === "/admin" : pathname.startsWith(href));

// 後台外殼：桌機左側固定功能列；手機收成抽屜（頂端漢堡開關）。
export default function AdminShell({
  children,
  adminName,
  role,
}: {
  children: React.ReactNode;
  adminName: string;
  role: "owner" | "staff";
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  async function logout() {
    await fetch("/api/admin/login", { method: "DELETE" }).catch(() => {});
    // 整頁跳轉：清掉 client router 快取，登出後按「上一頁」才不會還原後台畫面
    window.location.replace("/admin/login");
  }

  const current = NAV.flatMap((g) => g.items).find((n) => isActive(n.href, pathname));

  return (
    <div className="adm-shell">
      <div className="adm-topbar no-print">
        <button className="adm-burger" onClick={() => setOpen(true)} aria-label="開啟選單" aria-expanded={open}>
          ☰
        </button>
        <span className="tt">{current?.label ?? "管理後台"}</span>
      </div>
      <div className={`adm-overlay no-print${open ? " show" : ""}`} onClick={() => setOpen(false)} aria-hidden="true" />

      <aside className={`adm-side no-print${open ? " open" : ""}`} aria-label="後台選單">
        <div className="adm-brand">
          圖個有意思 TUGO
          <span>ADMIN · 管理後台</span>
        </div>
        <nav className="adm-nav">
          {NAV.map((g) => {
            const items = g.items.filter((n) => !n.ownerOnly || role === "owner");
            if (!items.length) return null;
            return (
              <div key={g.group}>
                <div className="adm-nav-group">{g.group}</div>
                {items.map((n) => (
                  <Link
                    key={n.href}
                    href={n.href}
                    data-active={isActive(n.href, pathname) ? "true" : "false"}
                    onClick={(e) => {
                      setOpen(false);
                      reloadIfCurrentPage(e, n.href, pathname);
                    }}
                  >
                    <span className="ic" aria-hidden="true">
                      {n.ic}
                    </span>
                    {n.label}
                  </Link>
                ))}
              </div>
            );
          })}
        </nav>
        <div className="adm-whoami">
          <b>{adminName}</b>
          <br />
          {role === "owner" ? "擁有者" : "工作人員"} ·{" "}
          <Link href="/admin/account" style={{ color: "var(--color-tangerine-light)" }}>
            我的帳號
          </Link>
        </div>
        <button className="adm-logout" onClick={logout}>
          登出
        </button>
      </aside>

      <div className="adm-main">{children}</div>
      <AdminAiAssistant />
    </div>
  );
}
