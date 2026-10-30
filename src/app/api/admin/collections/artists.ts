import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { slugOk } from "@/lib/admin/catalog";

/** 整組取代系列的參與藝術家（依陣列順序寫 sort）。 */
export async function setCollectionArtists(collectionId: string, ids: string[]): Promise<{ ok: true } | { ok: false; message: string }> {
  if (!ids.every(slugOk)) return { ok: false, message: "藝術家代碼格式不正確" };
  const sb = createAdminClient();
  if (ids.length) {
    const { data } = await sb.from("artists").select("id").in("id", ids);
    if ((data ?? []).length !== ids.length) return { ok: false, message: "有藝術家不存在" };
  }
  const del = await sb.from("collection_artists").delete().eq("collection_id", collectionId);
  if (del.error) return { ok: false, message: "更新參與藝術家失敗" };
  if (ids.length) {
    const ins = await sb.from("collection_artists").insert(ids.map((artist_id, sort) => ({ collection_id: collectionId, artist_id, sort })));
    if (ins.error) return { ok: false, message: "更新參與藝術家失敗" };
  }
  return { ok: true };
}
