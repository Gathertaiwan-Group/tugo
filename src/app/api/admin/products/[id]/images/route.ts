import { createAdminClient } from "@/lib/supabase/admin";
import { fail, guardAdmin, json, readJsonObject, unknownKey } from "@/lib/admin/api";
import { slugOk } from "@/lib/admin/catalog";
import { revalidatePublic } from "@/lib/admin/revalidate";
import { UPLOAD_ERROR_MESSAGES, removePublicObject, uploadPublicImage } from "@/lib/admin/upload";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type Ctx = { params: Promise<{ id: string }> };
const LABEL_MAX = 40;

async function productSlug(id: string): Promise<string | null> {
  const { data } = await createAdminClient().from("products").select("slug").eq("id", id).maybeSingle();
  return data?.slug ?? null;
}

// 上傳一張商品圖（FormData：file, label）
export async function POST(req: Request, ctx: Ctx) {
  const g = await guardAdmin(req);
  if (!g.ok) return g.res;
  const { id } = await ctx.params;
  if (!slugOk(id)) return fail("not_found", 404);
  const slug = await productSlug(id);
  if (!slug) return fail("not_found", 404);

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return fail("bad_payload", 400);
  }
  const labelRaw = form.get("label");
  const label = typeof labelRaw === "string" && labelRaw.trim() ? labelRaw.trim().slice(0, LABEL_MAX) : null;
  const up = await uploadPublicImage("tugo-product-images", `products/${id}`, form.get("file"));
  if (!up.ok) return fail(up.error, 400, { message: UPLOAD_ERROR_MESSAGES[up.error] });

  const sb = createAdminClient();
  const { data: last } = await sb.from("product_images").select("sort").eq("product_id", id).order("sort", { ascending: false }).limit(1);
  const sort = ((last?.[0] as { sort: number } | undefined)?.sort ?? -1) + 1;
  const { data, error } = await sb
    .from("product_images")
    .insert({ product_id: id, url: up.image.publicUrl, label, sort })
    .select("id,url,label,sort")
    .single();
  if (error) {
    await removePublicObject(up.image.publicUrl); // DB 失敗 → 回滾刪新檔
    return fail("db_error", 500, { message: "儲存失敗，請重試" });
  }
  revalidatePublic("product", slug);
  return json({ ok: true, image: data }, 201);
}

// 重排（{ids:number[]}）或改標籤（{imageId, label}）
export async function PATCH(req: Request, ctx: Ctx) {
  const g = await guardAdmin(req);
  if (!g.ok) return g.res;
  const { id } = await ctx.params;
  if (!slugOk(id)) return fail("not_found", 404);
  const body = await readJsonObject(req);
  if (!body || unknownKey(body, ["ids", "imageId", "label"])) return fail("bad_payload", 400);
  const slug = await productSlug(id);
  if (!slug) return fail("not_found", 404);
  const sb = createAdminClient();

  if (Array.isArray(body.ids)) {
    const ids = body.ids;
    if (ids.length > 50 || !ids.every((x) => Number.isInteger(x) && (x as number) > 0)) return fail("bad_payload", 400);
    const { error } = await sb.rpc("admin_reorder_product_images", { p_product: id, p_ids: ids });
    if (error) return fail("db_error", 500, { message: "排序儲存失敗" });
  } else if (Number.isInteger(body.imageId)) {
    const label = typeof body.label === "string" && body.label.trim() ? body.label.trim().slice(0, LABEL_MAX) : null;
    const { error } = await sb.from("product_images").update({ label }).eq("id", body.imageId as number).eq("product_id", id);
    if (error) return fail("db_error", 500);
  } else {
    return fail("bad_payload", 400);
  }
  revalidatePublic("product", slug);
  return json({ ok: true });
}

// 刪除一張圖（{imageId}）
export async function DELETE(req: Request, ctx: Ctx) {
  const g = await guardAdmin(req);
  if (!g.ok) return g.res;
  const { id } = await ctx.params;
  if (!slugOk(id)) return fail("not_found", 404);
  const body = await readJsonObject(req);
  if (!body || unknownKey(body, ["imageId"]) || !Number.isInteger(body.imageId)) return fail("bad_payload", 400);
  const slug = await productSlug(id);
  if (!slug) return fail("not_found", 404);
  const sb = createAdminClient();
  const { data } = await sb.from("product_images").select("url").eq("id", body.imageId as number).eq("product_id", id).maybeSingle();
  if (!data) return fail("not_found", 404);
  const { error } = await sb.from("product_images").delete().eq("id", body.imageId as number).eq("product_id", id);
  if (error) return fail("db_error", 500);
  await removePublicObject(data.url);
  revalidatePublic("product", slug);
  return json({ ok: true });
}
