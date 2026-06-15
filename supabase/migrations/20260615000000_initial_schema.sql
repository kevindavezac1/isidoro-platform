-- ============================================================
-- INITIAL SCHEMA — Plataforma de Fidelización Isidoro
-- Migración: 20260615000000
-- ============================================================

-- ============================================================
-- SETTINGS (sin dependencias)
-- ============================================================
create table public.settings (
  id              uuid          primary key default gen_random_uuid(),
  points_per_peso numeric(10,4) not null default 1.0,
  timezone        text          not null default 'America/Argentina/Buenos_Aires',
  updated_at      timestamptz   not null default now()
);

alter table public.settings enable row level security;

create policy "settings: lectura pública" on public.settings
  for select using (true);

-- "settings: escritura solo admin" se crea al final, después de que profiles existe

insert into public.settings (points_per_peso) values (1.0);

-- ============================================================
-- PROFILES (extiende auth.users)
-- ============================================================
create table public.profiles (
  id         uuid        primary key references auth.users(id) on delete cascade,
  role       text        not null check (role in ('cliente', 'cajero', 'admin')),
  full_name  text        not null,
  phone      text,
  qr_token   text        not null unique default gen_random_uuid()::text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "profiles: usuario ve solo el suyo" on public.profiles
  for select using (auth.uid() = id);

create policy "profiles: cajero y admin ven todos" on public.profiles
  for select using (
    exists (select 1 from public.profiles where id = auth.uid() and role in ('cajero', 'admin'))
  );

create policy "profiles: usuario actualiza el suyo" on public.profiles
  for update using (auth.uid() = id);

create policy "profiles: admin actualiza cualquiera" on public.profiles
  for update using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

-- ============================================================
-- CATEGORIES
-- ============================================================
create table public.categories (
  id         uuid        primary key default gen_random_uuid(),
  name       text        not null,
  sort_order int         not null default 0,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.categories enable row level security;

create policy "categories: lectura pública" on public.categories
  for select using (deleted_at is null);

create policy "categories: escritura solo admin" on public.categories
  for all using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

-- ============================================================
-- PRODUCTS
-- ============================================================
create table public.products (
  id           uuid          primary key default gen_random_uuid(),
  category_id  uuid          not null references public.categories(id),
  name         text          not null,
  description  text,
  price        numeric(10,2) not null check (price >= 0),
  image_url    text,
  is_available boolean       not null default true,
  sort_order   int           not null default 0,
  deleted_at   timestamptz,
  created_at   timestamptz   not null default now(),
  updated_at   timestamptz   not null default now()
);

alter table public.products enable row level security;

create policy "products: lectura pública" on public.products
  for select using (deleted_at is null);

create policy "products: escritura solo admin" on public.products
  for all using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

create index idx_products_category_available on public.products (category_id, is_available);

-- ============================================================
-- PROMOTIONS
-- ============================================================
create table public.promotions (
  id          uuid        primary key default gen_random_uuid(),
  name        text        not null,
  description text,
  valid_from  timestamptz not null,
  valid_until timestamptz not null,
  is_active   boolean     not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

alter table public.promotions enable row level security;

create policy "promotions: lectura pública" on public.promotions
  for select using (true);

create policy "promotions: escritura solo admin" on public.promotions
  for all using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

-- ============================================================
-- TIME_OFFERS
-- ============================================================
create table public.time_offers (
  id          uuid        primary key default gen_random_uuid(),
  name        text        not null,
  description text,
  start_time  time        not null,
  end_time    time        not null,
  is_active   boolean     not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

alter table public.time_offers enable row level security;

create policy "time_offers: lectura pública" on public.time_offers
  for select using (true);

create policy "time_offers: escritura solo admin" on public.time_offers
  for all using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

create index idx_time_offers_active on public.time_offers (is_active);

-- ============================================================
-- TIME_OFFER_PRODUCTS (N:M)
-- ============================================================
create table public.time_offer_products (
  id            uuid primary key default gen_random_uuid(),
  time_offer_id uuid not null references public.time_offers(id) on delete cascade,
  product_id    uuid not null references public.products(id) on delete cascade,
  unique (time_offer_id, product_id)
);

alter table public.time_offer_products enable row level security;

create policy "time_offer_products: lectura pública" on public.time_offer_products
  for select using (true);

create policy "time_offer_products: escritura solo admin" on public.time_offer_products
  for all using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

-- ============================================================
-- REWARDS
-- ============================================================
create table public.rewards (
  id          uuid        primary key default gen_random_uuid(),
  name        text        not null,
  description text,
  points_cost int         not null check (points_cost > 0),
  stock       int         check (stock >= 0),
  is_active   boolean     not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

alter table public.rewards enable row level security;

create policy "rewards: lectura pública" on public.rewards
  for select using (is_active = true);

create policy "rewards: escritura solo admin" on public.rewards
  for all using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

-- ============================================================
-- CONSUMPTIONS
-- ============================================================
create table public.consumptions (
  id            uuid          primary key default gen_random_uuid(),
  client_id     uuid          not null references public.profiles(id),
  cashier_id    uuid          not null references public.profiles(id),
  amount        numeric(10,2) not null check (amount > 0),
  points_earned int           not null default 0,
  notes         text,
  session_id    uuid,
  consumed_at   timestamptz   not null default now(),
  created_at    timestamptz   not null default now()
);

alter table public.consumptions enable row level security;

create policy "consumptions: cliente ve las suyas" on public.consumptions
  for select using (auth.uid() = client_id);

create policy "consumptions: cajero y admin ven todas" on public.consumptions
  for select using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role in ('cajero', 'admin')
    )
  );

create policy "consumptions: cajero inserta" on public.consumptions
  for insert with check (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role in ('cajero', 'admin')
    )
  );

-- ============================================================
-- POINTS_BALANCE
-- ============================================================
create table public.points_balance (
  id           uuid        primary key default gen_random_uuid(),
  client_id    uuid        not null unique references public.profiles(id),
  total_points int         not null default 0 check (total_points >= 0),
  updated_at   timestamptz not null default now()
);

alter table public.points_balance enable row level security;

create policy "points_balance: cliente ve el suyo" on public.points_balance
  for select using (auth.uid() = client_id);

create policy "points_balance: cajero y admin ven todos" on public.points_balance
  for select using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role in ('cajero', 'admin')
    )
  );

