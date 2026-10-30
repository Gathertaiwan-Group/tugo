# 交接文件：圖個有意思 TUGO STUDIO — 電商網站

> 給 Claude Code：請完整讀完這份 README，再打開 `prototype/TUGO Studio.dc.html` 對照。
> 目標：用 **Next.js（App Router）+ TypeScript + Tailwind CSS + Supabase**，部署在 **Vercel**、程式碼放 **GitHub**，**1:1 還原**這份原型的畫面、文案、互動與狀態。

---

## 0. 給 Claude Code 的第一步（照順序執行）

1. 讀這份 README → 讀 `docs/original-brief.pdf`（原始品牌需求）→ 讀 `prototype/` 原始碼。
2. 在瀏覽器打開 `prototype/TUGO Studio.dc.html`，逐頁對照（它不用 build 就能開，路由用 `#/...`）。
3. `npx create-next-app@latest tugo-studio --ts --tailwind --app --src-dir --eslint`
4. 建立 Supabase 專案，在 SQL Editor 執行 `supabase/schema.sql`，再執行 `supabase/seed.sql`。
5. 依 §3 路由表建立頁面，依 §4 設計 token 設定 Tailwind，依 §5 規格逐頁實作。
6. 本地 `.env.local` 設定 §8 環境變數 → push 到 GitHub → Vercel 匯入 repo、設定同樣的環境變數。
7. 完成後跑 §10 驗收清單，逐項比對原型。

**還原原則**：文案逐字照抄（含全形標點）；顏色、字級、圓角、間距以原型的 inline style 為準；有疑問時，**原型原始碼就是規格**。

---

## 1. 關於原型檔案

`prototype/` 中的檔案是**用 HTML 做的設計原型**（不是正式程式碼）。它是一種「Design Component」格式：

- `TUGO Studio.dc.html` — 整個網站（所有頁面）。上半部是 template（`{{ }}` 綁值、`<sc-if>` 條件、`<sc-for>` 迴圈，樣式全是 inline style），最下方 `<script>` 裡的 `class Component` 是所有邏輯（路由、購物車、篩選、表單驗證）。
- `ProductCard.dc.html` — 商品卡片元件（全站共用）。
- `tugo-data.js` — 全部 DEMO 種子資料（已轉成 `supabase/seed.sql`）。
- `support.js` — 原型執行環境，**不需移植**。

轉換對照：
- `<sc-if value="{{ x }}">` → `{x && (...)}`
- `<sc-for list="{{ items }}" as="it">` → `items.map(it => ...)`
- `<dc-import name="ProductCard" item="{{ it }}">` → `<ProductCard item={it} />`
- `style-hover="..."` → Tailwind `hover:` 類別
- `renderVals()` 中各 `xxxVals()` 函式 → 各頁的資料轉換/Server Component 查詢
- `this.state` → React state / Context（見 §7）

**保真度：高保真（hi-fi）**。顏色、字體、間距、文案皆為定稿；唯一的例外是**圖片**——所有圖片都是條紋佔位圖（見 §4.6），等正式素材。

---

## 2. 專案概要

- 品牌：圖個有意思｜TUGO STUDIO（英文名為暫定，上線前需確認商標與網域）
- 定位：新銳藝術家 × 原創聯名周邊商品
- Slogan：「好作品，不只值得被看見。」副標：「讓創意成為作品，讓作品走進生活。」
- 語言：繁體中文（`<html lang="zh-TW">`），幣別 NT$
- **重要**：目前所有藝術家、作品、商品、價格、庫存皆為虛構 DEMO 資料（DB 中 `is_demo = true`）。金流、物流、會員、電子報**皆未串接**，介面上必須明確標示（見 §5.0 Demo 橫幅與各表單的「Demo」說明），**不可**顯示付款成功等誤導訊息。

---

## 3. 路由對照表

原型用 hash 路由（`#/shop/tees`），Next.js 改成真實路徑：

