-- Intro gallery images for public guardian detail (body section below bio).
alter table public.guardian_profiles
  add column if not exists intro_gallery_image_urls text[] not null default '{}';

comment on column public.guardian_profiles.intro_gallery_image_urls is
  'Ordered URLs for the public guardian detail intro gallery (below “introduce this guardian”, before strengths).';
