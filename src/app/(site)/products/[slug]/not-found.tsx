import { NotFoundBlock } from "@/components/site/ui";

export default function NotFound() {
  return <NotFoundBlock code="ERROR 404 — PRODUCT" title="找不到這件商品" desc="它可能已經下架，或網址有誤。" href="/shop" cta="回到逛商品" titleClass="text-[clamp(30px,4vw,44px)]" />;
}