| 原型 hash | Next.js 路徑 | 說明 |
|---|---|---|
| `#/` | `/` | 首頁 |
| `#/shop` | `/shop` | 全部商品 |
| `#/shop/[cat]` | `/shop/[category]` | 分類（tees/hats/bags/stickers/posters/living） |
| `#/new` | `/new` | 新品上市（同 shop 版型，只顯示 `is_new`） |
| `#/products/[slug]` | `/products/[slug]` | 商品詳情 |
| `#/artists` | `/artists` | 藝術家列表 |
| `#/artists/[id]` | `/artists/[id]` | 藝術家詳情 |
| `#/collections` | `/collections` | 聯名企劃列表 |
| `#/collections/[id]` | `/collections/[id]` | 聯名企劃詳情 |
| `#/about` | `/about` | 關於我們 |
| `#/collaborate` | `/collaborate` | 藝術家合作（含申請表，錨點 `#apply`） |
| `#/faq` | `/faq` | 常見問題 |
| `#/shipping` `#/returns` `#/privacy` `#/terms` | 同名路徑 | 客服/條款（共用版型） |
| `#/cart` | `/cart` | 購物車頁 |
| `#/checkout` | `/checkout` | 結帳 |
| `#/account` | `/account` | 會員（登入/註冊 + 收藏 + 訂單） |
| 其他 | `not-found.tsx` | 404：「這一頁還沒被畫出來。」 |

找不到的商品/藝術家/系列各自有 404 區塊（文案見原型 `pMissing` / `aMissing` / `cMissing`），Next.js 用 `notFound()` + 各 segment 的 `not-found.tsx` 實作，文案照抄。

換頁時：關閉手機選單、搜尋、購物車抽屜、下拉選單，並捲回頂部。

SEO：每頁 `generateMetadata`；首頁 title「圖個有意思 TUGO STUDIO｜好作品，不只值得被看見。」，description「圖個有意思｜新銳藝術家 × 原創周邊商品。讓創意成為作品，讓作品走進生活。」，並設定 og:title / og:description / og:type。

---

## 4. 設計 Token（請寫進 `tailwind.config.ts`）

### 4.1 色彩

| Token | Hex | 用途 |
|---|---|---|
| `paper` | `#F4EFE5` | 全站背景、深色區塊上的文字 |
| `ink` | `#242622` | 主文字、深色區塊背景、黑框按鈕 |
| `forest` | `#244A3A` | 品牌主色：主按鈕、Footer、聯名區塊、連結 hover |
| `forest-dark` | `#1B392C` | 主按鈕 hover |
| `tangerine` | `#F07C46` | 點綴色：Logo 圓點、限量徽章、招募 CTA、引號、focus 外框 |
| `tangerine-light` | `#F4925F` | 橘色按鈕 hover |
| `card` | `#FAF7F0` | 卡片/側欄/表單容器背景 |
| `field` | `#FFFDF8` | 輸入框背景 |
| `line-card` | `#E3DDD0` | 卡片邊框 |
| `line` | `#D9D3C7` | 分隔線、Header 底線 |
| `line-field` | `#CFC8BA` | 輸入框/未選中按鈕邊框 |
| `hover-bg` | `#ECE5D7` | 圖示按鈕 hover 背景 |
| `menu-hover` | `#F0EADD` | 下拉選單項目 hover |
| `tag` | `#E9E2D3` | 標籤背景、條款頁提示 |
| `skeleton` | `#E6E0D3` | 骨架屏 |
| `muted` | `#5E6158` | 次要文字、mono 小標 |
| `body2` | `#3E403B` | 內文段落 |
| `disabled` | `#8A8C84` | 售罄文字、placeholder |
| `error` | `#B3261E` | 欄位錯誤文字與邊框 |
| `error-bg` / `error-ink` | `#FBE9E7` / `#8C1D18` | 表單頂部錯誤摘要 |
| `notice` | `#FDE7DB` | 金流未串接提示 |
| `success-bg` | `#E3EAE3` | 免運提示 |
| `on-forest-muted` | `#C9D6CC` | 綠底上的小標 |
| `on-forest-body` | `#DCE4DD` | 綠底上的內文 |
| `on-forest-line` | `#3B6150` | Footer 分隔線 |
| `soldout-bg` | `#D9D3C7` | 售罄按鈕/徽章背景 |
| 錯誤淡色（深底） | `#FFD3BF` | Footer 電子報錯誤文字 |

遮罩：`rgba(36,38,34,.4)`（手機選單）、`.45`（搜尋/購物車）、`.92`（圖片放大）。Header 背景 `rgba(244,239,229,.94)` + `backdrop-filter: blur(10px)`。佔位標籤背景 `rgba(244,239,229,.9~.92)`。

### 4.2 字體（Google Fonts，用 `next/font/google`）

