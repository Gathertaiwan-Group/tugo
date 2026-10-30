import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdminPage } from "@/lib/admin/auth";
import { emailToKey, fmtDate, money } from "@/lib/admin/format";
import { clampPage, hrefWith, parsePage, pick, sanitizeSearch, sp } from "@/lib/admin/query";
import { CUSTOMER_TIERS, CUSTOMER_TIER_LABELS } from "@/lib/admin/customers";
import { Cell, Empty, PageHead, Pager, Pill } from "@/components/admin/ui";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const PER_PAGE = 30;
const SORTS = ["last_activity", "total_spent", "order_count"] as const;
const SORT_COL: Record<(typeof SORTS)[number], string> = {
  last_activity: "last_activity_at",
  total_spent: "total_spent",
  order_count: "order_count",
};
const HAS = ["", "orders", "newsletter", "application"] as const;

type SP = Promise<Record<string, string | string[] | undefined>>;

export default async function CustomersPage({ searchParams }: { searchParams: SP }) {
  await requireAdminPage("/admin/customers");
  const raw = await searchParams;
  const q = sanitizeSearch(sp(raw.q));
  const tier = (CUSTOMER_TIERS as readonly string[]).includes(sp(raw.tier)) ? sp(raw.tier) : "";
  const has = pick(sp(raw.has), HAS, "");
  const sort = pick(sp(raw.sort), SORTS, "last_activity");
  const demo = sp(raw.demo) === "1";
  const wanted = parsePage(sp(raw.page));

  const build = (from: number) => {
    let qb = createAdminClient()
      .from("admin_customers")
      .select("email,name,phone,order_count,total_spent,last_order_at,application_count,subscribed_at,tier,tags,last_activity_at,is_demo", {
        count: "exact",
      })
      .order(SORT_COL[sort], { ascending: false, nullsFirst: false })
      .order("email", { ascending: true });
    if (!demo) qb = qb.eq("is_demo", false);
    if (tier) qb = qb.eq("tier", tier);
    if (has === "orders") qb = qb.gt("order_count", 0);
    if (has === "application") qb = qb.gt("application_count", 0);
    if (has === "newsletter") qb = qb.not("subscribed_at", "is", null);
    if (q) {
      const digits = q.replace(/\D/g, "");
      const w = q.replace(/ /g, "%"); // 清洗把 . 換成空白：以 % 連接，讓「a@b com」仍能比對 a@b.com
      const ors = [`email.ilike.%${w}%`, `name.ilike.%${w}%`, `phone.ilike.%${w}%`];
      if (digits.length >= 3 && digits !== q) ors.push(`phone.ilike.%${digits}%`);
      qb = qb.or(ors.join(","));
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
  const params = { q, tier, has, sort: sort === "last_activity" ? "" : sort, demo: demo ? "1" : "" };
  const cols = { "--cols": "minmax(0,2fr) 90px 80px minmax(0,1fr) minmax(0,1.2fr) 110px" } as React.CSSProperties;

  return (
    <div className="adm-page">
      <PageHead
        eyebrow="Customers"
        title="客戶知識庫"
        sub="以 Email 聚合訂單、電子報訂閱與合作申請，記錄客戶樣貌與偏好。"
        actions={
          <Link className="adm-btn adm-btn--ghost adm-btn--sm" href={hrefWith("/admin/customers", params, { demo: demo ? null : "1", page: null })}>
            {demo ? "隱藏示意資料" : "顯示示意資料"}
          </Link>
        }
      />
      <form className="adm-filter" method="get" key={JSON.stringify(params)}>
        {demo && <input type="hidden" name="demo" value="1" />}
        <div className="adm-field grow">
          <label className="adm-label" htmlFor="c-q">
            搜尋
          </label>
          <input id="c-q" name="q" className="adm-input" defaultValue={q} placeholder="Email / 姓名 / 電話" />
        </div>
        <div className="adm-field">
          <label className="adm-label" htmlFor="c-tier">
            等級
          </label>
          <select id="c-tier" name="tier" className="adm-select" defaultValue={tier}>
            <option value="">全部</option>
            {CUSTOMER_TIERS.map((t) => (
              <option key={t} value={t}>
                {CUSTOMER_TIER_LABELS[t]}
              </option>
            ))}
          </select>
        </div>
        <div className="adm-field">
          <label className="adm-label" htmlFor="c-has">
            來源
          </label>
          <select id="c-has" name="has" className="adm-select" defaultValue={has}>
            <option value="">全部</option>
            <option value="orders">有訂單</option>
            <option value="newsletter">有訂閱電子報</option>
            <option value="application">有合作申請</option>
          </select>
        </div>
        <div className="adm-field">
          <label className="adm-label" htmlFor="c-sort">
            排序
          </label>
          <select id="c-sort" name="sort" className="adm-select" defaultValue={sort}>
            <option value="last_activity">最近互動</option>
            <option value="total_spent">累計消費</option>
            <option value="order_count">訂單數</option>
          </select>
        </div>
        <button className="adm-btn adm-btn--primary">套用</button>
      </form>

      {rows.length === 0 ? (
        <Empty>沒有符合條件的客戶</Empty>
      ) : (
        <div className="adm-table">
          <div className="adm-thead" style={cols}>
            <span>客戶</span>
            <span>等級</span>
            <span>訂單</span>
            <span>累計消費</span>
            <span>標籤／來源</span>
            <span>最近互動</span>
          </div>
          {rows.map((r) => (
            <Link key={r.email} href={`/admin/customers/${emailToKey(r.email)}`} className="adm-row" style={cols}>
              <Cell label="客戶" full>
                <strong>{r.name || "（未留姓名）"}</strong>
                {r.is_demo && <span className="adm-small adm-muted"> · 示意</span>}
                <div className="adm-small adm-muted">
                  {r.email}
                  {r.phone ? ` · ${r.phone}` : ""}
                </div>
              </Cell>
              <Cell label="等級">
                <Pill status={r.tier === "vip" ? "accepted" : r.tier === "watch" ? "pending" : null}>{CUSTOMER_TIER_LABELS[r.tier] ?? r.tier}</Pill>
              </Cell>
              <Cell label="訂單">{r.order_count}</Cell>
              <Cell label="累計消費">
                <span className="adm-mono">{money(r.total_spent)}</span>
              </Cell>
              <Cell label="標籤／來源" full>
                <span className="adm-pills">
                  {(r.tags ?? []).slice(0, 3).map((t: string) => (
                    <span key={t} className="adm-pill">
                      {t}
                    </span>
                  ))}
                  {r.subscribed_at && <span className="adm-pill">電子報</span>}
                  {r.application_count > 0 && <span className="adm-pill">合作申請</span>}
                </span>
              </Cell>
              <Cell label="最近互動">{fmtDate(r.last_activity_at)}</Cell>
            </Link>
          ))}
        </div>
      )}
      <Pager page={page} pageCount={pageCount} total={total} hrefFor={(p) => hrefWith("/admin/customers", params, { page: p })} />
    </div>
  );
}
