import type { Metadata } from "next";
import { ShopPage } from "@/lib/site/shop-page";

export const metadata: Metadata = {
  title: "新品上市",
  description: "圖個有意思本季新品：新銳藝術家最新聯名作品。",
  alternates: { canonical: "/new" },
};

export default async function Page({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  return <ShopPage mode="new" searchParams={await searchParams} />;
}
