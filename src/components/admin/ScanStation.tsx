"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { STATIONS, STATION_LABELS, type StationKey } from "@/lib/admin/barcode";
import { FULFILLMENT_LABELS, fmtClock } from "@/lib/admin/format";

export type RecentScan = { id: number; station: string; adminName: string | null; at: string; orderNo: string | null; name: string | null };

const STORAGE_KEY = "tugo_admin_scan_default_station";
const DEDUPE_MS = 1500; // 同一 raw 在 1.5 秒內重送 → 掃描槍 double-read，安靜忽略
const IDLE_SUBMIT_MS = 120; // 沒有 Enter/Tab 的掃描槍：停止輸入 120ms 且長度足夠就送出
const MIN_IDLE_LEN = 14;

type RowStatus = "pending" | "ok" | "duplicate" | "err";
type Row = { id: string; raw: string; status: RowStatus; at: string; main?: string; note?: string };

const ERRORS: Record<string, string> = {
  order_not_found: "查無訂單",
  demo_read_only: "示意訂單，僅供檢視",
  order_cancelled: "訂單已取消／退款，不可出貨",
  bad_payload: "格式錯誤（請掃訂單條碼或輸入 TG 開頭訂單號）",
  rate_limited: "掃描過快，請稍候再試",
  unauthorized: "登入逾期，請重新整理頁面",
  bad_origin: "請求被拒絕",
};

function vibrate(p: number | number[]) {
  try {
    (navigator as Navigator & { vibrate?: (p: number | number[]) => boolean }).vibrate?.(p);
  } catch {
    /* iOS 無 Vibration API */
  }
}

