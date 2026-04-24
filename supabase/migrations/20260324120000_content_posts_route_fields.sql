-- Route / hybrid / spot posts: structured journey JSON + highlights.
-- Aligns with `ContentPost.route_journey` & `route_highlights` in `src/types/domain.ts`.

alter table public.content_posts
  add column if not exists post_format text,
  add column if not exists cover_image_url text,
  add column if not exists route_journey jsonb,
  add column if not exists route_highlights jsonb not null default '[]'::jsonb;

comment on column public.content_posts.post_format is 'article | spot | route | hybrid';
comment on column public.content_posts.route_journey is 'RouteJourney: { metadata, spots[], path[] } (WGS84)';
comment on column public.content_posts.route_highlights is 'string[] as JSON array';

create index if not exists content_posts_post_format_idx on public.content_posts (post_format)
  where post_format is not null;
