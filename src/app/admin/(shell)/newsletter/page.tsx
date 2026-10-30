import { requireAdminPage } from "@/lib/admin/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { fmtDateTime } from "@/lib/admin/format";
import { clampPage, hrefWith, parsePage, sanitizeSearch, sp } from "@/lib/admin/query";
import { Cell, Empty, PageHead, Pager } from "@/components/admin/ui";
import DeleteButton from "@/components/admin/catalog/DeleteButton";
import Link from "next/link";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const PER = 50;

export default async function NewsletterPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  await requireAdminPage("/admin/newsletter");
  const raw = await searchParams;
  const q = sanitizeSearch(sp(raw.q));
  const sb = createAdminClient();
  const build = (page: number) => {
    let query = sb
      .from("newsletter_subscribers")
      .select("id,email,created_at", { count: "exact" })
      .order("created_at", { ascending: false })
      .order("id", { ascending: false })
      .range((page - 1) * PER, page * PER - 1);
    if (q) query = query.ilike("email", `%${q}%`);
    return query;
  };
  let page = parsePage(sp(raw.page));
  let res = await build(page);
  const total = res.count ?? 0;
  const c = clampPage(page, total, PER);
  if (c.page !== page) {
    page = c.page;
    res = await build(page);
  }
  const rows = (res.data ?? []) as { id: number; email: string; created_at: string }[];
  const cols = { "--cols": "minmax(0,2fr) minmax(0,1fr) 90px" } as React.CSSProperties;
  const exportHref = q ? `/api/admin/newsletter/export?q=${encodeURIComponent(q)}` : "/api/admin/newsletter/export";

  return (
    <div className="adm-page">
      <PageHead
        eyebrow="Newsletter"
        title="電子報訂閱者"
        sub={`共 ${total.toLocaleString("en-US")} 位訂閱者${q ? "（搜尋結果）" : ""}`}
        actions={
          <a className="adm-btn adm-btn--primary" href={exportHref} download>
            匯出 CSV
          </a>
        }
      />
      <form className="adm-filter" method="get" key={q}>
        <div className="adm-field grow">
          <label className="adm-label" htmlFor="nq">
            搜尋 Email
          </label>
          <input id="nq" name="q" className="adm-input" defaultValue={q} maxLength={40} />
        </div>
        <div className="adm-actions">
          <button className="adm-btn adm-btn--primary">搜尋</button>
          <Link className="adm-btn adm-btn--ghost" href="/admin/newsletter">
            清除
          </Link>
        </div>
      </form>
      {rows.length === 0 ? (
        <Empty>{q ? "沒有符合的訂閱者" : "尚無訂閱者"}</Empty>
      ) : (
        <div className="adm-table">
          <div className="adm-thead" style={cols}>
            <span>Email</span>
            <span>訂閱時間</span>
            <span />
          </div>
          {rows.map((r) => (
            <div key={r.id} className="adm-row" style={cols}>
              <Cell label="Email" full>
                <span style={{ fontWeight: 600 }}>{r.email}</span>
              </Cell>
              <Cell label="訂閱時間">
                <span className="adm-mono">{fmtDateTime(r.created_at)}</span>
              </Cell>
              <div>
                <DeleteButton url={`/api/admin/newsletter/${r.id}`} confirmText={`確定刪除訂閱者 ${r.email}？（例如本人要求取消訂閱）`} label="移除" />
              </div>
            </div>
          ))}
        </div>
      )}
      <Pager page={page} pageCount={c.pageCount} total={total} hrefFor={(p) => hrefWith("/admin/newsletter", { q }, { page: p })} />
    </div>
  );
}
