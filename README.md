# 圖個有意思 TUGO STUDIO

新銳藝術家 × 原創聯名周邊電商站。規格來源：`tugo_handoff/README.md`（原型在 `tugo_handoff/prototype/`）。

技術：Next.js 15（App Router）+ TypeScript + Tailwind CSS v4 + Supabase（寄居 Gather 庫的 `tugo` schema）+ Vercel（hnd1）。

## 本機開發

```bash
npm ci
cp .env.example .env.local   # 填入 Supabase URL / anon key / service role key / ADMIN_SESSION_SECRET
npm run dev                  # http://localhost:3000
npm run lint && npx tsc --noEmit && npm run build
```

- 連線健檢：`/api/health`（service role 數 `tugo.products`）。
- Supabase client：`src/lib/supabase/{server,client,admin}.ts`，一律 `db.schema = 'tugo'`。service role 只能在 server 用。
- 設計 token 在 `src/app/globals.css` 的 `@theme static`（Tailwind v4，無 tailwind.config.ts）。

## Migration

- 檔案：`supabase/migrations/NNNN_name.sql`，依檔名排序套用；所有物件必須放在 `tugo` schema。
- 套用：`SUPABASE_ACCESS_TOKEN=... SUPABASE_PROJECT_REF=ozwftlkgqmewtadypsfi node scripts/apply-migrations.mjs`（`--dry-run` 只列待套用）。
  走 Supabase Management API，每個 migration 與帳本 `tugo.schema_migrations` 寫入同一交易。
- CI：push main 且 `supabase/migrations/**` 有變更時自動套用。
- **禁止 `supabase db push`**（此 DB 與其他客戶共用）；不可碰 `tugo` 以外的 schema。
- 新增表 / 函式後要重新 grant（參考 0001 結尾），`tugo` 已在 PostgREST exposed schemas。

## 部署

- GitHub `Gathertaiwan-Group/tugo` → push `main` 由 Vercel 自動部署（專案 `tugo`，區域 `hnd1`）；PR 產生 Preview。
- 環境變數見 `.env.example`（Vercel 已設 production / preview；service role 金鑰不給 development）。
- CI（`.github/workflows/ci.yml`）：PR / push main 跑 `npm ci → lint → tsc → build`。
- Storage bucket（public）：`tugo-product-images`、`tugo-artist-images`。
