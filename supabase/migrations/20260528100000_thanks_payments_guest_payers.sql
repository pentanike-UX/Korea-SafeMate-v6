-- 비회원(게스트) 고마움 표현 — payer_kind · guest_payer_key
alter table public.thanks_payments
  add column if not exists payer_kind text not null default 'member',
  add column if not exists guest_payer_key text;

alter table public.thanks_payments
  drop constraint if exists thanks_payments_payer_kind_check;

alter table public.thanks_payments
  add constraint thanks_payments_payer_kind_check
  check (payer_kind in ('member', 'guest'));

alter table public.thanks_payments
  alter column payer_user_id drop not null;

alter table public.thanks_payments
  drop constraint if exists thanks_payments_payer_shape_check;

alter table public.thanks_payments
  add constraint thanks_payments_payer_shape_check
  check (
    (payer_kind = 'member' and payer_user_id is not null)
    or (
      payer_kind = 'guest'
      and payer_user_id is null
      and payer_display_name is not null
      and char_length(trim(payer_display_name)) >= 2
    )
  );

create index if not exists thanks_payments_guest_key_idx
  on public.thanks_payments (route_id, guest_payer_key, paid_at desc)
  where payer_kind = 'guest' and guest_payer_key is not null;

comment on column public.thanks_payments.payer_kind is 'member = 로그인 여행자, guest = 비회원(닉네임 표시)';
comment on column public.thanks_payments.guest_payer_key is '비회원 브라우저 식별자(중복 결제 방지·하루이 UI 비노출)';