- **Noto Sans TC** 400/500/700 — 內文、UI（body 預設 15px / line-height 1.7）
- **Noto Serif TC** 600/700 — 所有標題、Logo 中文、引言
- **JetBrains Mono** 400/500 — 英文小標（eyebrow）、價格、數量、計數、佔位標籤

全站 `-webkit-font-smoothing: antialiased`、`box-sizing: border-box`、連結無底線、`a:hover` 顏色 `#244A3A`、`:focus-visible { outline:2px solid #F07C46; outline-offset:2px; border-radius:4px }`、placeholder `#8A8C84`。

### 4.3 字級（原型使用 clamp，請照抄）

| 用途 | 樣式 |
|---|---|
| 首頁 Hero H1（split） | Serif 700 `clamp(44px,6.6vw,92px)` / 1.12，letter-spacing -.01em，`text-wrap:balance` |
| 首頁 Hero H1（full） | Serif 700 `clamp(40px,5.6vw,76px)` / 1.12 |
| 頁面 H1 | Serif 700 `clamp(34px,4.4vw,56px)` ~ `clamp(36px,5vw,64px)` / 1.15–1.2 |
| 區塊 H2 | Serif 700 `clamp(30px,3.6vw,48px)` / 1.2 |
| 小區塊 H2 | Serif 700 `clamp(22px,2.4vw,30px)` / 1.3 |
| Eyebrow 小標 | Mono 500 11px / 1.4，letter-spacing .16em，`#5E6158`，例：`01 — NEW DROPS` |
| 商品卡名稱 | Sans 500 15px / 1.45 |
| 價格 | Mono 500 14px（卡片）/ 22px（詳情） |
| 按鈕 | Sans 500 14–15px |

### 4.4 間距與版面
- 內容容器：`max-width:1360px; margin:0 auto; padding:0 clamp(16px,4vw,48px)`（about 1200、faq 880、info 1100、cart/checkout 1200）
- 區塊垂直間距：`clamp(56px,8vw,112px)`
- Header 高度 68px，sticky，z-index 40
- 斷點：**960px**（< 960 為行動版：漢堡選單、篩選收合、單欄商店）
- 商品網格：`repeat(auto-fill, minmax(min(46%,220px),1fr))`（首頁新品 240px），gap `clamp(20px,2vw,28px) clamp(12px,1.6vw,20px)`
- 雙欄區塊多用 `repeat(auto-fit, minmax(min(100%,420px),1fr))` 自動換行

### 4.5 圓角 / 陰影
- 圓角：4（佔位標籤）、6（徽章、小縮圖）、8（按鈕、輸入框、標籤）、10–12（卡片、縮圖、選單）、16（大卡片、Hero 圖、區塊容器）、50%（頭像、色票）
- 陰影：下拉選單 `0 18px 40px rgba(36,38,34,.1)`；卡片 hover `0 16px 32px rgba(36,38,34,.08)`；Hero 浮動卡 `0 12px 30px rgba(36,38,34,.08)`；Toast `0 12px 30px rgba(36,38,34,.25)`

### 4.6 圖片佔位（正式圖片上線前沿用）
每個商品/藝術家/系列有 `hue`（色相）。佔位背景：
```js
bg(h, angle=135, L=0.87) =
  `repeating-linear-gradient(${angle}deg, oklch(${L} 0.035 ${h}) 0 14px, oklch(${L-0.03} 0.042 ${h}) 14px 28px)`
```
左下角/角落放 Mono 10–11px 標籤說明應放什麼圖（例：「情境照｜失眠貓夜景 T 恤」）。商品卡：主圖 `bg(hue,135)`，hover 第二張 `bg(hue+20,45,0.83)`；詳情四張：情境照(135,.86,+0)、平拍照(45,.84,+15)、細節照(90,.80,-15)、背面／包裝(0,.88,+30)；藝術家封面 `bg(hue,135)`、頭像 `bg(hue+30,90,0.8)`；系列 `bg(hue,135,0.8)`。
建議實作成 `<ImageOrPlaceholder src={url} hue={} label={} />`：有 `url` 就用 `next/image`，否則顯示條紋。

