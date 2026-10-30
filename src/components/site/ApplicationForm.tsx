"use client";
import Link from "next/link";
import { useState, useTransition } from "react";
import { Field, FormErrorSummary, Honeypot, inputCls, textareaCls } from "./form";
import { submitApplication, type ApplicationInput } from "@/lib/site/actions";
import { DISCIPLINES, EMAIL_RE, URL_RE } from "@/lib/site/format";

const EMPTY: ApplicationInput = { name: "", email: "", url: "", type: "", bio: "", idea: "", consent: false, privacy: false };

export function ApplicationForm() {
  const [f, setF] = useState<ApplicationInput>(EMPTY);
  const [company, setCompany] = useState("");
  const [err, setErr] = useState<Record<string, string>>({});
  const [serverErr, setServerErr] = useState("");
  const [done, setDone] = useState<null | { name: string; duplicate: boolean }>(null);
  const [pending, start] = useTransition();

  const set = <K extends keyof ApplicationInput>(k: K, v: ApplicationInput[K]) => {
    setF((p) => ({ ...p, [k]: v }));
    setErr((e) => ({ ...e, [k]: "" }));
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const x: Record<string, string> = {};
    if (!f.name.trim()) x.name = "請填寫姓名或藝名";
    if (!EMAIL_RE.test(f.email.trim())) x.email = f.email ? "Email 格式不正確" : "請填寫 Email";
    if (!URL_RE.test(f.url.trim())) x.url = f.url ? "請輸入完整網址（含 https://）" : "請提供 IG 或作品集網址";
    if (!f.type) x.type = "請選擇創作類型";
    if (f.bio.trim().length < 20) x.bio = `請至少寫 20 字（目前 ${f.bio.trim().length} 字）`;
    if (!f.consent) x.consent = "請確認作品授權聲明";
    if (!f.privacy) x.privacy = "請同意個資蒐集告知";
    setServerErr("");
    if (Object.keys(x).length) {
      setErr(x);
      return;
    }
    setErr({});
    start(async () => {
      const r = await submitApplication({ ...f, company });
      if (r.ok) setDone({ name: f.name.trim(), duplicate: r.duplicate });
      else if (r.errors) setErr(r.errors);
      else setServerErr(r.error ?? "系統忙碌中，請稍後再試。");
    });
  };

  if (done)
    return (
      <div role="status" className="flex animate-[tugoIn_.3s_ease] flex-col gap-3.5">
        <span className="grid h-12 w-12 place-items-center rounded-full bg-forest text-[22px] text-paper">✓</span>
        <h2 className="m-0 font-serif text-[26px] font-bold leading-[1.3]">謝謝你，{done.name}！</h2>
        <p className="m-0 text-[15px] text-body2">
          申請資料已送出並保存。{done.duplicate ? "我們之前也收過這個 Email 的申請，這次的內容會一併評估。" : ""}
          團隊會在初審完成後以 Email 與你聯繫（審核時程將另行通知）。
        </p>
        <button
          type="button"
          onClick={() => {
            setF(EMPTY);
            setDone(null);
          }}
          className="h-11 cursor-pointer self-start rounded-ctl border border-ink bg-transparent px-5"
        >
          再填一份
        </button>
      </div>
    );

  const hasErrors = Object.values(err).some(Boolean);
  return (
    <form noValidate onSubmit={submit} className="relative flex flex-col gap-[18px]">
      <div className="flex flex-col gap-1">
        <h2 className="m-0 font-serif text-[26px] font-bold leading-[1.3]">合作申請表</h2>
        <span className="text-[13px] text-muted">標示 * 為必填。資料僅用於合作評估與聯繫。</span>
      </div>
      {hasErrors ? <FormErrorSummary>有欄位尚未完成，請檢查下方紅字提示。</FormErrorSummary> : null}
      {serverErr ? <FormErrorSummary>{serverErr}</FormErrorSummary> : null}
      <Honeypot value={company} onChange={setCompany} />
      <div className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-[18px]">
        <Field label="姓名／藝名 *" err={err.name}>
          {(a) => <input {...a} value={f.name} onChange={(e) => set("name", e.target.value)} autoComplete="name" className={inputCls(err.name)} />}
        </Field>
        <Field label="Email *" err={err.email}>
          {(a) => (
            <input
              {...a}
              type="email"
              inputMode="email"
              autoComplete="email"
              autoCapitalize="off"
              spellCheck={false}
              value={f.email}
              onChange={(e) => set("email", e.target.value)}
              className={inputCls(err.email)}
            />
          )}
        </Field>
      </div>
      <Field label="IG／作品集網址 *" err={err.url}>
        {(a) => (
          <input
            {...a}
            type="url"
            inputMode="url"
            autoComplete="url"
            autoCapitalize="off"
            spellCheck={false}
            placeholder="https://"
            value={f.url}
            onChange={(e) => set("url", e.target.value)}
            className={inputCls(err.url)}
          />
        )}
      </Field>
      <Field label="創作類型 *" err={err.type}>
        {(a) => (
          <select {...a} value={f.type} onChange={(e) => set("type", e.target.value)} className={`${inputCls(err.type)} px-3`}>
            <option value="">請選擇</option>
            {DISCIPLINES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        )}
      </Field>
      <Field label="創作簡介 *" err={err.bio} extra={<span className="font-mono font-normal text-muted">{f.bio.trim().length} 字</span>}>
        {(a) => (
          <textarea
            {...a}
            rows={4}
            value={f.bio}
            onChange={(e) => set("bio", e.target.value)}
            placeholder="介紹你的創作主題、風格與經歷（至少 20 字）"
            className={textareaCls(err.bio)}
          />
        )}
      </Field>
      <Field label="合作想法（選填）">
        {(a) => <textarea {...a} rows={3} value={f.idea} onChange={(e) => set("idea", e.target.value)} placeholder="想做的品項、主題，或任何想法" className={textareaCls()} />}
      </Field>
      <label className="flex min-h-11 cursor-pointer items-start gap-2.5 py-1 text-[13px]">
        <input type="checkbox" checked={f.consent} onChange={(e) => set("consent", e.target.checked)} aria-invalid={!!err.consent} className="mt-0.5 h-5 w-5 shrink-0 accent-forest" />
        <span>
          我確認所提供之作品為本人原創或已取得合法授權，並了解合作條件以正式合約為準。*
          {err.consent ? <span className="block text-error">{err.consent}</span> : null}
        </span>
      </label>
      <label className="flex min-h-11 cursor-pointer items-start gap-2.5 py-1 text-[13px]">
        <input type="checkbox" checked={f.privacy} onChange={(e) => set("privacy", e.target.checked)} aria-invalid={!!err.privacy} className="mt-0.5 h-5 w-5 shrink-0 accent-forest" />
        <span>
          我已閱讀並同意{" "}
          <Link href="/privacy" className="underline">
            個人資料蒐集告知
          </Link>
          ，資料僅用於合作評估與聯繫。*
          {err.privacy ? <span className="block text-error">{err.privacy}</span> : null}
        </span>
      </label>
      <button type="submit" disabled={pending} className="h-[52px] cursor-pointer rounded-ctl border-0 bg-forest text-[15px] font-medium text-paper hover:bg-forest-dark disabled:opacity-80">
        {pending ? "送出中…" : "送出申請"}
      </button>
    </form>
  );
}
