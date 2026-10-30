import Link from "next/link";
import { requireAdminPage } from "@/lib/admin/auth";
import { INFO_PAGES, INFO_PAGE_LABELS, listFaqs, listSections, type InfoPage } from "@/lib/admin/content";
import { pick, sp } from "@/lib/admin/query";
import { PageHead } from "@/components/admin/ui";
import RecordsManager, { type RecField } from "@/components/admin/content/RecordsManager";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const TABS = ["faq", ...INFO_PAGES] as const;

const FAQ_FIELDS: RecField[] = [
  { key: "question", label: "問題", kind: "text", max: 300 },
  { key: "sort", label: "排序（小→大）", kind: "int" },
  { key: "answer", label: "回答", kind: "textarea", max: 4000, rows: 4 },
];
const SECTION_FIELDS: RecField[] = [
  { key: "heading", label: "段落標題", kind: "text", max: 200 },
  { key: "sort", label: "排序（小→大）", kind: "int" },
  { key: "page_title", label: "頁面標題（同頁各段一致）", kind: "text", max: 80 },
  { key: "body", label: "內文", kind: "textarea", max: 10000, rows: 6 },
];

export default async function ContentPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  await requireAdminPage("/admin/content");
  const tab = pick(sp((await searchParams).tab), TABS, "faq");
  const faqs = tab === "faq" ? await listFaqs() : [];
  const sections = tab !== "faq" ? await listSections(tab as InfoPage) : [];
  const pageTitle = sections[0]?.page_title ?? (tab !== "faq" ? INFO_PAGE_LABELS[tab as InfoPage] : "");

  return (
    <div className="adm-page">
      <PageHead eyebrow="Content" title="FAQ 與條款" sub="前台 /faq、/shipping、/returns、/privacy、/terms 的文字內容；儲存後前台數秒內更新。條款類文字上線前需經法務確認。" />
      <nav className="adm-tabs" aria-label="內容分類">
        <Link href="/admin/content?tab=faq" data-active={tab === "faq" ? "true" : "false"}>
          FAQ
        </Link>
        {INFO_PAGES.map((p) => (
          <Link key={p} href={`/admin/content?tab=${p}`} data-active={tab === p ? "true" : "false"}>
            {INFO_PAGE_LABELS[p]}
          </Link>
        ))}
      </nav>
      {tab === "faq" ? (
        <RecordsManager key="faq" records={faqs} fields={FAQ_FIELDS} apiBase="/api/admin/content/faqs" titleKey="question" emptyText="尚無 FAQ" />
      ) : (
        <RecordsManager
          key={tab}
          records={sections}
          fields={SECTION_FIELDS}
          apiBase="/api/admin/content/sections"
          fixed={{ page: tab }}
          titleKey="heading"
          newDefaults={{ page_title: pageTitle }}
          emptyText="此頁尚無段落"
        />
      )}
    </div>
  );
}
