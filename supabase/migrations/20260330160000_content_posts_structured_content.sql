-- Structured post body (route_post | practical_tip_post) as JSON — detail UI reads this first; `body` remains legacy/plain fallback.

alter table public.content_posts
  add column if not exists structured_content jsonb;

comment on column public.content_posts.structured_content is
  'v1 structured article: { version, template, data } — route_post or practical_tip_post';
