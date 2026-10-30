"use client";
import { createBrowserClient } from "@supabase/ssr";

/** 瀏覽器端（Client Component）用，anon key，schema=tugo。 */
export function createClient() {
  return createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    db: { schema: "tugo" },
  });
}
