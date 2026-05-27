-- ============================================================================
-- Phase 3I: 만료 알림 dedup 테이블
-- 정책: docs/payment-and-share-policy.md §6 (롤아웃 운영)
--
-- /api/cron/grant-expiry-notify 가 정기적으로 grant를 검사해서
-- 72h/24h/expired 알림을 큐에 넣을 때, 같은 (grant_id, kind) 쌍에 대해
-- 중복 전송되지 않도록 기록한다.
--
-- 실제 알림 전송(메일·푸시·인앱 토스트)은 별도 모듈에서 본 테이블 row를
-- 읽어 처리한다. 본 PR은 dedup + queue write까지만.
-- ============================================================================

create table if not exists public.route_grant_expiry_notifications (
  id uuid primary key default gen_random_uuid(),
  grant_id uuid not null references public.route_access_grants (id) on delete cascade,
  /** 72h: 만료 72시간 전 / 24h: 24시간 전 / expired: 만료 직후 */
  kind text not null check (kind in ('72h', '24h', 'expired')),
  /** queued → sent → failed. cron은 queued만 생성. 알림 워커가 sent/failed로 갱신. */
  status text not null default 'queued' check (status in ('queued', 'sent', 'failed')),
  /** 운영 로그: 실패 사유, 메시지 ID 등 */
  meta jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  sent_at timestamptz,
  unique (grant_id, kind)
);

create index if not exists route_grant_expiry_notifications_status_idx
  on public.route_grant_expiry_notifications (status, created_at);

alter table public.route_grant_expiry_notifications enable row level security;
-- service-role만 read/write. 일반 사용자는 RLS 기본 거부.
