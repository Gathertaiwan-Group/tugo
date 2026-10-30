import type { Metadata, Viewport } from "next";
import { SiteShell } from "@/components/site/SiteShell";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#F4EFE5",
};

export const metadata: Metadata = {
  title: {
    default: "圖個有意思 TUGO STUDIO｜好作品，不只值得被看見。",
    template: "%s｜圖個有意思 TUGO STUDIO",
  },
};

export const revalidate = 60;

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return <SiteShell>{children}</SiteShell>;
}
