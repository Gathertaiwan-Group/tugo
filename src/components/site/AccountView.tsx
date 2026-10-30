"use client";
import Link from "next/link";
import { useState } from "react";
import { useSite } from "./SiteProvider";
import { ProductCard } from "./ProductCard";
import { Field, inputCls } from "./form";
import { EMAIL_RE } from "@/lib/site/format";

/** /account：會員系統（Supabase Auth）尚未串接，維持原型的示意流程；收藏存在本機 localStorage。 */
export function AccountView() {
  const { favs, productById } = useSite();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [err, setErr] = useState<Record<string, string>>({});
  const [done, setDone] = useState(false);
  const isLogin = mode === "login";
  const favList = favs.map((id) => productById.get(id)).filter((p): p is NonNullable<typeof p> => !!p);

  return (
    <section className="container-tugo-1100 grid grid-cols-[repeat(auto-fit,minmax(min(100%,380px),1fr))] items-start gap-[clamp(32px,5vw,64px)] py-[clamp(28px,6vw,96px)]">
      <div className="rounded-panel border border-line-card bg-card p-[clamp(20px,4vw,40px)]">
        {done ? (
          <div role="status" className="flex flex-col gap-3">
            <h1 className="m-0 font-serif text-[26px] font-bold leading-[1.3]">介面驗證完成</h1>
            <p className="m-0 text-[15px] text-body2">
              會員系統尚待串接：<strong>沒有建立帳號，也沒有登入。</strong>正式版將串接會員服務（例如 Email 驗證、第三方登入）。
            </p>
            <button type="button" onClick={() => setDone(false)} className="h-11 cursor-pointer self-start rounded-ctl border border-ink bg-transparent px-[18px]">
              返回
            </button>
          </div>
        ) : (
          <form
            noValidate
            className="flex flex-col gap-4"
            onSubmit={(e) => {
              e.preventDefault();
              const x: Record<string, string> = {};
              if (!EMAIL_RE.test(email.trim())) x.email = "請輸入有效的 Email";
              if (pw.length < 8) x.pw = "密碼至少 8 碼";
              setErr(x);
              if (!Object.keys(x).length) setDone(true);
            }}
          >
            <span className="font-mono text-[11px] font-medium leading-none tracking-[.14em] text-muted">ACCOUNT ・ 會員系統待串接</span>
            <h1 className="m-0 font-serif text-[30px] font-bold leading-[1.3]">{isLogin ? "會員登入" : "建立帳號"}</h1>
            <Field label="Email" err={err.email}>
              {(a) => (
                <input
                  {...a}
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  autoCapitalize="off"
                  spellCheck={false}
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setErr((x) => ({ ...x, email: "" }));
                  }}
                  className={inputCls(err.email)}
                />
              )}
            </Field>
            <Field label="密碼" err={err.pw}>
              {(a) => (
                <input
                  {...a}
                  type="password"
                  autoComplete={isLogin ? "current-password" : "new-password"}
                  value={pw}
                  onChange={(e) => {
                    setPw(e.target.value);
                    setErr((x) => ({ ...x, pw: "" }));
                  }}
                  className={inputCls(err.pw)}
                />
              )}
            </Field>
            <button type="submit" className="h-[50px] cursor-pointer rounded-ctl border-0 bg-forest font-medium text-paper hover:bg-forest-dark">
              {isLogin ? "登入（Demo）" : "註冊（Demo）"}
            </button>
            <button
              type="button"
              onClick={() => {
                setMode(isLogin ? "register" : "login");
                setErr({});
              }}
              className="min-h-11 cursor-pointer border-0 bg-transparent text-[13px] text-forest underline"
            >
              {isLogin ? "還沒有帳號？建立帳號" : "已有帳號？登入"}
            </button>
          </form>
        )}
      </div>
      <div className="flex flex-col gap-4">
        <h2 className="m-0 font-serif text-[22px] font-bold leading-[1.3]">
          我的收藏 <span className="font-mono text-[13px] font-normal text-muted">{favList.length} 件</span>
        </h2>
        {favList.length ? (
          <div className="grid grid-cols-[repeat(auto-fill,minmax(min(46%,160px),1fr))] gap-4">
            {favList.map((p) => (
              <ProductCard key={p.id} item={p} />
            ))}
          </div>
        ) : (
          <div className="rounded-card border border-dashed border-line-field px-5 py-8 text-center text-[14px] text-muted">
            還沒有收藏。逛商品時點 ♡ 就能收進這裡（收藏保存在這台裝置的瀏覽器中）。
            <br />
            <Link href="/shop" className="inline-flex min-h-11 items-center font-medium text-forest">
              去逛逛 →
            </Link>
          </div>
        )}
        <h2 className="m-0 mt-4 font-serif text-[22px] font-bold leading-[1.3]">訂單紀錄</h2>
        <div className="rounded-card border border-dashed border-line-field px-5 py-6 text-[14px] text-muted">尚無訂單。訂單查詢功能將於串接金流與會員系統後開放。</div>
      </div>
    </section>
  );
}
