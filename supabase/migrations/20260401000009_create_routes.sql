-- v6: routes (신규)
create table if not exists public.routes (
  id uuid primary key default gen_random_uuid(),
  guardian_user_id uuid not null references public.guardian_profiles (user_id) on delete cascade,

  title_ko text,
  title_en text,
  title_th text,
  title_vi text,

  region_tags text[] not null default '{}',
  total_duration_min int,
  estimated_cost_min_krw int,
  estimated_cost_max_krw int,
  cover_image_url text,

  status text not null default 'draft'
    check (status in ('draft', 'under_review', 'public', 'private', 'deprecated')),

  route_type text not null default 'sample'
    check (route_type in ('sample', 'custom')),

  order_id uuid,

  view_count int not null default 0,
  purchase_count int not null default 0,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create index if not exists routes_guardian_user_idx on public.routes (guardian_user_id);
create index if not exists routes_status_type_idx on public.routes (status, route_type);
create index if not exists routes_region_idx on public.routes using gin (region_tags);

drop trigger if exists routes_updated_at on public.routes;
create trigger routes_updated_at
  before update on public.routes
  for each row execute function public.update_updated_at_column();

-- traveler_reviews.route_id → routes (00006에서 컬럼만 추가됨)
alter table public.traveler_reviews
  drop constraint if exists traveler_reviews_route_id_fkey;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'traveler_reviews_route_id_fkey'
      and conrelid = 'public.traveler_reviews'::regclass
  ) then
    alter table public.traveler_reviews
      add constraint traveler_reviews_route_id_fkey
      foreign key (route_id) references public.routes (id);
  end if;
end $$;

alter table public.routes enable row level security;

drop policy if exists "routes_select_public" on public.routes;
create policy "routes_select_public"
  on public.routes for select
  using (
    status = 'public'
    and route_type = 'sample'
    and deleted_at is null
  );

drop policy if exists "routes_select_own" on public.routes;
create policy "routes_select_own"
  on public.routes for select
  using (guardian_user_id = auth.uid());

drop policy if exists "routes_select_traveler_order" on public.routes;
create policy "routes_select_traveler_order"
  on public.routes for select
  using (
    route_type = 'custom'
    and order_id in (
      select b.id from public.bookings b
      where b.traveler_user_id = auth.uid()
    )
  );

drop policy if exists "routes_guardian_own" on public.routes;
create policy "routes_guardian_own"
  on public.routes for all
  using (guardian_user_id = auth.uid());

drop policy if exists "routes_admin" on public.routes;
create policy "routes_admin"
  on public.routes for all
  using (
    exists (
      select 1 from public.users
      where id = auth.uid()
      and app_role = 'admin'
    )
  );
