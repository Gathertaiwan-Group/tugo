import type { Metadata } from "next";
import { ShopPage } from "@/lib/site/shop-page";

export const metadata: Metadata = {
  title: "逛商品",
  description: "逛圖個有意思的新銳藝術家聯名商品：T 恤、帽子、包袋、貼紙、海報版畫與生活小物。",
  alternates: { canonical: "/shop" },
};

export default async function Page({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  return <ShopPage mode="all" searchParams={await searchParams} />;
}
