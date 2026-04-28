-- v6: bookings — 맞춤 루트 의뢰 확장 컬럼만 (enum 확장은 20260401000005a 에서 선행)
alter table public.bookings
  add column if not exists tier text
    check (tier is null or tier in ('basic', 'standard', 'premium')),
  add column if not exists travel_dates date[],
  add column if not exists interests text[] not null default '{}',
  add column if not exists transport_pref text
    check (transport_pref is null or transport_pref in ('walk', 'transit', 'taxi_ok')),
  add column if not exists food_restrictions text[] default '{}',
  add column if not exists communication_lang text default 'en',
  add column if not exists delivery_deadline_at timestamptz,
  add column if not exists delivered_at timestamptz,
  add column if not exists revision_count int not null default 0,
  add column if not exists max_revisions int not null default 1,
  add column if not exists revision_request_text text,
  add column if not exists revision_requested_at timestamptz;
