-- 圖個有意思 TUGO STUDIO — Supabase schema (Postgres)
-- 執行順序：schema.sql → seed.sql
-- 欄位名稱對應 prototype/tugo-data.js（對照表見 README §6）

create table categories (
  id text primary key,            -- tees / hats / bags / stickers / posters / living
  name text not null,
  sort int not null default 0
);

create table artists (
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

create table collections (
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

create table collection_artists (
  collection_id text references collections(id) on delete cascade,
  artist_id text references artists(id) on delete cascade,
  sort int not null default 0,
  primary key (collection_id, artist_id)
);

create type product_status as enum ('instock', 'limited', 'preorder', 'soldout');

create table products (
  id text primary key,
  slug text unique not null,      -- /products/[slug]
  name text not null,
  artist_id text not null references artists(id),
  category_id text not null references categories(id),
  collection_id text references collections(id),
  price int not null,             -- 新台幣整數
  status product_status not null default 'instock',
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
create index on products (artist_id);
create index on products (category_id);
create index on products (collection_id);

create table product_images (
  id bigserial primary key,
  product_id text references products(id) on delete cascade,
  url text not null,
  label text,                     -- 情境照 / 平拍照 / 細節照 / 背面／包裝
  sort int not null default 0
);

create table color_swatches (name text primary key, hex text not null);
create table size_chart (size text primary key, chest_cm int, length_cm int, sort int default 0);
create table faqs (id bigserial primary key, question text not null, answer text not null, sort int default 0);
create table info_sections (
  id bigserial primary key,
  page text not null,             -- shipping / returns / privacy / terms
  page_title text not null,
  heading text not null,
  body text not null,
  sort int default 0
);

-- 表單收件（前端只 insert，不可讀）
create table newsletter_subscribers (
  id bigserial primary key,
  email text unique not null,
  created_at timestamptz not null default now()
);

create table artist_applications (
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
create table favorites (
  user_id uuid references auth.users(id) on delete cascade,
  product_id text references products(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, product_id)
);

-- 訂單：金流串接後才啟用，先建表
create table orders (
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
create table order_items (
  id bigserial primary key,
  order_id uuid references orders(id) on delete cascade,
  product_id text references products(id),
  color text, size text, qty int not null check (qty between 1 and 10),
  unit_price int not null
);

-- RLS
alter table categories enable row level security;
alter table artists enable row level security;
alter table collections enable row level security;
alter table collection_artists enable row level security;
alter table products enable row level security;
alter table product_images enable row level security;
alter table color_swatches enable row level security;
alter table size_chart enable row level security;
alter table faqs enable row level security;
alter table info_sections enable row level security;
alter table newsletter_subscribers enable row level security;
alter table artist_applications enable row level security;
alter table favorites enable row level security;
alter table orders enable row level security;
alter table order_items enable row level security;

create policy "public read" on categories for select using (true);
create policy "public read" on artists for select using (true);
create policy "public read" on collections for select using (true);
create policy "public read" on collection_artists for select using (true);
create policy "public read" on products for select using (true);
create policy "public read" on product_images for select using (true);
create policy "public read" on color_swatches for select using (true);
create policy "public read" on size_chart for select using (true);
create policy "public read" on faqs for select using (true);
create policy "public read" on info_sections for select using (true);

create policy "anon insert" on newsletter_subscribers for insert with check (true);
create policy "anon insert" on artist_applications for insert with check (true);

create policy "own favorites" on favorites for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own orders read" on orders for select using (auth.uid() = user_id);
create policy "own order items read" on order_items for select using (exists (select 1 from orders o where o.id = order_id and o.user_id = auth.uid()));
-- orders insert 應由 server（service role）在金流回呼後執行，不開放前端直接寫入
