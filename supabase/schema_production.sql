-- =============================================================================
-- Korea SafeMate — Production-oriented Supabase / PostgreSQL schema
-- =============================================================================
-- Design principles (product logic):
--   • Open participation ≠ trusted matching: guardian_profiles.guardian_tier and
--     contribution metrics track publishing; guardian_profiles.matching_enabled is
--     ops-gated and MUST NOT auto-flip from post counts alone.
--   • profiles is the single join point from auth.users; traveler_* and guardian_*
--     extensions are optional rows by lifecycle.
--   • Bookings: semi-manual matching — statuses + booking_status_history audit.
--   • Content: region-first discovery; public read only for approved (and optional featured).
--   • Mutual reviews + incidents: trust/risk layer separate from booking ops.
--
-- MVP simplifications (called out in comments):
--   • interests / support_needs on bookings: text[] of slug strings (fast to ship);
--     Phase 2+ can normalize to junction tables for analytics.
--   • profiles.user_role vs guardian_profiles.guardian_tier: both exist; keep in sync
--     in application or via trigger (stub below).
--
-- Apply order: run as one migration on empty DB, or diff against existing schema.sql
-- and migrate incrementally.
-- =============================================================================

create extension if not exists pgcrypto;

-- ——— Helper: updated_at ———
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- =============================================================================
-- 1. ENUMS / DOMAIN TYPES
-- =============================================================================

-- App-facing role on profiles (JWT / RLS convenience). Includes guardian ladder.
create type public.user_role as enum (
  'traveler',
  'contributor',
  'active_guardian',
  'verified_guardian',
  'admin'
);

-- Program tier (contribution + trust ladder). Separate from matching_enabled.
create type public.guardian_tier as enum (
  'contributor',
  'active_guardian',
  'verified_guardian'
);

create type public.guardian_approval_status as enum (
  'pending',
  'under_review',
  'approved',
  'paused',
  'rejected'
);

create type public.traveler_type as enum ('foreign', 'korean');

create type public.region_type as enum ('metro', 'tourist_destination');

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

-- Content moderation pipeline (distinct from old draft/pending/approved if migrating).
create type public.content_approval_status as enum (
  'submitted',
  'under_review',
  'approved',
  'rejected',
  'hidden'
);

create type public.language_proficiency as enum (
  'basic',
  'conversational',
  'fluent',
  'native'
);

create type public.incident_severity as enum (
  'low',
  'medium',
  'high',
  'critical'
);

create type public.incident_resolution_status as enum (
  'open',
  'investigating',
  'resolved',
  'dismissed'
);

create type public.review_flagged_status as enum (
  'none',
  'flagged',
  'under_review',
  'action_taken'
);

create type public.admin_note_target_type as enum (
  'profile',
  'traveler_profile',
  'guardian_profile',
  'booking',
  'content_post',
  'incident'
);

create type public.guardian_activity_type as enum (
  'post_submitted',
  'post_approved',
  'booking_completed',
  'review_received',
  'incident_flagged'
);

-- Optional: post kind for Explore UX (MVP: keep; nullable on posts if unused).
create type public.content_post_kind as enum (
  'hot_place',
  'local_tip',
  'food',
  'shopping',
  'k_content',
  'practical'
);

-- =============================================================================
-- 2. CORE: profiles (1:1 auth.users)
-- =============================================================================

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text,
  display_name text,
  email text not null,
  avatar_url text,
  user_role public.user_role not null default 'traveler',
  country_code text,
  preferred_language text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index profiles_user_role_idx on public.profiles (user_role);
create index profiles_email_idx on public.profiles (email);

comment on table public.profiles is
  'Canonical app identity. Email may mirror auth.users.email; sync via trigger or auth hook in prod.';
comment on column public.profiles.user_role is
  'Primary RBAC label. Guardian tiers also on guardian_profiles; keep aligned for guardians (app or trigger).';

create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

-- =============================================================================
-- 3. Taxonomy: regions, content categories, service types, contact method catalog
-- =============================================================================

