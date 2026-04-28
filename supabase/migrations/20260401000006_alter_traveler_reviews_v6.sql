-- v6: traveler_reviews — route_id는 routes 생성 후 FK 부여 (20260401000009 끝)
alter table public.traveler_reviews
  add column if not exists route_id uuid,
  add column if not exists is_anonymous boolean not null default false;
