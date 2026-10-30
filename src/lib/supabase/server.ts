import "server-only";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { createClient as createJsClient } from "@supabase/supabase-js";

const url = () => process.env.NEXT_PUBLIC_SUPABASE_URL!;
const anon = () => process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

/**
 * Server Component / Server Action / Route Handler 用（anon key + 使用者 cookie session）。
 * 讀 cookies() → 該頁會變動態。需要登入身分（收藏、會員）時用這個。
 */
export async function createClient() {
  const cookieStore = await cookies();
  return createServerClient(url(), anon(), {
    db: { schema: "tugo" },
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll: (list) => {
        try {
          list.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        } catch {
          // 在 Server Component 內無法寫 cookie，可忽略（middleware / action 會處理）
        }
      },
    },
  });
}

/**
 * 公開目錄資料（商品、藝術家…）用：不讀 cookies，頁面可維持靜態 / ISR（export const revalidate = 60）。
 * 只用 anon key，只能讀 RLS 開放的公開表。
 */
export function createPublicClient() {
  return createJsClient(url(), anon(), {
    db: { schema: "tugo" },
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