create table public.regions (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name_en text not null,
  name_ko text,
  region_type public.region_type not null default 'metro',
  is_active boolean not null default true,
  sort_order int not null default 0,
  short_description text,
  detail_blurb text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index regions_active_sort_idx on public.regions (is_active, sort_order);
create index regions_slug_idx on public.regions (slug);

create trigger regions_set_updated_at
before update on public.regions
for each row execute function public.set_updated_at();

create table public.content_categories (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name_en text not null,
  name_ko text,
  is_active boolean not null default true,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index content_categories_active_sort_idx on public.content_categories (is_active, sort_order);

create trigger content_categories_set_updated_at
before update on public.content_categories
for each row execute function public.set_updated_at();

create table public.service_types (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name_en text not null,
  name_ko text,
  is_active boolean not null default true,
  sort_order int not null default 0,
  duration_hours int,
  base_price_krw int,
  short_description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint service_types_slug_check check (
    slug in ('arrival_companion', 'k_route_companion', 'first_24_hours')
  )
);

comment on constraint service_types_slug_check on public.service_types is
  'MVP: enforce three products; drop check later if you add services.';

create index service_types_active_sort_idx on public.service_types (is_active, sort_order);

create trigger service_types_set_updated_at
before update on public.service_types
for each row execute function public.set_updated_at();

-- Catalog of external channels (KakaoTalk, Telegram, …) — not per-user handles.
create table public.contact_methods (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  is_active boolean not null default true,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create index contact_methods_active_sort_idx on public.contact_methods (is_active, sort_order);

-- Per-profile saved handles (links catalog + handle string).
create table public.profile_contact_endpoints (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles (id) on delete cascade,
  contact_method_id uuid not null references public.contact_methods (id),
  handle text not null,
  is_preferred boolean not null default false,
  verified_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (profile_id, contact_method_id)
);

create index profile_contact_endpoints_profile_idx on public.profile_contact_endpoints (profile_id);

create trigger profile_contact_endpoints_set_updated_at
before update on public.profile_contact_endpoints
for each row execute function public.set_updated_at();

-- =============================================================================
-- 4. traveler_profiles & guardian_profiles
-- =============================================================================

create table public.traveler_profiles (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null unique references public.profiles (id) on delete cascade,
  traveler_type public.traveler_type not null default 'foreign',
  first_time_in_korea boolean,
  home_country text,
  bio text,
  preferred_contact_method_id uuid references public.contact_methods (id),
  contact_handle text,
  rating_avg numeric(3, 2),
  review_count int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index traveler_profiles_profile_idx on public.traveler_profiles (profile_id);

create trigger traveler_profiles_set_updated_at
before update on public.traveler_profiles
for each row execute function public.set_updated_at();

create table public.guardian_profiles (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null unique references public.profiles (id) on delete cascade,
  city text,
  region_id uuid references public.regions (id),
  short_intro text,
  approval_status public.guardian_approval_status not null default 'pending',
  guardian_tier public.guardian_tier not null default 'contributor',
  is_featured boolean not null default false,
  profile_completeness smallint not null default 0 check (profile_completeness between 0 and 100),
  avg_rating numeric(3, 2),
  review_count int not null default 0,
  completed_support_count int not null default 0,
  trust_score numeric(5, 2),
  risk_flag boolean not null default false,
  -- Ops gate: trusted matching (never auto from contribution alone).
  matching_enabled boolean not null default false,
  -- Rolling contribution counters (recomputed by job from content + activity logs).
  posts_approved_last_30d int not null default 0,
  posts_approved_last_7d int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index guardian_profiles_region_idx on public.guardian_profiles (region_id);
create index guardian_profiles_tier_idx on public.guardian_profiles (guardian_tier);
create index guardian_profiles_approval_idx on public.guardian_profiles (approval_status);
create index guardian_profiles_matching_idx on public.guardian_profiles (matching_enabled)
  where matching_enabled = true;
create index guardian_profiles_profile_idx on public.guardian_profiles (profile_id);

comment on column public.guardian_profiles.matching_enabled is
  'Semi-manual matching: admins enable after verification; independent of guardian_tier upgrades from posts.';

create trigger guardian_profiles_set_updated_at
before update on public.guardian_profiles
for each row execute function public.set_updated_at();

create table public.guardian_languages (
  id uuid primary key default gen_random_uuid(),
  guardian_profile_id uuid not null references public.guardian_profiles (id) on delete cascade,
  language_code text not null,
  proficiency_level public.language_proficiency not null,
  unique (guardian_profile_id, language_code)
);

create index guardian_languages_guardian_idx on public.guardian_languages (guardian_profile_id);

-- =============================================================================
-- 5. content_posts (guardian-authored intel)
-- =============================================================================

create table public.content_posts (
  id uuid primary key default gen_random_uuid(),
  author_guardian_profile_id uuid not null references public.guardian_profiles (id) on delete cascade,
  region_id uuid not null references public.regions (id),
  category_id uuid not null references public.content_categories (id),
  kind public.content_post_kind,
  title text not null,
  summary text,
  body text not null,
  approval_status public.content_approval_status not null default 'submitted',
  is_featured boolean not null default false,
  tags text[] not null default '{}',
  usefulness_score numeric(6, 2) not null default 0,
  rating_avg numeric(3, 2),
  rating_count int not null default 0,
  flagged_count int not null default 0,
  post_format text,
  cover_image_url text,
  route_journey jsonb,
  route_highlights jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  approved_at timestamptz,
  approved_by_profile_id uuid references public.profiles (id)
);

create index content_posts_region_status_idx on public.content_posts (region_id, approval_status);
create index content_posts_author_idx on public.content_posts (author_guardian_profile_id);
create index content_posts_status_idx on public.content_posts (approval_status);
create index content_posts_featured_idx on public.content_posts (is_featured)
  where is_featured = true and approval_status = 'approved';

create trigger content_posts_set_updated_at
before update on public.content_posts
for each row execute function public.set_updated_at();

-- =============================================================================
-- 6. guardian_activity_logs (contribution / threshold inputs)
-- =============================================================================

create table public.guardian_activity_logs (
  id uuid primary key default gen_random_uuid(),
  guardian_profile_id uuid not null references public.guardian_profiles (id) on delete cascade,
  activity_type public.guardian_activity_type not null,
  related_content_post_id uuid references public.content_posts (id) on delete set null,
  points int not null default 0,
  activity_date date not null default (timezone('utc', now()))::date,
  week_start_date date,
  month_key text,
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now()
);

create index guardian_activity_logs_guardian_date_idx
  on public.guardian_activity_logs (guardian_profile_id, activity_date desc);
create index guardian_activity_logs_month_idx on public.guardian_activity_logs (guardian_profile_id, month_key);
create index guardian_activity_logs_type_idx on public.guardian_activity_logs (activity_type);

-- =============================================================================
-- 7. bookings & history
-- =============================================================================

-- MVP: interests/support_needs as text[] of stable slugs (e.g. 'k_pop', 'transportation').
--       Normalize to junction tables when analytics require strict FKs.
create table public.bookings (
  id uuid primary key default gen_random_uuid(),
  traveler_profile_id uuid references public.traveler_profiles (id),
  assigned_guardian_profile_id uuid references public.guardian_profiles (id),
  service_type_id uuid not null references public.service_types (id),
  region_id uuid references public.regions (id),
  booking_status public.booking_status not null default 'requested',
  travel_date date,
  travel_time time,
  requested_start timestamptz,
  traveler_count int not null default 1 check (traveler_count between 1 and 8),
  preferred_language text,
  first_time_in_korea boolean,
  meeting_point text,
  accommodation_area text,
  interests text[] not null default '{}',
  support_needs text[] not null default '{}',
  preferred_contact_method_id uuid references public.contact_methods (id),
  contact_handle text,
  special_requests text,
  request_payload jsonb,
  guest_name text,
  guest_email text,
  external_contact_handed_off boolean not null default false,
  external_contact_handed_off_at timestamptz,
  risk_flag boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint bookings_traveler_or_guest check (
    traveler_profile_id is not null or guest_email is not null
  ),
  constraint bookings_time_check check (
    requested_start is not null or (travel_date is not null and travel_time is not null)
  )
);

comment on constraint bookings_time_check on public.bookings is
  'MVP: either requested_start (recommended) OR travel_date+travel_time; app should set requested_start.';

create index bookings_status_idx on public.bookings (booking_status);
create index bookings_traveler_idx on public.bookings (traveler_profile_id);
create index bookings_guardian_idx on public.bookings (assigned_guardian_profile_id);
create index bookings_region_idx on public.bookings (region_id);
create index bookings_created_idx on public.bookings (created_at desc);

create trigger bookings_set_updated_at
before update on public.bookings
for each row execute function public.set_updated_at();

create table public.booking_status_history (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references public.bookings (id) on delete cascade,
  previous_status public.booking_status,
  new_status public.booking_status not null,
  changed_by_profile_id uuid references public.profiles (id),
  note text,
  created_at timestamptz not null default now()
);

create index booking_status_history_booking_idx on public.booking_status_history (booking_id, created_at desc);

-- =============================================================================
-- 8. Reviews & incidents & admin notes & featured guardians
-- =============================================================================

create table public.traveler_reviews (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references public.bookings (id) on delete cascade,
  traveler_profile_id uuid not null references public.traveler_profiles (id),
  guardian_profile_id uuid not null references public.guardian_profiles (id),
  rating smallint not null check (rating between 1 and 5),
  review_text text,
  flagged_status public.review_flagged_status not null default 'none',
  created_at timestamptz not null default now(),
  unique (booking_id)
);

create index traveler_reviews_guardian_idx on public.traveler_reviews (guardian_profile_id);

create table public.guardian_reviews (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references public.bookings (id) on delete cascade,
  guardian_profile_id uuid not null references public.guardian_profiles (id),
  traveler_profile_id uuid not null references public.traveler_profiles (id),
  rating smallint not null check (rating between 1 and 5),
  review_text text,
  flagged_status public.review_flagged_status not null default 'none',
  created_at timestamptz not null default now(),
  unique (booking_id)
);

create index guardian_reviews_traveler_idx on public.guardian_reviews (traveler_profile_id);

create table public.incidents (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid references public.bookings (id) on delete set null,
  guardian_profile_id uuid references public.guardian_profiles (id),
  traveler_profile_id uuid references public.traveler_profiles (id),
  severity public.incident_severity not null default 'medium',
  incident_type text not null,
  description text not null,
  resolution_status public.incident_resolution_status not null default 'open',
  created_by_profile_id uuid not null references public.profiles (id),
  created_at timestamptz not null default now(),
  resolved_at timestamptz
);

create index incidents_booking_idx on public.incidents (booking_id);
create index incidents_resolution_idx on public.incidents (resolution_status);
create index incidents_severity_idx on public.incidents (severity);

create table public.admin_notes (
  id uuid primary key default gen_random_uuid(),
  target_type public.admin_note_target_type not null,
  target_id uuid not null,
  note text not null,
  created_by_profile_id uuid not null references public.profiles (id),
  created_at timestamptz not null default now()
);

create index admin_notes_target_idx on public.admin_notes (target_type, target_id);
create index admin_notes_created_idx on public.admin_notes (created_at desc);

create table public.featured_guardians (
  id uuid primary key default gen_random_uuid(),
  guardian_profile_id uuid not null references public.guardian_profiles (id) on delete cascade,
  feature_reason text,
  sort_order int not null default 0,
  active_from timestamptz,
  active_to timestamptz,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index featured_guardians_active_sort_idx
  on public.featured_guardians (is_active, sort_order);

create trigger featured_guardians_set_updated_at
before update on public.featured_guardians
for each row execute function public.set_updated_at();

-- =============================================================================
-- 9. RLS (enable + example policies)
-- =============================================================================
-- Supabase: use auth.uid() = profiles.id. Admin: profiles.user_role = 'admin'.
-- Service role bypasses RLS (API routes with service key for cron/admin tools).
--
-- MVP: tighten policies per environment; test with Supabase policy simulator.

alter table public.profiles enable row level security;
alter table public.traveler_profiles enable row level security;
alter table public.guardian_profiles enable row level security;
alter table public.guardian_languages enable row level security;
alter table public.profile_contact_endpoints enable row level security;
alter table public.content_posts enable row level security;
alter table public.guardian_activity_logs enable row level security;
alter table public.bookings enable row level security;
alter table public.booking_status_history enable row level security;
alter table public.traveler_reviews enable row level security;
alter table public.guardian_reviews enable row level security;
alter table public.incidents enable row level security;
alter table public.admin_notes enable row level security;
alter table public.featured_guardians enable row level security;

-- Taxonomy: typically readable by all authenticated + anon for public site (adjust per product).
alter table public.regions enable row level security;
alter table public.content_categories enable row level security;
alter table public.service_types enable row level security;
alter table public.contact_methods enable row level security;

-- ——— Helper predicate (repeat in policies or use SECURITY DEFINER function) ———
-- is_admin(uid) -> bool

create or replace function public.is_admin(check_uid uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles p
    where p.id = check_uid and p.user_role = 'admin'
  );
$$;

create or replace function public.current_profile_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select auth.uid();
$$;

-- profiles: own row read/update; insert on signup via trigger (below) or service role
create policy profiles_select_own_or_admin
  on public.profiles for select
  using (id = auth.uid() or public.is_admin(auth.uid()));

create policy profiles_update_own_or_admin
  on public.profiles for update
  using (id = auth.uid() or public.is_admin(auth.uid()));

create policy profiles_insert_own
  on public.profiles for insert
  with check (id = auth.uid() or public.is_admin(auth.uid()));

-- traveler_profiles
create policy traveler_select_own_or_admin
  on public.traveler_profiles for select
  using (
    profile_id = auth.uid()
    or public.is_admin(auth.uid())
  );

create policy traveler_insert_own
  on public.traveler_profiles for insert
  with check (profile_id = auth.uid() or public.is_admin(auth.uid()));

create policy traveler_update_own_or_admin
  on public.traveler_profiles for update
  using (profile_id = auth.uid() or public.is_admin(auth.uid()));

-- guardian_profiles
create policy guardian_select_own_or_admin
  on public.guardian_profiles for select
  using (
    profile_id = auth.uid()
    or public.is_admin(auth.uid())
  );

-- Public directory: optional separate view/policy — MVP anon read of *limited* columns via RPC/view.
create policy guardian_insert_own_or_admin
  on public.guardian_profiles for insert
  with check (profile_id = auth.uid() or public.is_admin(auth.uid()));

create policy guardian_update_own_or_admin
  on public.guardian_profiles for update
  using (profile_id = auth.uid() or public.is_admin(auth.uid()));

-- guardian_languages
create policy guardian_languages_all_own
  on public.guardian_languages for all
  using (
    exists (
      select 1 from public.guardian_profiles g
      where g.id = guardian_languages.guardian_profile_id and g.profile_id = auth.uid()
    )
    or public.is_admin(auth.uid())
  )
  with check (
    exists (
      select 1 from public.guardian_profiles g
      where g.id = guardian_languages.guardian_profile_id and g.profile_id = auth.uid()
    )
    or public.is_admin(auth.uid())
  );

-- profile_contact_endpoints
create policy contact_endpoints_all_own
  on public.profile_contact_endpoints for all
  using (profile_id = auth.uid() or public.is_admin(auth.uid()))
  with check (profile_id = auth.uid() or public.is_admin(auth.uid()));

-- content_posts: author guardians manage drafts/submitted; public read approved only (anon)
create policy content_posts_select_public_approved
  on public.content_posts for select
  using (
    approval_status = 'approved'
    or exists (
      select 1 from public.guardian_profiles g
      where g.id = content_posts.author_guardian_profile_id
        and g.profile_id = auth.uid()
    )
    or public.is_admin(auth.uid())
  );

create policy content_posts_insert_author
  on public.content_posts for insert
  with check (
    exists (
      select 1 from public.guardian_profiles g
      where g.id = author_guardian_profile_id and g.profile_id = auth.uid()
    )
    or public.is_admin(auth.uid())
  );

create policy content_posts_update_author_or_admin
  on public.content_posts for update
  using (
    exists (
      select 1 from public.guardian_profiles g
      where g.id = content_posts.author_guardian_profile_id and g.profile_id = auth.uid()
    )
    or public.is_admin(auth.uid())
  );

-- bookings: traveler owns by traveler_profiles.profile_id; guardian sees assigned only
create policy bookings_select_traveler_guardian_admin
  on public.bookings for select
  using (
    public.is_admin(auth.uid())
    or exists (
      select 1 from public.traveler_profiles t
      where t.id = bookings.traveler_profile_id and t.profile_id = auth.uid()
    )
    or exists (
      select 1 from public.guardian_profiles g
      where g.id = bookings.assigned_guardian_profile_id and g.profile_id = auth.uid()
    )
  );

-- MVP: guest intake allows traveler_profile_id IS NULL (anon or any session).
--       Tighten for production: Edge Function + service role only, or require auth + captcha.
create policy bookings_insert_traveler_or_guest
  on public.bookings for insert
  with check (
    public.is_admin(auth.uid())
    or traveler_profile_id is null
    or exists (
      select 1 from public.traveler_profiles t
      where t.id = traveler_profile_id and t.profile_id = auth.uid()
    )
  );

create policy bookings_update_admin_guardian_assigned
  on public.bookings for update
  using (
    public.is_admin(auth.uid())
    or exists (
      select 1 from public.traveler_profiles t
      where t.id = bookings.traveler_profile_id and t.profile_id = auth.uid()
    )
    or exists (
      select 1 from public.guardian_profiles g
      where g.id = bookings.assigned_guardian_profile_id and g.profile_id = auth.uid()
    )
  );

-- booking_status_history: read if can read booking; insert admin/service (MVP: admin only via policy)
create policy booking_history_select_related
  on public.booking_status_history for select
  using (
    public.is_admin(auth.uid())
    or exists (
      select 1 from public.bookings b
      where b.id = booking_status_history.booking_id
        and (
          exists (
            select 1 from public.traveler_profiles t
            where t.id = b.traveler_profile_id and t.profile_id = auth.uid()
          )
          or exists (
            select 1 from public.guardian_profiles g
            where g.id = b.assigned_guardian_profile_id and g.profile_id = auth.uid()
          )
        )
    )
  );

create policy booking_history_insert_admin
  on public.booking_status_history for insert
  with check (public.is_admin(auth.uid()));

-- reviews
create policy traveler_reviews_select_parties_admin
  on public.traveler_reviews for select
  using (
    public.is_admin(auth.uid())
    or exists (
      select 1 from public.traveler_profiles t
      where t.id = traveler_reviews.traveler_profile_id and t.profile_id = auth.uid()
    )
    or exists (
      select 1 from public.guardian_profiles g
      where g.id = traveler_reviews.guardian_profile_id and g.profile_id = auth.uid()
    )
  );

create policy traveler_reviews_insert_traveler
  on public.traveler_reviews for insert
  with check (
    exists (
      select 1 from public.traveler_profiles t
      where t.id = traveler_profile_id and t.profile_id = auth.uid()
    )
    or public.is_admin(auth.uid())
  );

create policy guardian_reviews_select_parties_admin
  on public.guardian_reviews for select
  using (
    public.is_admin(auth.uid())
    or exists (
      select 1 from public.traveler_profiles t
      where t.id = guardian_reviews.traveler_profile_id and t.profile_id = auth.uid()
    )
    or exists (
      select 1 from public.guardian_profiles g
      where g.id = guardian_reviews.guardian_profile_id and g.profile_id = auth.uid()
    )
  );

create policy guardian_reviews_insert_guardian
  on public.guardian_reviews for insert
  with check (
    exists (
      select 1 from public.guardian_profiles g
      where g.id = guardian_profile_id and g.profile_id = auth.uid()
    )
    or public.is_admin(auth.uid())
  );

-- incidents + admin_notes: admin-heavy (MVP)
create policy incidents_select_admin_or_creator
  on public.incidents for select
  using (
    public.is_admin(auth.uid())
    or created_by_profile_id = auth.uid()
  );

create policy incidents_write_admin
  on public.incidents for insert
  with check (public.is_admin(auth.uid()) or created_by_profile_id = auth.uid());

create policy incidents_update_admin
  on public.incidents for update
  using (public.is_admin(auth.uid()));

create policy admin_notes_admin_only
  on public.admin_notes for all
  using (public.is_admin(auth.uid()))
  with check (public.is_admin(auth.uid()));

-- featured_guardians: public read active; write admin
create policy featured_guardians_public_read_active
  on public.featured_guardians for select
  using (
    (
      is_active = true
      and (active_from is null or active_from <= now())
      and (active_to is null or active_to >= now())
    )
    or public.is_admin(auth.uid())
  );

create policy featured_guardians_write_admin
  on public.featured_guardians for insert
  with check (public.is_admin(auth.uid()));

create policy featured_guardians_update_admin
  on public.featured_guardians for update
  using (public.is_admin(auth.uid()));

-- Taxonomy read for authenticated + anon (public explore)
create policy regions_public_read
  on public.regions for select using (true);

create policy content_categories_public_read
  on public.content_categories for select using (true);

create policy service_types_public_read
  on public.service_types for select using (true);

create policy contact_methods_public_read
  on public.contact_methods for select using (true);

-- Taxonomy writes: admin only (separate from public SELECT policies)
create policy regions_insert_admin on public.regions for insert
  with check (public.is_admin(auth.uid()));
create policy regions_update_admin on public.regions for update
  using (public.is_admin(auth.uid()));
create policy regions_delete_admin on public.regions for delete
  using (public.is_admin(auth.uid()));

create policy content_categories_insert_admin on public.content_categories for insert
  with check (public.is_admin(auth.uid()));
create policy content_categories_update_admin on public.content_categories for update
  using (public.is_admin(auth.uid()));
create policy content_categories_delete_admin on public.content_categories for delete
  using (public.is_admin(auth.uid()));

create policy service_types_insert_admin on public.service_types for insert
  with check (public.is_admin(auth.uid()));
create policy service_types_update_admin on public.service_types for update
  using (public.is_admin(auth.uid()));
create policy service_types_delete_admin on public.service_types for delete
  using (public.is_admin(auth.uid()));

create policy contact_methods_insert_admin on public.contact_methods for insert
  with check (public.is_admin(auth.uid()));
create policy contact_methods_update_admin on public.contact_methods for update
  using (public.is_admin(auth.uid()));
create policy contact_methods_delete_admin on public.contact_methods for delete
  using (public.is_admin(auth.uid()));

-- guardian_activity_logs: own guardian + admin
create policy guardian_activity_select_own_admin
  on public.guardian_activity_logs for select
  using (
    public.is_admin(auth.uid())
    or exists (
      select 1 from public.guardian_profiles g
      where g.id = guardian_activity_logs.guardian_profile_id and g.profile_id = auth.uid()
    )
  );

create policy guardian_activity_insert_system
  on public.guardian_activity_logs for insert
  with check (
    public.is_admin(auth.uid())
    or exists (
      select 1 from public.guardian_profiles g
      where g.id = guardian_profile_id and g.profile_id = auth.uid()
    )
  );

-- =============================================================================
-- 10. Auth sync: new user -> profiles row (MVP trigger)
-- =============================================================================

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, display_name, avatar_url)
  values (
    new.id,
    coalesce(new.email, ''),
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name'),
    coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)),
    new.raw_user_meta_data->>'avatar_url'
  )
  on conflict (id) do update set
    email = excluded.email,
    updated_at = now();
  return new;
end;
$$;

-- Run once: create trigger on auth.users (Supabase dashboard or migration with proper permissions)
-- create trigger on_auth_user_created
--   after insert on auth.users
--   for each row execute function public.handle_new_user();

comment on function public.handle_new_user is
  'Wire in Supabase: Database > Triggers on auth.users, or use Auth Hook to insert profiles.';

-- =============================================================================
-- 11. Optional: keep profiles.user_role in sync with guardian_tier (MVP stub)
-- =============================================================================
-- Application should set user_role to contributor | active_guardian | verified_guardian
-- when guardian program state changes. Example trigger sketch (commented):
--
-- create or replace function public.sync_guardian_role_from_tier() ...

-- =============================================================================
-- SEED DATA (run manually after tables exist; adjust UUIDs if needed)
-- =============================================================================
/*
-- contact_methods
insert into public.contact_methods (slug, name, sort_order) values
  ('kakaotalk', 'KakaoTalk', 1),
  ('telegram', 'Telegram', 2),
  ('whatsapp', 'WhatsApp', 3),
  ('email', 'Email', 4);

-- service_types
insert into public.service_types (slug, name_en, name_ko, sort_order, duration_hours, base_price_krw, short_description)
values
  ('arrival_companion', 'Arrival Companion', '도착 동행', 1, 4, 89000, 'Airport/station to stay; first navigation.'),
  ('k_route_companion', 'K-Route Companion', 'K-루트 동행', 2, 5, 99000, 'Execute chosen K-content / shopping routes.'),
  ('first_24_hours', 'First 24 Hours', '첫 24시간', 3, 8, 129000, 'First-day adaptation and practical setup.');

-- regions (examples)
insert into public.regions (slug, name_en, name_ko, region_type, sort_order, short_description)
values
  ('seoul', 'Seoul Capital Area', '수도권', 'metro', 1, 'Phase 1 core'),
  ('busan', 'Busan & vicinity', '부산', 'metro', 2, 'Coastal city logistics'),
  ('jeju', 'Jeju', '제주', 'tourist_destination', 3, 'Island logistics');

-- content_categories
insert into public.content_categories (slug, name_en, sort_order) values
  ('practical', 'Practical', 1),
  ('food', 'Food', 2),
  ('local_tip', 'Local tips', 3),
  ('k_content', 'K-content', 4);
*/

-- =============================================================================
-- PHASING (implementation checklist)
-- =============================================================================
-- Phase 1 — Explore + booking request:
--   regions, content_categories, service_types, contact_methods, profiles, traveler_profiles (optional),
--   bookings (+ guest columns), booking_status_history, minimal RLS, handle_new_user.
-- Phase 2 — Guardian dashboards + contribution:
--   guardian_profiles, guardian_languages, content_posts, guardian_activity_logs,
--   profile_contact_endpoints, recompute jobs for posts_approved_* counters.
-- Phase 3 — Reviews + trust + incidents:
--   traveler_reviews, guardian_reviews, incidents, admin_notes, flagged_status flows.
-- Phase 4 — Moderation + analytics:
--   materialized views, stricter content RLS via RPC, audit exports, Storage buckets
--   (avatars: profiles.avatar_url; post media: content_posts media table or jsonb urls).
-- =============================================================================

-- =============================================================================
-- FRONTEND / VERCEL NOTES
-- =============================================================================
-- • Use Supabase SSR client with user JWT for RLS-bound queries; use service role only
--   on Vercel API routes for admin actions, webhooks, and cron (tier recompute).
-- • Map wizard payload -> bookings.request_payload + normalized columns; set requested_start in KST→timestamptz.
-- • Slug mapping: UI may still use arrival / k_route / first_24h — map to service_types.slug
--   arrival_companion / k_route_companion / first_24_hours in API layer.
-- • Public Explore: query content_posts where approval_status = 'approved' (anon key works with RLS above).
-- • Admin console: either elevate profiles.user_role to admin for staff accounts, or use
--   service role from trusted server routes only (never expose service key to browser).
-- =============================================================================
