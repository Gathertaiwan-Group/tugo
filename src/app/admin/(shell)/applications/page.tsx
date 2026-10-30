import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdminPage } from "@/lib/admin/auth";
import { APPLICATION_STATUSES, APPLICATION_STATUS_LABELS, fmtDateTime, label } from "@/lib/admin/format";
import { clampPage, hrefWith, parsePage, sanitizeSearch, sp } from "@/lib/admin/query";
import { Cell, Empty, PageHead, Pager, Pill } from "@/components/admin/ui";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const PER_PAGE = 30;
type SP = Promise<Record<string, string | string[] | undefined>>;

export default async function ApplicationsPage({ searchParams }: { searchParams: SP }) {
  await requireAdminPage("/admin/applications");
  const raw = await searchParams;
  const q = sanitizeSearch(sp(raw.q));
  const status = (APPLICATION_STATUSES as readonly string[]).includes(sp(raw.status)) ? sp(raw.status) : "";
  const wanted = parsePage(sp(raw.page));

  const build = (from: number) => {
    let qb = createAdminClient()
      .from("artist_applications")
      .select("id,name,email,discipline,status,created_at,updated_at", { count: "exact" })
      .order("created_at", { ascending: false });
    if (status) qb = qb.eq("status", status);
    if (q) {
      const w = q.replace(/ /g, "%");
      qb = qb.or(`name.ilike.%${w}%,email.ilike.%${w}%,discipline.ilike.%${w}%`);
    }
    return qb.range(from, from + PER_PAGE - 1);
  };
  let res = await build((wanted - 1) * PER_PAGE);
  let total = res.count ?? 0;
  const { page, pageCount } = clampPage(wanted, total, PER_PAGE);
  if (page !== wanted) {
    res = await build((page - 1) * PER_PAGE);
    total = res.count ?? total;
  }
  const rows = res.data ?? [];
  const params = { q, status };
  const cols = { "--cols": "minmax(0,1.4fr) minmax(0,1.6fr) minmax(0,1fr) 100px 140px" } as React.CSSProperties;

  return (
    <div className="adm-page">
      <PageHead eyebrow="Applications" title="合作申請" sub="藝術家合作申請的審核收件匣（前台 /collaborate 申請表）。" />
      <div className="adm-tabs">
        <Link href={hrefWith("/admin/applications", params, { status: null, page: null })} data-active={!status ? "true" : "false"}>
          全部
        </Link>
        {APPLICATION_STATUSES.map((s) => (
          <Link key={s} href={hrefWith("/admin/applications", params, { status: s, page: null })} data-active={status === s ? "true" : "false"}>
            {APPLICATION_STATUS_LABELS[s]}
          </Link>
        ))}
      </div>
      <form className="adm-filter" method="get" key={JSON.stringify(params)}>
        {status && <input type="hidden" name="status" value={status} />}
        <div className="adm-field grow">
          <label className="adm-label" htmlFor="app-q">
            搜尋
          </label>
          <input id="app-q" name="q" className="adm-input" defaultValue={q} placeholder="姓名 / Email / 創作類型" />
        </div>
        <button className="adm-btn adm-btn--primary">搜尋</button>
      </form>
      {rows.length === 0 ? (
        <Empty>沒有符合條件的申請</Empty>
      ) : (
        <div className="adm-table">
          <div className="adm-thead" style={cols}>
            <span>申請人</span>
            <span>Email</span>
            <span>創作類型</span>
            <span>狀態</span>
            <span>申請時間</span>
          </div>
          {rows.map((r) => (
            <Link key={r.id} href={`/admin/applications/${r.id}`} className="adm-row" style={cols}>
              <Cell label="申請人" full>
                <strong>{r.name}</strong>
              </Cell>
              <Cell label="Email" full>
                {r.email}
              </Cell>
              <Cell label="創作類型">{r.discipline}</Cell>
              <Cell label="狀態">
                <Pill status={r.status}>{label(APPLICATION_STATUS_LABELS, r.status)}</Pill>
              </Cell>
              <Cell label="申請時間">{fmtDateTime(r.created_at)}</Cell>
            </Link>
          ))}
        </div>
      )}
      <Pager page={page} pageCount={pageCount} total={total} hrefFor={(p) => hrefWith("/admin/applications", params, { page: p })} />
    </div>
  );
}
