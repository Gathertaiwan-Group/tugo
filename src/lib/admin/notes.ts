import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";

export type NoteSubject = "order" | "application" | "customer";
export const NOTE_SUBJECTS: readonly NoteSubject[] = ["order", "application", "customer"];
export type AdminNote = { id: number; body: string; admin_id: string | null; admin_name: string | null; created_at: string };

/** 讀某主體的內部備註（新→舊，最多 100 筆）。 */
export async function listNotes(subjectType: NoteSubject, subjectId: string): Promise<AdminNote[]> {
  const { data } = await createAdminClient()
    .from("admin_notes")
    .select("id,body,admin_id,admin_name,created_at")
    .eq("subject_type", subjectType)
    .eq("subject_id", subjectId)
    .order("created_at", { ascending: false })
    .limit(100);
  return (data ?? []) as AdminNote[];
}
