"use client";
import Link from "next/link";
import { useState, useTransition } from "react";
import { useSite } from "./SiteProvider";
import { Logo } from "./icons";
import { subscribeNewsletter } from "@/lib/site/actions";
import { EMAIL_RE } from "@/lib/site/format";

function Newsletter() {
  const [email, setEmail] = useState("");
  const [company, setCompany] = useState("");
  const [err, setErr] = useState("");
  const [done, setDone] = useState<null | { duplicate: boolean }>(null);
  const [pending, start] = useTransition();

  if (done)
    return (
      <div role="status" className="flex flex-col gap-2">
        <strong className="text-[17px]">{done.duplicate ? "✓ 這個 Email 已經在訂閱名單裡了！" : "✓ 感謝訂閱！"}</strong>
        <span className="text-[13px] text-on-forest-muted">（電子報寄送服務尚未串接，目前不會寄出確認信；開通後會寄到這個 Email。）</span>
        <button
          type="button"
          onClick={() => {
            setDone(null);
            setEmail("");
          }}
          className="min-h-11 cursor-pointer self-start border-0 bg-transparent p-0 text-[13px] text-paper underline"
        >
          重新填寫
        </button>
      </div>
    );

  return (
    <form
      noValidate
      className="flex flex-col gap-2"
      onSubmit={(e) => {
        e.preventDefault();
        const v = email.trim();
        if (!EMAIL_RE.test(v)) return setErr(v ? "Email 格式不正確" : "請輸入 Email");
        start(async () => {
          const started = Date.now();
          const r = await subscribeNewsletter({ email: v, company });
          const wait = 800 - (Date.now() - started);
          if (wait > 0) await new Promise((res) => setTimeout(res, wait));
          if (r.ok) setDone({ duplicate: r.duplicate });
          else setErr(r.error);
        });
      }}
    >
      <div className="flex flex-wrap gap-2">
        <input
          type="email"
          inputMode="email"
          autoComplete="email"
          enterKeyHint="send"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            setErr("");
          }}
          placeholder="你的 Email"
          aria-label="Email"
          aria-invalid={!!err}
          aria-describedby={err ? "nl-err" : undefined}
          className={`h-[52px] min-w-0 flex-[1_1_220px] rounded-ctl border bg-paper px-4 text-[16px] text-ink ${err ? "border-error-soft" : "border-paper"}`}
        />
        <input
          tabIndex={-1}
          autoComplete="off"
          aria-hidden="true"
          name="company"
          value={company}
          onChange={(e) => setCompany(e.target.value)}
          className="absolute -left-[9999px] h-px w-px opacity-0"
        />
        <button
          type="submit"
          disabled={pending}
          className="h-[52px] flex-[1_0_auto] cursor-pointer rounded-ctl border-0 bg-tangerine px-7 font-bold text-ink hover:bg-tangerine-light sm:flex-none"
        >
          {pending ? "送出中…" : "訂閱"}
        </button>
      </div>
      {err ? (
        <span id="nl-err" role="alert" className="text-[13px] text-error-soft">
          {err}
        </span>
      ) : null}
      <span className="text-[12px] text-on-forest-muted">電子報寄送服務尚未串接：Email 會保存在訂閱名單，開通後才會寄送。</span>
    </form>
  );
}

const linkCls = "inline-flex min-h-11 items-center hover:text-white hover:underline nav:min-h-0";

export function Footer() {
  const { catalog } = useSite();
  return (
    <footer className="mt-[clamp(56px,8vw,112px)] bg-forest text-paper [&_a:hover]:text-white">
      <div className="container-tugo grid grid-cols-[repeat(auto-fit,minmax(min(100%,380px),1fr))] items-end gap-x-[72px] gap-y-8 border-b border-on-forest-line pb-[clamp(32px,5vw,56px)] pt-[clamp(40px,6vw,80px)]">
        <div className="flex flex-col gap-2.5">
          <span className="font-mono text-[11px] font-medium leading-[1.4] tracking-[.16em] text-on-forest-muted">NEWSLETTER</span>
          <h2 className="m-0 font-serif text-[clamp(26px,3vw,38px)] font-bold leading-[1.3]">新作品上架時，第一個告訴你。</h2>
        </div>
        <div className="relative">
          <Newsletter />
        </div>
      </div>
      <div className="container-tugo grid grid-cols-2 gap-8 py-[clamp(32px,5vw,56px)] min-[560px]:grid-cols-[repeat(auto-fit,minmax(160px,1fr))]">
        <div className="col-span-2 flex min-w-[min(100%,260px)] flex-col gap-3">
          <span className="flex items-center gap-2.5">
            <Logo light />
            <span className="font-serif text-[20px] font-bold leading-[1.1] tracking-[.06em]">圖個有意思</span>
          </span>
          <span className="font-mono text-[10px] font-medium leading-[1.4] tracking-[.24em] text-on-forest-muted">TUGO STUDIO（暫定名稱）</span>
          <p className="m-0 max-w-[24em] text-[13px] text-on-forest-body">新銳藝術家 × 原創周邊商品。讓好作品不只被看見，也能被收藏、穿戴與使用。</p>
          <span className="text-[13px] text-on-forest-body">hello@tugo.studio ・ Instagram @tugo.studio（皆為示意，尚未啟用）</span>
        </div>
        <nav aria-label="逛商品" className="flex flex-col gap-0 text-[14px] nav:gap-2">
          <span className="mb-1.5 font-mono text-[11px] font-medium leading-none tracking-[.14em] text-on-forest-muted">SHOP</span>
          <Link href="/new" className={linkCls}>
            新品上市
          </Link>
          {catalog.categories.map((c) => (
            <Link key={c.id} href={`/shop/${c.id}`} className={linkCls}>
              {c.name}
            </Link>
          ))}
        </nav>
        <nav aria-label="關於" className="flex flex-col gap-0 text-[14px] nav:gap-2">
          <span className="mb-1.5 font-mono text-[11px] font-medium leading-none tracking-[.14em] text-on-forest-muted">ABOUT</span>
          <Link href="/artists" className={linkCls}>
            認識藝術家
          </Link>
          <Link href="/collections" className={linkCls}>
            聯名企劃
          </Link>
          <Link href="/about" className={linkCls}>
            關於我們
          </Link>
          <Link href="/collaborate" className={linkCls}>
            藝術家合作
          </Link>
        </nav>
        <nav aria-label="客服" className="flex flex-col gap-0 text-[14px] nav:gap-2">
          <span className="mb-1.5 font-mono text-[11px] font-medium leading-none tracking-[.14em] text-on-forest-muted">HELP</span>
          <Link href="/faq" className={linkCls}>
            常見問題
          </Link>
          <Link href="/shipping" className={linkCls}>
            配送說明
          </Link>
          <Link href="/returns" className={linkCls}>
            退換貨政策
          </Link>
          <Link href="/privacy" className={linkCls}>
            隱私權政策
          </Link>
          <Link href="/terms" className={linkCls}>
            服務條款
          </Link>
        </nav>
      </div>
      <div className="container-tugo flex flex-wrap justify-between gap-3 border-t border-on-forest-line pb-[calc(24px+var(--bottom-bar,0px)+env(safe-area-inset-bottom))] pt-4 text-[12px] text-on-forest-muted">
        <span>© 2026 圖個有意思 TUGO STUDIO ・ Demo 示意網站</span>
        <span>所有作品著作權屬原創作者所有</span>
      </div>
    </footer>
  );
}
