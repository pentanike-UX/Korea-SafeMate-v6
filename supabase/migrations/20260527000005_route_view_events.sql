-- ============================================================================
-- Phase 3K: 여행자 투명성 — 열람 이력 로그
-- 정책: 사용자 본인이 자기 열람 내역을 마이페이지에서 모두 확인할 수 있어야 한다.
--
-- 한 사용자가 같은 루트를 여러 번 열면 여러 row가 쌓이지만, 화면에서는
-- 통상 최근 N건만 노출하고 통계도 따로 집계한다.
-- ============================================================================

create table if not exists public.route_post_view_events (
  id uuid primary key default gen_random_uuid(),
  route_id text not null,
  viewer_user_id uuid not null references auth.users (id) on delete cascade,
  /** owner: 본인 grant / shared-invite: 공유받음 / ticket: 티켓 소모 직후 */
  source text not null check (source in ('owner', 'shared-invite', 'ticket', 'custom-self')),
  /** 어떤 grant로 열람했는지(있으면 채움). owner/shared/ticket 모두 가능. custom-self는 null */
  grant_id uuid references public.route_access_grants (id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists route_post_view_events_viewer_created_idx
  on public.route_post_view_events (viewer_user_id, created_at desc);
create index if not exists route_post_view_events_route_idx
  on public.route_post_view_events (route_id, created_at desc);
create index if not exists route_post_view_events_grant_idx
  on public.route_post_view_events (grant_id, created_at desc);

alter table public.route_post_view_events enable row level security;

-- 본인 열람 이력은 본인만 SELECT.
drop policy if exists route_post_view_events_select_own on public.route_post_view_events;
create policy route_post_view_events_select_own on public.route_post_view_events
  for select
  using ((select auth.uid()) = viewer_user_id);

-- INSERT는 service-role 경유만 (페이지 서버 컴포넌트가 로깅).
