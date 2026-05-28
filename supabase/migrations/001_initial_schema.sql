-- ============================================================
-- Pixy — Initial Schema
-- Run this in Supabase SQL Editor or via: supabase db push
-- ============================================================

-- Enable PostGIS for geospatial queries (available on Supabase)
create extension if not exists postgis;

-- ─── Enums ──────────────────────────────────────────────────

create type user_role as enum ('client', 'photographer');
create type order_status as enum (
  'pending',
  'accepted',
  'in_progress',
  'delivering',
  'completed',
  'cancelled'
);

-- ─── Users ──────────────────────────────────────────────────
-- Extends Supabase auth.users

create table public.users (
  id          uuid primary key references auth.users(id) on delete cascade,
  email       text not null unique,
  full_name   text not null,
  avatar_url  text,
  role        user_role not null default 'client',
  created_at  timestamptz not null default now()
);

alter table public.users enable row level security;

create policy "Users can view all profiles" on public.users
  for select using (true);

create policy "Users can update own profile" on public.users
  for update using (auth.uid() = id);

-- Auto-create user row on signup
create or replace function public.handle_new_user()
returns trigger language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.users (id, email, full_name, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    coalesce((new.raw_user_meta_data->>'role')::public.user_role, 'client'::public.user_role)
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ─── Photographer Profiles ───────────────────────────────────

create table public.photographer_profiles (
  id                  uuid primary key default gen_random_uuid(),
  user_id             uuid not null unique references public.users(id) on delete cascade,
  bio                 text not null default '',
  location_name       text not null default '',
  latitude            float8 not null default 0,
  longitude           float8 not null default 0,
  location            geography(point, 4326),  -- for geo queries
  base_price          numeric(10,2) not null default 50,
  is_available        boolean not null default false,
  portfolio_urls      text[] not null default '{}',
  specialties         text[] not null default '{}',
  rating              numeric(3,2) not null default 0,
  total_reviews       int not null default 0,
  total_orders        int not null default 0,
  response_time_min   int not null default 5,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

-- Index for geospatial proximity search
create index photographer_location_idx on public.photographer_profiles using gist (location);
create index photographer_available_idx on public.photographer_profiles (is_available) where is_available = true;

alter table public.photographer_profiles enable row level security;

create policy "Anyone can view photographer profiles" on public.photographer_profiles
  for select using (true);

create policy "Photographers can update own profile" on public.photographer_profiles
  for update using (auth.uid() = user_id);

create policy "Photographers can insert own profile" on public.photographer_profiles
  for insert with check (auth.uid() = user_id);

-- Sync lat/lng into geography column
create or replace function sync_photographer_location()
returns trigger language plpgsql as $$
begin
  new.location := st_setsrid(st_makepoint(new.longitude, new.latitude), 4326)::geography;
  new.updated_at := now();
  return new;
end;
$$;

create trigger photographer_location_sync
  before insert or update on public.photographer_profiles
  for each row execute function sync_photographer_location();

-- ─── Services ────────────────────────────────────────────────

create table public.services (
  id                uuid primary key default gen_random_uuid(),
  photographer_id   uuid not null references public.photographer_profiles(id) on delete cascade,
  name              text not null,
  description       text not null default '',
  price             numeric(10,2) not null,
  duration_min      int not null default 60,
  deliverables      text not null default '',
  is_active         boolean not null default true,
  created_at        timestamptz not null default now()
);

alter table public.services enable row level security;

create policy "Anyone can view active services" on public.services
  for select using (is_active = true);

create policy "Photographers manage own services" on public.services
  for all using (
    exists (
      select 1 from public.photographer_profiles p
      where p.id = photographer_id and p.user_id = auth.uid()
    )
  );

-- ─── Orders ──────────────────────────────────────────────────

create table public.orders (
  id                uuid primary key default gen_random_uuid(),
  client_id         uuid not null references public.users(id),
  photographer_id   uuid not null references public.photographer_profiles(id),
  service_id        uuid not null references public.services(id),
  status            order_status not null default 'pending',
  meet_latitude     float8 not null,
  meet_longitude    float8 not null,
  meet_address      text not null,
  notes             text,
  scheduled_at      timestamptz,   -- null = on-demand / instant
  total_price       numeric(10,2) not null,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

alter table public.orders enable row level security;

create policy "Client can view own orders" on public.orders
  for select using (auth.uid() = client_id);

create policy "Photographer can view assigned orders" on public.orders
  for select using (
    exists (
      select 1 from public.photographer_profiles p
      where p.id = photographer_id and p.user_id = auth.uid()
    )
  );

create policy "Client can create orders" on public.orders
  for insert with check (auth.uid() = client_id);

create policy "Photographer can update order status" on public.orders
  for update using (
    exists (
      select 1 from public.photographer_profiles p
      where p.id = photographer_id and p.user_id = auth.uid()
    )
  );

create policy "Client can cancel own orders" on public.orders
  for update using (auth.uid() = client_id and status = 'pending');

-- updated_at trigger
create or replace function update_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at := now(); return new; end;
$$;

create trigger orders_updated_at
  before update on public.orders
  for each row execute function update_updated_at();

-- ─── Order Photos ─────────────────────────────────────────────

create table public.order_photos (
  id              uuid primary key default gen_random_uuid(),
  order_id        uuid not null references public.orders(id) on delete cascade,
  url             text not null,
  thumbnail_url   text not null,
  delivered_at    timestamptz not null default now()
);

alter table public.order_photos enable row level security;

create policy "Order participants can view photos" on public.order_photos
  for select using (
    exists (
      select 1 from public.orders o
      where o.id = order_id
      and (
        o.client_id = auth.uid()
        or exists (
          select 1 from public.photographer_profiles p
          where p.id = o.photographer_id and p.user_id = auth.uid()
        )
      )
    )
  );

create policy "Photographer can upload photos" on public.order_photos
  for insert with check (
    exists (
      select 1 from public.orders o
      join public.photographer_profiles p on p.id = o.photographer_id
      where o.id = order_id and p.user_id = auth.uid()
    )
  );

-- ─── Reviews ─────────────────────────────────────────────────

create table public.reviews (
  id                uuid primary key default gen_random_uuid(),
  order_id          uuid not null unique references public.orders(id),
  client_id         uuid not null references public.users(id),
  photographer_id   uuid not null references public.photographer_profiles(id),
  rating            smallint not null check (rating between 1 and 5),
  comment           text not null default '',
  created_at        timestamptz not null default now()
);

alter table public.reviews enable row level security;

create policy "Anyone can view reviews" on public.reviews for select using (true);
create policy "Client can leave review for completed order" on public.reviews
  for insert with check (
    auth.uid() = client_id
    and exists (
      select 1 from public.orders o
      where o.id = order_id and o.status = 'completed'
    )
  );

-- Auto-update photographer rating after review insert
create or replace function update_photographer_rating()
returns trigger language plpgsql as $$
begin
  update public.photographer_profiles
  set
    rating = (select avg(rating)::numeric(3,2) from public.reviews where photographer_id = new.photographer_id),
    total_reviews = (select count(*)::int from public.reviews where photographer_id = new.photographer_id)
  where id = new.photographer_id;
  return new;
end;
$$;

create trigger review_rating_update
  after insert on public.reviews
  for each row execute function update_photographer_rating();

-- ─── Conversations & Messages ─────────────────────────────────

create table public.conversations (
  id                uuid primary key default gen_random_uuid(),
  order_id          uuid not null unique references public.orders(id),
  client_id         uuid not null references public.users(id),
  photographer_id   uuid not null references public.users(id),
  created_at        timestamptz not null default now()
);

create table public.messages (
  id                  uuid primary key default gen_random_uuid(),
  conversation_id     uuid not null references public.conversations(id) on delete cascade,
  sender_id           uuid not null references public.users(id),
  content             text not null,
  created_at          timestamptz not null default now()
);

alter table public.conversations enable row level security;
alter table public.messages enable row level security;

create policy "Participants can access conversation" on public.conversations
  for select using (auth.uid() = client_id or auth.uid() = photographer_id);

create policy "Participants can send messages" on public.messages
  for all using (
    exists (
      select 1 from public.conversations c
      where c.id = conversation_id
      and (c.client_id = auth.uid() or c.photographer_id = auth.uid())
    )
  );

-- ─── Storage Buckets ─────────────────────────────────────────
-- Run in Supabase dashboard or via CLI

-- insert into storage.buckets (id, name, public) values ('avatars', 'avatars', true);
-- insert into storage.buckets (id, name, public) values ('portfolio', 'portfolio', true);
-- insert into storage.buckets (id, name, public) values ('order-photos', 'order-photos', false);

-- ─── Nearby Photographers Function ────────────────────────────

create or replace function nearby_photographers(
  lat float8,
  lng float8,
  radius_km float8 default 10
)
returns table (
  id uuid,
  user_id uuid,
  bio text,
  location_name text,
  latitude float8,
  longitude float8,
  base_price numeric,
  is_available boolean,
  portfolio_urls text[],
  specialties text[],
  rating numeric,
  total_reviews int,
  total_orders int,
  response_time_min int,
  distance_km float8
)
language sql stable as $$
  select
    p.id, p.user_id, p.bio, p.location_name,
    p.latitude, p.longitude, p.base_price, p.is_available,
    p.portfolio_urls, p.specialties, p.rating, p.total_reviews,
    p.total_orders, p.response_time_min,
    (st_distance(p.location, st_setsrid(st_makepoint(lng, lat), 4326)::geography) / 1000)::float8 as distance_km
  from public.photographer_profiles p
  where st_dwithin(
    p.location,
    st_setsrid(st_makepoint(lng, lat), 4326)::geography,
    radius_km * 1000
  )
  order by distance_km;
$$;
