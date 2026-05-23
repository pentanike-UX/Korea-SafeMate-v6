-- RLS는 enable됐지만 정책이 없어 default-deny 상태인 12개 테이블에 의도 정책 추가.
-- 모든 운영 호출은 service role을 통해 일어나며 RLS 우회 → 운영 영향 없음.
-- 명시 정책은 의도 문서화 + 향후 사용자 클라이언트 직접 접근 시 안전 가드.

-- ─── 1) 사용자 본인만 접근 (mypage_* attention) ────────────────────────────
-- user_id가 text 타입이라 auth.uid()를 cast.
drop policy if exists "mypage_menu_attention_seen_owner" on public.mypage_menu_attention_seen;
create policy "mypage_menu_attention_seen_owner"
  on public.mypage_menu_attention_seen for all
  using (user_id = auth.uid()::text)
  with check (user_id = auth.uid()::text);

drop policy if exists "mypage_block_attention_seen_owner" on public.mypage_block_attention_seen;
create policy "mypage_block_attention_seen_owner"
  on public.mypage_block_attention_seen for all
  using (user_id = auth.uid()::text)
  with check (user_id = auth.uid()::text);

-- ─── 2) 공개 읽기 (참조 데이터 / 디스플레이용) ─────────────────────────────
drop policy if exists "service_types_public_read" on public.service_types;
create policy "service_types_public_read"
  on public.service_types for select using (true);

drop policy if exists "featured_guardians_public_read" on public.featured_guardians;
create policy "featured_guardians_public_read"
  on public.featured_guardians for select using (true);

-- 공개 글만(approved/blocked). guardian 본인은 자기 글 모든 상태 조회.
drop policy if exists "content_posts_public_read_approved" on public.content_posts;
create policy "content_posts_public_read_approved"
  on public.content_posts for select
  using (status in ('approved', 'blocked'));

drop policy if exists "content_posts_author_read_self" on public.content_posts;
create policy "content_posts_author_read_self"
  on public.content_posts for select
  using (author_user_id = auth.uid());

-- guardian_languages: 누구나 읽기(가디언 프로필 표시)
drop policy if exists "guardian_languages_public_read" on public.guardian_languages;
create policy "guardian_languages_public_read"
  on public.guardian_languages for select using (true);

-- ─── 3) Admin 전용 (audit / sensitive) ──────────────────────────────────
drop policy if exists "admin_accounts_admin_only" on public.admin_accounts;
create policy "admin_accounts_admin_only"
  on public.admin_accounts for all
  using (exists (
    select 1 from public.users
    where id = auth.uid() and app_role in ('admin', 'super_admin')
  ));

drop policy if exists "admin_notes_admin_only" on public.admin_notes;
create policy "admin_notes_admin_only"
  on public.admin_notes for all
  using (exists (
    select 1 from public.users
    where id = auth.uid() and app_role in ('admin', 'super_admin')
  ));

drop policy if exists "booking_status_history_admin_only" on public.booking_status_history;
create policy "booking_status_history_admin_only"
  on public.booking_status_history for all
  using (exists (
    select 1 from public.users
    where id = auth.uid() and app_role in ('admin', 'super_admin')
  ));

drop policy if exists "guardian_activity_logs_admin_only" on public.guardian_activity_logs;
create policy "guardian_activity_logs_admin_only"
  on public.guardian_activity_logs for all
  using (exists (
    select 1 from public.users
    where id = auth.uid() and app_role in ('admin', 'super_admin')
  ));

drop policy if exists "incidents_admin_only" on public.incidents;
create policy "incidents_admin_only"
  on public.incidents for all
  using (exists (
    select 1 from public.users
    where id = auth.uid() and app_role in ('admin', 'super_admin')
  ));

drop policy if exists "contact_methods_owner" on public.contact_methods;
create policy "contact_methods_owner"
  on public.contact_methods for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());
