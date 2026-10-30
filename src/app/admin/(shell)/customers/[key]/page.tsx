import Link from "next/link";
import { notFound } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdminPage } from "@/lib/admin/auth";
import { listNotes } from "@/lib/admin/notes";
import { ilikeExact, CUSTOMER_TIER_LABELS } from "@/lib/admin/customers";
import {
  APPLICATION_STATUS_LABELS,
  FULFILLMENT_LABELS,
  ORDER_STATUS_LABELS,
  fmtDate,
  fmtDateTime,
  keyToEmail,
  label,
  money,
} from "@/lib/admin/format";
import { PageHead, Pill } from "@/components/admin/ui";
import NotesPanel from "@/components/admin/NotesPanel";
import CustomerProfileEditor from "@/components/admin/CustomerProfileEditor";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type TimelineItem = { at: string; kind: "order" | "application" | "newsletter" | "note" | "followup"; title: string; detail?: string; href?: string };

export default async function CustomerDetail({ params }: { params: Promise<{ key: string }> }) {
  const { key } = await params;
  await requireAdminPage(`/admin/customers/${key}`);
  const email = keyToEmail(key);
  if (!email) notFound();
  const sb = createAdminClient();
  const pattern = ilikeExact(email);

  const [summaryRes, profileRes, ordersRes, appsRes, newsRes, followRes, notes] = await Promise.all([
    sb.from("admin_customers").select("*").eq("email", email).maybeSingle(),
    sb.from("customer_profiles").select("*").eq("email", email).maybeSingle(),
    sb
      .from("orders")
      .select("id,order_no,total,status,fulfillment_status,created_at,recipient_name")
      .ilike("email", pattern)
      .order("created_at", { ascending: false })
      .limit(50),
    sb.from("artist_applications").select("id,name,discipline,status,created_at").ilike("email", pattern).order("created_at", { ascending: false }).limit(50),
    sb.from("newsletter_subscribers").select("id,created_at").ilike("email", pattern).limit(5),
    sb.from("followups").select("id,title,status,due_at,created_at,priority").eq("customer_email", email).order("created_at", { ascending: false }).limit(50),
    listNotes("customer", email),
  ]);
  const c = summaryRes.data;
  if (!c) notFound();
  const profile = profileRes.data;
  const orders = ordersRes.data ?? [];

  const timeline: TimelineItem[] = [
    ...orders.map((o) => ({
      at: o.created_at,
      kind: "order" as const,
      title: `訂單 ${o.order_no ?? o.id.slice(0, 8)} · ${money(o.total)}`,
      detail: `${label(ORDER_STATUS_LABELS, o.status)} / ${label(FULFILLMENT_LABELS, o.fulfillment_status)}`,
      href: `/admin/orders/${o.id}`,
    })),
    ...(appsRes.data ?? []).map((a) => ({
      at: a.created_at,
      kind: "application" as const,
      title: `合作申請 · ${a.discipline}`,
      detail: label(APPLICATION_STATUS_LABELS, a.status),
      href: `/admin/applications/${a.id}`,
    })),
    ...(newsRes.data ?? []).map((n) => ({ at: n.created_at, kind: "newsletter" as const, title: "訂閱電子報" })),
    ...notes.map((n) => ({ at: n.created_at, kind: "note" as const, title: `備註 · ${n.admin_name ?? "—"}`, detail: n.body.slice(0, 120) })),
    ...(followRes.data ?? []).map((f) => ({
      at: f.created_at,
      kind: "followup" as const,
      title: `回訪：${f.title}`,
      detail: `${f.status === "open" ? "未完成" : f.status === "completed" ? "已完成" : "已取消"} · 到期 ${fmtDate(f.due_at)}`,
      href: "/admin/followups",
    })),
  ].sort((a, b) => (a.at < b.at ? 1 : a.at > b.at ? -1 : 0));

  return (
    <div className="adm-page">
      <PageHead
        eyebrow="Customer"
        title={c.name || c.email}
        sub={
          <>
            {c.email}
            {c.phone ? ` · ${c.phone}` : ""} · <Pill status={c.tier === "vip" ? "accepted" : c.tier === "watch" ? "pending" : null}>{CUSTOMER_TIER_LABELS[c.tier] ?? c.tier}</Pill>
            {c.is_demo ? " · 示意資料" : ""}
          </>
        }
        actions={
          <>
            <Link className="adm-btn adm-btn--ghost adm-btn--sm" href="/admin/customers">
              ← 回列表
            </Link>
            <Link
              className="adm-btn adm-btn--ghost adm-btn--sm"
              href={`/admin/followups?new=1&related_type=customer&related_id=${encodeURIComponent(c.email)}&customer_email=${encodeURIComponent(c.email)}`}
            >
              ＋ 新增回訪
            </Link>
          </>
        }
      />
      <div className="adm-kpis">
        <div className="adm-kpi">
          <div className="k-label">訂單數</div>
          <div className="k-value">{c.order_count}</div>
        </div>
        <div className="adm-kpi">
          <div className="k-label">累計消費（不含取消/退款）</div>
          <div className="k-value">{money(c.total_spent)}</div>
        </div>
        <div className="adm-kpi">
          <div className="k-label">首購 / 最近下單</div>
          <div className="k-value" style={{ fontSize: 15 }}>
            {fmtDate(c.first_order_at)} / {fmtDate(c.last_order_at)}
          </div>
        </div>
        <div className="adm-kpi">
          <div className="k-label">電子報</div>
          <div className="k-value" style={{ fontSize: 15 }}>
            {c.subscribed_at ? `${fmtDate(c.subscribed_at)} 訂閱` : "未訂閱"}
          </div>
        </div>
      </div>
      <div className="adm-grid-main">
        <div className="adm-stack">
          {profile?.ai_summary && (
            <section className="adm-card">
              <h2 className="adm-h2">客戶摘要</h2>
              <p style={{ margin: 0, whiteSpace: "pre-wrap" }}>{profile.ai_summary}</p>
            </section>
          )}
          <section className="adm-card">
            <h2 className="adm-h2">完整服務歷程</h2>
            {timeline.length === 0 ? (
              <p className="adm-muted adm-small">尚無紀錄</p>
            ) : (
              <ol className="adm-timeline">
                {timeline.map((t, i) => (
                  <li key={`${t.kind}-${i}`} data-kind={t.kind}>
                    <div className="adm-small adm-muted">{fmtDateTime(t.at)}</div>
                    <div>{t.href ? <Link href={t.href}>{t.title}</Link> : t.title}</div>
                    {t.detail && <div className="adm-small adm-muted" style={{ overflowWrap: "anywhere" }}>{t.detail}</div>}
                  </li>
                ))}
              </ol>
            )}
          </section>
        </div>
        <div className="adm-stack">
          <CustomerProfileEditor
            customerKey={key}
            initial={{
              display_name: profile?.display_name ?? "",
              phone: profile?.phone ?? "",
              tier: profile?.tier ?? "regular",
              tags: profile?.tags ?? [],
              source_channel: profile?.source_channel ?? "",
              preferred_artists: profile?.preferred_artists ?? [],
              preferred_categories: profile?.preferred_categories ?? [],
              size_pref: profile?.size_pref ?? "",
              ai_summary: profile?.ai_summary ?? "",
              service_notes: profile?.service_notes ?? "",
            }}
          />
          <NotesPanel subjectType="customer" subjectId={email} initialNotes={notes} />
        </div>
      </div>
    </div>
  );
}
