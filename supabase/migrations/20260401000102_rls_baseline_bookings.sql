-- v6 RLS: bookings — 트래블러/가디언 각자 본인 의뢰만 (§2.9 DATA_MODEL_API.md)
alter table public.bookings enable row level security;

drop policy if exists "bookings_select_traveler" on public.bookings;
create policy "bookings_select_traveler"
  on public.bookings for select
  using (traveler_user_id = auth.uid());

drop policy if exists "bookings_select_guardian" on public.bookings;
create policy "bookings_select_guardian"
  on public.bookings for select
  using (guardian_user_id = auth.uid());

drop policy if exists "bookings_insert_traveler" on public.bookings;
create policy "bookings_insert_traveler"
  on public.bookings for insert
  with check (traveler_user_id = auth.uid());

drop policy if exists "bookings_update_guardian_owned_row" on public.bookings;
create policy "bookings_update_guardian_owned_row"
  on public.bookings for update
  using (guardian_user_id = auth.uid())
  with check (guardian_user_id = auth.uid());

drop policy if exists "bookings_admin" on public.bookings;
create policy "bookings_admin"
  on public.bookings for all
  using (
    exists (
      select 1 from public.users
      where id = auth.uid()
      and app_role = 'admin'
    )
  );
