-- 사전 존재 함수 5종이 PostgREST를 통해 anon/authenticated로 호출 가능했던 lint 경고 해소.
-- 모든 호출자가 service role 클라이언트로 동작하는 것을 codegrep으로 확인 후 적용.
-- service role은 GRANT 체인을 우회해 항상 실행 가능 → 운영 영향 없음.

revoke execute on function public.points_apply_ledger(
  uuid, integer, public.point_ledger_event_type, text, uuid,
  public.point_ledger_status, text, text, text,
  timestamp with time zone, timestamp with time zone
) from public, anon, authenticated;

revoke execute on function public.rls_auto_enable() from public, anon, authenticated;

revoke execute on function public.service_count_unread_chat_threads(uuid)
  from public, anon, authenticated;

revoke execute on function public.service_message_threads_list_for_user(uuid)
  from public, anon, authenticated;

revoke execute on function public.wayly_record_usage(integer, bigint, bigint, integer, integer)
  from public, anon, authenticated;

-- update_updated_at*: 트리거 전용 함수, EXECUTE 없이도 트리거는 작동.
-- 동시에 search_path mutable 경고도 해소(set search_path 추가).
create or replace function public.update_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.update_updated_at_column()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

revoke execute on function public.update_updated_at() from public, anon, authenticated;
revoke execute on function public.update_updated_at_column() from public, anon, authenticated;
