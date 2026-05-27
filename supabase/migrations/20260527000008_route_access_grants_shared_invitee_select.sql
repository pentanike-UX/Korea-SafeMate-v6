-- 초대받은 사용자가 route_access_resolve RPC의 shared-invite 조인에서
-- grant 행(expires_at, route_id)을 읽을 수 있도록 SELECT 정책 추가.
-- (기존: owner만 grant SELECT 가능 → invitee는 RPC가 빈 결과 → 결제 화면으로 오인)

drop policy if exists route_access_grants_select_shared_invitee on public.route_access_grants;
create policy route_access_grants_select_shared_invitee on public.route_access_grants
  for select
  using (
    exists (
      select 1
      from public.route_share_invites i
      where i.grant_id = route_access_grants.id
        and i.granted_to_user_id = (select auth.uid())
        and i.status = 'active'
    )
  );
