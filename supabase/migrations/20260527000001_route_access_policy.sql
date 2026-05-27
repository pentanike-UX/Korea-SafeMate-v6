-- ============================================================================
-- Phase 3B: 하루루트 결제·공유 정책 데이터 모델
-- 정책 단일 소스: docs/payment-and-share-policy.md
--
-- 테이블:
--  - route_access_grants: 결제·공급으로 보유하는 루트별 권한 (90일 만료)
--  - route_ticket_packs:  Trio/Penta 패키지의 잔여 티켓 상태
--  - route_share_invites: 오너가 발급하는 무료 초대 (grant당 최대 2명)
-- ============================================================================

-- ─── route_access_grants ────────────────────────────────────────────────────
create table if not exists public.route_access_grants (
  id uuid primary key default gen_random_uuid(),
  route_id text not null,
  owner_user_id uuid not null references auth.users (id) on delete cascade,
  source text not null check (source in ('single', 'trio', 'penta', 'admin-comp')),
  expires_at timestamptz not null,
  created_at timestamptz not null default now(),
  unique (route_id, owner_user_id)
);

create index if not exists route_access_grants_owner_route_idx
  on public.route_access_grants (owner_user_id, route_id);
create index if not exists route_access_grants_expires_idx
  on public.route_access_grants (expires_at);

alter table public.route_access_grants enable row level security;

drop policy if exists route_access_grants_select_own on public.route_access_grants;
create policy route_access_grants_select_own on public.route_access_grants
  for select
  using ((select auth.uid()) = owner_user_id);

-- 발급은 service-role(결제 검증·운영 자동화)로만 허용 → 일반 클라이언트는 insert/update/delete 불가.
-- (정책 미부여 시 RLS 활성화로 기본 거부됨)

-- ─── route_ticket_packs ────────────────────────────────────────────────────
create table if not exists public.route_ticket_packs (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid not null references auth.users (id) on delete cascade,
  pack_size int not null check (pack_size in (3, 5)),
  tickets_used int not null default 0 check (tickets_used >= 0),
  expires_at timestamptz not null,
  created_at timestamptz not null default now(),
  constraint route_ticket_packs_used_le_size check (tickets_used <= pack_size)
);

create index if not exists route_ticket_packs_owner_idx
  on public.route_ticket_packs (owner_user_id, expires_at desc);

alter table public.route_ticket_packs enable row level security;

drop policy if exists route_ticket_packs_select_own on public.route_ticket_packs;
create policy route_ticket_packs_select_own on public.route_ticket_packs
  for select
  using ((select auth.uid()) = owner_user_id);

-- ─── route_share_invites ───────────────────────────────────────────────────
create table if not exists public.route_share_invites (
  id uuid primary key default gen_random_uuid(),
  grant_id uuid not null references public.route_access_grants (id) on delete cascade,
  granted_by_user_id uuid not null references auth.users (id) on delete cascade,
  granted_to_user_id uuid not null references auth.users (id) on delete cascade,
  status text not null default 'active' check (status in ('active', 'revoked')),
  created_at timestamptz not null default now(),
  revoked_at timestamptz,
  unique (grant_id, granted_to_user_id)
);

create index if not exists route_share_invites_to_idx
  on public.route_share_invites (granted_to_user_id, status);
create index if not exists route_share_invites_grant_idx
  on public.route_share_invites (grant_id, status);

alter table public.route_share_invites enable row level security;

drop policy if exists route_share_invites_select_party on public.route_share_invites;
create policy route_share_invites_select_party on public.route_share_invites
  for select
  using (
    (select auth.uid()) = granted_by_user_id
    or (select auth.uid()) = granted_to_user_id
  );

-- 발급/회수 mutation도 service-role 경유.

-- ─── 함수: active invite 개수 enforcement (application + DB 이중 방어) ────
create or replace function public.route_share_invite_enforce_limit()
returns trigger
language plpgsql
as $$
declare
  active_count int;
begin
  if (tg_op = 'INSERT' and new.status = 'active')
     or (tg_op = 'UPDATE' and new.status = 'active' and (old.status is null or old.status <> 'active')) then
    select count(*) into active_count
    from public.route_share_invites
    where grant_id = new.grant_id
      and status = 'active'
      and id <> new.id;
    if active_count >= 2 then
      raise exception 'route_share_invite_limit: grant_id % already has 2 active invites', new.grant_id;
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists route_share_invites_limit_trg on public.route_share_invites;
create trigger route_share_invites_limit_trg
  before insert or update on public.route_share_invites
  for each row
  execute function public.route_share_invite_enforce_limit();

-- ─── 함수: 활성 접근 판정 헬퍼 (RPC) ───────────────────────────────────────
-- 자주 쓰는 owner 판정: 본인 grant 미만료 + 만료 안된 active invite 매핑.
create or replace function public.route_access_resolve(p_route_id text, p_viewer uuid)
returns table (
  can_view boolean,
  reason text,
  expires_at timestamptz,
  shared_by_user_id uuid,
  grant_id uuid
)
language sql
stable
as $$
  -- 1) 본인 grant 미만료
  select true, 'owner'::text, g.expires_at, null::uuid, g.id
  from public.route_access_grants g
  where g.route_id = p_route_id
    and g.owner_user_id = p_viewer
    and g.expires_at > now()
  union all
  -- 2) 공유받음
  select true, 'shared-invite'::text, g.expires_at, g.owner_user_id, g.id
  from public.route_share_invites i
  join public.route_access_grants g on g.id = i.grant_id
  where i.granted_to_user_id = p_viewer
    and i.status = 'active'
    and g.route_id = p_route_id
    and g.expires_at > now()
  limit 1
$$;
