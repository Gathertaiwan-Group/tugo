import type { EntityField } from "@/components/admin/catalog/EntityForm";

export const ARTIST_FIELDS: EntityField[] = [
  { key: "id", label: "代碼（網址 /artists/…）", kind: "slug", required: true, max: 80, hint: "小寫英數與連字號" },
  { key: "name", label: "名稱", kind: "text", required: true, max: 80 },
  { key: "name_en", label: "英文名", kind: "text", max: 80 },
  { key: "discipline", label: "創作類型", kind: "text", max: 80 },
  { key: "city", label: "城市", kind: "text", max: 60 },
  { key: "instagram", label: "Instagram", kind: "text", max: 120 },
  { key: "tags", label: "標籤", kind: "list", max: 400, hint: "以逗號或頓號分隔，最多 12 個" },
  { key: "tagline", label: "一句話介紹（列表卡片）", kind: "text", max: 200, span: true },
  { key: "philosophy", label: "創作理念（詳情頁引言）", kind: "textarea", max: 1000 },
  { key: "bio", label: "簡介", kind: "textarea", max: 4000 },
  { key: "sort", label: "排序（小→大）", kind: "int" },
  { key: "hue", label: "佔位色相（0–360）", kind: "int" },
  { key: "is_demo", label: "示意資料", kind: "bool" },
];

export function collectionFields(artists: { id: string; name: string }[]): EntityField[] {
  return [
    { key: "id", label: "代碼（網址 /collections/…）", kind: "slug", required: true, max: 80, hint: "小寫英數與連字號" },
    { key: "name", label: "系列名稱", kind: "text", required: true, max: 80 },
    { key: "name_en", label: "英文名", kind: "text", max: 80 },
    { key: "season", label: "季度", kind: "text", max: 60 },
    { key: "concept", label: "概念（一句話）", kind: "text", max: 300, span: true },
    { key: "description", label: "介紹", kind: "textarea", max: 4000 },
    { key: "artist_ids", label: "參與藝術家", kind: "multi", options: artists.map((a) => ({ value: a.id, label: a.name })), hint: "依勾選順序排列" },
    { key: "sort", label: "排序（小→大）", kind: "int" },
    { key: "hue", label: "佔位色相（0–360）", kind: "int" },
    { key: "is_demo", label: "示意資料", kind: "bool" },
  ];
}
