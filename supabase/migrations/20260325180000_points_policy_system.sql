-- Points policy + ledger (SafeMate v3)
-- Run after core schema (users, guardian_profiles, content_posts, bookings).

-- ——— Enums ———
do $$ begin
  create type public.point_ledger_event_type as enum (
    'guardian_profile_reward',
    'post_publish_reward',
    'post_reward_revoke',
    'match_complete_reward',
    'manual_adjustment'
  );
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.point_ledger_status as enum ('pending', 'available', 'revoked');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.guardian_profile_points_status as enum ('none', 'granted', 'revoked');
exception when duplicate_object then null;
end $$;

-- ——— Policy versions ———
create table if not exists public.point_policy_versions (
  id uuid primary key default gen_random_uuid(),
  version_code text not null unique,
  profile_signup_reward int not null,
  profile_reward_timing text not null check (profile_reward_timing in ('immediate', 'approval')),
  post_publish_reward int not null,
  post_reward_timing text not null check (post_reward_timing in ('immediate', 'approval')),
  post_daily_limit int not null,
  post_monthly_limit int not null,
  match_complete_reward int not null,
  match_reward_timing text not null default 'confirmed_only'
    check (match_reward_timing = 'confirmed_only'),
  allow_revoke_on_post_delete boolean not null,
  allow_revoke_on_policy_violation boolean not null,
  is_active boolean not null default false,
  effective_from timestamptz not null default now(),
  created_at timestamptz not null default now(),
  created_by_user_id uuid references public.users (id)
);

create unique index if not exists point_policy_versions_one_active_true
  on public.point_policy_versions (is_active)
  where is_active = true;

-- ——— Ledger ———
create table if not exists public.point_ledger (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  event_type public.point_ledger_event_type not null,
  event_ref_type text,
  event_ref_id uuid,
  amount int not null,
  status public.point_ledger_status not null default 'available',
  reason text,
  policy_version text not null,
  idempotency_key text not null unique,
  occurred_at timestamptz not null default now(),
  available_at timestamptz,
  revoked_at timestamptz
);

create index if not exists point_ledger_user_occurred_idx
  on public.point_ledger (user_id, occurred_at desc);

create index if not exists point_ledger_ref_idx
  on public.point_ledger (event_ref_type, event_ref_id)
  where event_ref_id is not null;

create index if not exists point_ledger_post_reward_idx
  on public.point_ledger (user_id, occurred_at)
  where event_type = 'post_publish_reward';

-- ——— Balance snapshot ———
create table if not exists public.point_balance_snapshot (
  user_id uuid primary key references public.users (id) on delete cascade,
  balance int not null default 0,
  lifetime_earned int not null default 0,
  lifetime_revoked int not null default 0,
  updated_at timestamptz not null default now()
);

-- ——— Matches (completion + rewards) ———
create table if not exists public.matches (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid references public.bookings (id) on delete set null,
  traveler_user_id uuid not null references public.users (id) on delete cascade,
  guardian_user_id uuid not null references public.users (id) on delete cascade,
  traveler_confirmed_at timestamptz,
  guardian_confirmed_at timestamptz,
  completion_confirmed_at timestamptz,
  reward_granted_at timestamptz,
  reward_revoked_at timestamptz,
  created_at timestamptz not null default now(),
  constraint matches_distinct_users check (traveler_user_id <> guardian_user_id)
);

create index if not exists matches_traveler_idx on public.matches (traveler_user_id);
create index if not exists matches_guardian_idx on public.matches (guardian_user_id);
create index if not exists matches_booking_idx on public.matches (booking_id)
  where booking_id is not null;

-- ——— Extend guardian_profiles ———
alter table public.guardian_profiles
  add column if not exists profile_points_status public.guardian_profile_points_status not null default 'none',
  add column if not exists reward_granted_at timestamptz,
  add column if not exists reward_revoked_at timestamptz;

-- ——— Extend content_posts (posts) ———
alter table public.content_posts
  add column if not exists reward_granted_at timestamptz,
  add column if not exists reward_revoked_at timestamptz,
  add column if not exists moderation_reward_ok boolean not null default false;

comment on column public.content_posts.moderation_reward_ok is
  'When post_reward_timing is approval, grant only if true (moderator released reward).';

