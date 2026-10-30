import { createAdminClient } from "@/lib/supabase/admin";
import { fail, guardAdmin, json, readJsonObject } from "@/lib/admin/api";
import { COLLECTION_LABELS, COLLECTION_SPECS, dbErrorMessage, validateFields } from "@/lib/admin/catalog";
import { revalidatePublic } from "@/lib/admin/revalidate";
import { setCollectionArtists } from "./artists";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const g = await guardAdmin(req);
  if (!g.ok) return g.res;
  const body = await readJsonObject(req);
  if (!body) return fail("bad_payload", 400);
  const v = validateFields(body, COLLECTION_SPECS, COLLECTION_LABELS, "create");
  if (!v.ok) return fail("bad_payload", 400, { message: v.message });
  const { artist_ids, ...values } = v.values;
  const { error } = await createAdminClient().from("collections").insert(values);
  if (error) {
    const e = dbErrorMessage(error);
    return fail(e.error, e.status, { message: e.message });
  }
  if (Array.isArray(artist_ids)) {
    const r = await setCollectionArtists(values.id as string, artist_ids as string[]);
    if (!r.ok) return fail("bad_payload", 400, { message: r.message });
  }
  revalidatePublic("collection", values.id as string);
  return json({ ok: true, id: values.id }, 201);
}
