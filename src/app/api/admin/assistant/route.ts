import { fail, guardAdmin, json, readJsonObject } from "@/lib/admin/api";
import { buildSnapshot, classifyIntent, linksFor, safeReport, SYSTEM_PROMPT, validateAssistantInput } from "@/lib/admin/assistant";
import { callGeminiChat, geminiConfigured, normalizeReply } from "@/lib/admin/gemini";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

export async function POST(req: Request) {
  const g = await guardAdmin(req);
  if (!g.ok) return g.res;
  const v = validateAssistantInput(await readJsonObject(req));
  if (!v.ok) return fail("bad_payload", 400);
  const { query, history, includeDemo } = v.input;
  const intent = classifyIntent(query);

  let snapshot;
  try {
    snapshot = await buildSnapshot(includeDemo);
  } catch {
    return fail("snapshot_failed", 500);
  }
  const report = safeReport(intent, snapshot);
  const links = linksFor(intent);

  if (geminiConfigured()) {
    try {
      const context = `資料快照（${snapshot.generatedAt}，台北時間以 UTC+8 換算）：\n${JSON.stringify(snapshot)}\n\n備援報表：\n${report}\n\n問題：${query}`;
      const firstUser = history.findIndex((t) => t.role === "user");
      const turns = firstUser >= 0 ? history.slice(firstUser) : [];
      const reply = normalizeReply(await callGeminiChat([...turns, { role: "user", text: context }], { system: SYSTEM_PROMPT }));
      return json({ ok: true, reply: reply.slice(0, 1200), source: "gemini", links });
    } catch {
      /* fallthrough → 安全報表 */
    }
  }
  return json({ ok: true, reply: report, source: "safe_report", links });
}
