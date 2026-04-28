-- v6 RLS: guardian_profiles — is_public 공개 읽기 + 본인 전체 + admin
-- under_review 상태는 공개 노출 안 함.
-- matching_enabled 는 매칭 알고리즘 전용으로 공개 SELECT 조건과 별개.
alter table public.guardian_profiles enable row level security;

drop policy if exists "guardian_profiles_select_public" on public.guardian_profiles;
create policy "guardian_profiles_select_public"
  on public.guardian_profiles for select
  using (
    approval_status = 'approved'
    and (profile_status is null or profile_status::text != 'suspended')
    and is_public = true
  );

drop policy if exists "guardian_profiles_select_own" on public.guardian_profiles;
create policy "guardian_profiles_select_own"
  on public.guardian_profiles for select
  using (user_id = auth.uid());

drop policy if exists "guardian_profiles_insert_own" on public.guardian_profiles;
create policy "guardian_profiles_insert_own"
  on public.guardian_profiles for insert
  with check (user_id = auth.uid());

drop policy if exists "guardian_profiles_update_own" on public.guardian_profiles;
create policy "guardian_profiles_update_own"
  on public.guardian_profiles for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

drop policy if exists "guardian_profiles_admin" on public.guardian_profiles;
create policy "guardian_profiles_admin"
  on public.guardian_profiles for all
  using (
    exists (
      select 1 from public.users
      where id = auth.uid()
      and app_role = 'admin'
    )
  );
