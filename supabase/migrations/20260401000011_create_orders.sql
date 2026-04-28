-- v6: orders (신규) — bookings와 1:1
create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null unique references public.bookings (id) on delete cascade,
  traveler_user_id uuid not null references public.users (id) on delete cascade,
  guardian_user_id uuid not null references public.users (id) on delete cascade,

  tier text not null,
  gross_amount_krw_cents bigint not null,
  platform_fee_krw_cents bigint not null,
  guardian_payout_krw_cents bigint not null,
  commission_rate numeric(4, 3) not null,

  payment_status text not null default 'pending'
    check (payment_status in ('pending', 'paid', 'failed', 'refunded')),
  payment_provider text default 'stripe',
  payment_provider_ref text,
  paid_at timestamptz,

  payout_status text not null default 'pending'
    check (payout_status in ('pending', 'processing', 'paid', 'failed')),
  payout_provider_ref text,
  paid_out_at timestamptz,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists orders_traveler_user_idx on public.orders (traveler_user_id);
create index if not exists orders_guardian_user_idx on public.orders (guardian_user_id);
create index if not exists orders_payment_status_idx on public.orders (payment_status);
create index if not exists orders_payout_status_idx on public.orders (payout_status);

drop trigger if exists orders_updated_at on public.orders;
create trigger orders_updated_at
  before update on public.orders
  for each row execute function public.update_updated_at_column();

alter table public.orders enable row level security;

drop policy if exists "orders_select_traveler" on public.orders;
create policy "orders_select_traveler"
  on public.orders for select
  using (traveler_user_id = auth.uid());

drop policy if exists "orders_select_guardian" on public.orders;
create policy "orders_select_guardian"
  on public.orders for select
  using (guardian_user_id = auth.uid());

drop policy if exists "orders_server_only" on public.orders;
create policy "orders_server_only"
  on public.orders for insert
  with check (false);

drop policy if exists "orders_admin" on public.orders;
create policy "orders_admin"
  on public.orders for all
  using (
    exists (
      select 1 from public.users
      where id = auth.uid()
      and app_role = 'admin'
    )
  );
