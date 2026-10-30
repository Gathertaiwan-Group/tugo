import { NotFoundBlock } from "@/components/site/ui";

export default function NotFound() {
  return <NotFoundBlock code="ERROR 404 — ARTIST" title="找不到這位藝術家" href="/artists" cta="回到藝術家列表" titleClass="text-[36px]" />;
}
