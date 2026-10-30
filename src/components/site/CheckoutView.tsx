"use client";
import Link from "next/link";
import { useState, useTransition } from "react";
import { useSite } from "./SiteProvider";
import { useCartLines } from "./useCartLines";
import { ImageOrPlaceholder } from "./ImageOrPlaceholder";
import { Field, FormErrorSummary, Honeypot, inputCls } from "./form";
import { placeOrder, type CheckoutSummary } from "@/lib/site/actions";
import { CITIES, EMAIL_RE, PAY_METHODS, PHONE_RE, money, normalizePhone, type PayMethod, type ShipMethod } from "@/lib/site/format";

const SHIP_OPTS: [ShipMethod, string, string, string][] = [
  ["home", "宅配到府", "黑貓／新竹物流（待串接）・2–4 個工作天", "NT$ 100"],
  ["cvs", "超商取貨", "7-ELEVEN／全家（待串接）・選擇門市", "NT$ 60"],
];

type Form = { name: string; phone: string; email: string; city: string; addr: string; store: string; note: string };
const EMPTY: Form = { name: "", phone: "", email: "", city: "", addr: "", store: "", note: "" };

function Radio({ active, small }: { active: boolean; small?: boolean }) {
  return (
    <span className={`grid shrink-0 place-items-center rounded-full border-[1.5px] border-forest ${small ? "h-4 w-4" : "h-[18px] w-[18px]"}`}>
      <span className={`rounded-full ${small ? "h-2 w-2" : "h-2.5 w-2.5"} ${active ? "bg-forest" : "bg-transparent"}`} />
    </span>
  );
}

type SummaryLine = { key: string; name: string; variant: string; qty: number; lineText: string; hue: number; image: string | null };
function Summary({ lines, subText, shipText, totalText }: { lines: SummaryLine[]; subText: string; shipText: string; totalText: string }) {
  return (
    <>
      {lines.map((l) => (
        <div key={l.key} className="flex items-center gap-3">
          <ImageOrPlaceholder src={l.image} hue={l.hue} alt="" decorative sizes="48px" className="aspect-[4/5] w-12 shrink-0 rounded-badge" />
          <span className="flex min-w-0 flex-1 flex-col leading-[1.4]">
            <span className="text-[13px] font-medium">{l.name}</span>
            <span className="text-[12px] text-muted">
              {l.variant} × {l.qty}
            </span>
          </span>
          <span className="font-mono text-[13px] font-medium leading-none">{l.lineText}</span>
        </div>
      ))}
      <div className="flex justify-between border-t border-line pt-3 text-[14px]">
        <span>小計</span>
        <span className="font-mono">{subText}</span>
      </div>
      <div className="flex justify-between text-[14px]">
        <span>運費</span>
        <span className="font-mono">{shipText}</span>
      </div>
      <div className="flex justify-between border-t border-line pt-3 text-[16px] font-bold">
        <span>合計</span>
        <span className="font-mono">{totalText}</span>
      </div>
    </>
  );
}