-- ============================================================
-- REDEMPTIONS
-- ============================================================
create table public.redemptions (
  id           uuid        primary key default gen_random_uuid(),
  client_id    uuid        not null references public.profiles(id),
  reward_id    uuid        not null references public.rewards(id),
  cashier_id   uuid        references public.profiles(id),
  code         char(6)     not null check (code ~ '^[0-9]{6}$'),
  status       text        not null default 'pending'
                             check (status in ('pending', 'confirmed', 'expired')),
  points_used  int         not null check (points_used > 0),
  initiated_at timestamptz not null default now(),
  confirmed_at timestamptz,
  expires_at   timestamptz not null default now() + interval '15 minutes',
  created_at   timestamptz not null default now()
);

alter table public.redemptions enable row level security;

create policy "redemptions: cliente ve las suyas" on public.redemptions
  for select using (auth.uid() = client_id);

create policy "redemptions: cajero y admin ven y modifican todas" on public.redemptions
  for all using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role in ('cajero', 'admin')
    )
  );

create index idx_redemptions_code_status on public.redemptions (code, status);

-- ============================================================
-- POINTS_TRANSACTIONS (fuente de verdad del saldo)
-- ============================================================
create table public.points_transactions (
  id             uuid        primary key default gen_random_uuid(),
  client_id      uuid        not null references public.profiles(id),
  type           text        not null
                               check (type in (
                                 'consumption',
                                 'redemption',
                                 'manual_adjustment',
                                 'expiry'
                               )),
  consumption_id uuid        references public.consumptions(id),
  redemption_id  uuid        references public.redemptions(id),
  adjusted_by    uuid        references public.profiles(id),
  points         int         not null,
  expires_at     timestamptz,
  created_at     timestamptz not null default now()
);

alter table public.points_transactions enable row level security;

create policy "points_transactions: cliente ve las suyas" on public.points_transactions
  for select using (auth.uid() = client_id);

create policy "points_transactions: cajero y admin ven todas" on public.points_transactions
  for select using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role in ('cajero', 'admin')
    )
  );

create index idx_points_transactions_client_expires on public.points_transactions (client_id, expires_at);

-- ============================================================
-- POLICY DIFERIDA: settings admin (requería profiles)
-- ============================================================
create policy "settings: escritura solo admin" on public.settings
  for all using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );
