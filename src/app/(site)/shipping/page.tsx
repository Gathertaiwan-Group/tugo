import type { Metadata } from "next";
import { InfoPage, INFO_TITLES } from "@/lib/site/info-page";

export const revalidate = 60;
export const metadata: Metadata = { title: INFO_TITLES.shipping, alternates: { canonical: "/shipping" } };

export default function Page() {
  return <InfoPage page="shipping" />;
}
