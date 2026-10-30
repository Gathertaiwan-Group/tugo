import { createAdminClient } from "@/lib/supabase/admin";
import { fail, guardAdmin, json, readJsonObject, unknownKey } from "@/lib/admin/api";
import { slugOk } from "@/lib/admin/catalog";
import { revalidatePublic } from "@/lib/admin/revalidate";
import { UPLOAD_ERROR_MESSAGES, removePublicObject, uploadPublicImage } from "@/lib/admin/upload";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
type Ctx = { params: Promise<{ id: string }> };
const KINDS = { portrait: "portrait_url", cover: "cover_url" } as const;
type Kind = keyof typeof KINDS;
const isKind = (k: unknown): k is Kind => k === "portrait" || k === "cover";

// 上傳頭像 / 封面（FormData：kind, file）：先上傳新檔 → 寫 DB → 刪舊檔；DB 失敗刪新檔
export async function POST(req: Request, ctx: Ctx) {
  const g = await guardAdmin(req);
  if (!g.ok) return g.res;
  const { id } = await ctx.params;
  if (!slugOk(id)) return fail("not_found", 404);
  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return fail("bad_payload", 400);
  }
  const kind = form.get("kind");
  if (!isKind(kind)) return fail("bad_payload", 400);
  const col = KINDS[kind];
  const sb = createAdminClient();
  const { data: cur } = await sb.from("artists").select("portrait_url,cover_url").eq("id", id).maybeSingle();
  if (!cur) return fail("not_found", 404);
  const up = await uploadPublicImage("tugo-artist-images", `artists/${id}/${kind}`, form.get("file"));
  if (!up.ok) return fail(up.error, 400, { message: UPLOAD_ERROR_MESSAGES[up.error] });
  const { error } = await sb.from("artists").update({ [col]: up.image.publicUrl }).eq("id", id);
  if (error) {
    await removePublicObject(up.image.publicUrl);
    return fail("db_error", 500, { message: "儲存失敗，請重試" });
  }
  await removePublicObject((cur as Record<string, string | null>)[col]);
  revalidatePublic("artist", id);
  return json({ ok: true, url: up.image.publicUrl });
}

// 清除圖片（{kind}）
export async function DELETE(req: Request, ctx: Ctx) {
  const g = await guardAdmin(req);
  if (!g.ok) return g.res;
  const { id } = await ctx.params;
  if (!slugOk(id)) return fail("not_found", 404);
  const body = await readJsonObject(req);
  if (!body || unknownKey(body, ["kind"]) || !isKind(body.kind)) return fail("bad_payload", 400);
  const col = KINDS[body.kind];
  const sb = createAdminClient();
  const { data: cur } = await sb.from("artists").select("portrait_url,cover_url").eq("id", id).maybeSingle();
  if (!cur) return fail("not_found", 404);
  const { error } = await sb.from("artists").update({ [col]: null }).eq("id", id);
  if (error) return fail("db_error", 500);
  await removePublicObject((cur as Record<string, string | null>)[col]);
  revalidatePublic("artist", id);
  return json({ ok: true });
}
