import type { Metadata } from "next";
import Link from "next/link";
import { getFaqs } from "@/lib/site/catalog";
import { FaqAccordion } from "@/components/site/FaqAccordion";
import { Eyebrow } from "@/components/site/ui";

export const revalidate = 60;
export const metadata: Metadata = {
  title: "常見問題",
  description: "圖個有意思常見問題：授權、預購出貨、退換貨、運費、發票與藝術家合作。",
  alternates: { canonical: "/faq" },
};

export default async function FaqPage() {
  const faqs = await getFaqs();
  return (
    <section className="container-tugo-880 py-[clamp(32px,6vw,96px)]">
      <Eyebrow>FAQ — 常見問題</Eyebrow>
      <h1 className="mb-8 mt-3 font-serif text-[clamp(34px,4.4vw,56px)] font-bold leading-[1.2]">有問題嗎？</h1>
      <FaqAccordion items={faqs} />
      <p className="mb-0 mt-8 text-[14px] text-muted">
        還有其他問題？請來信 hello@tugo.studio（示意信箱，尚未啟用）。另見{" "}
        <Link href="/shipping" className="underline">
          配送說明
        </Link>
        、
        <Link href="/returns" className="underline">
          退換貨政策
        </Link>
        。
      </p>
    </section>
  );
}
