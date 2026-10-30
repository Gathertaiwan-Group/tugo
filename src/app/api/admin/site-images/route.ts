import { createAdminClient } from "@/lib/supabase/admin";
import { fail, guardAdmin, json, readJsonObject, unknownKey } from "@/lib/admin/api";
import { revalidatePublic } from "@/lib/admin/revalidate";
import { isValidSlotKey } from "@/lib/admin/siteImageSlots";
import { UPLOAD_ERROR_MESSAGES, removePublicObject, uploadPublicImage } from "@/lib/admin/upload";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const ALT_MAX = 200;
const cleanAlt = (v: unknown) => (typeof v === "string" && v.trim() ? v.trim().slice(0, ALT_MAX) : null);

async function categoryExists(key: string): Promise<boolean> {
  if (!key.startsWith("category.")) return true;
  const { data } = await createAdminClient().from("categories").select("id").eq("id", key.slice("category.".length)).maybeSingle();
  return !!data;
}

export async function GET(req: Request) {
  const g = await guardAdmin(req);
  if (!g.ok) return g.res;
  const { data } = await createAdminClient().from("site_images").select("slot_key,public_url,alt,width,height,updated_at");
  return json({ ok: true, images: data ?? [] });
}

// 上傳 / 替換（FormData：slotKey, file, alt）：先上傳新檔 → upsert → 刪舊檔；DB 失敗刪新檔回滾
export async function POST(req: Request) {
  const g = await guardAdmin(req);
  if (!g.ok) return g.res;
  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return fail("bad_payload", 400);
  }
  const slotKey = form.get("slotKey");
  if (!isValidSlotKey(slotKey) || !(await categoryExists(slotKey))) return fail("bad_payload", 400, { message: "未知的圖片版位" });
  const sb = createAdminClient();
  const { data: cur } = await sb.from("site_images").select("public_url").eq("slot_key", slotKey).maybeSingle();
  const up = await uploadPublicImage("tugo-product-images", `site/${slotKey.replace(/\./g, "-")}`, form.get("file"));
  if (!up.ok) return fail(up.error, 400, { message: UPLOAD_ERROR_MESSAGES[up.error] });
  const row = {
    slot_key: slotKey,
    public_url: up.image.publicUrl,
    storage_path: up.image.path,
    alt: cleanAlt(form.get("alt")),
    width: up.image.width,
    height: up.image.height,
    updated_by: g.admin.id,
    updated_at: new Date().toISOString(),
  };
  const { error } = await sb.from("site_images").upsert(row, { onConflict: "slot_key" });
  if (error) {
    await removePublicObject(up.image.publicUrl);
    return fail("db_error", 500, { message: "儲存失敗，請重試" });
  }
  if (cur?.public_url && cur.public_url !== up.image.publicUrl) await removePublicObject(cur.public_url);
  revalidatePublic(slotKey.startsWith("category.") ? "category" : "site");
  return json({ ok: true, url: up.image.publicUrl });
}

// 只改替代文字（{slotKey, alt}）
export async function PATCH(req: Request) {
  const g = await guardAdmin(req);
  if (!g.ok) return g.res;
  const body = await readJsonObject(req);
  if (!body || unknownKey(body, ["slotKey", "alt"]) || !isValidSlotKey(body.slotKey)) return fail("bad_payload", 400);
  const { data, error } = await createAdminClient()
    .from("site_images")
    .update({ alt: cleanAlt(body.alt), updated_by: g.admin.id, updated_at: new Date().toISOString() })
    .eq("slot_key", body.slotKey)
    .select("slot_key");
  if (error) return fail("db_error", 500);
  if (!data?.length) return fail("not_found", 404, { message: "此版位尚未上傳圖片" });
  revalidatePublic(body.slotKey.startsWith("category.") ? "category" : "site");
  return json({ ok: true });
}

// 清除版位圖片（{slotKey}）→ 前台回到佔位圖
export async function DELETE(req: Request) {
  const g = await guardAdmin(req);
  if (!g.ok) return g.res;
  const body = await readJsonObject(req);
  if (!body || unknownKey(body, ["slotKey"]) || !isValidSlotKey(body.slotKey)) return fail("bad_payload", 400);
  const sb = createAdminClient();
  const { data: cur } = await sb.from("site_images").select("public_url").eq("slot_key", body.slotKey).maybeSingle();
  if (!cur) return json({ ok: true });
  const { error } = await sb.from("site_images").delete().eq("slot_key", body.slotKey);
  if (error) return fail("db_error", 500);
  await removePublicObject(cur.public_url);
  revalidatePublic(body.slotKey.startsWith("category.") ? "category" : "site");
  return json({ ok: true });
}
