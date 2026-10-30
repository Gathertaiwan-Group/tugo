import type { Metadata } from "next";
import { CartView } from "@/components/site/CartView";

export const metadata: Metadata = { title: "購物車", robots: { index: false } };

export default function CartPage() {
  return <CartView />;
}
