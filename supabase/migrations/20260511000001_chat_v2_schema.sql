-- ─────────────────────────────────────────────────────────────────────────────
-- chat_v2: pre-booking 문의 스레드 지원 + AI 자동답변 플래그
-- ─────────────────────────────────────────────────────────────────────────────

-- 1. message_threads.booking_id → nullable (pre_booking 문의는 부킹 전 생성)
alter table public.message_threads
  alter column booking_id drop not null;

-- 2. inquiry_kind 구분 컬럼 추가
alter table public.message_threads
  add column if not exists inquiry_kind text not null default 'pre_booking'
    check (inquiry_kind in ('pre_booking', 'post_booking'));

-- 기존 행: booking_id 있으면 post_booking
update public.message_threads
  set inquiry_kind = 'post_booking'
  where booking_id is not null;

-- 3. pre_booking 스레드는 traveler+guardian 페어로 유일 (중복 생성 방지)
create unique index if not exists message_threads_pair_pre_booking_uidx
  on public.message_threads (traveler_user_id, guardian_user_id)
  where inquiry_kind = 'pre_booking';

-- 4. messages: AI 자동답변 여부 플래그
alter table public.messages
  add column if not exists is_ai_reply boolean not null default false;

-- 5. guardian_profiles: AI 자동답변 설정 토글
alter table public.guardian_profiles
  add column if not exists ai_auto_reply_enabled boolean not null default false;

-- 6. RLS: INSERT 정책 — pre_booking 스레드 생성 허용 (본인이 traveler)
drop policy if exists "message_threads_insert" on public.message_threads;
create policy "message_threads_insert"
  on public.message_threads for insert
  with check (traveler_user_id = auth.uid());

-- 7. RLS: UPDATE 정책 — last_message_at 갱신용 (참여자만)
drop policy if exists "message_threads_update_participants" on public.message_threads;
create policy "message_threads_update_participants"
  on public.message_threads for update
  using (
    traveler_user_id = auth.uid()
    or guardian_user_id = auth.uid()
  );

-- 8. Supabase Realtime 활성화 (messages 테이블)
-- Dashboard에서 이미 활성화된 경우 무시
alter publication supabase_realtime add table public.messages;
