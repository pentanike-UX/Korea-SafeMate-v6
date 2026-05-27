-- ============================================================================
-- Phase 3H: 어뷰징 감시 — route_abuse_signals 로그 테이블
-- 정책: docs/payment-and-share-policy.md §3.5
--
-- 모든 INSERT는 service-role 경유. SELECT는 super_admin만.
-- 이벤트 종류:
--   invite-cycle-warn:  같은 grant에서 revoke→reissue 누적이 임계치 근접/초과
--   invite-rapid-warn:  짧은 시간(예: 1시간) 내 다수 무료 초대 발급
--   invite-self-attempt: 자기 자신에게 초대 시도(차단됨)
--   share-link-anon-attempt: 비식별 share URL로 접근 시도(차단됨)
-- ============================================================================

create table if not exists public.route_abuse_signals (
  id uuid primary key default gen_random_uuid(),
  signal_type text not null check (signal_type in (
    'invite-cycle-warn',
    'invite-rapid-warn',
    'invite-self-attempt',
    'share-link-anon-attempt',
    'comp-issued',
    'grant-expired-manual'
  )),
  severity text not null default 'info' check (severity in ('info', 'warn', 'critical')),
  /** 관련 grant — 있으면 채움. */
  grant_id uuid references public.route_access_grants (id) on delete set null,
  /** 관련 사용자 — 행위자 또는 피해자. */
  actor_user_id uuid references auth.users (id) on delete set null,
  target_user_id uuid references auth.users (id) on delete set null,
  /** 자유 metadata (route_id, counts 등) */
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists route_abuse_signals_created_idx
  on public.route_abuse_signals (created_at desc);
create index if not exists route_abuse_signals_grant_idx
  on public.route_abuse_signals (grant_id, created_at desc);
create index if not exists route_abuse_signals_actor_idx
  on public.route_abuse_signals (actor_user_id, created_at desc);

alter table public.route_abuse_signals enable row level security;

-- super_admin만 SELECT — application(service-role)에서 admin role 검사 후 조회.
-- 일반 사용자는 RLS로 기본 거부.

-- ============================================================================
-- route_share_invites: 같은 (grant_id, granted_to_user_id) 쌍에 대해 누적 revoke
-- 카운트가 정책상 5회를 넘으면 새 active 발급을 막는다.
-- (DB level enforcement — 어뷰징 자동 방어)
-- ============================================================================

-- 어뷰징 방지: 같은 grant 내에서 누적 revoke 5회를 넘으면 새 invite를 막는다.
-- (오너가 무한히 그랜티를 바꿔가며 무료 공유를 회전시키는 패턴 차단)
create or replace function public.route_share_invite_enforce_revoke_cycle()
returns trigger
language plpgsql
as $$
declare
  total_revoked int;
begin
  if (tg_op = 'INSERT' and new.status = 'active') then
    select count(*) into total_revoked
    from public.route_share_invites
    where grant_id = new.grant_id
      and status = 'revoked';
    if total_revoked >= 5 then
      raise exception 'route_share_invite_revoke_cycle: grant=% has revoked %x — abuse threshold',
        new.grant_id, total_revoked;
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists route_share_invites_revoke_cycle_trg on public.route_share_invites;
create trigger route_share_invites_revoke_cycle_trg
  before insert on public.route_share_invites
  for each row
  execute function public.route_share_invite_enforce_revoke_cycle();
