-- 비회원 고마움 insert — service role 없이도 동작하도록 SECURITY DEFINER RPC 제공
-- NOTE: 실제 결제 연동 전까지 demo provider만 사용 (server action이 amount/length를 선검증)

create or replace function public.thanks_payments_insert_guest(
  p_route_id uuid,
  p_harui_user_id uuid,
  p_gross_amount integer,
  p_message text,
  p_source text,
  p_guest_payer_key text,
  p_payer_display_name text,
  p_paid_at timestamptz,
  p_payment_key text,
  p_payment_provider text
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_route record;
  v_id uuid;
  v_since timestamptz;
begin
  if p_route_id is null or p_harui_user_id is null then
    raise exception 'invalid-input';
  end if;
  if p_gross_amount is null or p_gross_amount <= 0 then
    raise exception 'invalid-amount';
  end if;
  if p_guest_payer_key is null or length(trim(p_guest_payer_key)) < 6 then
    raise exception 'invalid-guest-key';
  end if;
  if p_payer_display_name is null or char_length(trim(p_payer_display_name)) < 2 then
    raise exception 'invalid-nickname';
  end if;

  select id, status, deleted_at, guardian_user_id
    into v_route
  from public.routes
  where id = p_route_id;

  if v_route is null then
    raise exception 'route-not-found';
  end if;
  if v_route.deleted_at is not null then
    raise exception 'route-not-found';
  end if;
  if v_route.guardian_user_id <> p_harui_user_id then
    raise exception 'harui-mismatch';
  end if;
  if v_route.status not in ('public', 'sample') then
    raise exception 'route-not-public';
  end if;

  -- 단순 중복 방지 (10초) — 서버 액션과 동일한 의도
  v_since := (coalesce(p_paid_at, now()) - interval '10 seconds');
  if exists (
    select 1
    from public.thanks_payments tp
    where tp.route_id = p_route_id
      and tp.payer_kind = 'guest'
      and tp.guest_payer_key = p_guest_payer_key
      and tp.gross_amount = p_gross_amount
      and tp.status = 'paid'
      and tp.paid_at >= v_since
  ) then
    raise exception 'duplicate-payment';
  end if;

  insert into public.thanks_payments (
    route_id,
    harui_user_id,
    payer_kind,
    payer_user_id,
    payer_display_name,
    guest_payer_key,
    gross_amount,
    platform_fee_rate,
    platform_fee_amount,
    harui_amount,
    pg_fee_amount,
    message,
    status,
    payment_provider,
    payment_key,
    source,
    paid_at
  ) values (
    p_route_id,
    p_harui_user_id,
    'guest',
    null,
    trim(p_payer_display_name),
    trim(p_guest_payer_key),
    p_gross_amount,
    0.1,
    floor(p_gross_amount * 0.1),
    (p_gross_amount - floor(p_gross_amount * 0.1)),
    0,
    left(coalesce(p_message, ''), 200),
    'paid',
    coalesce(p_payment_provider, 'demo'),
    p_payment_key,
    p_source,
    coalesce(p_paid_at, now())
  )
  returning id into v_id;

  return v_id;
end;
$$;

revoke execute on function public.thanks_payments_insert_guest(
  uuid, uuid, integer, text, text, text, text, timestamptz, text, text
) from public;

grant execute on function public.thanks_payments_insert_guest(
  uuid, uuid, integer, text, text, text, text, timestamptz, text, text
) to anon, authenticated;

