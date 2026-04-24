-- Sample / demo rows live in the same tables as production; UI uses `is_sample` for badges and ops filters.
-- `seed_*_key` enables idempotent import (upsert) without colliding with human-readable mock ids (`seed-mg10-ap-01`, `mg01`).

alter table public.content_posts
  add column if not exists is_sample boolean not null default false,
  add column if not exists seed_content_key text;

comment on column public.content_posts.is_sample is
  'True when row is demo/seed content — same rendering as prod; show sample badge + admin filters.';
comment on column public.content_posts.seed_content_key is
  'Stable idempotency key from TS seed (e.g. seed-mg10-ap-01). UUID `id` remains canonical PK.';

create unique index if not exists content_posts_seed_content_key_unique
  on public.content_posts (seed_content_key)
  where seed_content_key is not null;

create index if not exists content_posts_is_sample_idx
  on public.content_posts (is_sample)
  where is_sample = true;

alter table public.guardian_profiles
  add column if not exists is_sample boolean not null default false,
  add column if not exists seed_guardian_key text;

comment on column public.guardian_profiles.is_sample is
  'True when profile is demo/seed — same public rendering; badge + admin filters.';
comment on column public.guardian_profiles.seed_guardian_key is
  'Stable key from TS seed (e.g. mg01). `user_id` is UUID (often deterministic v5 from this key).';

create unique index if not exists guardian_profiles_seed_guardian_key_unique
  on public.guardian_profiles (seed_guardian_key)
  where seed_guardian_key is not null;

create index if not exists guardian_profiles_is_sample_idx
  on public.guardian_profiles (is_sample)
  where is_sample = true;
