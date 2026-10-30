// client 端呼叫後台 API 的共用函式：JSON、同源（瀏覽器會自動帶 Origin）、錯誤訊息中文化。
export type AdminResult<T = Record<string, unknown>> = { ok: true; data: T } | { ok: false; error: string; message: string };

const MESSAGES: Record<string, string> = {
  unauthorized: "登入已失效，請重新登入",
  bad_origin: "請求來源不符，已拒絕",
  forbidden: "權限不足（需擁有者）",
  not_found: "找不到資料",
  bad_payload: "資料格式不正確",
  rate_limited: "操作過快，請稍候",
  conflict: "資料重複或衝突",
};

export function adminErrorMessage(error: string, fallback?: string): string {
  return MESSAGES[error] ?? fallback ?? "操作失敗，請重試";
}

export async function adminFetch<T = Record<string, unknown>>(url: string, init: { method?: string; body?: unknown; form?: FormData } = {}): Promise<AdminResult<T>> {
  try {
    const res = await fetch(url, {
      method: init.method ?? (init.body || init.form ? "POST" : "GET"),
      headers: init.form ? undefined : { "Content-Type": "application/json" },
      body: init.form ?? (init.body !== undefined ? JSON.stringify(init.body) : undefined),
      cache: "no-store",
    });
    const data = (await res.json().catch(() => ({}))) as Record<string, unknown>;
    if (res.ok && data.ok !== false) return { ok: true, data: data as T };
    const error = typeof data.error === "string" ? data.error : `http_${res.status}`;
    const message = typeof data.message === "string" ? data.message : adminErrorMessage(error);
    if (error === "unauthorized") {
      setTimeout(() => window.location.replace(`/admin/login?next=${encodeURIComponent(window.location.pathname)}`), 800);
    }
    return { ok: false, error, message };
  } catch {
    return { ok: false, error: "network", message: "網路錯誤，請檢查連線後重試" };
  }
}
