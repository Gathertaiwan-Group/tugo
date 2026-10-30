import "server-only";
// 管理員密碼雜湊（pbkdf2-sha256，node:crypto）。只在 Node runtime 使用，切勿被 middleware（Edge）import。
// ⚠ 參數與 scripts/createAdmin.mjs 必須一致（兩處同步）。
import { pbkdf2Sync, randomBytes, timingSafeEqual } from "node:crypto";

export const PBKDF2 = { iterations: 120_000, keylen: 32, digest: "sha256" } as const;
export const MIN_PASSWORD_LENGTH = 10;

export function hashPassword(password: string): { salt: string; hash: string } {
  const salt = randomBytes(16).toString("hex");
  const hash = pbkdf2Sync(password, salt, PBKDF2.iterations, PBKDF2.keylen, PBKDF2.digest).toString("hex");
  return { salt, hash };
}

export function verifyPassword(password: string, salt: string, expectedHash: string): boolean {
  if (!password || !salt || !expectedHash) return false;
  const hash = pbkdf2Sync(password, salt, PBKDF2.iterations, PBKDF2.keylen, PBKDF2.digest);
  let b: Buffer;
  try {
    b = Buffer.from(expectedHash, "hex");
  } catch {
    return false;
  }
  if (hash.length !== b.length) return false;
  return timingSafeEqual(hash, b);
}

/** 密碼規則：至少 10 碼、最多 200 碼。回傳錯誤訊息或 null。 */
export function passwordProblem(pw: unknown): string | null {
  if (typeof pw !== "string") return "請輸入密碼";
  if (pw.length < MIN_PASSWORD_LENGTH) return `密碼至少 ${MIN_PASSWORD_LENGTH} 碼`;
  if (pw.length > 200) return "密碼過長";
  return null;
}
