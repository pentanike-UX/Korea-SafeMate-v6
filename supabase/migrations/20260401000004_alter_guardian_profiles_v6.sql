-- v6: guardian_profiles — 공개/정산/파운딩 필드 (matching_enabled와 is_public은 별도 용도)
-- status: approval_status + profile_status 유지. v6에서 "활성 공개"는
--   approval_status = 'approved' and profile_status <> 'suspended' 등으로 조합.
alter table public.guardian_profiles
  add column if not exists is_founding_member boolean not null default false,
  add column if not exists founding_commission_expires_at timestamptz,
  add column if not exists stripe_account_id text,
  add column if not exists payout_schedule text default 'monthly',
  add column if not exists is_public boolean not null default false;
