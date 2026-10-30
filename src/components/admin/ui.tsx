// 後台共用的展示元件（無狀態，server/client 皆可用）。
import Link from "next/link";
import { tone } from "@/lib/admin/format";

export function PageHead({
  eyebrow,
  title,
  sub,
  actions,
}: {
  eyebrow?: string;
  title: string;
  sub?: React.ReactNode;
  actions?: React.ReactNode;
}) {
  return (
    <header className="adm-head">
      <div>
        {eyebrow && <div className="adm-eyebrow">{eyebrow}</div>}
        <h1 className="adm-h1">{title}</h1>
        {sub && <p className="adm-sub">{sub}</p>}
      </div>
      {actions && <div className="adm-actions">{actions}</div>}
    </header>
  );
}

export function Pill({ status, children }: { status?: string | null; children: React.ReactNode }) {
  return (
    <span className="adm-pill" data-tone={tone(status)}>
      {children}
    </span>
  );
}

/** 表格儲存格：手機版顯示欄位標題 */
export function Cell({ label, children, full, className }: { label: string; children: React.ReactNode; full?: boolean; className?: string }) {
  return (
    <div className={[full ? "full" : "", className ?? ""].join(" ").trim() || undefined}>
      <span className="adm-cell-label">{label}</span>
      {children}
    </div>
  );
}

export function Pager({
  page,
  pageCount,
  total,
  hrefFor,
}: {
  page: number;
  pageCount: number;
  total: number;
  hrefFor: (p: number) => string;
}) {
  return (
    <nav className="adm-pager" aria-label="分頁">
      <span>
        共 {total.toLocaleString("en-US")} 筆 · 第 {page} / {pageCount} 頁
      </span>
      <span className="adm-actions">
        {page > 1 ? (
          <Link className="adm-btn adm-btn--ghost adm-btn--sm" href={hrefFor(page - 1)}>
            ← 上一頁
          </Link>
        ) : (
          <span className="adm-btn adm-btn--ghost adm-btn--sm" aria-disabled="true" style={{ opacity: 0.4 }}>
            ← 上一頁
          </span>
        )}
        {page < pageCount ? (
          <Link className="adm-btn adm-btn--ghost adm-btn--sm" href={hrefFor(page + 1)}>
            下一頁 →
          </Link>
        ) : (
          <span className="adm-btn adm-btn--ghost adm-btn--sm" aria-disabled="true" style={{ opacity: 0.4 }}>
            下一頁 →
          </span>
        )}
      </span>
    </nav>
  );
}

export function Empty({ children }: { children: React.ReactNode }) {
  return <div className="adm-empty">{children}</div>;
}
