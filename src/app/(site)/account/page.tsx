import type { Metadata } from "next";
import { AccountView } from "@/components/site/AccountView";

export const metadata: Metadata = { title: "會員中心", robots: { index: false } };

export default function AccountPage() {
  return <AccountView />;
}
