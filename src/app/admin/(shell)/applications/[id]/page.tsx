import Link from "next/link";
import { notFound } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdminPage } from "@/lib/admin/auth";
import { listNotes } from "@/lib/admin/notes";
import { APPLICATION_STATUS_LABELS, emailToKey, fmtDateTime, label } from "@/lib/admin/format";
import { PageHead, Pill } from "@/components/admin/ui";
import NotesPanel from "@/components/admin/NotesPanel";
import ApplicationStatusControl from "@/components/admin/ApplicationStatusControl";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function safeUrl(u: string | null): string | null {
  if (!u) return null;
  try {
    const url = new URL(u);
    return url.protocol === "http:" || url.protocol === "https:" ? url.toString() : null;
  } catch {
    return null;
  }
}

export default async function ApplicationDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await requireAdminPage(`/admin/applications/${id}`);
  if (!/^\d{1,18}$/.test(id)) notFound();
  const sb = createAdminClient();
  const [{ data: app }, notes] = await Promise.all([
    sb.from("artist_applications").select("*").eq("id", id).maybeSingle(),
    listNotes("application", id),
  ]);
  if (!app) notFound();
  let reviewer: string | null = null;
  if (app.reviewed_by) {
    const { data } = await sb.from("admin_users").select("name,email").eq("id", app.reviewed_by).maybeSingle();
    reviewer = data ? data.name || data.email : null;
  }
  const portfolio = safeUrl(app.portfolio_url);

  return (
    <div className="adm-page">
      <PageHead
        eyebrow={`Application #${app.id}`}
        title={app.name}
        sub={
          <>
            <Pill status={app.status}>{label(APPLICATION_STATUS_LABELS, app.status)}</Pill> · 申請於 {fmtDateTime(app.created_at)}
          </>
        }
        actions={
          <>
            <Link className="adm-btn adm-btn--ghost adm-btn--sm" href="/admin/applications">
              ← 回列表
            </Link>
            <Link
              className="adm-btn adm-btn--ghost adm-btn--sm"
              href={`/admin/followups?new=1&related_type=application&related_id=${app.id}&customer_email=${encodeURIComponent(app.email)}&title=${encodeURIComponent(`回覆合作申請：${app.name}`)}`}
            >
              ＋ 新增回訪
            </Link>
          </>
        }
      />
      <div className="adm-grid-main">
        <div className="adm-stack">
          <section className="adm-card">
            <h2 className="adm-h2">申請內容</h2>
            <dl className="adm-dl">
              <dt>姓名</dt>
              <dd>{app.name}</dd>
              <dt>Email</dt>
              <dd>
                <Link href={`/admin/customers/${emailToKey(app.email)}`}>{app.email}</Link>
              </dd>
              <dt>創作類型</dt>
              <dd>{app.discipline}</dd>
              <dt>作品集</dt>
              <dd>
                {portfolio ? (
                  <a href={portfolio} target="_blank" rel="noopener noreferrer">
                    {portfolio}
                  </a>
                ) : (
                  <span className="adm-muted">{app.portfolio_url || "—"}（非 http(s) 連結，未開放點擊）</span>
                )}
              </dd>
              <dt>自我介紹</dt>
              <dd>{app.bio}</dd>
              <dt>合作想法</dt>
              <dd>{app.idea || "—"}</dd>
              <dt>原創聲明</dt>
              <dd>{app.consent_original ? "已同意" : "未同意"}</dd>
              <dt>隱私同意</dt>
              <dd>{app.consent_privacy ? "已同意" : "未同意"}</dd>
            </dl>
          </section>
        </div>
        <div className="adm-stack">
          <section className="adm-card">
            <h2 className="adm-h2">審核狀態</h2>
            <ApplicationStatusControl id={String(app.id)} status={app.status} />
            <p className="adm-small adm-muted" style={{ marginTop: 10 }}>
              最後更新：{fmtDateTime(app.updated_at)}
              {reviewer ? ` · ${reviewer}` : ""}
            </p>
          </section>
          <NotesPanel subjectType="application" subjectId={String(app.id)} initialNotes={notes} />
        </div>
      </div>
    </div>
  );
}
