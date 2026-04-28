-- v6: traveler_profiles — 알림 설정
alter table public.traveler_profiles
  add column if not exists notification_email boolean not null default true,
  add column if not exists notification_push boolean not null default true;
