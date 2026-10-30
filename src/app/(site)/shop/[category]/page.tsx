import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getCatalog } from "@/lib/site/catalog";
import { ShopPage } from "@/lib/site/shop-page";

type Props = { params: Promise<{ category: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { category } = await params;
  const cat = (await getCatalog()).categories.find((c) => c.id === category);
  if (!cat) return {};
  return {
    title: cat.name,
    description: `圖個有意思｜${cat.name}：新銳藝術家原創聯名商品。`,
    alternates: { canonical: `/shop/${cat.id}` },
    openGraph: { title: `${cat.name}｜圖個有意思 TUGO STUDIO`, type: "website" },
  };
}

export default async function Page({ params, searchParams }: Props) {
  const { category } = await params;
  const catalog = await getCatalog();
  if (!catalog.categories.some((c) => c.id === category)) notFound();
  return <ShopPage mode="category" categoryId={category} searchParams={await searchParams} />;
}
