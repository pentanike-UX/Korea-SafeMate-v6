-- v6 RLS: traveler_profiles — 본인(user_id = auth.uid())만
alter table public.traveler_profiles enable row level security;

drop policy if exists "traveler_profiles_select_own" on public.traveler_profiles;
create policy "traveler_profiles_select_own"
  on public.traveler_profiles for select
  using (user_id = auth.uid());

drop policy if exists "traveler_profiles_insert_own" on public.traveler_profiles;
create policy "traveler_profiles_insert_own"
  on public.traveler_profiles for insert
  with check (user_id = auth.uid());

drop policy if exists "traveler_profiles_update_own" on public.traveler_profiles;
create policy "traveler_profiles_update_own"
  on public.traveler_profiles for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

drop policy if exists "traveler_profiles_admin" on public.traveler_profiles;
create policy "traveler_profiles_admin"
  on public.traveler_profiles for all
  using (
    exists (
      select 1 from public.users
      where id = auth.uid()
      and app_role = 'admin'
    )
  );
