-- ============================================================================
-- Phase 3N — route_share_invites 토큰 링크 모델
--   기존: 오너가 회원 검색 후 granted_to_user_id에 직접 발급 (회원 검색 부담 ↑)
--   변경: 오너가 토큰 발급 → URL 공유 → 받은 사람이 로그인 후 redeem 시 매핑
--
-- 호환성:
--   - granted_to_user_id가 채워진 row는 그대로 active로 동작 (기존 회원 검색 경로)
--   - granted_to_user_id가 NULL이면 "redeem 대기" 토큰 row
--   - 트리거의 active count 제한(grant당 2개)은 NULL row도 카운트 — 무차별 토큰 방지
--   - route_access_resolve는 granted_to_user_id가 채워졌을 때만 매칭되므로 그대로 OK
-- ============================================================================

-- 1) granted_to_user_id를 nullable로 변경
alter table public.route_share_invites
  alter column granted_to_user_id drop not null;

-- 2) invite_token: URL safe short token (orclient에서 nanoid/randomBytes로 생성)
alter table public.route_share_invites
  add column if not exists invite_token text;

create unique index if not exists route_share_invites_token_uidx
  on public.route_share_invites (invite_token)
  where invite_token is not null;

-- 3) redeemed_at: granted_to_user_id가 채워진 시점 추적 (감사/분석용)
alter table public.route_share_invites
  add column if not exists redeemed_at timestamptz;

-- 4) 기존 unique(grant_id, granted_to_user_id)는 NULL 다수 허용하므로 그대로 둠.
--    Postgres 기본 동작: NULL은 unique 비교에서 distinct로 취급되어 같은 grant_id에
--    granted_to_user_id=NULL인 여러 row 가능.

comment on column public.route_share_invites.invite_token is
  'URL 공유용 short token. NULL이면 회원 검색 직접 발급 경로(legacy).';
comment on column public.route_share_invites.redeemed_at is
  'granted_to_user_id가 채워진 시점. 토큰 발급 → redeem 흐름의 latency 측정용.';
