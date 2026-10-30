import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import type { FieldSpec } from "@/lib/admin/catalog";

export const INFO_PAGES = ["shipping", "returns", "privacy", "terms"] as const;
export type InfoPage = (typeof INFO_PAGES)[number];
export const INFO_PAGE_LABELS: Record<InfoPage, string> = {
  shipping: "運送說明",
  returns: "退換貨",
  privacy: "隱私權政策",
  terms: "服務條款",
};

export const FAQ_SPECS: Record<string, FieldSpec> = {
  question: { type: "text", max: 300, required: true },
  answer: { type: "text", max: 4000, required: true },
  sort: { type: "int", min: 0, max: 100000 },
};
export const FAQ_LABELS: Record<string, string> = { question: "問題", answer: "回答", sort: "排序" };

export const SECTION_SPECS: Record<string, FieldSpec> = {
  page: { type: "enum", values: INFO_PAGES, required: true },
  page_title: { type: "text", max: 80, required: true },
  heading: { type: "text", max: 200, required: true },
  body: { type: "text", max: 10000, required: true },
  sort: { type: "int", min: 0, max: 100000 },
};
export const SECTION_LABELS: Record<string, string> = { page: "頁面", page_title: "頁面標題", heading: "段落標題", body: "內文", sort: "排序" };

export type FaqRow = { id: number; question: string; answer: string; sort: number | null };
export type SectionRow = { id: number; page: string; page_title: string; heading: string; body: string; sort: number | null };

export async function listFaqs(): Promise<FaqRow[]> {
  const { data } = await createAdminClient().from("faqs").select("id,question,answer,sort").order("sort").order("id").limit(500);
  return (data ?? []) as FaqRow[];
}

export async function listSections(page: InfoPage): Promise<SectionRow[]> {
  const { data } = await createAdminClient()
    .from("info_sections")
    .select("id,page,page_title,heading,body,sort")
    .eq("page", page)
    .order("sort")
    .order("id")
    .limit(500);
  return (data ?? []) as SectionRow[];
}
