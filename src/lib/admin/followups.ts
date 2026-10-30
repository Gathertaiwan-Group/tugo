// 追蹤與回訪：輸入驗證與分欄（純函式）。
export const FOLLOWUP_PRIORITIES = ["low", "medium", "high"] as const;
export const FOLLOWUP_STATUSES = ["open", "completed", "cancelled"] as const;
export const RELATED_TYPES = ["order", "application", "customer"] as const;
export const PRIORITY_LABELS: Record<string, string> = { low: "低", medium: "中", high: "高" };
export const FOLLOWUP_STATUS_LABELS: Record<string, string> = { open: "未完成", completed: "已完成", cancelled: "已取消" };
export const RELATED_LABELS: Record<string, string> = { order: "訂單", application: "合作申請", customer: "客戶" };

export const FOLLOWUP_FIELDS = [
  "title",
  "reason",
  "priority",
  "status",
  "assignee_id",
  "due_at",
  "related_type",
  "related_id",
  "customer_email",
] as const;

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export type FollowupInput = Partial<Record<(typeof FOLLOWUP_FIELDS)[number], string | null>>;

export function validateFollowup(
  body: Record<string, unknown>,
  mode: "create" | "update"
): { ok: true; row: Record<string, unknown> } | { ok: false; message: string } {
  const row: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(body)) {
    if (!(FOLLOWUP_FIELDS as readonly string[]).includes(k)) return { ok: false, message: `不允許的欄位：${k}` };
    if (v !== null && typeof v !== "string") return { ok: false, message: `${k} 格式不正確` };
    const s = typeof v === "string" ? v.trim() : "";
    switch (k) {
      case "title":
        if (!s || s.length > 160) return { ok: false, message: "標題必填、最多 160 字" };
        row.title = s;
        break;
      case "reason":
        if (s.length > 1000) return { ok: false, message: "原因最多 1000 字" };
        row.reason = s || null;
        break;
      case "priority":
        if (!(FOLLOWUP_PRIORITIES as readonly string[]).includes(s)) return { ok: false, message: "優先級不正確" };
        row.priority = s;
        break;
      case "status":
        if (!(FOLLOWUP_STATUSES as readonly string[]).includes(s)) return { ok: false, message: "狀態不正確" };
        row.status = s;
        break;
      case "assignee_id":
        if (s && !UUID_RE.test(s)) return { ok: false, message: "負責人不正確" };
        row.assignee_id = s || null;
        break;
      case "due_at": {
        const t = s ? new Date(s).getTime() : NaN;
        if (!s.includes("T") || Number.isNaN(t)) return { ok: false, message: "到期時間不正確" };
        row.due_at = new Date(t).toISOString();
        break;
      }
      case "related_type":
        if (s && !(RELATED_TYPES as readonly string[]).includes(s)) return { ok: false, message: "關聯類型不正確" };
        row.related_type = s || null;
        break;
      case "related_id":
        if (s.length > 254) return { ok: false, message: "關聯編號過長" };
        row.related_id = s || null;
        break;
      case "customer_email":
        if (s && (!EMAIL_RE.test(s) || s.length > 254)) return { ok: false, message: "客戶 Email 格式不正確" };
        row.customer_email = s ? s.toLowerCase() : null;
        break;
    }
  }
  if (mode === "create") {
    if (!row.title) return { ok: false, message: "標題必填" };
    if (!row.due_at) return { ok: false, message: "到期時間必填" };
  }
  if ("related_type" in row && !row.related_type) row.related_id = null;
  if (row.related_id && !row.related_type && mode === "create") return { ok: false, message: "請選擇關聯類型" };
  // 完成時自動寫 completed_at；改回 open/cancelled 清空
  if (row.status === "completed") row.completed_at = new Date().toISOString();
  else if (row.status === "open" || row.status === "cancelled") row.completed_at = null;
  return { ok: true, row };
}

export type Bucket = "overdue" | "today" | "week" | "later";
const DAY = 86_400_000;
const OFFSET = 8 * 3_600_000;

/** 依台北日界分欄：逾期（到期 < 現在）／今天／7 天內／之後。 */
export function bucketOf(dueAt: string, now = Date.now()): Bucket {
  const due = new Date(dueAt).getTime();
  if (due < now) return "overdue";
  const todayStart = Math.floor((now + OFFSET) / DAY) * DAY - OFFSET;
  if (due < todayStart + DAY) return "today";
  if (due < todayStart + 8 * DAY) return "week";
  return "later";
}
