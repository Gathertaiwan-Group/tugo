#!/usr/bin/env node
// 建立或更新後台管理員（寫入 tugo.admin_users）。
// 用法：node scripts/createAdmin.mjs <email> [name] [--role owner|staff]
//   密碼從環境變數 ADMIN_PASSWORD 讀（避免留在 shell history）；未設定時互動輸入（不回顯）。
//   已存在的 email → 更新密碼/姓名/角色、重新啟用，並 session_version+1（舊登入全部失效）。
// 讀 .env.local 的 NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY。
// ⚠ pbkdf2 參數必須與 src/lib/admin/password.ts 一致（兩處同步）。
import { readFileSync, existsSync } from "node:fs";
import { pbkdf2Sync, randomBytes } from "node:crypto";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";

const PBKDF2 = { iterations: 120_000, keylen: 32, digest: "sha256" };
const MIN_LEN = 10;

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const envFile = path.join(root, ".env.local");
if (existsSync(envFile)) {
  for (const line of readFileSync(envFile, "utf8").split("\n")) {
    const m = /^([A-Z0-9_]+)=(.*)$/.exec(line.trim());
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
}

const args = process.argv.slice(2);
const roleIdx = args.indexOf("--role");
const role = roleIdx >= 0 ? args[roleIdx + 1] : "staff";
const positional = args.filter((_, i) => i !== roleIdx && i !== roleIdx + 1);
const [emailRaw, name] = positional;
const email = (emailRaw ?? "").trim().toLowerCase();

if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !["owner", "staff"].includes(role)) {
  console.error("用法：ADMIN_PASSWORD='…' node scripts/createAdmin.mjs <email> [name] [--role owner|staff]");
  process.exit(1);
}

async function readHidden(prompt) {
  if (!process.stdin.isTTY) {
    console.error("請設定 ADMIN_PASSWORD 環境變數");
    process.exit(1);
  }
  process.stdout.write(prompt);
  process.stdin.setRawMode(true);
  process.stdin.resume();
  let s = "";
  return await new Promise((resolve) => {
    process.stdin.on("data", (buf) => {
      for (const ch of buf.toString("utf8")) {
        if (ch === "\r" || ch === "\n") {
          process.stdin.setRawMode(false);
          process.stdin.pause();
          process.stdout.write("\n");
          return resolve(s);
        }
        if (ch === "\u0003") process.exit(130);
        if (ch === "\u007f") s = s.slice(0, -1);
        else s += ch;
      }
    });
  });
}

const password = process.env.ADMIN_PASSWORD || (await readHidden("密碼（至少 10 碼）："));
if (password.length < MIN_LEN) {
  console.error(`密碼至少 ${MIN_LEN} 碼`);
  process.exit(1);
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error("缺少 NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}
const sb = createClient(url, key, { db: { schema: "tugo" }, auth: { persistSession: false } });

const salt = randomBytes(16).toString("hex");
const hash = pbkdf2Sync(password, salt, PBKDF2.iterations, PBKDF2.keylen, PBKDF2.digest).toString("hex");

const { data: existing, error: selErr } = await sb.from("admin_users").select("id,session_version").eq("email", email).maybeSingle();
if (selErr) {
  console.error("查詢失敗：", selErr.message);
  process.exit(1);
}
const row = { email, password_hash: hash, password_salt: salt, role, active: true, ...(name ? { name } : {}) };
const { error } = existing
  ? await sb.from("admin_users").update({ ...row, session_version: existing.session_version + 1 }).eq("id", existing.id)
  : await sb.from("admin_users").insert(row);
if (error) {
  console.error("寫入失敗：", error.message);
  process.exit(1);
}
console.log(`${existing ? "已更新" : "已建立"}管理員 ${email}（${role === "owner" ? "擁有者" : "工作人員"}）`);
