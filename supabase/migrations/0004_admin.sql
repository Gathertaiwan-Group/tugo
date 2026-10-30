-- 圖個有意思 TUGO STUDIO · 0004_admin
-- 後台（/admin）所需的表、欄位、函式。只動 tugo schema（此庫與其他客戶共用）。
-- 對既有表一律「加法」：只加 nullable 或有 default 的欄位，不改型別、不加 check 到既有欄位，
-- 確保前台對 orders / order_items 的既有 insert 不會失敗。
-- 後台表：開 RLS、不建任何 policy、revoke anon/authenticated → 只有 service_role 能讀寫。

-- ───────────────────────── 管理員 ─────────────────────────
create table if not exists tugo.admin_users (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  name text,
  password_hash text not null,
  password_salt text not null,
  role text not null default 'staff' check (role in ('owner', 'staff')),
  active boolean not null default true,
  -- session 版本：停用 / 改密碼 / 改角色時 +1，舊 cookie 立即失效（server 端每次請求比對）
  session_version int not null default 1,
  created_at timestamptz not null default now(),
  last_login_at timestamptz
);

-- ───────────────────────── 訂單擴充（加法） ─────────────────────────
alter table tugo.orders add column if not exists order_no text;
alter table tugo.orders add column if not exists fulfillment_status text not null default 'unfulfilled';
alter table tugo.orders add column if not exists carrier text;
alter table tugo.orders add column if not exists tracking_no text;
alter table tugo.orders add column if not exists shipped_at timestamptz;
alter table tugo.orders add column if not exists delivered_at timestamptz;
alter table tugo.orders add column if not exists updated_at timestamptz;
alter table tugo.orders add column if not exists is_demo boolean not null default false;
create unique index if not exists orders_order_no_key on tugo.orders (order_no);
create index if not exists orders_created_at_idx on tugo.orders (created_at desc);
create index if not exists orders_email_lower_idx on tugo.orders (lower(email));
create index if not exists orders_fulfillment_idx on tugo.orders (fulfillment_status);
create index if not exists order_items_order_idx on tugo.order_items (order_id);

-- 訂單編號：TG + 台北日期 YYYYMMDD + '-' + 當日 5 碼流水（每日 99999 張上限，條碼 payload 固定 14 碼）
create table if not exists tugo.order_no_counters (
  day date primary key,
  n int not null default 0
);

create or replace function tugo.gen_order_no() returns trigger
language plpgsql
security definer
set search_path = tugo, pg_temp
as $$
declare
  d date := (now() at time zone 'Asia/Taipei')::date;
  seq int;
begin
  if new.order_no is null or new.order_no = '' then
    insert into tugo.order_no_counters as c (day, n) values (d, 1)
      on conflict (day) do update set n = c.n + 1
      returning c.n into seq;
    new.order_no := 'TG' || to_char(d, 'YYYYMMDD') || '-' || lpad(seq::text, 5, '0');
  end if;
  return new;
end;
$$;

drop trigger if exists orders_gen_order_no on tugo.orders;
create trigger orders_gen_order_no before insert on tugo.orders
  for each row execute function tugo.gen_order_no();

-- 既有訂單補號（依建立時間；流水從 50001 起，避開當日計數器）
with numbered as (
  select id, (created_at at time zone 'Asia/Taipei')::date as d,
         row_number() over (partition by (created_at at time zone 'Asia/Taipei')::date order by created_at) as rn
  from tugo.orders where order_no is null
)
update tugo.orders o
   set order_no = 'TG' || to_char(n.d, 'YYYYMMDD') || '-' || lpad((n.rn + 50000)::text, 5, '0')
  from numbered n where o.id = n.id;

-- 出貨進度事件（append-only；orders.fulfillment_status 是由事件重算的快取）
create table if not exists tugo.order_events (
  id bigserial primary key,
  order_id uuid not null references tugo.orders(id) on delete cascade,
  station text not null check (station in ('picking', 'packed', 'shipped', 'delivered')),
  admin_id uuid references tugo.admin_users(id) on delete set null,
  admin_name text,
  note text,
  scanned_at timestamptz not null default now()
);
create index if not exists order_events_order_idx on tugo.order_events (order_id, scanned_at desc);
create index if not exists order_events_station_idx on tugo.order_events (station, scanned_at desc);

-- ───────────────────────── 內部備註（訂單 / 合作申請 / 客戶共用） ─────────────────────────
create table if not exists tugo.admin_notes (
  id bigserial primary key,
  subject_type text not null check (subject_type in ('order', 'application', 'customer')),
  subject_id text not null,
  body text not null check (char_length(body) between 1 and 2000),
  admin_id uuid references tugo.admin_users(id) on delete set null,
  admin_name text,
  created_at timestamptz not null default now()
);
create index if not exists admin_notes_subject_idx on tugo.admin_notes (subject_type, subject_id, created_at desc);

-- ───────────────────────── 合作申請擴充（加法） ─────────────────────────
alter table tugo.artist_applications add column if not exists updated_at timestamptz;
alter table tugo.artist_applications add column if not exists reviewed_by uuid references tugo.admin_users(id) on delete set null;
create index if not exists artist_applications_created_idx on tugo.artist_applications (created_at desc);
create index if not exists artist_applications_email_lower_idx on tugo.artist_applications (lower(email));

