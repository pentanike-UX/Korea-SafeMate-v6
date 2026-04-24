-- Traveler profile settings: additional editable fields + image slots.
alter table public.user_profiles
  add column if not exists preferred_region text,
  add column if not exists interest_themes text[] not null default '{}',
  add column if not exists spoken_languages text[] not null default '{}',
  add column if not exists profile_note text,
  add column if not exists list_card_image_url text,
  add column if not exists detail_hero_image_url text;
