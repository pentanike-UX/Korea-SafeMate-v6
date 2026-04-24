-- Guardian profile workspace editable extensions.
alter table public.guardian_profiles
  add column if not exists theme_slugs text[] not null default '{}',
  add column if not exists style_slugs text[] not null default '{}',
  add column if not exists trust_reasons text[] not null default '{}';
