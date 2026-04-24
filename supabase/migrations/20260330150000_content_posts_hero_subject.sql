-- Hero cover crop bias: person | place | mixed. Nullable for legacy kind-based fallback.

alter table public.content_posts
  add column if not exists hero_subject text;

alter table public.content_posts
  drop constraint if exists content_posts_hero_subject_check;

alter table public.content_posts
  add constraint content_posts_hero_subject_check
  check (hero_subject is null or hero_subject in ('person', 'place', 'mixed'));

comment on column public.content_posts.hero_subject is 'Hero image crop: person | place | mixed (null = infer from kind)';
