-- 圖個有意思 TUGO STUDIO · 0001_init
-- 所有物件都在自訂 schema `tugo`（此 DB 與 panpan / hank / planet / groupbuy 等共用，禁止動 public、禁止 supabase db push）。
-- 由 scripts/apply-migrations.mjs 透過 Supabase Management API 套用，帳本 tugo.schema_migrations。
-- 原始檔：tugo_handoff/supabase/schema.sql（已改寫為 tugo schema）

create schema if not exists tugo;
grant usage on schema tugo to anon, authenticated, service_role;

-- 圖個有意思 TUGO STUDIO — Supabase schema (Postgres)
-- 執行順序：schema.sql → seed.sql
-- 欄位名稱對應 prototype/tugo-data.js（對照表見 README §6）

create table tugo.categories (
  id text primary key,            -- tees / hats / bags / stickers / posters / living
  name text not null,
  sort int not null default 0
);

create table tugo.artists (
  id text primary key,            -- 作為網址 slug：/artists/[id]
  name text not null,
  name_en text,
  discipline text,
  tags text[] not null default '{}',
  tagline text,                   -- 一句話介紹（列表卡片）
  bio text,
  philosophy text,                -- 詳情頁引言
  instagram text,
  city text,
  hue int not null default 0,     -- 佔位圖色相（真實圖片上線後可移除）
  portrait_url text,
  cover_url text,
  sort int not null default 0,
  is_demo boolean not null default false,
  created_at timestamptz not null default now()
);

create table tugo.collections (
  id text primary key,            -- /collections/[id]
  name text not null,
  name_en text,
  season text,
  concept text,
  description text,
  hue int not null default 0,
  cover_url text,
  sort int not null default 0,
  is_demo boolean not null default false
);

create table tugo.collection_artists (
  collection_id text references tugo.collections(id) on delete cascade,
  artist_id text references tugo.artists(id) on delete cascade,
  sort int not null default 0,
  primary key (collection_id, artist_id)
);

create type tugo.product_status as enum ('instock', 'limited', 'preorder', 'soldout');

create table tugo.products (
  id text primary key,
  slug text unique not null,      -- /products/[slug]
  name text not null,
  artist_id text not null references tugo.artists(id),
  category_id text not null references tugo.categories(id),
  collection_id text references tugo.collections(id),
  price int not null,             -- 新台幣整數
  status tugo.product_status not null default 'instock',
  ship_date date,                 -- 預購預計出貨日
  is_new boolean not null default false,
  popularity int not null default 0,
  released_at date not null default current_date,
  colors text[] not null default '{}',
  sizes text[] not null default '{}',
  stock int not null default 0,
  material text, care text, dimensions text, story text,
  hue int not null default 0,
  is_demo boolean not null default false,
  created_at timestamptz not null default now()
);
create index on tugo.products (artist_id);
create index on tugo.products (category_id);
create index on tugo.products (collection_id);

create table tugo.product_images (
  id bigserial primary key,
  product_id text references tugo.products(id) on delete cascade,
  url text not null,
  label text,                     -- 情境照 / 平拍照 / 細節照 / 背面／包裝
  sort int not null default 0
);

create table tugo.color_swatches (name text primary key, hex text not null);
create table tugo.size_chart (size text primary key, chest_cm int, length_cm int, sort int default 0);
create table tugo.faqs (id bigserial primary key, question text not null, answer text not null, sort int default 0);
create table tugo.info_sections (
  id bigserial primary key,
  page text not null,             -- shipping / returns / privacy / terms
  page_title text not null,
  heading text not null,
  body text not null,
  sort int default 0
);

-- 表單收件（前端只 insert，不可讀）
create table tugo.newsletter_subscribers (
  id bigserial primary key,
  email text unique not null,
  created_at timestamptz not null default now()
);

