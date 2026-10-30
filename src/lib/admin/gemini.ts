import "server-only";

const MODEL = "gemini-3.5-flash";
const ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`;
const TIMEOUT_MS = 15_000;

export type ChatTurn = { role: "user" | "model"; text: string };
export class GeminiError extends Error {}

export function geminiConfigured(): boolean {
  return Boolean(process.env.GEMINI_API_KEY);
}

/**
 * Gemini 多輪對話（關閉 thinking）。金鑰放 header x-goog-api-key，不放 URL（避免進存取日誌）。
 * 未設定 GEMINI_API_KEY、逾時、HTTP 失敗、空回覆一律 throw，由呼叫端 fallback。
 */
export async function callGeminiChat(turns: ChatTurn[], opts: { system?: string; maxTokens?: number; temperature?: number } = {}): Promise<string> {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new GeminiError("gemini_not_configured");
  const body: Record<string, unknown> = {
    contents: turns.slice(-12).map((t) => ({ role: t.role, parts: [{ text: t.text }] })),
    generationConfig: {
      temperature: opts.temperature ?? 0.2,
      maxOutputTokens: opts.maxTokens ?? 600,
      thinkingConfig: { thinkingBudget: 0 },
    },
  };
  if (opts.system) body.systemInstruction = { parts: [{ text: opts.system }] };

  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": key },
      body: JSON.stringify(body),
      cache: "no-store",
      signal: ctrl.signal,
    });
    if (!res.ok) throw new GeminiError(`http_${res.status}`);
    const data = (await res.json()) as { candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }> };
    const text = data.candidates?.[0]?.content?.parts?.map((p) => p.text ?? "").join("").trim();
    if (!text) throw new GeminiError("empty");
    return text;
  } catch (e) {
    if (e instanceof GeminiError) throw e;
    throw new GeminiError(ctrl.signal.aborted ? "timeout" : "network");
  } finally {
    clearTimeout(timer);
  }
}

/** 去掉 Markdown 標記（# 與 **）。 */
export function normalizeReply(s: string): string {
  return s
    .replace(/^#{1,6}\s*/gm, "")
    .replace(/\*\*/g, "")
    .trim();
}
