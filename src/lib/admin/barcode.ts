/**
 * 出貨條碼 codec —— Code 128 Subset C。純函式、零依賴（移植自 Nina lib/workOrder/barcode.ts，pattern 表原封不動）。
 *
 * payload 固定 14 碼純數字：日期 8 碼(YYYYMMDD) + 當日流水 5 碼 + 站別 1 碼（Code128-C 需偶數長度）。
 * 訂單編號格式 TG20261031-00001（由 DB trigger tugo.gen_order_no 產生；每日上限 99999 張）。
 * 站別：1 揀貨 picking / 2 包裝 packed / 3 出貨 shipped / 4 送達 delivered。
 * 模組載入時對 pattern 表自檢，打錯會在 import 階段直接拋錯，而不是等到現場掃不到。
 */

export type StationKey = "picking" | "packed" | "shipped" | "delivered";

export const STATION_LABELS: Record<StationKey, string> = {
  picking: "揀貨",
  packed: "包裝完成",
  shipped: "交寄物流",
  delivered: "已送達",
};
export const STATIONS: StationKey[] = ["picking", "packed", "shipped", "delivered"];
const STATION_DIGIT: Record<StationKey, string> = { picking: "1", packed: "2", shipped: "3", delivered: "4" };

export const ORDER_NO_RE = /^TG(\d{8})-(\d{5})$/;

// --- Code128 標準 symbol pattern 表（索引 = symbol 值 0..106；來源 JsBarcode MIT，見 Nina 原檔說明）---
const PATTERNS: string[] = [
  "212222", "222122", "222221", "121223", "121322", "131222", "122213", "122312", "132212", "221213",
  "221312", "231212", "112232", "122132", "122231", "113222", "123122", "123221", "223211", "221132",
  "221231", "213212", "223112", "312131", "311222", "321122", "321221", "312212", "322112", "322211",
  "212123", "212321", "232121", "111323", "131123", "131321", "112313", "132113", "132311", "211313",
  "231113", "231311", "112133", "112331", "132131", "113123", "113321", "133121", "313121", "211331",
  "231131", "213113", "213311", "213131", "311123", "311321", "331121", "312113", "312311", "332111",
  "314111", "221411", "431111", "111224", "111422", "121124", "121421", "141122", "141221", "112214",
  "112412", "122114", "122411", "142112", "142211", "241211", "221114", "413111", "241112", "134111",
  "111242", "121142", "121241", "114212", "124112", "124211", "411212", "421112", "421211", "212141",
  "214121", "412121", "111143", "111341", "131141", "114113", "114311", "411113", "411311", "113141",
  "114131", "311141", "411131", "211412", "211214", "211232", "2331112",
];

const START_C = 105;
const STOP = 106;

if (PATTERNS.length !== 107) throw new Error(`code128 PATTERNS 長度應為 107，實際 ${PATTERNS.length}`);
for (let i = 0; i < 106; i++) {
  const p = PATTERNS[i];
  const sum = p.split("").reduce((a, c) => a + Number(c), 0);
  if (p.length !== 6 || sum !== 11) throw new Error(`code128 PATTERNS[${i}] 格式錯誤："${p}"`);
}
if (PATTERNS[STOP] !== "2331112") throw new Error("code128 STOP pattern 錯誤");

export function isStation(v: unknown): v is StationKey {
  return typeof v === "string" && (STATIONS as string[]).includes(v);
}

/** order_no + 站別 → 14 碼 payload；格式不符回 null（呼叫端顯示「條碼不可用」）。 */
export function encodeBarcode(orderNo: string, station: StationKey): { payload: string; caption: string } | null {
  const m = ORDER_NO_RE.exec(orderNo);
  if (!m) return null;
  return { payload: `${m[1]}${m[2]}${STATION_DIGIT[station]}`, caption: `${orderNo} · ${STATION_LABELS[station]}` };
}

/** 訂單本身（不帶站別）的條碼：13 碼補 0 成 14 碼，站別碼 0 = 無站別（掃到時用預設站別）。 */
export function encodeOrderBarcode(orderNo: string): { payload: string; caption: string } | null {
  const m = ORDER_NO_RE.exec(orderNo);
  if (!m) return null;
  return { payload: `${m[1]}${m[2]}0`, caption: orderNo };
}

/** 14 碼 payload → order_no + 站別（站別碼 0 → null）。格式不符回 null。 */
export function decodeBarcode(payload: string): { orderNo: string; station: StationKey | null } | null {
  if (!/^\d{14}$/.test(payload)) return null;
  const date8 = payload.slice(0, 8);
  const serial = payload.slice(8, 13);
  const d = payload[13];
  if (d === "0") return { orderNo: `TG${date8}-${serial}`, station: null };
  const station = STATIONS.find((k) => STATION_DIGIT[k] === d);
  if (!station) return null;
  return { orderNo: `TG${date8}-${serial}`, station };
}

export function code128cChecksum(pairs: number[]): number {
  let sum = START_C;
  pairs.forEach((v, idx) => {
    sum += v * (idx + 1);
  });
  return sum % 103;
}

export function code128cModules(payload: string): number[] {
  if (!/^\d+$/.test(payload) || payload.length % 2 !== 0) throw new Error(`code128cModules: payload 必須是偶數長度純數字`);
  const pairs: number[] = [];
  for (let i = 0; i < payload.length; i += 2) pairs.push(Number(payload.slice(i, i + 2)));
  const symbols = [START_C, ...pairs, code128cChecksum(pairs), STOP];
  const modules: number[] = [];
  for (const v of symbols) for (const ch of PATTERNS[v]) modules.push(Number(ch));
  return modules;
}

/** inline SVG（mm 單位、內含 quiet zone），可直接印在 A4 單據上。 */
export function code128cSvg(payload: string, opt?: { moduleMm?: number; heightMm?: number; quietModules?: number }): string {
  const moduleMm = opt?.moduleMm ?? 0.33;
  const heightMm = opt?.heightMm ?? 12;
  const quiet = (opt?.quietModules ?? 10) * moduleMm;
  const modules = code128cModules(payload);
  const total = modules.reduce((a, b) => a + b, 0) * moduleMm + quiet * 2;
  const rects: string[] = [];
  let x = quiet;
  let bar = true;
  for (const w of modules) {
    const wMm = w * moduleMm;
    if (bar) rects.push(`<rect x="${x.toFixed(3)}" y="0" width="${wMm.toFixed(3)}" height="${heightMm}" fill="#000"/>`);
    x += wMm;
    bar = !bar;
  }
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${total.toFixed(3)} ${heightMm}" width="${total.toFixed(3)}mm" height="${heightMm}mm" shape-rendering="crispEdges">` +
    `<rect x="0" y="0" width="${total.toFixed(3)}" height="${heightMm}" fill="#fff"/>` +
    rects.join("") +
    `</svg>`
  );
}

/** 解析掃描輸入：先試 14 碼條碼；否則當裸訂單號（去頭尾空白與 *、轉大寫）。 */
export function parseScanInput(raw: string): { orderNo: string; station: StationKey | null } | null {
  const s = raw.trim().replace(/^\*+|\*+$/g, "").toUpperCase();
  if (/^\d{14}$/.test(s)) return decodeBarcode(s);
  if (ORDER_NO_RE.test(s)) return { orderNo: s, station: null };
  return null;
}
