-- ============================================================================
-- Phase 3J: Comp grant 사유 메타 + 운영 audit log
-- 정책: docs/payment-and-share-policy.md
--
-- 1) route_access_grants에 comp_reason text 추가 — admin-comp source 발급 시
--    필수. 다른 source(single/trio/penta)는 null.
-- 2) abuse_signals.payload는 이미 jsonb라 별도 컬럼 추가 없이 사유를 운영 로그로
--    노출. 기존 comp-issued signal payload에 reason을 포함.
-- ============================================================================

alter table public.route_access_grants
  add column if not exists comp_reason text;

-- admin-comp source일 때만 reason이 NOT NULL이어야 한다.
alter table public.route_access_grants
  drop constraint if exists route_access_grants_comp_reason_required;
alter table public.route_access_grants
  add constraint route_access_grants_comp_reason_required
  check (source <> 'admin-comp' or (comp_reason is not null and length(trim(comp_reason)) >= 3));