### 4.7 動畫
- `tugoIn`：`from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:none}` — 下拉選單 .18s、抽屜/搜尋/手機選單 .2–.22s、Hero 文字 .6s、成功訊息 .3s，全部 `ease`
- `tugoPulse`：opacity .55↔1 — 骨架屏 1s infinite、Loading 1.2s
- 卡片 hover 上浮 `translateY(-3px)` .25s；按鈕 hover `translateY(-2px)` .2s；商品卡第二張圖淡入 opacity .35s；收藏鈕 hover `scale(1.08)`
- 加 `prefers-reduced-motion` 時關閉動畫（原型未做，正式版建議加）

### 4.8 Logo（暫定）
30×30 SVG：圓角方框 + 3/4 圓弧 + 橘色圓點（原始碼見原型 header）。旁邊：「圖個有意思」Serif 700 18px letter-spacing .06em；下方「TUGO STUDIO」Mono 500 9px letter-spacing .24em `#5E6158`。Footer 版為淺色描邊。

---

## 5. 頁面規格

> 以下列出結構與關鍵行為；**精確樣式與逐字文案請直接看原型對應區塊**（用 `is_home`、`is_shop` 等關鍵字搜尋）。

### 5.0 全站框架（`app/layout.tsx`）
1. **跳至主要內容**連結（focus 時出現）
2. **Demo 橫幅**（可用 env 或設定開關）：深色 `#242622` 條，橘色 Mono「DEMO」+「示意網站｜所有藝術家、作品、商品、價格與庫存皆為虛構資料；未串接金流、物流與會員系統。」
3. **Header**（sticky）：Logo｜桌機主選單（新品上市、逛商品▾、認識藝術家、聯名企劃、關於我們、藝術家合作；目前頁面底線 2px `#244A3A`）｜右側：搜尋、會員、購物車按鈕（綠底，顯示數量；有商品時右上角橘點）
   - 「逛商品」hover/focus 展開 420px 寬 2 欄下拉：6 個分類（縮圖 + 名稱 + 「N items」）+「逛全部商品 →」
   - 行動版：左側漢堡 → 左側滑出抽屜（寬 min(86vw,360px)）：主選單大字 Serif 20px、分類 2 欄方格、搜尋/會員按鈕
4. **全站搜尋**（覆蓋層，從上方出現）：輸入即時搜尋商品名+藝術家名（最多 6 筆）與藝術家（名稱/英文名/類型）；無結果提示；下方分類捷徑；Enter → 帶關鍵字到 `/shop`；Esc 關閉；開啟時自動 focus
5. **Footer**（`#244A3A`）：電子報區（標題「新作品上架時，第一個告訴你。」+ Email 表單）、品牌欄、SHOP / ABOUT / HELP 三欄連結、版權列
6. **購物車抽屜**（右側 min(100vw,420px)）、**Toast**（底部置中）

### 5.1 首頁 `/`
1. **Hero**（兩種版型，預設 `split`）：
   - split：左文右圖。Eyebrow「ARTIST × GOODS — 2026 AW」；H1「好作品，<br>不只值得<br>被看見。」（「看見」下方橘色螢光筆底線，高 .18em）；副文；CTA「探索聯名商品 →」（綠）、「認識藝術家」（黑框）。右側 4:5 圖 + 左下浮動卡（本季聯名 + 系列名 + 藝術家）
   - full：全幅圖 + 左下米色文字卡
2. **分類列**：6 格，上下框線，每格名稱 + 數量
3. **01 — NEW DROPS 新品上市**：`is_new` 依上架日新→舊取 8 筆，「看全部新品 →」
4. **02 — ARTISTS 精選藝術家**：前 4 位，卡片（封面 5:4 + 壓在左下的 56px 頭像 + 名稱/英文名/類型・城市/一句話 +「查看作品 →」）
5. **03 — COLLABORATION**：綠底，主打第一個系列（夜市研究所）
6. **04 — OUR STORY 為什麼創作，值得走進日常？**：左標題右三段文
7. **藝術家招募**：黑色圓角大卡「你的作品，值得有更多可能。」+ 橘色 CTA

### 5.2 商店 `/shop`、`/shop/[category]`、`/new`
- 麵包屑、Eyebrow（All Goods / New Drops / Shop / tees）、H1、商品數
- 分類標籤列（可橫向捲動；選中為黑底白字）
- 工具列：行動版「篩選（N）」按鈕｜關鍵字搜尋框｜排序 select（最新上架 / 熱門程度 / 價格：低到高 / 價格：高到低）
- 左側篩選面板（桌機固定 232px；行動版點按鈕展開）：供貨狀態 radio（全部/現貨/預購；「現貨」包含 instock + limited）、藝術家 checkbox；有條件時顯示「清除篩選」
- 篩選/排序變更時顯示 320ms 骨架屏（6 張）
- 空狀態：虛線框「沒有符合條件的商品」+「清除所有篩選」
- 建議把篩選狀態放到 URL query（`?q=&sort=&artist=&avail=`），原型存在 state 中

