-- Separate image roles for guardian public surfaces (avatar / list card / detail hero).
alter table public.guardian_profiles
  add column if not exists avatar_image_url text,
  add column if not exists list_card_image_url text,
  add column if not exists detail_hero_image_url text;

comment on column public.guardian_profiles.avatar_image_url is
  'Square-ish avatar for headers, chips, and small profile surfaces.';
comment on column public.guardian_profiles.list_card_image_url is
  'Primary image for guardian list / compare cards (portrait-friendly).';
comment on column public.guardian_profiles.detail_hero_image_url is
  'Wide hero image on public guardian detail.';
