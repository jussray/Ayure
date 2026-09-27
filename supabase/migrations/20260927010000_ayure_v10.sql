-- AYURE Backend V10: intent-first property network
-- No seed/fake marketplace data is inserted by this migration.

create table if not exists public.ayure_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  profile_type text not null check (profile_type in ('buyer','owner','investor','operator','service_provider','agent','business')),
  display_name text not null,
  business_name text,
  headline text,
  bio text,
  location_text text,
  markets text[] not null default '{}',
  services text[] not null default '{}',
  proof_state text not null default 'reported' check (proof_state in ('example','projected','reported','verified')),
  status text not null default 'draft' check (status in ('draft','review','published','suspended')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.ayure_properties (
  id uuid primary key default gen_random_uuid(),
  owner_profile_id uuid references public.ayure_profiles(id) on delete set null,
  title text not null,
  slug text unique,
  location_text text not null,
  price numeric,
  bedrooms numeric,
  bathrooms numeric,
  area_sqft numeric,
  property_type text,
  summary text,
  image_urls text[] not null default '{}',
  proof_state text not null default 'reported' check (proof_state in ('example','projected','reported','verified')),
  status text not null default 'draft' check (status in ('draft','review','published','unavailable')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.ayure_services (
  id uuid primary key default gen_random_uuid(),
  provider_profile_id uuid not null references public.ayure_profiles(id) on delete cascade,
  title text not null,
  summary text,
  service_tags text[] not null default '{}',
  markets text[] not null default '{}',
  price_from numeric,
  proof_state text not null default 'reported' check (proof_state in ('example','projected','reported','verified')),
  status text not null default 'draft' check (status in ('draft','review','published','paused')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.ayure_opportunities (
  id uuid primary key default gen_random_uuid(),
  creator_profile_id uuid references public.ayure_profiles(id) on delete set null,
  property_id uuid references public.ayure_properties(id) on delete set null,
  title text not null,
  opportunity_type text not null,
  summary text,
  location_text text,
  target_roles text[] not null default '{}',
  budget_min numeric,
  budget_max numeric,
  proof_state text not null default 'reported' check (proof_state in ('example','projected','reported','verified')),
  status text not null default 'draft' check (status in ('draft','review','published','matched','closed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.ayure_intents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  anonymous_fingerprint text,
  intent_kind text not null check (intent_kind in ('explore','buy','find_operator','transform','invest','offer_services')),
  location_text text,
  budget_max numeric,
  target_kinds text[] not null default '{}',
  terms text[] not null default '{}',
  consented boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.ayure_connections (
  id uuid primary key default gen_random_uuid(),
  requester_profile_id uuid not null references public.ayure_profiles(id) on delete cascade,
  target_type text not null check (target_type in ('profile','property','service','opportunity','business')),
  target_id uuid not null,
  intent_id uuid references public.ayure_intents(id) on delete set null,
  message text,
  status text not null default 'requested' check (status in ('requested','accepted','declined','closed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.ayure_leads (
  id uuid primary key default gen_random_uuid(),
  role text not null check (role in ('buyer','owner','investor','operator','service_provider')),
  name text not null,
  email text not null,
  goal text not null,
  receipt text not null unique,
  status text not null default 'new' check (status in ('new','reviewing','invited','closed')),
  created_at timestamptz not null default now()
);

create index if not exists ayure_profiles_type_status_idx on public.ayure_profiles(profile_type, status);
create index if not exists ayure_properties_status_location_idx on public.ayure_properties(status, location_text);
create index if not exists ayure_services_status_idx on public.ayure_services(status);
create index if not exists ayure_opportunities_status_location_idx on public.ayure_opportunities(status, location_text);
create index if not exists ayure_intents_kind_created_idx on public.ayure_intents(intent_kind, created_at desc);
create index if not exists ayure_connections_requester_status_idx on public.ayure_connections(requester_profile_id, status);

alter table public.ayure_profiles enable row level security;
alter table public.ayure_properties enable row level security;
alter table public.ayure_services enable row level security;
alter table public.ayure_opportunities enable row level security;
alter table public.ayure_intents enable row level security;
alter table public.ayure_connections enable row level security;
alter table public.ayure_leads enable row level security;

drop policy if exists "public read published ayure profiles" on public.ayure_profiles;
create policy "public read published ayure profiles"
on public.ayure_profiles for select
using (status = 'published');

drop policy if exists "public read published ayure properties" on public.ayure_properties;
create policy "public read published ayure properties"
on public.ayure_properties for select
using (status = 'published');

drop policy if exists "public read published ayure services" on public.ayure_services;
create policy "public read published ayure services"
on public.ayure_services for select
using (status = 'published');

drop policy if exists "public read published ayure opportunities" on public.ayure_opportunities;
create policy "public read published ayure opportunities"
on public.ayure_opportunities for select
using (status = 'published');

drop policy if exists "users manage own ayure profile" on public.ayure_profiles;
create policy "users manage own ayure profile"
on public.ayure_profiles for all
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

drop policy if exists "users read own ayure intents" on public.ayure_intents;
create policy "users read own ayure intents"
on public.ayure_intents for select
to authenticated
using (user_id = auth.uid());

drop policy if exists "users create own ayure intents" on public.ayure_intents;
create policy "users create own ayure intents"
on public.ayure_intents for insert
to authenticated
with check (user_id = auth.uid());

-- ayure_leads intentionally has no public policy.
-- v0 lead capture writes only through the server-side service-role API route.