### 5.3 商品卡 `ProductCard`（見 `prototype/ProductCard.dc.html`）
- 4:5 圖，圓角 12，hover 淡入第二張
- 左上徽章：限量（橘底黑字）、預購（米底綠字綠框）、售罄（灰底）、其餘若為新品則 NEW（綠底）
- 右上 36px 收藏鈕（♡ / ♥）
- 藝術家名（12px muted）、商品名、價格（Mono）、按鈕：
  - 售罄 →「已售罄」disabled
  - 有多個顏色或尺寸 →「選擇規格」→ 前往詳情頁
  - 預購 →「預購」直接加入購物車
  - 其他 →「加入購物車」直接加入

### 5.4 商品詳情 `/products/[slug]`
- 麵包屑：首頁 / 逛商品 / 分類 / 商品名
- 左：主圖 4:5（點擊放大）+ 4 張縮圖（選中黑框 2px）
- 右（sticky top 96px）：藝術家連結、H1、價格、狀態文字（帶色點）：
  - instock：`現貨・剩餘 {stock} 件（示意庫存）`
  - limited：`限量・剩餘 {stock} 件（示意庫存）`
  - preorder：`預購中・預計 {ship_date} 起陸續出貨`
  - soldout：`已售罄・補貨通知功能待串接`
- 顏色（色票 + 名稱，選中黑框）、尺寸（選中黑底）；只有一個選項時自動預選
- T 恤分類顯示「查看尺寸表 / 收起尺寸表」（尺寸｜胸寬｜衣長）
- 數量 1–10、主按鈕文字含總價（`加入購物車・NT$ 1,960` / `預購・…` / `已售罄`）、收藏鈕
- 未選規格點加入 → 紅字「⚠ 請先選擇顏色 / 請先選擇尺寸」
- 服務說明三條、分頁籤：商品故事 / 材質與保養 / 出貨與退換貨
- 下方：關於藝術家卡片 → 同藝術家作品 → 同系列（其他藝術家）→ 你可能也會喜歡（排除前兩組與售罄，依熱門度取 4）
- 放大燈箱：上一張/下一張/關閉、`n / 4`
- 換頁（換商品）時重設規格選擇

### 5.5 藝術家 `/artists`、`/artists/[id]`
- 列表：標題「作品背後，<br>是一個人。」、搜尋（名稱/英文名/類型/一句話）、標籤篩選（全部 + 所有 tags）、計數；卡片含頭像、名稱、3 格作品拼圖（2fr 1fr，左大右二）、標籤、商品數、一句話
- 詳情：封面（高 clamp(220px,36vw,440px)）、頭像壓在封面下緣 -56px、名稱；左側 Serif 大引言（橘色「」）、右側簡介/標籤/IG（示意）；參與的聯名系列；該藝術家所有商品

### 5.6 聯名企劃 `/collections`、`/collections/[id]`
- 列表：「一個主題，幾種觀點。」，每個系列一列（16:10 圖 + 編號/季度/件數 + 名稱 + 英文/藝術家 + 概念 +「探索系列 →」）
- 詳情：綠底 Hero、參與藝術家、系列商品、其他聯名企劃

### 5.7 關於我們、藝術家合作、FAQ、條款頁、會員
- **/about**：大標、圖文、三個理念（01 創作者優先 / 02 把作品做成好東西 / 03 有趣，是認真的）、兩個 CTA
- **/collaborate**：黑底 Hero → 4 個價值 → 三種方案（A 新銳共創 / B 藝術家聯名「最常見」/ C 限定企劃，皆註明「分潤比例、授權期間、是否獨家：依合作合約約定」）→ 5 步流程 → 左 FAQ 右申請表（`id="apply"`）
  - **文案法律原則**：不承諾固定收入、保證銷量或曝光；分潤皆寫「依合約約定」
