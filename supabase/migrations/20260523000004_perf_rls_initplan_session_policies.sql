-- 이번 세션에서 추가한 RLS 정책의 auth.uid()를 (select auth.uid())로 감싸
-- row-level 재평가 제거 (Supabase auth_rls_initplan 권고).
-- + content_posts 중복 SELECT 정책 2개 → 1개 OR 정책으로 통합(multiple_permissive_policies 완화).

drop policy if exists "mypage_menu_attention_seen_owner" on public.mypage_menu_attention_seen;
create policy "mypage_menu_attention_seen_owner"
  on public.mypage_menu_attention_seen for all
  using (user_id = (select auth.uid())::text)
  with check (user_id = (select auth.uid())::text);

drop policy if exists "mypage_block_attention_seen_owner" on public.mypage_block_attention_seen;
create policy "mypage_block_attention_seen_owner"
  on public.mypage_block_attention_seen for all
  using (user_id = (select auth.uid())::text)
  with check (user_id = (select auth.uid())::text);

drop policy if exists "content_posts_public_read_approved" on public.content_posts;
drop policy if exists "content_posts_author_read_self" on public.content_posts;
drop policy if exists "content_posts_read" on public.content_posts;
create policy "content_posts_read" on public.content_posts for select
  using (status in ('approved', 'blocked') or author_user_id = (select auth.uid()));

drop policy if exists "admin_accounts_admin_only" on public.admin_accounts;
create policy "admin_accounts_admin_only" on public.admin_accounts for all
  using (exists (select 1 from public.users where id = (select auth.uid()) and app_role in ('admin','super_admin')));

drop policy if exists "admin_notes_admin_only" on public.admin_notes;
create policy "admin_notes_admin_only" on public.admin_notes for all
  using (exists (select 1 from public.users where id = (select auth.uid()) and app_role in ('admin','super_admin')));

drop policy if exists "booking_status_history_admin_only" on public.booking_status_history;
create policy "booking_status_history_admin_only" on public.booking_status_history for all
  using (exists (select 1 from public.users where id = (select auth.uid()) and app_role in ('admin','super_admin')));

drop policy if exists "guardian_activity_logs_admin_only" on public.guardian_activity_logs;
create policy "guardian_activity_logs_admin_only" on public.guardian_activity_logs for all
  using (exists (select 1 from public.users where id = (select auth.uid()) and app_role in ('admin','super_admin')));

drop policy if exists "incidents_admin_only" on public.incidents;
create policy "incidents_admin_only" on public.incidents for all
  using (exists (select 1 from public.users where id = (select auth.uid()) and app_role in ('admin','super_admin')));

drop policy if exists "contact_methods_owner" on public.contact_methods;
create policy "contact_methods_owner" on public.contact_methods for all
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

drop policy if exists "traveler_saved_routes_select_own" on public.traveler_saved_routes;
create policy "traveler_saved_routes_select_own" on public.traveler_saved_routes for select
  using ((select auth.uid()) = traveler_user_id);
drop policy if exists "traveler_saved_routes_insert_own" on public.traveler_saved_routes;
create policy "traveler_saved_routes_insert_own" on public.traveler_saved_routes for insert
  with check ((select auth.uid()) = traveler_user_id);
drop policy if exists "traveler_saved_routes_delete_own" on public.traveler_saved_routes;
create policy "traveler_saved_routes_delete_own" on public.traveler_saved_routes for delete
  using ((select auth.uid()) = traveler_user_id);

create index if not exists traveler_saved_routes_route_idx
  on public.traveler_saved_routes (route_id);
