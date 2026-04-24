-- Baseline: empty remote `public` — run before all other migrations in this folder.
-- Source of truth snapshot: `supabase/schema.sql` (users / guardian_profiles.user_id / content_posts.author_user_id model).
-- Later migrations add matches, point_*, user_profiles, admin_accounts, traveler_saved_*, RLS, and idempotent column tweaks.

-- Legacy reference schema (pre–formal model).
-- Implementation-ready DDL + RLS + phasing: see `schema_production.sql`.
--
-- Korea SafeMate — Supabase schema (revised: 3-layer product)
-- Layers: (1) local intel feed, (2) guardian community + reputation, (3) safe matching / practical support.
-- TODO(prod): Migrations + RLS on every table; separate policies for traveler / contributor / tiers / admin.

create extension if not exists "pgcrypto";

-- ——— Enums ———
create type public.user_role as enum (
  'traveler',
  'contributor',
  'active_guardian',
  'verified_guardian',
  'admin'
);

create type public.guardian_tier as enum (
  'contributor',
  'active_guardian',
  'verified_guardian'
);

create type public.booking_status as enum (
  'requested',
  'reviewing',
  'matched',
  'confirmed',
  'in_progress',
  'completed',
  'cancelled',
  'issue_reported'
);

create type public.guardian_approval_status as enum (
  'pending',
  'under_review',
  'approved',
  'paused',
  'rejected'
);

create type public.service_type_code as enum ('arrival', 'k_route', 'first_24h');
create type public.language_proficiency as enum ('basic', 'conversational', 'fluent', 'native');
create type public.incident_severity as enum ('low', 'medium', 'high');
create type public.admin_note_entity as enum ('booking', 'guardian', 'traveler', 'content_post');

create type public.region_phase as enum ('phase_1', 'phase_2');
create type public.content_post_status as enum ('draft', 'pending', 'approved', 'rejected');
create type public.content_post_kind as enum (
  'hot_place',
  'local_tip',
  'food',
  'shopping',
  'k_content',
  'practical'
);
create type public.contact_channel as enum ('telegram', 'kakao', 'whatsapp', 'line', 'email', 'other');

-- ——— Core users ———
create table public.users (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  role public.user_role not null default 'traveler',
  created_at timestamptz not null default now()
);

comment on column public.users.role is
  'Primary app role; production may also use profile flags (e.g. traveler + contributor).';

