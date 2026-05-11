-- ─────────────────────────────────────────────────────────────────────────────
-- guardian_profiles.last_seen_at — 온라인/오프라인 판정 단일 소스
-- 5분 이내 = "지금 온라인", 외 = "오프라인". heartbeat은 가디언 워크스페이스 진입 시 upsert.
-- Rollback: see bottom comment.
-- ─────────────────────────────────────────────────────────────────────────────

alter table public.guardian_profiles
  add column if not exists last_seen_at timestamptz;

create index if not exists guardian_profiles_last_seen_idx
  on public.guardian_profiles (last_seen_at desc nulls last);

comment on column public.guardian_profiles.last_seen_at is
  'ISO timestamptz — 가디언 마지막 활동 시각. now()-5분 이내면 "지금 온라인" 표기.';

-- ── Rollback (수동 적용) ─────────────────────────────────────────────────────
-- drop index if exists public.guardian_profiles_last_seen_idx;
-- alter table public.guardian_profiles drop column if exists last_seen_at;
