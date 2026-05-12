-- ─────────────────────────────────────────────────────────────────────────────
-- user_push_subscriptions — Web Push (VAPID) 구독 정보 저장
-- 각 사용자가 여러 디바이스/브라우저에서 구독 가능. endpoint 단위 unique.
-- ─────────────────────────────────────────────────────────────────────────────

create table if not exists public.user_push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  user_agent text,
  created_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now()
);

create index if not exists user_push_subscriptions_user_idx
  on public.user_push_subscriptions(user_id);

alter table public.user_push_subscriptions enable row level security;

drop policy if exists "push_own_select" on public.user_push_subscriptions;
create policy "push_own_select"
  on public.user_push_subscriptions for select
  using (user_id = auth.uid());

drop policy if exists "push_own_insert" on public.user_push_subscriptions;
create policy "push_own_insert"
  on public.user_push_subscriptions for insert
  with check (user_id = auth.uid());

drop policy if exists "push_own_delete" on public.user_push_subscriptions;
create policy "push_own_delete"
  on public.user_push_subscriptions for delete
  using (user_id = auth.uid());

-- service role 은 RLS 우회 — 푸시 전송 시 다른 사용자 구독 조회에 사용

-- ── Rollback ────────────────────────────────────────────────────────────────
-- drop table if exists public.user_push_subscriptions;