- **/faq**：手風琴（一次只開一個，+/−）
- **/shipping /returns /privacy /terms**：左側子選單（目前頁綠底）+ 「本頁為示意文案，正式上線前需經法務確認。」+ 段落
- **/account**：登入/註冊切換表單 + 我的收藏 + 訂單紀錄（空狀態）

### 5.8 購物車與結帳
- **購物車抽屜**與 **/cart**：縮圖、藝術家、名稱、`顏色／尺寸`（無則「單一規格」）・現貨或`預購・預計 X 出貨`、數量 −/+（1–10，1 時 − disabled）、小計、移除
- 運費規則（示意）：小計 0 →「—」；≥ NT$1,500 免運；否則宅配 100 / 超商 60。提示「再買 NT$ X 即可免運」/「已達免運門檻」
- 加入購物車後：預設開啟抽屜（設定 `addBehavior='toast'` 則改顯示 Toast「已加入購物車：{name}」+「查看」，2.4 秒消失）
- 同商品同規格合併數量（上限 10）
- 結帳步驟列：01 購物車 → 02 收件與配送 → 03 付款（待串接）
- 結帳表單：收件人姓名、手機、Email；配送（宅配到府 NT$100 / 超商取貨 NT$60 卡片選擇）；宅配 → 縣市 select（19 縣市，見原型）+ 地址；超商 → 門市（手動輸入，電子地圖待串接）；備註；付款方式（信用卡/ATM 轉帳/超商代碼/LINE Pay，皆標「待串接」）+ 橘色提示「金流尚未串接。本頁不收取任何信用卡或付款資訊…」
- 送出後：**只顯示**「收件與配送資料已確認」+「此為示意流程：沒有建立真實訂單、沒有收取任何款項。」— **不可**顯示付款成功

---

## 6. 資料模型（Supabase）

`supabase/schema.sql` 建表 + RLS；`supabase/seed.sql` 是 `tugo-data.js` 完整轉出的 DEMO 資料（6 分類、6 藝術家、3 系列、12 商品、色票、尺寸表、FAQ、條款段落）。

欄位對照（原型 → DB）：
- artist：`en→name_en`、`disc→discipline`、`line→tagline`、`phil→philosophy`、`ig→instagram`
- collection：`en→name_en`、`long→description`、`artists[]→collection_artists`
- product：`artist→artist_id`、`cat→category_id`、`coll→collection_id`、`ship→ship_date`、`isNew→is_new`、`pop→popularity`、`date→released_at`、`dims→dimensions`

讀取：公開頁面用 Server Components + `@supabase/ssr` 查詢（建議 `revalidate = 60` 或 on-demand revalidation）。
寫入：電子報 → `newsletter_subscribers`；合作申請 → `artist_applications`（皆用 Server Action，前端已驗證、DB 有 check constraint）；收藏 → 登入用戶寫 `favorites`、未登入存 localStorage。
訂單：`orders` / `order_items` 已建表，**等金流（綠界 / 藍新 / TapPay 等）串接後**由 server 端寫入。

圖片：建 Supabase Storage bucket `product-images`、`artist-images`（public read），URL 寫入 `product_images.url`、`artists.portrait_url/cover_url`、`collections.cover_url`。

---

## 7. 狀態管理

| 狀態 | 原型位置 | 正式版建議 |
|---|---|---|
| 購物車 `[{key,id,color,size,qty}]`，key = `id|color|size` | `state.cart`，localStorage `tugo-demo-cart` | `CartContext`（client）+ localStorage 同一個 key；價格永遠從 DB 重新取 |
| 收藏 | `state.favs`（僅當次瀏覽） | 未登入 localStorage，登入後同步到 `favorites` |
| 購物車抽屜 / 搜尋 / 手機選單 / 下拉 / Toast | `cartOpen` `searchOpen` `navOpen` `menu` `toast` | `UIContext` 或各元件內 state |
| 商店篩選 `{q, sort, artists[], avail}` | `state.shop` | URL searchParams |
| 商品詳情 `{color,size,qty,img,err,zoom,tab,chart}` | `state.pd` | 詳情頁 client 元件 state |
| 表單 + 錯誤 + 狀態（idle/loading/done） | `nl`/`ap`/`co`/`acc` | react-hook-form + zod，或 useActionState |

## 8. 表單驗證規則（錯誤文案逐字照抄）

