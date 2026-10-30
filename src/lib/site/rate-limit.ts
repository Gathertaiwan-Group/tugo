import "server-only";
import { headers } from "next/headers";

/**
 * 基本限流（記憶體、每個 serverless instance 各自計數）：擋同一 IP 短時間大量送出。
 * 不是嚴格防線；搭配表單 honeypot 欄位一起用。
 */
const buckets = new Map<string, number[]>();

export async function clientIp() {
  const h = await headers();
  return (h.get("x-forwarded-for")?.split(",")[0] || h.get("x-real-ip") || "unknown").trim();
}

export async function rateLimited(scope: string, limit: number, windowMs: number) {
  const key = `${scope}:${await clientIp()}`;
  const now = Date.now();
  const hits = (buckets.get(key) ?? []).filter((t) => now - t < windowMs);
  if (hits.length >= limit) {
    buckets.set(key, hits);
    return true;
  }
  hits.push(now);
  buckets.set(key, hits);
  if (buckets.size > 5000) {
    for (const [k, v] of buckets) if (!v.some((t) => now - t < windowMs)) buckets.delete(k);
  }
  return false;
}
