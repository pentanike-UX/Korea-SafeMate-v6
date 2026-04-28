-- v6: users — 신규 컬럼만 (기존 컬럼 변경 없음)
alter table public.users
  add column if not exists onboarded boolean not null default false,
  add column if not exists is_first_visit boolean default true;
