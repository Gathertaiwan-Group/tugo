"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { reloadIfCurrentPage } from "@/components/admin/reloadIfCurrentPage";

type AssistantLink = { label: string; href: string };
type Message = { role: "user" | "model"; text: string; source?: "gemini" | "safe_report"; links?: AssistantLink[]; error?: boolean };

const QUICK_PROMPTS = ["整理本月營運概況", "目前待出貨訂單", "熱銷商品與低庫存", "待處理合作申請"];
const WELCOME: Message = {
  role: "model",
  text: "我是後台 AI 資料小幫手。可以問訂單、出貨、熱銷商品、庫存、合作申請與回訪狀況，我只會讀取與整理資料，不會修改任何資料。",
};

export default function AdminAiAssistant() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([WELCOME]);
  const [query, setQuery] = useState("");
  const [busy, setBusy] = useState(false);
  const [includeDemo, setIncludeDemo] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const logRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) requestAnimationFrame(() => inputRef.current?.focus());
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        buttonRef.current?.focus();
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open]);

  useEffect(() => {
    logRef.current?.scrollTo({ top: logRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, busy]);

  function close() {
    setOpen(false);
    requestAnimationFrame(() => buttonRef.current?.focus());
  }

  async function ask(text: string) {
    const trimmed = text.trim().slice(0, 600);
    if (!trimmed || busy) return;
    const history = messages
      .slice(1) // 不送歡迎訊息
      .filter((m) => !m.error)
      .slice(-8)
      .map(({ role, text: t }) => ({ role, text: t.slice(0, 1000) }));
    setMessages((m) => [...m, { role: "user", text: trimmed }]);
    setQuery("");
    setBusy(true);
    try {
      const res = await fetch("/api/admin/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: trimmed, history, includeDemo }),
        cache: "no-store",
      });
      const data = (await res.json().catch(() => ({}))) as { ok?: boolean; reply?: string; source?: "gemini" | "safe_report"; links?: AssistantLink[]; error?: string };
      if (!res.ok || !data.ok || !data.reply) throw new Error(data.error ?? "assistant_failed");
      setMessages((m) => [...m, { role: "model", text: data.reply!, source: data.source ?? "safe_report", links: data.links ?? [] }]);
    } catch (e) {
      const unauthorized = e instanceof Error && e.message === "unauthorized";
      setMessages((m) => [
        ...m,
        { role: "model", text: unauthorized ? "登入已失效，請重新登入。" : "目前無法取得報表，請稍後再試一次。既有資料不會受到影響。", error: true },
      ]);
    } finally {
      setBusy(false);
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        className="adm-ai-fab no-print"
        aria-label={open ? "關閉 AI 小幫手" : "開啟 AI 小幫手"}
        aria-expanded={open}
        aria-controls="admin-ai-panel"
        onClick={() => setOpen((v) => !v)}
      >
        <span aria-hidden="true">AI</span>
        <i aria-hidden="true" />
      </button>

      <section
        id="admin-ai-panel"
        className="adm-ai-panel no-print"
        data-open={open ? "true" : "false"}
        role="dialog"
        aria-modal="false"
        aria-labelledby="admin-ai-title"
        aria-hidden={!open}
      >
        <header className="adm-ai-head">
          <div>
            <h2 id="admin-ai-title">AI 資料小幫手</h2>
            <p>只讀分析 · {includeDemo ? "含示意資料" : "真實資料"}</p>
          </div>
          <button type="button" onClick={close} aria-label="關閉 AI 小幫手">
            ×
          </button>
        </header>
        <div style={{ padding: "8px 14px", borderBottom: "1px solid var(--color-line-card)" }}>
          <label className="adm-check adm-small">
            <input type="checkbox" checked={includeDemo} onChange={(e) => setIncludeDemo(e.target.checked)} tabIndex={open ? 0 : -1} />
            含示意資料（is_demo）
          </label>
        </div>

        <div className="adm-ai-log" ref={logRef} aria-live="polite">
          {messages.map((m, i) => (
            <article key={i} className="adm-ai-msg" data-role={m.role} data-error={m.error ? "true" : "false"}>
              <p>{m.text}</p>
              {m.role === "model" && m.source && i > 0 && <small>{m.source === "gemini" ? "AI 分析 · 依後台資料快照" : "安全報表 · 由白名單資料生成"}</small>}
              {!!m.links?.length && (
                <nav aria-label="相關資料">
                  {m.links.map((l) => (
                    <Link
                      key={l.href + l.label}
                      href={l.href}
                      tabIndex={open ? 0 : -1}
                      onClick={(e) => {
                        close();
                        reloadIfCurrentPage(e, l.href, pathname);
                      }}
                    >
                      {l.label}
                    </Link>
                  ))}
                </nav>
              )}
            </article>
          ))}
          {busy && (
            <div className="adm-small adm-muted" role="status">
              正在整理資料…
            </div>
          )}
        </div>

        {messages.length === 1 && (
          <div className="adm-ai-quick" aria-label="快速提問">
            {QUICK_PROMPTS.map((p) => (
              <button key={p} type="button" onClick={() => void ask(p)} disabled={busy} tabIndex={open ? 0 : -1}>
                {p}
              </button>
            ))}
          </div>
        )}

        <form
          className="adm-ai-form"
          onSubmit={(e) => {
            e.preventDefault();
            void ask(query);
          }}
        >
          <label htmlFor="admin-ai-query" className="adm-sr">
            詢問營運資料
          </label>
          <div>
            <input
              ref={inputRef}
              id="admin-ai-query"
              className="adm-input"
              value={query}
              maxLength={600}
              autoComplete="off"
              placeholder="例如：本週有哪些訂單還沒出貨？"
              onChange={(e) => setQuery(e.target.value)}
              disabled={busy}
              tabIndex={open ? 0 : -1}
            />
            <button type="submit" className="adm-btn adm-btn--primary" disabled={busy || !query.trim()} tabIndex={open ? 0 : -1}>
              送出
            </button>
          </div>
          <p>只會查詢與整理資料，不會直接修改資料。</p>
        </form>
      </section>
    </>
  );
}
