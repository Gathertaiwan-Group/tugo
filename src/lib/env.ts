// 站台層級設定（對應原型 Tweaks：showDemoBanner / heroLayout / addBehavior）。NEXT_PUBLIC_* 會被 inline 進 client bundle。
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(/\/$/, "");
export const SHOW_DEMO_BANNER = process.env.NEXT_PUBLIC_SHOW_DEMO_BANNER !== "false";
export const HERO_LAYOUT: "split" | "full" = process.env.NEXT_PUBLIC_HERO_LAYOUT === "full" ? "full" : "split";
export const ADD_TO_CART: "drawer" | "toast" = process.env.NEXT_PUBLIC_ADD_TO_CART === "toast" ? "toast" : "drawer";
