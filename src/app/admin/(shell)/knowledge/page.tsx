import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdminPage } from "@/lib/admin/auth";
import { APPLICATION_STATUS_LABELS, FULFILLMENT_LABELS, ORDER_STATUS_LABELS, emailToKey, fmtDateTime, label, money } from "@/lib/admin/format";
import { pick, sanitizeSearch, sp } from "@/lib/admin/query";
import { Empty, PageHead } from "@/components/admin/ui";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const TYPES = ["all", "order", "application", "note"] as const;
const TYPE_LABELS: Record<string, string> = { all: "全部", order: "訂單", application: "合作申請", note: "內部備註" };
const LIMIT = 30;

type Hit = { key: string; type: "order" | "application" | "note"; at: string; title: string; meta: string; excerpt: string; href: string };

function excerpt(s: string | null | undefined, q: string): string {
  const text = (s ?? "").replace(/\s+/g, " ").trim();
  if (text.length <= 80) return text;
  const i = text.toLowerCase().indexOf(q.toLowerCase());
  const start = i > 30 ? i - 30 : 0;
  return `${start > 0 ? "…" : ""}${text.slice(start, start + 80)}…`;
}

export default async function KnowledgePage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  await requireAdminPage("/admin/knowledge");
  const raw = await searchParams;
  const q = sanitizeSearch(sp(raw.q));
  const type = pick(sp(raw.type), TYPES, "all");
  const hits: Hit[] = [];

  if (q) {
    const sb = createAdminClient();
    const like = `%${q.replace(/ /g, "%")}%`;
    const [orders, apps, notes] = await Promise.all([
      type === "all" || type === "order"
        ? sb
            .from("orders")
            .select("id,order_no,recipient_name,email,total,status,fulfillment_status,note,address,created_at")
            .or(`order_no.ilike.${like},recipient_name.ilike.${like},email.ilike.${like},phone.ilike.${like},note.ilike.${like},address.ilike.${like}`)
            .order("created_at", { ascending: false })
            .limit(LIMIT)
        : null,
      type === "all" || type === "application"
        ? sb
            .from("artist_applications")
            .select("id,name,email,discipline,bio,idea,status,created_at")
            .or(`name.ilike.${like},email.ilike.${like},discipline.ilike.${like},bio.ilike.${like},idea.ilike.${like}`)
            .order("created_at", { ascending: false })
            .limit(LIMIT)
        : null,
      type === "all" || type === "note"
        ? sb.from("admin_notes").select("id,subject_type,subject_id,body,admin_name,created_at").ilike("body", like).order("created_at", { ascending: false }).limit(LIMIT)
        : null,
    ]);
    for (const o of orders?.data ?? []) {
      const matchText = [o.note, o.address].find((t) => t && t.toLowerCase().includes(q.toLowerCase())) ?? "";
      hits.push({
        key: `o-${o.id}`,
        type: "order",
        at: o.created_at,
        title: `${o.order_no ?? o.id.slice(0, 8)} · ${o.recipient_name}`,
        meta: `${money(o.total)} · ${label(ORDER_STATUS_LABELS, o.status)} / ${label(FULFILLMENT_LABELS, o.fulfillment_status)} · ${o.email}`,
        excerpt: excerpt(matchText, q),
        href: `/admin/orders/${o.id}`,
      });
    }
    for (const a of apps?.data ?? []) {
      const matchText = [a.bio, a.idea].find((t) => t && t.toLowerCase().includes(q.toLowerCase())) ?? a.bio;
      hits.push({
        key: `a-${a.id}`,
        type: "application",
        at: a.created_at,
        title: `${a.name} · ${a.discipline}`,
        meta: `${label(APPLICATION_STATUS_LABELS, a.status)} · ${a.email}`,
        excerpt: excerpt(matchText, q),
        href: `/admin/applications/${a.id}`,
      });
    }
    for (const n of notes?.data ?? []) {
      const href =
        n.subject_type === "order"
          ? `/admin/orders/${n.subject_id}`
          : n.subject_type === "application"
            ? `/admin/applications/${n.subject_id}`
            : `/admin/customers/${emailToKey(n.subject_id)}`;
      hits.push({
        key: `n-${n.id}`,
        type: "note",
        at: n.created_at,
        title: `內部備註（${n.subject_type === "order" ? "訂單" : n.subject_type === "application" ? "合作申請" : "客戶"}）`,
        meta: n.admin_name ?? "—",
        excerpt: excerpt(n.body, q),
        href,
      });
    }
    hits.sort((a, b) => (a.at < b.at ? 1 : a.at > b.at ? -1 : 0));
  }

  return (
    <div className="adm-page">
      <PageHead eyebrow="Knowledge" title="服務知識庫" sub="跨訂單、合作申請與內部備註的全域搜尋（每類最多 30 筆，依時間排序）。" />
      <form className="adm-filter" method="get" key={`${q}|${type}`}>
        <div className="adm-field grow">
          <label className="adm-label" htmlFor="k-q">
            關鍵字
          </label>
          <input id="k-q" name="q" className="adm-input" defaultValue={q} placeholder="訂單號、姓名、Email、備註內容…" />
        </div>
        <div className="adm-field">
          <label className="adm-label" htmlFor="k-type">
            類型
          </label>
          <select id="k-type" name="type" className="adm-select" defaultValue={type}>
            {TYPES.map((t) => (
              <option key={t} value={t}>
                {TYPE_LABELS[t]}
              </option>
            ))}
          </select>
        </div>
        <button className="adm-btn adm-btn--primary">搜尋</button>
      </form>
      {!q ? (
        <Empty>輸入關鍵字開始搜尋</Empty>
      ) : hits.length === 0 ? (
        <Empty>找不到「{q}」的相關紀錄</Empty>
      ) : (
        <div className="adm-stack" style={{ gap: 10 }}>
          <p className="adm-small adm-muted" style={{ margin: 0 }}>
            共 {hits.length} 筆結果
          </p>
          {hits.map((h) => (
            <Link key={h.key} href={h.href} className="adm-card" style={{ display: "block", textDecoration: "none", padding: 14 }}>
              <div className="adm-small adm-muted">
                <span className="adm-pill">{TYPE_LABELS[h.type]}</span> {fmtDateTime(h.at)}
              </div>
              <div style={{ fontWeight: 600, marginTop: 4, overflowWrap: "anywhere" }}>{h.title}</div>
              <div className="adm-small adm-muted" style={{ overflowWrap: "anywhere" }}>
                {h.meta}
              </div>
              {h.excerpt && <div className="adm-small" style={{ marginTop: 4, overflowWrap: "anywhere" }}>{h.excerpt}</div>}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
