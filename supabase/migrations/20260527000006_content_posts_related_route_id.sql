-- =============================================================================
-- content_posts.related_route_id — 하루웨이 포스트 ↔ 하루루트 1:1 매핑
-- ---------------------------------------------------------------------------
-- 비즈니스 모델: 하루이는 한 번의 입력으로 (post + route) 양쪽 자산을 생성한다.
--   - 하루웨이(post) = 콘텐츠/발견 (무료 노출)
--   - 하루루트(route) = 실행 도구 (결제 발생 지점)
--
-- 본 컬럼이 채워져 있어야 RelatedRouteBanner / PlaybookUnlockSheet가
-- 실제 routeId로 진입 → route_access_grants 발급 → 결제 후 사이클이 완성된다.
-- =============================================================================

alter table public.content_posts
  add column if not exists related_route_id uuid
    references public.routes (id) on delete set null;

create index if not exists content_posts_related_route_id_idx
  on public.content_posts (related_route_id)
  where related_route_id is not null;

comment on column public.content_posts.related_route_id is
  'Optional FK to public.routes(id). When set, the post displays a "Buy this Haru-Route" CTA that enters /routes/{related_route_id}. One author may keep many posts pointing to the same route.';