-- ——— Regions (expandable Phase 1 metros → Phase 2 destinations) ———
create table public.regions (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  name_ko text,
  phase public.region_phase not null default 'phase_1',
  short_description text,
  detail_blurb text,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create index regions_phase_idx on public.regions (phase);

-- ——— Content taxonomy ———
create table public.content_categories (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  description text,
  created_at timestamptz not null default now()
);

-- ——— Local intel posts (moderated; not a free-for-all forum) ———
create table public.content_posts (
  id uuid primary key default gen_random_uuid(),
  author_user_id uuid not null references public.users (id) on delete cascade,
  region_id uuid not null references public.regions (id),
  category_id uuid not null references public.content_categories (id),
  kind public.content_post_kind not null,
  title text not null,
  summary text,
  body text not null,
  tags text[] not null default '{}',
  usefulness_votes int not null default 0,
  helpful_rating numeric(2, 1),
  popular_score int not null default 0,
  recommended_score int not null default 0,
  featured boolean not null default false,
  status public.content_post_status not null default 'pending',
  post_format text,
  cover_image_url text,
  route_journey jsonb,
  route_highlights jsonb not null default '[]'::jsonb,
  hero_subject text check (hero_subject is null or hero_subject in ('person', 'place', 'mixed')),
  structured_content jsonb,
  is_sample boolean not null default false,
  seed_content_key text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  reviewed_at timestamptz,
  reviewed_by_user_id uuid references public.users (id)
);

create index content_posts_region_idx on public.content_posts (region_id);
create index content_posts_author_idx on public.content_posts (author_user_id);
create index content_posts_status_idx on public.content_posts (status);
create unique index content_posts_seed_content_key_unique on public.content_posts (seed_content_key)
  where seed_content_key is not null;
create index content_posts_is_sample_idx on public.content_posts (is_sample) where is_sample = true;

-- ——— Profiles ———
create table public.traveler_profiles (
  user_id uuid primary key references public.users (id) on delete cascade,
  full_name text not null,
  country_code text not null,
  phone text,
  preferred_language text not null,
  updated_at timestamptz not null default now()
);

create table public.guardian_profiles (
  user_id uuid primary key references public.users (id) on delete cascade,
  display_name text not null,
  headline text,
  bio text,
  guardian_tier public.guardian_tier not null default 'contributor',
  approval_status public.guardian_approval_status not null default 'pending',
  primary_region_id uuid references public.regions (id),
  years_in_seoul int not null default 0,
  photo_url text,
  avatar_image_url text,
  list_card_image_url text,
  detail_hero_image_url text,
  intro_gallery_image_urls text[] not null default '{}',
  posts_approved_last_30d int not null default 0,
  posts_approved_last_7d int not null default 0,
  featured boolean not null default false,
  influencer_seed boolean not null default false,
  matching_enabled boolean not null default false,
  avg_traveler_rating numeric(2, 1),
  expertise_tags text[] not null default '{}',
  is_sample boolean not null default false,
  seed_guardian_key text,
  updated_at timestamptz not null default now()
);

create unique index guardian_profiles_seed_guardian_key_unique on public.guardian_profiles (seed_guardian_key)
  where seed_guardian_key is not null;
create index guardian_profiles_is_sample_idx on public.guardian_profiles (is_sample) where is_sample = true;

comment on column public.guardian_profiles.matching_enabled is
  'Separate from tier: ops must enable matching after verification; high contribution alone is insufficient.';

create table public.guardian_languages (
  guardian_user_id uuid not null references public.guardian_profiles (user_id) on delete cascade,
  language_code text not null,
  proficiency public.language_proficiency not null,
  primary key (guardian_user_id, language_code)
);

-- ——— Contribution & audit (tier inputs) ———
create table public.guardian_activity_logs (
  id uuid primary key default gen_random_uuid(),
  guardian_user_id uuid not null references public.guardian_profiles (user_id) on delete cascade,
  action text not null,
  detail jsonb,
  created_at timestamptz not null default now()
);

create index guardian_activity_logs_guardian_idx on public.guardian_activity_logs (guardian_user_id);

-- ——— Featured / seed program ———
create table public.featured_guardians (
  id uuid primary key default gen_random_uuid(),
  guardian_user_id uuid not null references public.guardian_profiles (user_id) on delete cascade,
  tagline text,
  priority int not null default 0,
  active boolean not null default true,
  starts_at timestamptz,
  ends_at timestamptz,
  created_at timestamptz not null default now()
);

-- ——— External chat handoff (no first-party chat MVP) ———
create table public.contact_methods (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  channel public.contact_channel not null,
  handle text not null,
  is_preferred boolean not null default false,
  verified_at timestamptz,
  created_at timestamptz not null default now()
);

create index contact_methods_user_idx on public.contact_methods (user_id);

-- ——— Services & bookings ———
create table public.service_types (
  code public.service_type_code primary key,
  name text not null,
  short_description text not null,
  duration_hours int not null,
  base_price_krw int not null,
  active boolean not null default true
);

create table public.bookings (
  id uuid primary key default gen_random_uuid(),
  traveler_user_id uuid references public.users (id),
  guardian_user_id uuid references public.users (id),
  service_code public.service_type_code not null references public.service_types (code),
  status public.booking_status not null default 'requested',
  requested_start timestamptz not null,
  party_size int not null default 1 check (party_size between 1 and 8),
  pickup_hint text,
  notes text,
  preferred_contact_channel public.contact_channel,
  contact_handle_hint text,
  guest_name text,
  guest_email text,
  request_payload jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint bookings_traveler_or_guest check (
    traveler_user_id is not null or guest_email is not null
  )
);

create index bookings_traveler_idx on public.bookings (traveler_user_id);
create index bookings_guardian_idx on public.bookings (guardian_user_id);
create index bookings_status_idx on public.bookings (status);

create table public.booking_status_history (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references public.bookings (id) on delete cascade,
  from_status public.booking_status,
  to_status public.booking_status not null,
  changed_at timestamptz not null default now(),
  actor_user_id uuid references public.users (id),
  note text
);

create index booking_status_history_booking_idx on public.booking_status_history (booking_id);

-- ——— Mutual reviews (trust signals for future matching) ———
create table public.traveler_reviews (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references public.bookings (id) on delete cascade,
  traveler_user_id uuid not null references public.users (id),
  guardian_user_id uuid not null references public.users (id),
  rating int not null check (rating between 1 and 5),
  comment text,
  created_at timestamptz not null default now(),
  unique (booking_id)
);

create table public.guardian_reviews (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references public.bookings (id) on delete cascade,
  guardian_user_id uuid not null references public.users (id),
  traveler_user_id uuid not null references public.users (id),
  rating int not null check (rating between 1 and 5),
  comment text,
  created_at timestamptz not null default now(),
  unique (booking_id)
);

create index traveler_reviews_guardian_idx on public.traveler_reviews (guardian_user_id);
create index guardian_reviews_traveler_idx on public.guardian_reviews (traveler_user_id);

-- ——— Incidents & admin notes ———
create table public.incidents (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references public.bookings (id) on delete cascade,
  reported_by_user_id uuid not null references public.users (id),
  summary text not null,
  severity public.incident_severity not null default 'low',
  created_at timestamptz not null default now(),
  resolved_at timestamptz
);

create table public.admin_notes (
  id uuid primary key default gen_random_uuid(),
  entity_type public.admin_note_entity not null,
  entity_id uuid not null,
  author_user_id uuid not null references public.users (id),
  body text not null,
  created_at timestamptz not null default now()
);

create index admin_notes_entity_idx on public.admin_notes (entity_type, entity_id);

-- ——— Mypage attention (cross-device seen signatures) ———
create table public.mypage_menu_attention_seen (
  user_id text not null,
  menu_key text not null,
  seen_signature text not null,
  updated_at timestamptz not null default now(),
  primary key (user_id, menu_key)
);

create index mypage_menu_attention_seen_user_updated_idx on public.mypage_menu_attention_seen (user_id, updated_at desc);

-- ——— Tier rules (reference; enforce in application or cron) ———
-- Active Guardian (example): >= 12 approved posts in rolling 30 days AND >= 3 approved posts/week (rolling 7d).
-- Verified Guardian: manual review + policy checks; `matching_enabled` true only after ops approval.
-- TODO(prod): Scheduled job to recompute guardian_profiles.guardian_tier + posts_* counters from content_posts.

comment on table public.content_posts is
  'Curated local intel — moderated, region-scoped; distinct from marketing brochure copy.';
comment on table public.bookings is
  'Practical support matching; external chat handoff — not in-app chat MVP.';
comment on table public.traveler_reviews is 'Traveler rates guardian after interaction.';
comment on table public.guardian_reviews is 'Guardian rates traveler behavior — mutual trust layer.';