-- ───────────────────────── 商品擴充（加法） ─────────────────────────
-- 上下架：default true，前台既有查詢不受影響；前台應加 .eq('is_published', true)
alter table tugo.products add column if not exists is_published boolean not null default true;
alter table tugo.products add column if not exists updated_at timestamptz;

-- ───────────────────────── 客戶知識庫 ─────────────────────────
-- 顧客以小寫 email 為鍵（訪客結帳也能聚合）
create table if not exists tugo.customer_profiles (
  email text primary key check (email = lower(email)),
  display_name text,
  phone text,
  tier text not null default 'regular' check (tier in ('vip', 'regular', 'watch')),
  tags text[] not null default '{}',
  source_channel text,
  preferred_artists text[] not null default '{}',
  preferred_categories text[] not null default '{}',
  size_pref text,
  ai_summary text,
  service_notes text,
  is_demo boolean not null default false,
  updated_at timestamptz not null default now()
);

-- 追蹤與回訪
create table if not exists tugo.followups (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(title) between 1 and 160),
  reason text,
  priority text not null default 'medium' check (priority in ('low', 'medium', 'high')),
  status text not null default 'open' check (status in ('open', 'completed', 'cancelled')),
  assignee_id uuid references tugo.admin_users(id) on delete set null,
  due_at timestamptz not null,
  completed_at timestamptz,
  related_type text check (related_type in ('order', 'application', 'customer')),
  related_id text,
  customer_email text,
  created_by uuid references tugo.admin_users(id) on delete set null,
  is_demo boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists followups_status_due_idx on tugo.followups (status, due_at);
create index if not exists followups_email_idx on tugo.followups (customer_email);

-- 網站圖片（固定 slot；公開內容，前台可讀）
create table if not exists tugo.site_images (
  slot_key text primary key,
  public_url text,
  storage_path text,
  alt text,
  width int,
  height int,
  updated_by uuid references tugo.admin_users(id) on delete set null,
  updated_at timestamptz not null default now()
);

-- ───────────────────────── 顧客聚合 view ─────────────────────────
create or replace view tugo.admin_customers with (security_invoker = true) as
with emails as (
  select lower(email) as email from tugo.orders
  union select lower(email) from tugo.newsletter_subscribers
  union select lower(email) from tugo.artist_applications
  union select email from tugo.customer_profiles
),
o as (
  select lower(email) as email,
         count(*) as order_count,
         coalesce(sum(total) filter (where status not in ('cancelled', 'refunded')), 0) as total_spent,
         max(created_at) as last_order_at,
         min(created_at) as first_order_at,
         (array_agg(recipient_name order by created_at desc))[1] as name,
         (array_agg(phone order by created_at desc))[1] as phone,
         bool_and(is_demo) as all_demo
  from tugo.orders group by lower(email)
),
a as (
  select lower(email) as email, count(*) as application_count, max(created_at) as last_application_at,
         (array_agg(name order by created_at desc))[1] as name
  from tugo.artist_applications group by lower(email)
),
n as (
  select lower(email) as email, min(created_at) as subscribed_at from tugo.newsletter_subscribers group by lower(email)
)
select e.email,
       coalesce(p.display_name, o.name, a.name) as name,
       coalesce(p.phone, o.phone) as phone,
       coalesce(o.order_count, 0)::int as order_count,
       coalesce(o.total_spent, 0)::int as total_spent,
       o.first_order_at,
       o.last_order_at,
       coalesce(a.application_count, 0)::int as application_count,
       n.subscribed_at,
       coalesce(p.tier, 'regular') as tier,
       coalesce(p.tags, '{}') as tags,
       greatest(o.last_order_at, a.last_application_at, n.subscribed_at, p.updated_at) as last_activity_at,
       coalesce(p.is_demo, o.all_demo, false) as is_demo
from emails e
left join o on o.email = e.email
left join a on a.email = e.email
left join n on n.email = e.email
left join tugo.customer_profiles p on p.email = e.email;