export default function ScanStation({ adminLabel, initialRecent }: { adminLabel: string; initialRecent: RecentScan[] }) {
  const [rows, setRows] = useState<Row[]>(() =>
    initialRecent.map((r) => ({
      id: `i${r.id}`,
      raw: r.orderNo ?? "",
      status: "ok" as const,
      at: r.at,
      main: `${r.orderNo ?? "—"}${r.name ? ` · ${r.name}` : ""} · ${STATION_LABELS[r.station as StationKey] ?? r.station}`,
      note: r.adminName ? `由 ${r.adminName}` : "已記錄",
    }))
  );
  const [value, setValue] = useState("");
  const [manual, setManual] = useState(false);
  const [station, setStation] = useState<StationKey>("picking");
  const inputRef = useRef<HTMLInputElement>(null);
  const manualRef = useRef(false);
  const stationRef = useRef<StationKey>("picking");
  const idleRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastRef = useRef<{ raw: string; at: number } | null>(null);
  const audioRef = useRef<AudioContext | null>(null);
  const seqRef = useRef(0);
  const unmountedRef = useRef(false);

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY);
      if (saved && (STATIONS as string[]).includes(saved)) {
        setStation(saved as StationKey);
        stationRef.current = saved as StationKey;
      }
    } catch {
      /* 私密模式 */
    }
  }, []);

  function choose(s: StationKey) {
    setStation(s);
    stationRef.current = s;
    try {
      window.localStorage.setItem(STORAGE_KEY, s);
    } catch {
      /* ignore */
    }
  }

  // 掃描槍就是鍵盤：輸入框隨時要在焦點上（手動模式不搶）
  const refocus = useCallback(() => {
    if (!manualRef.current) inputRef.current?.focus();
  }, []);
  useEffect(() => {
    refocus();
    const onVis = () => document.visibilityState === "visible" && refocus();
    window.addEventListener("focus", refocus);
    document.addEventListener("visibilitychange", onVis);
    const t = setInterval(refocus, 1000);
    return () => {
      window.removeEventListener("focus", refocus);
      document.removeEventListener("visibilitychange", onVis);
      clearInterval(t);
    };
  }, [refocus]);

  useEffect(() => {
    unmountedRef.current = false;
    return () => {
      unmountedRef.current = true;
      if (idleRef.current) clearTimeout(idleRef.current);
      const ctx = audioRef.current;
      audioRef.current = null;
      try {
        ctx?.close().catch(() => {});
      } catch {
        /* ignore */
      }
    };
  }, []);

  function beep(freq: number, when = 0) {
    if (unmountedRef.current) return;
    if (!audioRef.current) {
      const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!Ctx) return;
      audioRef.current = new Ctx();
    }
    const ctx = audioRef.current;
    const t0 = ctx.currentTime + when;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.frequency.value = freq;
    osc.connect(gain);
    gain.connect(ctx.destination);
    gain.gain.setValueAtTime(0.0001, t0);
    gain.gain.exponentialRampToValueAtTime(0.3, t0 + 0.005);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.12);
    osc.start(t0);
    osc.stop(t0 + 0.14);
  }
  const success = () => {
    beep(880);
    vibrate(30);
  };
  const failure = () => {
    beep(220);
    beep(220, 0.16);
    vibrate([40, 60, 40]);
  };

  const submit = useCallback((input: string) => {
    const raw = input.trim();
    if (!raw) return;
    const now = Date.now();
    const last = lastRef.current;
    setValue("");
    requestAnimationFrame(refocus);
    if (last && last.raw === raw && now - last.at < DEDUPE_MS) return;
    lastRef.current = { raw, at: now };
    const id = `r${++seqRef.current}`;
    setRows((rs): Row[] => [{ id, raw, status: "pending" as const, at: new Date().toISOString() }, ...rs].slice(0, 100));
    fetch("/api/admin/scan", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ raw, fallbackStation: stationRef.current }),
    })
      .then(async (res) => {
        const d = (await res.json().catch(() => ({}))) as Record<string, unknown>;
        if (res.ok && d.ok) {
          success(); // 重複掃描也算成功（照樣記錄），用琥珀色提示即可
          const o = (d.order ?? {}) as { order_no?: string; recipient_name?: string };
          const dup = Boolean(d.duplicate);
          const f = typeof d.fulfillment === "string" ? ` → ${FULFILLMENT_LABELS[d.fulfillment] ?? d.fulfillment}` : "";
          setRows((rs) =>
            rs.map((r) =>
              r.id === id
                ? {
                    ...r,
                    status: dup ? "duplicate" : "ok",
                    main: `${o.order_no ?? raw}${o.recipient_name ? ` · ${o.recipient_name}` : ""} · ${String(d.stationLabel ?? "")}`,
                    note: dup
                      ? `重複掃描（首次 ${fmtClock(d.firstAt as string)}${d.firstAdminName ? ` · ${String(d.firstAdminName)}` : ""}）${f}`
                      : `已記錄${f}`,
                  }
                : r
            )
          );
        } else {
          failure();
          const err = typeof d.error === "string" ? d.error : "";
          const note = (typeof d.message === "string" && d.message) || ERRORS[err] || (res.status >= 500 ? "系統錯誤，請重試" : "發生錯誤，請重試");
          setRows((rs) => rs.map((r) => (r.id === id ? { ...r, status: "err", main: raw, note } : r)));
        }
      })
      .catch(() => {
        failure();
        setRows((rs) => rs.map((r) => (r.id === id ? { ...r, status: "err", main: raw, note: "網路錯誤，請檢查連線後重試" } : r)));
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function onChange(e: React.ChangeEvent<HTMLInputElement>) {
    const v = e.target.value;
    setValue(v);
    if (idleRef.current) clearTimeout(idleRef.current);
    idleRef.current = setTimeout(() => {
      idleRef.current = null;
      if (!manualRef.current && v.trim().length >= MIN_IDLE_LEN) submit(v);
    }, IDLE_SUBMIT_MS);
  }
  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" || e.key === "Tab") {
      e.preventDefault();
      if (idleRef.current) clearTimeout(idleRef.current);
      idleRef.current = null;
      submit(value);
    }
  }
  function toggleManual() {
    const next = !manualRef.current;
    manualRef.current = next;
    setManual(next);
    if (!next) requestAnimationFrame(() => inputRef.current?.focus());
  }
  async function logout() {
    await fetch("/api/admin/login", { method: "DELETE" }).catch(() => {});
    window.location.replace("/admin/login");
  }

  return (
    <div className="scan-page">
      <header className="scan-header">
        <Link href="/admin/orders">← 後台</Link>
        <span className="who">{adminLabel}</span>
        <button type="button" className="adm-btn adm-btn--sm" style={{ color: "var(--color-paper)", borderColor: "rgba(244,239,229,.4)" }} onClick={logout}>
          登出
        </button>
      </header>
      <main className="scan-body">
        <h1 className="adm-h1" style={{ marginBottom: 10 }}>
          出貨掃描站
        </h1>
        <div className="scan-stations" role="group" aria-label="預設站別">
          {STATIONS.map((s) => (
            <button key={s} type="button" data-active={s === station ? "true" : "false"} aria-pressed={s === station} onClick={() => choose(s)}>
              {STATION_LABELS[s]}
            </button>
          ))}
        </div>
        <p className="adm-small adm-muted" style={{ margin: "8px 0 0" }}>
          掃到訂單條碼／輸入訂單號時記到：<strong>{STATION_LABELS[station]}</strong>（揀貨單上的站別條碼以條碼為準）
        </p>
        <div className="scan-input-row">
          <input
            ref={inputRef}
            className="scan-input"
            value={value}
            onChange={onChange}
            onKeyDown={onKeyDown}
            onBlur={() => requestAnimationFrame(refocus)}
            inputMode={manual ? "text" : "none"}
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="characters"
            spellCheck={false}
            placeholder={manual ? "輸入訂單號，例 TG20261031-00001" : "請對準條碼掃描…"}
            aria-label="掃描輸入"
          />
          <button type="button" className="adm-btn" onClick={toggleManual}>
            {manual ? "改用掃描槍" : "⌨ 手動"}
          </button>
        </div>
        <div aria-live="polite">
          {rows.length === 0 ? (
            <div className="adm-empty">尚無掃描紀錄</div>
          ) : (
            rows.map((r) => (
              <div key={r.id} className="scan-row" data-status={r.status}>
                <span className="t">{fmtClock(r.at)}</span>
                <span>{r.status === "pending" ? r.raw : r.main}</span>
                <span className="n">{r.status === "pending" ? "處理中…" : r.note}</span>
              </div>
            ))
          )}
        </div>
      </main>
    </div>
  );
}
