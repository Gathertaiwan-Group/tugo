// 網站圖片固定 slot（版面契約）：後台只能替換既有 slot，不能新增任意 key。
// 前台讀法：select slot_key, public_url, alt from tugo.site_images（anon 可讀），以 slot_key 取圖；沒有圖就沿用條紋佔位。
// 分類圖片使用動態 slot `category.<分類 id>`。

export type SiteImageSlot = { key: string; label: string; group: string; aspect: string; hint: string };

export const SITE_IMAGE_SLOTS: SiteImageSlot[] = [
  { key: "home.hero", label: "首頁 Hero（split 版右側）", group: "首頁", aspect: "4 / 5", hint: "直式 4:5，建議 1600×2000" },
  { key: "home.hero_full", label: "首頁 Hero（全幅版）", group: "首頁", aspect: "16 / 9", hint: "橫式 16:9，建議 2400×1350" },
  { key: "home.story", label: "OUR STORY 區塊", group: "首頁", aspect: "4 / 3", hint: "橫式 4:3" },
  { key: "home.recruit", label: "藝術家招募卡", group: "首頁", aspect: "16 / 9", hint: "橫式 16:9" },
  { key: "about.main", label: "關於我們主圖", group: "關於與合作", aspect: "3 / 2", hint: "橫式 3:2" },
  { key: "collaborate.hero", label: "藝術家合作頁 Hero", group: "關於與合作", aspect: "16 / 9", hint: "橫式 16:9" },
];

export const CATEGORY_SLOT_RE = /^category\.[a-z0-9-]{1,80}$/;

export function isValidSlotKey(key: unknown): key is string {
  return typeof key === "string" && (SITE_IMAGE_SLOTS.some((s) => s.key === key) || CATEGORY_SLOT_RE.test(key));
}
