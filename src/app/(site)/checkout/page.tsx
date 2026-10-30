import type { Metadata } from "next";
import { CheckoutView } from "@/components/site/CheckoutView";

export const metadata: Metadata = { title: "結帳", robots: { index: false } };

export default function CheckoutPage() {
  return <CheckoutView />;
}
