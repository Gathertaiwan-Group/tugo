import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdminPage } from "@/lib/admin/auth";
import { pick, sp } from "@/lib/admin/query";
import { FOLLOWUP_STATUSES, FOLLOWUP_STATUS_LABELS, RELATED_TYPES } from "@/lib/admin/followups";
import { PageHead } from "@/components/admin/ui";
import FollowupBoard, { type FollowupRow } from "@/components/admin/FollowupBoard";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function FollowupsPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  await requireAdminPage("/admin/followups");
  const raw = await searchParams;
  const tab = pick(sp(raw.tab), FOLLOWUP_STATUSES, "open");
  const sb = createAdminClient();

  let q = sb
    .from("followups")
    .select("id,title,reason,priority,status,assignee_id,due_at,completed_at,related_type,related_id,customer_email,created_at")
    .eq("status", tab)
    .eq("is_demo", false);
  q = tab === "open" ? q.order("due_at", { ascending: true }).limit(300) : q.order("updated_at", { ascending: false }).limit(100);

  const [{ data: rows }, { data: admins }] = await Promise.all([
    q,
    sb.from("admin_users").select("id,name,email").eq("active", true).order("created_at", { ascending: true }),
  ]);

  const relatedType = sp(raw.related_type);
  const prefill =
    sp(raw.new) === "1"
      ? {
          title: sp(raw.title).slice(0, 160),
          related_type: (RELATED_TYPES as readonly string[]).includes(relatedType) ? relatedType : "",
          related_id: sp(raw.related_id).slice(0, 254),
          customer_email: sp(raw.customer_email).slice(0, 254),
        }
      : null;

  return (
    <div className="adm-page">
      <PageHead eyebrow="Follow-ups" title="追蹤與回訪" sub="出貨逾期、合作申請待回覆、客訴跟進等待辦事項。" />
      <div className="adm-tabs">
        {FOLLOWUP_STATUSES.map((s) => (
          <Link key={s} href={s === "open" ? "/admin/followups" : `/admin/followups?tab=${s}`} data-active={tab === s ? "true" : "false"}>
            {FOLLOWUP_STATUS_LABELS[s]}
          </Link>
        ))}
      </div>
      <FollowupBoard
        key={`${tab}|${prefill ? JSON.stringify(prefill) : ""}`}
        tab={tab}
        rows={(rows ?? []) as FollowupRow[]}
        admins={(admins ?? []).map((a) => ({ id: a.id, name: a.name || a.email }))}
        prefill={prefill}
      />
    </div>
  );
}
