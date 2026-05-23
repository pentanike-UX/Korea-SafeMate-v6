-- 여행자가 루트를 북마크(저장)하는 테이블. traveler_saved_posts 패턴 미러링.
create table if not exists public.traveler_saved_routes (
  traveler_user_id uuid not null references public.users (id) on delete cascade,
  route_id uuid not null references public.routes (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (traveler_user_id, route_id)
);

create index if not exists traveler_saved_routes_traveler_idx
  on public.traveler_saved_routes (traveler_user_id, created_at desc);

alter table public.traveler_saved_routes enable row level security;

drop policy if exists "traveler_saved_routes_select_own" on public.traveler_saved_routes;
create policy "traveler_saved_routes_select_own"
  on public.traveler_saved_routes for select
  using (auth.uid() = traveler_user_id);

drop policy if exists "traveler_saved_routes_insert_own" on public.traveler_saved_routes;
create policy "traveler_saved_routes_insert_own"
  on public.traveler_saved_routes for insert
  with check (auth.uid() = traveler_user_id);

drop policy if exists "traveler_saved_routes_delete_own" on public.traveler_saved_routes;
create policy "traveler_saved_routes_delete_own"
  on public.traveler_saved_routes for delete
  using (auth.uid() = traveler_user_id);

comment on table public.traveler_saved_routes is 'Traveler bookmarked route ids (per authenticated account).';
