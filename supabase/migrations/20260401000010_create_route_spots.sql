-- v6: route_spots (신규)
create table if not exists public.route_spots (
  id uuid primary key default gen_random_uuid(),
  route_id uuid not null references public.routes (id) on delete cascade,
  spot_id uuid not null references public.spot_catalog (id),
  sort_order int not null,

  stay_min int not null default 60,
  guardian_note_ko text,
  guardian_note_en text,
  guardian_note_th text,
  guardian_note_vi text,

  move_from_prev_method text check (move_from_prev_method in ('walk', 'subway', 'taxi')),
  move_from_prev_min int,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  unique (route_id, sort_order)
);

create index if not exists route_spots_route_idx on public.route_spots (route_id, sort_order);

drop trigger if exists route_spots_updated_at on public.route_spots;
create trigger route_spots_updated_at
  before update on public.route_spots
  for each row execute function public.update_updated_at_column();

alter table public.route_spots enable row level security;

drop policy if exists "route_spots_select_public" on public.route_spots;
create policy "route_spots_select_public"
  on public.route_spots for select
  using (
    route_id in (
      select r.id from public.routes r
      where r.status = 'public' and r.route_type = 'sample' and r.deleted_at is null
    )
  );

drop policy if exists "route_spots_guardian_own" on public.route_spots;
create policy "route_spots_guardian_own"
  on public.route_spots for all
  using (
    route_id in (
      select r.id from public.routes r
      where r.guardian_user_id = auth.uid()
    )
  );

drop policy if exists "route_spots_traveler_order" on public.route_spots;
create policy "route_spots_traveler_order"
  on public.route_spots for select
  using (
    route_id in (
      select r.id from public.routes r
      join public.bookings b on b.id = r.order_id
      where b.traveler_user_id = auth.uid()
    )
  );
