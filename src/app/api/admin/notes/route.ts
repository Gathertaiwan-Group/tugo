import { createAdminClient } from "@/lib/supabase/admin";
import { fail, guardAdmin, json, readJsonObject, unknownKey } from "@/lib/admin/api";
import { adminDisplayName } from "@/lib/admin/auth";
import { NOTE_SUBJECTS, type NoteSubject } from "@/lib/admin/notes";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const g = await guardAdmin(req);
  if (!g.ok) return g.res;
  const body = await readJsonObject(req);
  if (!body || unknownKey(body, ["subject_type", "subject_id", "body"])) return fail("bad_payload", 400);
  const st = body.subject_type;
  const sid = typeof body.subject_id === "string" ? body.subject_id.trim() : "";
  const text = typeof body.body === "string" ? body.body.trim() : "";
  if (typeof st !== "string" || !NOTE_SUBJECTS.includes(st as NoteSubject)) return fail("bad_payload", 400, { message: "主體類型不正確" });
  if (!sid || sid.length > 254) return fail("bad_payload", 400);
  if (text.length < 1 || text.length > 2000) return fail("bad_payload", 400, { message: "備註需 1–2000 字" });
  const { data, error } = await createAdminClient()
    .from("admin_notes")
    .insert({ subject_type: st, subject_id: st === "customer" ? sid.toLowerCase() : sid, body: text, admin_id: g.admin.id, admin_name: adminDisplayName(g.admin) })
    .select("id,body,admin_id,admin_name,created_at")
    .single();
  if (error) return fail("save_failed", 500);
  return json({ ok: true, note: data }, 201);
}
