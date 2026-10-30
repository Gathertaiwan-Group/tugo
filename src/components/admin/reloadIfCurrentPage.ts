import type { MouseEvent } from "react";

/**
 * 點到「目前所在頁面」的連結時改成整頁重載（client 換到同網址不會重掛元件，用 useState(initial) 的頁面會停在舊資料）。
 * ⌘／Ctrl／Shift／Alt 點擊與非左鍵維持瀏覽器預設。
 */
export function reloadIfCurrentPage(e: MouseEvent<HTMLAnchorElement>, href: string, pathname: string) {
  const plainClick = e.button === 0 && !e.metaKey && !e.ctrlKey && !e.shiftKey && !e.altKey;
  if (!plainClick) return;
  const target = new URL(href, window.location.href);
  if (target.origin !== window.location.origin || target.pathname !== pathname) return;
  e.preventDefault();
  window.location.assign(target.pathname + target.search + target.hash);
}
