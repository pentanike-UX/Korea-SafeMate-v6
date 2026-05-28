-- 고마움 표현하기(선택 결제) — v2026 무료 확산 모델
create table if not exists public.thanks_payments (
  id uuid primary key default gen_random_uuid(),
  route_id uuid not null references public.routes (id) on delete cascade,
  harui_user_id uuid not null references auth.users (id) on delete cascade,
  payer_user_id uuid references auth.users (id) on delete set null,
  payer_display_name text,
  gross_amount int not null check (gross_amount > 0),
  platform_fee_rate numeric(5, 4) not null default 0.1,
  platform_fee_amount int not null check (platform_fee_amount >= 0),
  harui_amount int not null check (harui_amount >= 0),
  pg_fee_amount int not null default 0 check (pg_fee_amount >= 0),
  message text check (char_length(coalesce(message, '')) <= 200),
  status text not null default 'pending'
    check (status in ('pending', 'paid', 'failed', 'cancelled', 'refunded')),
  payment_provider text,
  payment_key text,
  source text,
  created_at timestamptz not null default now(),
  paid_at timestamptz
);

create index if not exists thanks_payments_route_idx on public.thanks_payments (route_id, created_at desc);
create index if not exists thanks_payments_harui_idx on public.thanks_payments (harui_user_id, created_at desc);
create index if not exists thanks_payments_payer_idx on public.thanks_payments (payer_user_id, created_at desc)
  where payer_user_id is not null;

alter table public.thanks_payments enable row level security;

drop policy if exists "thanks_payments_insert_authenticated" on public.thanks_payments;
create policy "thanks_payments_insert_authenticated"
  on public.thanks_payments for insert
  with check (auth.uid() is not null and payer_user_id = auth.uid());

drop policy if exists "thanks_payments_select_payer" on public.thanks_payments;
create policy "thanks_payments_select_payer"
  on public.thanks_payments for select
  using (payer_user_id = auth.uid());

drop policy if exists "thanks_payments_select_harui" on public.thanks_payments;
create policy "thanks_payments_select_harui"
  on public.thanks_payments for select
  using (harui_user_id = auth.uid());

comment on table public.thanks_payments is 'Traveler voluntary thanks to route guardian (not route access purchase).';
