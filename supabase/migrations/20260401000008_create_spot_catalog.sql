-- v6: spot_catalog (신규)
create table if not exists public.spot_catalog (
  id uuid primary key default gen_random_uuid(),

  name_ko text not null,
  name_en text,
  name_th text,
  name_vi text,

  address_ko text,
  address_en text,
  lat numeric(10, 7) not null,
  lng numeric(10, 7) not null,
  region_tags text[] not null default '{}',

  category text not null
    check (category in ('food', 'cafe', 'attraction', 'shopping', 'nightlife', 'nature', 'activity')),
  subcategory text,

  avg_cost_krw int,
  avg_stay_min int,
  reservation_required boolean default false,
  external_url text,
  kakaomap_id text,
  naver_place_id text,

  images text[] default '{}',

  source text not null default 'manual'
    check (source in ('manual', 'tour_api', 'naver_api', 'guardian_submitted')),
  is_verified boolean not null default false,
  is_active boolean not null default true,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists spot_catalog_category_idx on public.spot_catalog (category);
create index if not exists spot_catalog_region_idx on public.spot_catalog using gin (region_tags);
create index if not exists spot_catalog_active_idx on public.spot_catalog (is_active, is_verified);

drop trigger if exists spot_catalog_updated_at on public.spot_catalog;
create trigger spot_catalog_updated_at
  before update on public.spot_catalog
  for each row execute function public.update_updated_at_column();

alter table public.spot_catalog enable row level security;

drop policy if exists "spot_catalog_select_public" on public.spot_catalog;
create policy "spot_catalog_select_public"
  on public.spot_catalog for select
  using (is_active = true and is_verified = true);

drop policy if exists "spot_catalog_admin" on public.spot_catalog;
create policy "spot_catalog_admin"
  on public.spot_catalog for all
  using (
    exists (
      select 1 from public.users
      where id = auth.uid()
      and app_role = 'admin'
    )
  );
