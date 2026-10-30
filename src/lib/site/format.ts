// 前台共用小工具（server / client 皆可用）。
import type { LiteProduct, Product } from "./types";

/** 條紋佔位圖（README §4.6）。 */
export function bg(h: number, angle = 135, L = 0.87) {
  return `repeating-linear-gradient(${angle}deg, oklch(${L} 0.035 ${h}) 0 14px, oklch(${(L - 0.03).toFixed(2)} 0.042 ${h}) 14px 28px)`;
}

export function money(n: number) {
  return "NT$ " + n.toLocaleString("en-US");
}

export const FREE_SHIP_THRESHOLD = 1500;
export const SHIP_FEE = { home: 100, cvs: 60 } as const;
export type ShipMethod = keyof typeof SHIP_FEE;
export const PAY_METHODS = [
  ["card", "信用卡"],
  ["atm", "ATM 轉帳"],
  ["cvs", "超商代碼"],
  ["linepay", "LINE Pay"],
] as const;
export type PayMethod = (typeof PAY_METHODS)[number][0];

export function shippingFee(subtotal: number, ship: ShipMethod) {
  if (subtotal === 0 || subtotal >= FREE_SHIP_THRESHOLD) return 0;
  return SHIP_FEE[ship];
}

export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const URL_RE = /^https?:\/\/[^\s.]+\.[^\s]+/;
export const PHONE_RE = /^09\d{8}$/;
/** 去除空白/減號；瀏覽器自動填入的 +886 9xx 轉成 09xx */
export function normalizePhone(v: string) {
  return v.replace(/[\s()-]/g, "").replace(/^\+?886-?0?/, "0");
}

export const CITIES = [
  "台北市", "新北市", "基隆市", "桃園市", "新竹市", "新竹縣", "苗栗縣", "台中市", "彰化縣", "南投縣",
  "雲林縣", "嘉義市", "嘉義縣", "台南市", "高雄市", "屏東縣", "宜蘭縣", "花蓮縣", "台東縣",
];

export const DISCIPLINES = ["插畫", "角色設計", "攝影", "版畫／印刷", "字體／平面設計", "拼貼／複合媒材", "其他"];

type BadgeInfo = { text: string; bg: string; color: string; border: string };
export function badgeOf(p: Pick<Product, "status" | "is_new">): BadgeInfo | null {
  if (p.status === "limited") return { text: "限量", bg: "#F07C46", color: "#242622", border: "#F07C46" };
  if (p.status === "preorder") return { text: "預購", bg: "#F4EFE5", color: "#244A3A", border: "#244A3A" };
  if (p.status === "soldout") return { text: "售罄", bg: "#D9D3C7", color: "#3E403B", border: "#D9D3C7" };
  if (p.is_new) return { text: "NEW", bg: "#244A3A", color: "#F4EFE5", border: "#244A3A" };
  return null;
}

export function needsOptions(p: Pick<LiteProduct, "colors" | "sizes">) {
  return p.colors.length > 1 || p.sizes.length > 1;
}

export function statusText(p: Pick<Product, "status" | "stock" | "ship_date">) {
  switch (p.status) {
    case "instock":
      return `現貨・剩餘 ${p.stock} 件（示意庫存）`;
    case "limited":
      return `限量・剩餘 ${p.stock} 件（示意庫存）`;
    case "preorder":
      return `預購中・預計 ${p.ship_date} 起陸續出貨`;
    default:
      return "已售罄・補貨通知功能待串接";
  }
}

export function cartKey(id: string, color: string, size: string) {
  return `${id}|${color}|${size}`;
}
