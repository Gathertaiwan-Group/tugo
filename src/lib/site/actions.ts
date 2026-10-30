"use server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCatalog } from "./catalog";
import { rateLimited } from "./rate-limit";
import { normalizePhone, CITIES, DISCIPLINES, EMAIL_RE, PAY_METHODS, PHONE_RE, URL_RE, money, shippingFee, type PayMethod, type ShipMethod } from "./format";

const str = (v: unknown, max = 500) => (typeof v === "string" ? v.slice(0, max) : "");

// ---------------- 電子報 ----------------
export type NewsletterResult = { ok: true; duplicate: boolean } | { ok: false; error: string };

export async function subscribeNewsletter(input: { email: string; company?: string }): Promise<NewsletterResult> {
  const email = str(input.email, 254).trim().toLowerCase();
  if (!EMAIL_RE.test(email)) return { ok: false, error: email ? "Email 格式不正確" : "請輸入 Email" };
  // honeypot：真人看不到這個欄位；有值就假裝成功、不寫入
  if (str(input.company)) return { ok: true, duplicate: false };
  if (await rateLimited("newsletter", 5, 10 * 60_000)) return { ok: false, error: "送出太頻繁，請稍後再試。" };

  const { error } = await createAdminClient().from("newsletter_subscribers").insert({ email });
  if (error) {
    if (error.code === "23505") return { ok: true, duplicate: true };
    console.error("[newsletter] insert failed", error.message);
    return { ok: false, error: "系統忙碌中，請稍後再試。" };
  }
  return { ok: true, duplicate: false };
}

// ---------------- 合作申請 ----------------
export type ApplicationInput = {
  name: string;
  email: string;
  url: string;
  type: string;
  bio: string;
  idea: string;
  consent: boolean;
  privacy: boolean;
  company?: string;
};
export type ApplicationResult = { ok: true; duplicate: boolean } | { ok: false; errors?: Record<string, string>; error?: string };

export async function submitApplication(input: ApplicationInput): Promise<ApplicationResult> {
  const f = {
    name: str(input.name, 100).trim(),
    email: str(input.email, 254).trim(),
    url: str(input.url, 500).trim(),
    type: str(input.type, 50),
    bio: str(input.bio, 3000).trim(),
    idea: str(input.idea, 3000).trim(),
    consent: input.consent === true,
    privacy: input.privacy === true,
  };
  const err: Record<string, string> = {};
  if (!f.name) err.name = "請填寫姓名或藝名";
  if (!EMAIL_RE.test(f.email)) err.email = f.email ? "Email 格式不正確" : "請填寫 Email";
  if (!URL_RE.test(f.url)) err.url = f.url ? "請輸入完整網址（含 https://）" : "請提供 IG 或作品集網址";
  if (!DISCIPLINES.includes(f.type)) err.type = "請選擇創作類型";
  if (f.bio.length < 20) err.bio = `請至少寫 20 字（目前 ${f.bio.length} 字）`;
  if (!f.consent) err.consent = "請確認作品授權聲明";
  if (!f.privacy) err.privacy = "請同意個資蒐集告知";
  if (Object.keys(err).length) return { ok: false, errors: err };
  if (str(input.company)) return { ok: true, duplicate: false };
  if (await rateLimited("application", 3, 10 * 60_000)) return { ok: false, error: "送出太頻繁，請稍後再試。" };

  const db = createAdminClient();
  const email = f.email.toLowerCase();
  const { count } = await db.from("artist_applications").select("id", { count: "exact", head: true }).eq("email", email);
  const { error } = await db.from("artist_applications").insert({
    name: f.name,
    email,
    portfolio_url: f.url,
    discipline: f.type,
    bio: f.bio,
    idea: f.idea || null,
    consent_original: true,
    consent_privacy: true,
  });
  if (error) {
    console.error("[application] insert failed", error.message);
    return { ok: false, error: "系統忙碌中，請稍後再試。" };
  }
  return { ok: true, duplicate: (count ?? 0) > 0 };
}

// ---------------- 結帳（建立待付款訂單；金流未串接） ----------------
export type CheckoutInput = {
  name: string;
  phone: string;
  email: string;
  ship: ShipMethod;
  city: string;
  addr: string;
  store: string;
  note: string;
  pay: PayMethod;
  items: { id: string; color: string; size: string; qty: number }[];
  company?: string;
};
export type CheckoutSummary = {
  orderNo: string;
  shipName: string;
  payName: string;
  lines: { key: string; name: string; variant: string; qty: number; lineText: string; hue: number; image: string | null }[];
  subText: string;
  shipText: string;
  totalText: string;
};
export type CheckoutResult = { ok: true; summary: CheckoutSummary } | { ok: false; errors?: Record<string, string>; error?: string };

const SHIP_NAME: Record<ShipMethod, string> = { home: "宅配到府", cvs: "超商取貨" };

