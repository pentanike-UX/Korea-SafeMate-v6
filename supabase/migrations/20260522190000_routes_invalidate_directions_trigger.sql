-- route_spots 변경(INSERT/UPDATE/DELETE) 시 parent route의 directions_meta를 무효화.
-- 좌표·순서가 바뀌었는데 admin이 게시/리프레시를 안 했을 때 stale 폴리라인이 남는 걸 방지.
-- delivery API는 spot 인서트 직후 directions_meta를 재계산해 넣으므로 같은 트랜잭션에서
-- 트리거가 NULL을 쓴 뒤 다시 채워진다(순서 안전).

create or replace function public.routes_invalidate_directions_meta_from_route_spots()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  target_route_id uuid;
begin
  -- INSERT/DELETE는 row의 route_id를 그대로 사용.
  -- UPDATE는 spot_id 또는 sort_order가 실제로 바뀐 경우에만 무효화.
  if (tg_op = 'INSERT') then
    target_route_id := new.route_id;
  elsif (tg_op = 'DELETE') then
    target_route_id := old.route_id;
  elsif (tg_op = 'UPDATE') then
    if (new.spot_id is distinct from old.spot_id
        or new.sort_order is distinct from old.sort_order) then
      target_route_id := new.route_id;
    else
      return new;
    end if;
  else
    return null;
  end if;

  update public.routes
    set directions_meta = null
    where id = target_route_id
      and directions_meta is not null;

  if (tg_op = 'DELETE') then
    return old;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_route_spots_invalidate_directions on public.route_spots;
create trigger trg_route_spots_invalidate_directions
  after insert or update or delete on public.route_spots
  for each row
  execute function public.routes_invalidate_directions_meta_from_route_spots();

comment on function public.routes_invalidate_directions_meta_from_route_spots() is
  'route_spots 변경 시 부모 routes.directions_meta를 NULL로 자동 무효화 (delivery API가 같은 트랜잭션에서 재계산).';

-- PostgREST가 public.* 함수를 RPC로 노출하므로, 트리거 전용 함수는 EXECUTE 회수.
-- 트리거는 DB 시스템이 직접 호출하므로 EXECUTE 권한과 무관하게 동작한다.
revoke execute on function public.routes_invalidate_directions_meta_from_route_spots() from public;
revoke execute on function public.routes_invalidate_directions_meta_from_route_spots() from anon;
revoke execute on function public.routes_invalidate_directions_meta_from_route_spots() from authenticated;