export function CheckoutView() {
  const { cart, cartReady, clearCart } = useSite();
  const [ship, setShip] = useState<ShipMethod>("home");
  const [pay, setPay] = useState<PayMethod>("card");
  const [f, setF] = useState<Form>(EMPTY);
  const [company, setCompany] = useState("");
  const [err, setErr] = useState<Record<string, string>>({});
  const [serverErr, setServerErr] = useState("");
  const [done, setDone] = useState<CheckoutSummary | null>(null);
  const [pending, start] = useTransition();
  const c = useCartLines(ship);

  const set = (k: keyof Form, v: string) => {
    setF((p) => ({ ...p, [k]: v }));
    setErr((e) => ({ ...e, [k]: "" }));
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const x: Record<string, string> = {};
    if (!f.name.trim()) x.name = "請填寫收件人姓名";
    if (!PHONE_RE.test(normalizePhone(f.phone))) x.phone = f.phone ? "手機格式應為 09 開頭 10 碼" : "請填寫手機號碼";
    if (!EMAIL_RE.test(f.email.trim())) x.email = f.email ? "Email 格式不正確" : "請填寫 Email";
    if (ship === "home") {
      if (!f.city) x.city = "請選擇縣市";
      if (!f.addr.trim()) x.addr = "請填寫地址";
    }
    if (ship === "cvs" && !f.store.trim()) x.store = "請填寫取貨門市（門市選擇器待串接）";
    setServerErr("");
    setErr(x);
    if (Object.keys(x).length) {
      requestAnimationFrame(() => document.querySelector<HTMLElement>("[data-checkout-form] [aria-invalid='true']")?.focus());
      return;
    }
    start(async () => {
      const r = await placeOrder({ ...f, ship, pay, company, items: cart.map(({ id, color, size, qty }) => ({ id, color, size, qty })) });
      if (r.ok) {
        setDone(r.summary);
        clearCart();
        window.scrollTo({ top: 0 });
      } else if (r.errors) setErr(r.errors);
      else setServerErr(r.error ?? "系統忙碌中，請稍後再試。");
    });
  };

  const lineSummary: SummaryLine[] = c.lines.map((l) => ({
    key: l.key,
    name: l.product.name,
    variant: l.variant,
    qty: l.qty,
    lineText: money(l.lineTotal),
    hue: l.product.hue,
    image: l.product.image,
  }));

  const steps = (
    <nav aria-label="結帳步驟" className="mb-4 flex flex-wrap items-center gap-2 font-mono text-[12px] font-medium leading-none text-muted">
      <Link href="/cart" className="inline-flex min-h-11 items-center nav:min-h-0">
        01 購物車
      </Link>
      <span aria-hidden="true">→</span>
      <span aria-current="step" className="text-ink">
        02 收件與配送
      </span>
      <span aria-hidden="true">→</span>
      <span>03 付款（待串接）</span>
    </nav>
  );

  const aside = (s: { lines: SummaryLine[]; subText: string; shipText: string; totalText: string }, mobileCollapsible: boolean) => (
    <>
      {mobileCollapsible ? (
        <details className="group rounded-panel border border-line-card bg-card nav:hidden">
          <summary className="flex min-h-[52px] cursor-pointer list-none items-center justify-between gap-3 px-5 [&::-webkit-details-marker]:hidden">
            <span className="font-medium">
              購買明細 <span className="font-mono text-[12px] text-muted">({s.lines.reduce((t, l) => t + l.qty, 0)} 件)</span>
              <span aria-hidden="true" className="ml-1 inline-block text-[11px] transition-transform group-open:rotate-180">
                ▾
              </span>
            </span>
            <span className="font-mono font-bold">{s.totalText}</span>
          </summary>
          <div className="flex flex-col gap-3 px-5 pb-5">
            <Summary {...s} />
          </div>
        </details>
      ) : null}
      <aside className={`flex-col gap-3 rounded-panel border border-line-card bg-card p-6 nav:sticky nav:top-24 ${mobileCollapsible ? "hidden nav:flex" : "flex"}`}>
        <h2 className="mb-1 mt-0 font-serif text-[20px] font-bold leading-[1.3]">購買明細</h2>
        <Summary {...s} />
      </aside>
    </>
  );

  if (done)
    return (
      <section className="container-tugo-1200 pb-[clamp(56px,8vw,112px)] pt-[clamp(24px,5vw,72px)]">
        <h1 className="mb-6 mt-0 font-serif text-[clamp(32px,4vw,52px)] font-bold leading-[1.2]">結帳</h1>
        <div className="grid grid-cols-1 items-start gap-[clamp(24px,4vw,56px)] nav:grid-cols-[minmax(0,1fr)_380px]">
          <div role="status" className="flex animate-[tugoIn_.3s_ease] flex-col gap-3.5 rounded-panel border border-line-card bg-card p-[clamp(20px,4vw,40px)]">
            <span className="font-mono text-[11px] font-medium leading-none tracking-[.14em] text-muted">DEMO ・ 尚未付款</span>
            <h2 className="m-0 font-serif text-[26px] font-bold leading-[1.3]">收件與配送資料已確認</h2>
            <p className="m-0 text-[15px] text-body2">
              配送：{done.shipName}　付款：{done.payName}
            </p>
            <p className="m-0 text-[15px] text-body2">
              <strong>
                已收到你的訂購資料（訂單編號 {done.orderNo}）。金流尚未串接，本站沒有收取任何款項。
              </strong>
              訂單目前為「待付款」狀態；正式上線後，此步驟會導向第三方金流付款頁完成付款。
            </p>
            <Link href="/shop" className="inline-flex h-11 items-center self-start rounded-ctl border border-ink px-5">
              繼續逛逛
            </Link>
          </div>
          {aside(done, false)}
        </div>
      </section>
    );

  return (
    <section className="container-tugo-1200 pb-[clamp(56px,8vw,112px)] pt-[clamp(20px,5vw,72px)]">
      {steps}
      <h1 className="mb-6 mt-0 font-serif text-[clamp(32px,4vw,52px)] font-bold leading-[1.2] nav:mb-7">結帳</h1>
      {!cartReady ? (
        <div className="h-40 animate-tugo-pulse rounded-panel bg-skeleton" aria-busy="true" aria-label="載入中" />
      ) : c.lines.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-panel border border-dashed border-line-field px-6 py-16 text-center">
          <span className="font-serif text-[22px] font-bold leading-[1.3]">購物車沒有商品，無法結帳</span>
          <Link href="/shop" className="inline-flex h-12 items-center rounded-ctl bg-forest px-6 text-paper hover:text-paper">
            去逛商品
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 items-start gap-[clamp(20px,4vw,56px)] nav:grid-cols-[minmax(0,1fr)_380px]">
          <div className="min-w-0 nav:order-1">
            <div className="mb-6 nav:hidden">{aside({ lines: lineSummary, subText: c.subText, shipText: c.shipText, totalText: c.totalText }, true)}</div>
            <form noValidate onSubmit={submit} data-checkout-form className="relative flex flex-col gap-7">
              {Object.values(err).some(Boolean) ? <FormErrorSummary>收件資訊尚未完整，請檢查紅字提示。</FormErrorSummary> : null}
              {serverErr ? <FormErrorSummary>{serverErr}</FormErrorSummary> : null}
              <Honeypot value={company} onChange={setCompany} />
              <fieldset className="m-0 flex min-w-0 flex-col gap-4 border-0 p-0">
                <legend className="mb-4 font-serif text-[20px] font-bold leading-[1.3]">收件資訊</legend>
                <div className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-4">
                  <Field label="收件人姓名 *" err={err.name}>
                    {(a) => <input {...a} autoComplete="shipping name" enterKeyHint="next" value={f.name} onChange={(e) => set("name", e.target.value)} className={inputCls(err.name)} />}
                  </Field>
                  <Field label="手機 *" err={err.phone}>
                    {(a) => (
                      <input
                        {...a}
                        type="tel"
                        inputMode="tel"
                        autoComplete="tel"
                        enterKeyHint="next"
                        placeholder="0912345678"
                        maxLength={14}
                        value={f.phone}
                        onChange={(e) => set("phone", e.target.value)}
                        className={inputCls(err.phone)}
                      />
                    )}
                  </Field>
                </div>
                <Field label="Email *（訂單通知）" err={err.email}>
                  {(a) => (
                    <input
                      {...a}
                      type="email"
                      inputMode="email"
                      autoComplete="email"
                      autoCapitalize="off"
                      spellCheck={false}
                      enterKeyHint="next"
                      value={f.email}
                      onChange={(e) => set("email", e.target.value)}
                      className={inputCls(err.email)}
                    />
                  )}
                </Field>
              </fieldset>

              <fieldset className="m-0 flex min-w-0 flex-col gap-3 border-0 p-0">
                <legend className="mb-4 font-serif text-[20px] font-bold leading-[1.3]">配送方式</legend>
                {SHIP_OPTS.map(([id, name, desc, fee]) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setShip(id)}
                    aria-pressed={ship === id}
                    className={`flex cursor-pointer items-center gap-3.5 rounded-card border-[1.5px] bg-field p-4 text-left ${ship === id ? "border-forest" : "border-line-field"}`}
                  >
                    <Radio active={ship === id} />
                    <span className="flex min-w-0 flex-1 flex-col">
                      <strong className="text-[15px]">{name}</strong>
                      <span className="text-[12px] text-muted">{desc}</span>
                    </span>
                    <span className="shrink-0 font-mono text-[13px] font-medium leading-none">{fee}</span>
                  </button>
                ))}
                {ship === "home" ? (
                  <div className="grid grid-cols-1 gap-3 min-[480px]:grid-cols-[minmax(140px,1fr)_3fr]">
                    <Field label="縣市 *" err={err.city}>
                      {(a) => (
                        <select {...a} autoComplete="shipping address-level1" value={f.city} onChange={(e) => set("city", e.target.value)} className={`${inputCls(err.city)} px-2.5`}>
                          <option value="">請選擇</option>
                          {CITIES.map((x) => (
                            <option key={x} value={x}>
                              {x}
                            </option>
                          ))}
                        </select>
                      )}
                    </Field>
                    <Field label="地址 *" err={err.addr}>
                      {(a) => (
                        <input {...a} autoComplete="shipping street-address" enterKeyHint="next" value={f.addr} onChange={(e) => set("addr", e.target.value)} className={inputCls(err.addr)} />
                      )}
                    </Field>
                  </div>
                ) : (
                  <Field label="取貨門市 *（電子地圖選店待串接，請先手動輸入）" err={err.store}>
                    {(a) => (
                      <input
                        {...a}
                        autoComplete="off"
                        enterKeyHint="next"
                        placeholder="例如：7-ELEVEN 安平門市"
                        value={f.store}
                        onChange={(e) => set("store", e.target.value)}
                        className={inputCls(err.store)}
                      />
                    )}
                  </Field>
                )}
                <Field label="備註（選填）">
                  {(a) => <input {...a} autoComplete="off" value={f.note} onChange={(e) => set("note", e.target.value)} className={inputCls()} />}
                </Field>
              </fieldset>

              <fieldset className="m-0 flex min-w-0 flex-col gap-3 border-0 p-0">
                <legend className="mb-2 font-serif text-[20px] font-bold leading-[1.3]">付款方式</legend>
                <p role="note" className="mb-1 mt-0 rounded-ctl bg-notice px-3.5 py-2.5 text-[13px] text-ink">
                  <strong>金流尚未串接。</strong>本頁不收取任何信用卡或付款資訊；正式上線後將導向第三方金流頁面完成付款。
                </p>
                <div className="grid grid-cols-2 gap-2.5 min-[720px]:grid-cols-[repeat(auto-fit,minmax(150px,1fr))]">
                  {PAY_METHODS.map(([id, name]) => (
                    <button
                      key={id}
                      type="button"
                      onClick={() => setPay(id)}
                      aria-pressed={pay === id}
                      className={`flex min-h-[52px] cursor-pointer items-center gap-2.5 rounded-[10px] border-[1.5px] bg-field p-3 text-left text-[14px] ${pay === id ? "border-forest" : "border-line-field"}`}
                    >
                      <Radio active={pay === id} small />
                      <span className="min-w-0 flex-1">{name}</span>
                      <span className="shrink-0 text-[11px] text-muted">待串接</span>
                    </button>
                  ))}
                </div>
              </fieldset>
              <button
                type="submit"
                disabled={pending}
                className="h-[54px] cursor-pointer rounded-ctl border-0 bg-forest text-[16px] font-medium text-paper hover:bg-forest-dark disabled:opacity-80"
              >
                {pending ? "確認中…" : "確認訂單資料（Demo）"}
              </button>
              <p className="m-0 -mt-3 text-center text-[12px] text-muted">送出後會建立一筆「待付款」訂單資料；本站目前不會扣款。</p>
            </form>
          </div>
          <div className="hidden nav:order-2 nav:block">{aside({ lines: lineSummary, subText: c.subText, shipText: c.shipText, totalText: c.totalText }, false)}</div>
        </div>
      )}
    </section>
  );
}