export async function placeOrder(input: CheckoutInput): Promise<CheckoutResult> {
  const ship: ShipMethod = input.ship === "cvs" ? "cvs" : "home";
  const payEntry = PAY_METHODS.find(([id]) => id === input.pay);
  const f = {
    name: str(input.name, 100).trim(),
    phone: normalizePhone(str(input.phone, 30)),
    email: str(input.email, 254).trim(),
    city: str(input.city, 10),
    addr: str(input.addr, 300).trim(),
    store: str(input.store, 100).trim(),
    note: str(input.note, 500).trim(),
  };
  const err: Record<string, string> = {};
  if (!f.name) err.name = "請填寫收件人姓名";
  if (!PHONE_RE.test(f.phone)) err.phone = f.phone ? "手機格式應為 09 開頭 10 碼" : "請填寫手機號碼";
  if (!EMAIL_RE.test(f.email)) err.email = f.email ? "Email 格式不正確" : "請填寫 Email";
  if (ship === "home") {
    if (!CITIES.includes(f.city)) err.city = "請選擇縣市";
    if (!f.addr) err.addr = "請填寫地址";
  }
  if (ship === "cvs" && !f.store) err.store = "請填寫取貨門市（門市選擇器待串接）";
  if (!payEntry) err.pay = "請選擇付款方式";
  if (Object.keys(err).length) return { ok: false, errors: err };

  if (str(input.company)) return { ok: false, error: "無法送出，請重新整理後再試。" };
  if (await rateLimited("checkout", 5, 10 * 60_000)) return { ok: false, error: "送出太頻繁，請稍後再試。" };

  // 以 DB 價格重算（不信任前端金額）
  const { products } = await getCatalog();
  const raw = Array.isArray(input.items) ? input.items.slice(0, 30) : [];
  if (raw.length === 0) return { ok: false, error: "購物車沒有商品，無法結帳。" };
  const merged = new Map<string, { id: string; color: string; size: string; qty: number }>();
  for (const it of raw) {
    const id = str(it?.id, 50), color = str(it?.color, 50), size = str(it?.size, 50);
    const qty = Math.floor(Number(it?.qty));
    if (!Number.isFinite(qty) || qty < 1) continue;
    const k = `${id}|${color}|${size}`;
    const prev = merged.get(k);
    merged.set(k, { id, color, size, qty: Math.min(10, (prev?.qty ?? 0) + qty) });
  }
  const lines: (CheckoutSummary["lines"][number] & { product_id: string; color: string | null; size: string | null; unit_price: number })[] = [];
  for (const [k, it] of merged) {
    const p = products.find((x) => x.id === it.id);
    if (!p) return { ok: false, error: "購物車中有已下架的商品，請回購物車調整。" };
    if (p.status === "soldout") return { ok: false, error: `「${p.name}」已售罄，請從購物車移除後再結帳。` };
    const colorOk = p.colors.length ? p.colors.includes(it.color) : it.color === "";
    const sizeOk = p.sizes.length ? p.sizes.includes(it.size) : it.size === "";
    if (!colorOk || !sizeOk) return { ok: false, error: `「${p.name}」的規格已變更，請從購物車移除後重新選擇。` };
    lines.push({
      key: k,
      product_id: p.id,
      color: it.color || null,
      size: it.size || null,
      qty: it.qty,
      unit_price: p.price,
      name: p.name,
      variant: [it.color, it.size].filter(Boolean).join("／") || "單一規格",
      lineText: money(p.price * it.qty),
      hue: p.hue,
      image: p.images[0]?.url ?? null,
    });
  }
  const subtotal = lines.reduce((t, l) => t + l.unit_price * l.qty, 0);
  const fee = shippingFee(subtotal, ship);

  const db = createAdminClient();
  const { data: order, error } = await db
    .from("orders")
    .insert({
      recipient_name: f.name,
      phone: f.phone,
      email: f.email.toLowerCase(),
      ship_method: ship,
      city: ship === "home" ? f.city : null,
      address: ship === "home" ? f.addr : null,
      cvs_store: ship === "cvs" ? f.store : null,
      note: f.note || null,
      pay_method: payEntry![0],
      subtotal,
      shipping_fee: fee,
      total: subtotal + fee,
      status: "pending_payment",
    })
    .select("id, order_no")
    .single();
  if (error || !order) {
    console.error("[checkout] order insert failed", error?.message);
    return { ok: false, error: "系統忙碌中，請稍後再試。" };
  }
  const { error: itemErr } = await db.from("order_items").insert(
    lines.map((l) => ({ order_id: order.id, product_id: l.product_id, color: l.color, size: l.size, qty: l.qty, unit_price: l.unit_price })),
  );
  if (itemErr) {
    console.error("[checkout] items insert failed", itemErr.message);
    await db.from("orders").delete().eq("id", order.id);
    return { ok: false, error: "系統忙碌中，請稍後再試。" };
  }

  return {
    ok: true,
    summary: {
      orderNo: (order.order_no as string | null) || orderNoOf(order.id as string), // order_no 由 DB trigger 產生（0004_admin）
      shipName: SHIP_NAME[ship],
      payName: payEntry![1],
      lines: lines.map(({ key, name, variant, qty, lineText, hue, image }) => ({ key, name, variant, qty, lineText, hue, image })),
      subText: money(subtotal),
      shipText: fee === 0 ? "免運" : money(fee),
      totalText: money(subtotal + fee),
    },
  };
}

function orderNoOf(id: string) {
  return "TG-" + id.replace(/-/g, "").slice(0, 8).toUpperCase();
}
