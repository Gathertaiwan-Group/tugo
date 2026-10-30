import { NotFoundBlock } from "@/components/site/ui";

export default function NotFound() {
  return <NotFoundBlock code="ERROR 404" title="這一頁還沒被畫出來。" desc="網址可能有誤，或頁面已經移動。" href="/" cta="回到首頁" />;
}