-- ——— Atomic ledger + snapshot ———
create or replace function public.points_apply_ledger(
  p_user_id uuid,
  p_amount int,
  p_event_type public.point_ledger_event_type,
  p_event_ref_type text,
  p_event_ref_id uuid,
  p_status public.point_ledger_status,
  p_reason text,
  p_policy_version text,
  p_idempotency_key text,
  p_available_at timestamptz,
  p_occurred_at timestamptz
) returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid;
  v_effective timestamptz;
  v_apply_balance boolean;
begin
  insert into public.point_ledger (
    user_id,
    event_type,
    event_ref_type,
    event_ref_id,
    amount,
    status,
    reason,
    policy_version,
    idempotency_key,
    occurred_at,
    available_at
  ) values (
    p_user_id,
    p_event_type,
    p_event_ref_type,
    p_event_ref_id,
    p_amount,
    p_status,
    p_reason,
    p_policy_version,
    p_idempotency_key,
    coalesce(p_occurred_at, now()),
    p_available_at
  )
  on conflict (idempotency_key) do nothing
  returning id into v_id;

  if v_id is null then
    return jsonb_build_object('inserted', false, 'ledger_id', null);
  end if;

  v_effective := coalesce(p_available_at, p_occurred_at, now());
  v_apply_balance := p_status = 'available' and v_effective <= now();

  if v_apply_balance then
    insert into public.point_balance_snapshot (user_id, balance, lifetime_earned, lifetime_revoked, updated_at)
    values (
      p_user_id,
      p_amount,
      case when p_amount > 0 then p_amount else 0 end,
      case when p_amount < 0 then -p_amount else 0 end,
      now()
    )
    on conflict (user_id) do update set
      balance = public.point_balance_snapshot.balance + p_amount,
      lifetime_earned = public.point_balance_snapshot.lifetime_earned
        + case when p_amount > 0 then p_amount else 0 end,
      lifetime_revoked = public.point_balance_snapshot.lifetime_revoked
        + case when p_amount < 0 then -p_amount else 0 end,
      updated_at = now();
  end if;

  return jsonb_build_object('inserted', true, 'ledger_id', v_id);
end;
$$;

revoke all on function public.points_apply_ledger(
  uuid, int, public.point_ledger_event_type, text, uuid,
  public.point_ledger_status, text, text, text, timestamptz, timestamptz
) from public;

grant execute on function public.points_apply_ledger(
  uuid, int, public.point_ledger_event_type, text, uuid,
  public.point_ledger_status, text, text, text, timestamptz, timestamptz
) to service_role;

-- ——— RLS ———
alter table public.point_ledger enable row level security;
alter table public.point_balance_snapshot enable row level security;
alter table public.point_policy_versions enable row level security;
alter table public.matches enable row level security;

drop policy if exists "point_ledger_select_own" on public.point_ledger;
create policy "point_ledger_select_own"
  on public.point_ledger for select
  using (auth.uid() = user_id);

drop policy if exists "point_balance_select_own" on public.point_balance_snapshot;
create policy "point_balance_select_own"
  on public.point_balance_snapshot for select
  using (auth.uid() = user_id);

drop policy if exists "point_policy_select_active" on public.point_policy_versions;
create policy "point_policy_select_active"
  on public.point_policy_versions for select
  using (is_active = true);

drop policy if exists "matches_select_participant" on public.matches;
create policy "matches_select_participant"
  on public.matches for select
  using (auth.uid() = traveler_user_id or auth.uid() = guardian_user_id);

-- ——— Seed default policy ———
insert into public.point_policy_versions (
  version_code,
  profile_signup_reward,
  profile_reward_timing,
  post_publish_reward,
  post_reward_timing,
  post_daily_limit,
  post_monthly_limit,
  match_complete_reward,
  match_reward_timing,
  allow_revoke_on_post_delete,
  allow_revoke_on_policy_violation,
  is_active,
  effective_from
)
values (
  'v1-default',
  300,
  'immediate',
  100,
  'immediate',
  300,
  3000,
  700,
  'confirmed_only',
  true,
  true,
  true,
  now()
)
on conflict (version_code) do nothing;

-- If no active row (e.g. conflict skipped), ensure one active exists
update public.point_policy_versions p
set is_active = true
where version_code = 'v1-default'
  and not exists (select 1 from public.point_policy_versions x where x.is_active = true);
