import "server-only";
import { createClient } from "@supabase/supabase-js";

/**
 * service role client：繞過 RLS，只能在 server（Server Action / Route Handler / 後台）使用，絕不可進 client bundle。
 * fetch 一律 cache:'no-store'，避免 Next Data Cache 把查詢結果快取一年。
 */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("缺少 NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY");
  return createClient(url, key, {
    db: { schema: "tugo" },
    auth: { persistSession: false, autoRefreshToken: false },
    global: { fetch: (input, init) => fetch(input, { ...init, cache: "no-store" }) },
  });
}