create table tugo.artist_applications (
  id bigserial primary key,
  name text not null,
  email text not null,
  portfolio_url text not null,
  discipline text not null,
  bio text not null check (char_length(bio) >= 20),
  idea text,
  consent_original boolean not null check (consent_original),
  consent_privacy boolean not null check (consent_privacy),
  status text not null default 'pending',
  created_at timestamptz not null default now()
);

-- 會員相關（使用 Supabase Auth）
create table tugo.favorites (
  user_id uuid references auth.users(id) on delete cascade,
  product_id text references tugo.products(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, product_id)
);

-- 訂單：金流串接後才啟用，先建表
create table tugo.orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id),
  recipient_name text not null, phone text not null, email text not null,
  ship_method text not null check (ship_method in ('home','cvs')),
  city text, address text, cvs_store text, note text,
  pay_method text not null check (pay_method in ('card','atm','cvs','linepay')),
  subtotal int not null, shipping_fee int not null, total int not null,
  status text not null default 'pending_payment',
  created_at timestamptz not null default now()
);
create table tugo.order_items (
  id bigserial primary key,
  order_id uuid references tugo.orders(id) on delete cascade,
  product_id text references tugo.products(id),
  color text, size text, qty int not null check (qty between 1 and 10),
  unit_price int not null
);

-- RLS
alter table tugo.categories enable row level security;
alter table tugo.artists enable row level security;
alter table tugo.collections enable row level security;
alter table tugo.collection_artists enable row level security;
alter table tugo.products enable row level security;
alter table tugo.product_images enable row level security;
alter table tugo.color_swatches enable row level security;
alter table tugo.size_chart enable row level security;
alter table tugo.faqs enable row level security;
alter table tugo.info_sections enable row level security;
alter table tugo.newsletter_subscribers enable row level security;
alter table tugo.artist_applications enable row level security;
alter table tugo.favorites enable row level security;
alter table tugo.orders enable row level security;
alter table tugo.order_items enable row level security;

create policy "public read" on tugo.categories for select using (true);
create policy "public read" on tugo.artists for select using (true);
create policy "public read" on tugo.collections for select using (true);
create policy "public read" on tugo.collection_artists for select using (true);
create policy "public read" on tugo.products for select using (true);
create policy "public read" on tugo.product_images for select using (true);
create policy "public read" on tugo.color_swatches for select using (true);
create policy "public read" on tugo.size_chart for select using (true);
create policy "public read" on tugo.faqs for select using (true);
create policy "public read" on tugo.info_sections for select using (true);

create policy "anon insert" on tugo.newsletter_subscribers for insert with check (true);
create policy "anon insert" on tugo.artist_applications for insert with check (true);

create policy "own favorites" on tugo.favorites for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own orders read" on tugo.orders for select using (auth.uid() = user_id);
create policy "own order items read" on tugo.order_items for select using (exists (select 1 from tugo.orders o where o.id = order_id and o.user_id = auth.uid()));
-- orders insert 應由 server（service role）在金流回呼後執行，不開放前端直接寫入

-- ---------- 權限（RLS 之外的 table grant；RLS policy 同原檔） ----------
grant select on tugo.categories, tugo.artists, tugo.collections, tugo.collection_artists,
  tugo.products, tugo.product_images, tugo.color_swatches, tugo.size_chart,
  tugo.faqs, tugo.info_sections to anon, authenticated;
-- 表單收件：前端只 insert、不可讀
grant insert on tugo.newsletter_subscribers, tugo.artist_applications to anon, authenticated;
grant usage on sequence tugo.newsletter_subscribers_id_seq, tugo.artist_applications_id_seq to anon, authenticated;
-- 會員資料（RLS 限本人）
grant select, insert, update, delete on tugo.favorites to authenticated;
grant select on tugo.orders, tugo.order_items to authenticated;
-- service role（後台 / server）全權
grant all on all tables in schema tugo to service_role;
grant usage, select on all sequences in schema tugo to service_role;
