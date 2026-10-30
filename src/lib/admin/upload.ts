import "server-only";
import { randomUUID } from "node:crypto";
import { createAdminClient } from "@/lib/supabase/admin";

export const MAX_IMAGE_BYTES = 4 * 1024 * 1024; // 為 Vercel 4.5MB body 上限留白
export const PUBLIC_BUCKETS = ["tugo-product-images", "tugo-artist-images"] as const;
export type PublicBucket = (typeof PUBLIC_BUCKETS)[number];

type ImageKind = { ext: "jpg" | "png" | "webp"; contentType: string };

/** 只信 magic bytes，不信副檔名與 client 給的 MIME。 */
function sniff(b: Uint8Array): ImageKind | null {
  if (b.length >= 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return { ext: "jpg", contentType: "image/jpeg" };
  if (b.length >= 8 && b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47 && b[4] === 0x0d && b[5] === 0x0a && b[6] === 0x1a && b[7] === 0x0a)
    return { ext: "png", contentType: "image/png" };
  if (
    b.length >= 12 &&
    b[0] === 0x52 && b[1] === 0x49 && b[2] === 0x46 && b[3] === 0x46 &&
    b[8] === 0x57 && b[9] === 0x45 && b[10] === 0x42 && b[11] === 0x50
  )
    return { ext: "webp", contentType: "image/webp" };
  return null;
}

/** PNG/JPEG 寬高（讀檔頭；失敗回 null，不擋上傳）。 */
function dimensions(b: Uint8Array, kind: ImageKind): { width: number; height: number } | null {
  try {
    if (kind.ext === "png" && b.length > 24) {
      const dv = new DataView(b.buffer, b.byteOffset, b.byteLength);
      return { width: dv.getUint32(16), height: dv.getUint32(20) };
    }
    if (kind.ext === "jpg") {
      let i = 2;
      while (i + 9 < b.length) {
        if (b[i] !== 0xff) return null;
        const marker = b[i + 1];
        const len = (b[i + 2] << 8) | b[i + 3];
        if (marker >= 0xc0 && marker <= 0xcf && marker !== 0xc4 && marker !== 0xc8 && marker !== 0xcc) {
          return { height: (b[i + 5] << 8) | b[i + 6], width: (b[i + 7] << 8) | b[i + 8] };
        }
        i += 2 + len;
      }
    }
  } catch {
    /* ignore */
  }
  return null;
}

export type UploadedImage = { publicUrl: string; path: string; width: number | null; height: number | null };

export type UploadError = "no_file" | "too_large" | "bad_type" | "upload_failed";
export const UPLOAD_ERROR_MESSAGES: Record<UploadError, string> = {
  no_file: "請選擇圖片檔",
  too_large: "圖片超過 4MB",
  bad_type: "只接受 JPG / PNG / WebP",
  upload_failed: "上傳失敗，請重試",
};

/** 驗證並上傳到 public bucket；路徑 <prefix>/<ts>-<uuid>.<ext>，Cache-Control 一年（檔名唯一，不會有舊快取問題）。 */
export async function uploadPublicImage(
  bucket: PublicBucket,
  prefix: string,
  file: unknown
): Promise<{ ok: true; image: UploadedImage } | { ok: false; error: UploadError }> {
  if (!(file instanceof File) || file.size === 0) return { ok: false, error: "no_file" };
  if (file.size > MAX_IMAGE_BYTES) return { ok: false, error: "too_large" };
  const bytes = new Uint8Array(await file.arrayBuffer());
  const kind = sniff(bytes);
  if (!kind) return { ok: false, error: "bad_type" };
  const safePrefix = prefix.replace(/[^a-zA-Z0-9/_-]/g, "-").replace(/\/+/g, "/").replace(/^\/|\/$/g, "") || "misc";
  const path = `${safePrefix}/${Date.now()}-${randomUUID()}.${kind.ext}`;
  const sb = createAdminClient();
  const { error } = await sb.storage.from(bucket).upload(path, bytes, { contentType: kind.contentType, cacheControl: "31536000", upsert: false });
  if (error) return { ok: false, error: "upload_failed" };
  const { data } = sb.storage.from(bucket).getPublicUrl(path);
  const dim = dimensions(bytes, kind);
  return { ok: true, image: { publicUrl: data.publicUrl, path, width: dim?.width ?? null, height: dim?.height ?? null } };
}

/** 由 public URL 反推 bucket 內路徑（只認本專案兩個 bucket）。 */
export function storagePathFromPublicUrl(url: string | null | undefined): { bucket: PublicBucket; path: string } | null {
  if (!url) return null;
  for (const bucket of PUBLIC_BUCKETS) {
    const marker = `/storage/v1/object/public/${bucket}/`;
    const i = url.indexOf(marker);
    if (i >= 0) return { bucket, path: decodeURIComponent(url.slice(i + marker.length)) };
  }
  return null;
}

/** best-effort 刪檔（DB 已不再引用後才呼叫）。 */
export async function removePublicObject(url: string | null | undefined): Promise<void> {
  const loc = storagePathFromPublicUrl(url);
  if (!loc) return;
  await createAdminClient().storage.from(loc.bucket).remove([loc.path]).catch(() => {});
}
