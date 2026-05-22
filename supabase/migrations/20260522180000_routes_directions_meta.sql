-- 라우트의 directions 메타(폴리라인 path + legs 분/m + provider)를 routes 테이블에 저장.
-- 운영 환경에서 directions Runtime Cache가 잠겨 있더라도 즉시 사용 가능.
-- 좌표가 변하면 delivery API 측에서 갱신.

alter table public.routes
  add column if not exists directions_meta jsonb null;

comment on column public.routes.directions_meta is
  'Cached directions result: { provider, path: [{lat,lng}], legs: [{distance_m, duration_s}], distance_m, duration_s, computed_at } — refreshed on delivery.';