-- ───────────────────────── 總覽統計 RPC（DB 端聚合，台北日界） ─────────────────────────
create or replace function tugo.admin_dashboard(include_demo boolean default false)
returns jsonb
language sql
stable
set search_path = tugo, pg_temp
as $$
  with bounds as (
    select (date_trunc('day', now() at time zone 'Asia/Taipei')) at time zone 'Asia/Taipei' as today_start,
           (date_trunc('month', now() at time zone 'Asia/Taipei')) at time zone 'Asia/Taipei' as month_start,
           (date_trunc('day', now() at time zone 'Asia/Taipei') - interval '13 days') at time zone 'Asia/Taipei' as d14_start
  ),
  ord as (select * from tugo.orders where include_demo or not is_demo),
  live as (select * from ord where status not in ('cancelled', 'refunded'))
  select jsonb_build_object(
    'orders_today', (select count(*) from live, bounds where created_at >= today_start),
    'orders_month', (select count(*) from live, bounds where created_at >= month_start),
    'revenue_month_paid', (select coalesce(sum(total), 0) from live, bounds where created_at >= month_start and status = 'paid'),
    'gross_month', (select coalesce(sum(total), 0) from live, bounds where created_at >= month_start),
    'pending_payment', (select count(*) from live where status = 'pending_payment'),
    'to_ship', (select count(*) from live where fulfillment_status in ('unfulfilled', 'picking', 'packed')),
    'shipped_in_transit', (select count(*) from live where fulfillment_status = 'shipped'),
    'applications_pending', (select count(*) from tugo.artist_applications where status in ('pending', 'reviewing')),
    'newsletter_total', (select count(*) from tugo.newsletter_subscribers),
    'newsletter_month', (select count(*) from tugo.newsletter_subscribers, bounds where created_at >= month_start),
    'low_stock', (select count(*) from tugo.products where (include_demo or not is_demo) and is_published and status <> 'soldout' and stock <= 3),
    'followups_open', (select count(*) from tugo.followups where status = 'open' and (include_demo or not is_demo)),
    'followups_overdue', (select count(*) from tugo.followups where status = 'open' and due_at < now() and (include_demo or not is_demo)),
    'daily', (
      select coalesce(jsonb_agg(jsonb_build_object('day', to_char(g.day, 'YYYY-MM-DD'), 'orders', coalesce(x.cnt, 0), 'amount', coalesce(x.amt, 0)) order by g.day), '[]'::jsonb)
      from generate_series((now() at time zone 'Asia/Taipei')::date - 13, (now() at time zone 'Asia/Taipei')::date, interval '1 day') as g(day)
      left join (
        select (created_at at time zone 'Asia/Taipei')::date as d, count(*) as cnt, sum(total) as amt
        from live, bounds where created_at >= d14_start group by 1
      ) x on x.d = g.day::date
    )
  );
$$;

-- 熱銷商品（依訂單品項數量；排除取消/退款）
create or replace function tugo.admin_top_products(include_demo boolean default false, since timestamptz default now() - interval '30 days', lim int default 10)
returns table (product_id text, name text, artist_name text, qty bigint, amount bigint, stock int)
language sql
stable
set search_path = tugo, pg_temp
as $$
  select p.id, p.name, ar.name, sum(i.qty)::bigint, sum(i.qty * i.unit_price)::bigint, p.stock
  from tugo.order_items i
  join tugo.orders o on o.id = i.order_id
  join tugo.products p on p.id = i.product_id
  left join tugo.artists ar on ar.id = p.artist_id
  where o.created_at >= since and o.status not in ('cancelled', 'refunded') and (include_demo or not o.is_demo)
  group by p.id, p.name, ar.name, p.stock
  order by 4 desc
  limit least(greatest(lim, 1), 50);
$$;

-- 商品圖片整組重排（後台用；原子）
create or replace function tugo.admin_reorder_product_images(p_product text, p_ids bigint[])
returns void
language plpgsql
set search_path = tugo, pg_temp
as $$
declare i int;
begin
  for i in 1 .. coalesce(array_length(p_ids, 1), 0) loop
    update tugo.product_images set sort = i - 1 where id = p_ids[i] and product_id = p_product;
  end loop;
end;
$$;

-- ───────────────────────── RLS 與權限 ─────────────────────────
alter table tugo.admin_users enable row level security;
alter table tugo.order_no_counters enable row level security;
alter table tugo.order_events enable row level security;
alter table tugo.admin_notes enable row level security;
alter table tugo.customer_profiles enable row level security;
alter table tugo.followups enable row level security;
alter table tugo.site_images enable row level security;

revoke all on tugo.admin_users, tugo.order_no_counters, tugo.order_events, tugo.admin_notes,
  tugo.customer_profiles, tugo.followups, tugo.admin_customers from anon, authenticated;
revoke all on tugo.site_images from anon, authenticated;

-- site_images 是公開版面內容：前台可讀（只讀）
drop policy if exists "public read" on tugo.site_images;
create policy "public read" on tugo.site_images for select using (true);
grant select on tugo.site_images to anon, authenticated;

grant all on tugo.admin_users, tugo.order_no_counters, tugo.order_events, tugo.admin_notes,
  tugo.customer_profiles, tugo.followups, tugo.site_images to service_role;
grant select on tugo.admin_customers to service_role;
grant usage, select on sequence tugo.order_events_id_seq, tugo.admin_notes_id_seq to service_role;

revoke all on function tugo.admin_dashboard(boolean) from public, anon, authenticated;
revoke all on function tugo.admin_top_products(boolean, timestamptz, int) from public, anon, authenticated;
revoke all on function tugo.admin_reorder_product_images(text, bigint[]) from public, anon, authenticated;
revoke all on function tugo.gen_order_no() from public, anon, authenticated;
grant execute on function tugo.admin_dashboard(boolean) to service_role;
grant execute on function tugo.admin_top_products(boolean, timestamptz, int) to service_role;
grant execute on function tugo.admin_reorder_product_images(text, bigint[]) to service_role;