- **電子報**：Email 必填且符合 `^[^\s@]+@[^\s@]+\.[^\s@]+$` →「請輸入 Email」/「Email 格式不正確」；loading 800ms 文案「送出中…」
- **合作申請**：姓名「請填寫姓名或藝名」；Email「請填寫 Email」/「Email 格式不正確」；網址需 `^https?://` 開頭 →「請提供 IG 或作品集網址」/「請輸入完整網址（含 https://）」；類型「請選擇創作類型」（插畫、角色設計、攝影、版畫／印刷、字體／平面設計、拼貼／複合媒材、其他）；簡介 ≥ 20 字「請至少寫 20 字（目前 N 字）」，右上即時字數；兩個勾選「請確認作品授權聲明」「請同意個資蒐集告知」；有錯時頂部摘要「有欄位尚未完成，請檢查下方紅字提示。」
- **結帳**：姓名「請填寫收件人姓名」；手機去除空白/減號後需 `^09\d{8}$` →「請填寫手機號碼」/「手機格式應為 09 開頭 10 碼」；Email 同上；宅配需縣市「請選擇縣市」、地址「請填寫地址」；超商需門市「請填寫取貨門市（門市選擇器待串接）」
- **會員**：Email「請輸入有效的 Email」；密碼 ≥ 8「密碼至少 8 碼」→ 正式版改接 Supabase Auth
- 錯誤欄位邊框變 `#B3261E`，使用者修改該欄位即清除該欄錯誤。所有表單 `noValidate`，用自訂驗證。

## 9. 環境變數 / 部署

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=        # 僅 server 使用
NEXT_PUBLIC_SHOW_DEMO_BANNER=true
NEXT_PUBLIC_HERO_LAYOUT=split      # split | full
NEXT_PUBLIC_ADD_TO_CART=drawer     # drawer | toast
NEXT_PUBLIC_SITE_URL=
```
後三個對應原型的 Tweaks 選項（`showDemoBanner`、`heroLayout`、`addBehavior`）。
部署：GitHub repo → Vercel Import → 填環境變數 → 每次 push main 自動部署；PR 產生 Preview。另需 `sitemap.ts`、`robots.ts`。

## 10. 驗收清單

- [ ] 1440px 與 390px 寬度下，每一頁與原型並排比對：排版、顏色、字體、文案一致
- [ ] 960px 斷點切換：漢堡選單、篩選收合
- [ ] 下拉選單、搜尋（即時結果、Enter、Esc）、手機選單運作
- [ ] 商店：分類、關鍵字、排序 4 種、供貨狀態、藝術家篩選、清除、空狀態、骨架屏
- [ ] 商品卡 4 種按鈕狀態、徽章 4 種、收藏切換、hover 第二張圖
- [ ] 詳情：縮圖切換、燈箱、規格必選錯誤、單一選項自動選、尺寸表、數量 1–10、3 個分頁、3 組推薦
- [ ] 購物車：合併、數量、移除、運費/免運提示、重新整理後仍保留
- [ ] 結帳：所有驗證、宅配/超商切換、完成畫面**沒有**付款成功字樣
- [ ] 合作申請、電子報、會員表單驗證與完成畫面
- [ ] 所有 404（全站、商品、藝術家、系列）
- [ ] 鍵盤可操作、focus 外框橘色、所有圖示按鈕有 aria-label、對比度 ≥ 4.5:1
- [ ] Demo 橫幅與所有「待串接」標示都在
- [ ] Lighthouse：Performance / Accessibility / SEO ≥ 90

## 11. 上線前待辦（非程式）
- TUGO STUDIO 商標與網域確認
- 藝術家授權合約、分潤條款
- 金流、物流、電子發票服務商選定與串接
- 條款/隱私/退換貨文案法務審閱
- 正式商品攝影、藝術家肖像授權、正式 Logo
- 移除 DEMO 資料（`delete from ... where is_demo`）與 Demo 橫幅

## 檔案清單
```
tugo_handoff/
├── README.md                ← 本文件
├── docs/original-brief.pdf  ← 原始品牌與設計需求
├── prototype/
│   ├── TUGO Studio.dc.html  ← 完整網站原型（規格來源）
│   ├── ProductCard.dc.html  ← 商品卡元件
│   ├── tugo-data.js         ← DEMO 資料
│   └── support.js           ← 原型執行環境（不需移植）
└── supabase/
    ├── schema.sql           ← 資料表 + RLS
    └── seed.sql             ← DEMO 種子資料
```
