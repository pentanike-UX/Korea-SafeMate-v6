-- ─────────────────────────────────────────────────────────────────────────────
-- Chat / pre_booking threads: context column, message limits, read receipts,
-- traveler message counter trigger, list RPC, unread count for service snapshot.
-- ─────────────────────────────────────────────────────────────────────────────

-- 1. Optional context: which content post the traveler inquired from
alter table public.message_threads
  add column if not exists content_post_id uuid references public.content_posts (id) on delete set null;

create index if not exists message_threads_content_post_idx
  on public.message_threads (content_post_id)
  where content_post_id is not null;

comment on column public.message_threads.content_post_id is
  'Optional: content_posts.id when traveler opened inquiry from a post; may be updated on later opens.';

-- 2. Pre_booking threads: allow enough back-and-forth (legacy default was 1).
update public.message_threads
set max_messages_traveler = greatest(max_messages_traveler, 100)
where inquiry_kind = 'pre_booking';

alter table public.message_threads
  alter column max_messages_traveler set default 100;

-- 3. Reconcile traveler_message_count from existing messages (idempotent).
update public.message_threads mt
set traveler_message_count = (
  select count(*)::int
  from public.messages m
  where m.thread_id = mt.id
    and m.sender_role = 'traveler'
    and coalesce(m.is_ai_reply, false) = false
);

-- 4. Increment traveler_message_count only for real traveler sends (not AI rows).
create or replace function public.messages_after_insert_bump_traveler_count()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  if new.sender_role = 'traveler' and coalesce(new.is_ai_reply, false) = false then
    update public.message_threads
    set traveler_message_count = traveler_message_count + 1
    where id = new.thread_id;
  end if;
  return new;
end;
$$;

drop trigger if exists message_threads_bump_traveler_count_trg on public.messages;
create trigger message_threads_bump_traveler_count_trg
  after insert on public.messages
  for each row
  execute function public.messages_after_insert_bump_traveler_count();

-- 5. Only is_read may change on UPDATE (RLS alone cannot enforce column-level).
create or replace function public.messages_before_update_guard()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  if (old.id, old.thread_id, old.sender_user_id, old.sender_role, old.content, old.content_type, old.created_at, old.is_ai_reply)
     is distinct from
     (new.id, new.thread_id, new.sender_user_id, new.sender_role, new.content, new.content_type, new.created_at, new.is_ai_reply)
  then
    raise exception 'messages: only is_read may be updated' using errcode = '23514';
  end if;
  return new;
end;
$$;

drop trigger if exists messages_before_update_guard_trg on public.messages;
create trigger messages_before_update_guard_trg
  before update on public.messages
  for each row
  execute function public.messages_before_update_guard();

-- 6. RLS: participants may mark *incoming* messages as read.
drop policy if exists "messages_update_read_receipts" on public.messages;
create policy "messages_update_read_receipts"
  on public.messages for update
  using (
    sender_user_id is distinct from auth.uid()
    and thread_id in (
      select mt.id from public.message_threads mt
      where mt.traveler_user_id = auth.uid()
         or mt.guardian_user_id = auth.uid()
    )
  )
  with check (
    sender_user_id is distinct from auth.uid()
    and thread_id in (
      select mt.id from public.message_threads mt
      where mt.traveler_user_id = auth.uid()
         or mt.guardian_user_id = auth.uid()
    )
  );

-- 7. List threads for current user with preview + unread (no users.email — RLS blocks cross-user email).
create or replace function public.message_threads_list_for_viewer()
returns table (
  id uuid,
  booking_id uuid,
  inquiry_kind text,
  traveler_user_id uuid,
  guardian_user_id uuid,
  max_messages_traveler int,
  traveler_message_count int,
  last_message_at timestamptz,
  created_at timestamptz,
  content_post_id uuid,
  other_user_id uuid,
  other_display_name text,
  other_avatar_url text,
  unread_count bigint,
  last_message_preview text,
  message_count bigint
)
language sql
stable
security invoker
set search_path = public
as $$
  select
    mt.id,
    mt.booking_id,
    mt.inquiry_kind::text,
    mt.traveler_user_id,
    mt.guardian_user_id,
    mt.max_messages_traveler,
    mt.traveler_message_count,
    mt.last_message_at,
    mt.created_at,
    mt.content_post_id,
    case
      when mt.traveler_user_id = auth.uid() then mt.guardian_user_id
      else mt.traveler_user_id
    end as other_user_id,
    case
      when mt.traveler_user_id = auth.uid() then
        coalesce(
          (select gp.display_name from public.guardian_profiles gp where gp.user_id = mt.guardian_user_id),
          '하루이'
        )
      else
        coalesce(
          (select gp.display_name from public.guardian_profiles gp where gp.user_id = mt.traveler_user_id),
          '여행자'
        )
    end as other_display_name,
    case
      when mt.traveler_user_id = auth.uid() then
        nullif(
          coalesce(
            nullif((select gp.avatar_image_url from public.guardian_profiles gp where gp.user_id = mt.guardian_user_id), ''),
            nullif((select gp.photo_url from public.guardian_profiles gp where gp.user_id = mt.guardian_user_id), '')
          ),
          ''
        )
      else
        nullif(
          coalesce(
            nullif((select gp.avatar_image_url from public.guardian_profiles gp where gp.user_id = mt.traveler_user_id), ''),
            nullif((select gp.photo_url from public.guardian_profiles gp where gp.user_id = mt.traveler_user_id), '')
          ),
          ''
        )
    end as other_avatar_url,
    (select count(*)::bigint from public.messages m
      where m.thread_id = mt.id
        and not m.is_read
        and m.sender_user_id is distinct from auth.uid()) as unread_count,
    (select left(m.content, 160) from public.messages m
      where m.thread_id = mt.id
      order by m.created_at desc nulls last
      limit 1) as last_message_preview,
    (select count(*)::bigint from public.messages m2 where m2.thread_id = mt.id) as message_count
  from public.message_threads mt
  where (mt.traveler_user_id = auth.uid() or mt.guardian_user_id = auth.uid())
    and exists (select 1 from public.messages m0 where m0.thread_id = mt.id)
  order by mt.last_message_at desc nulls last, mt.created_at desc;
$$;

grant execute on function public.message_threads_list_for_viewer() to authenticated;

-- 8. Unread thread count for mypage snapshot (service_role only; server-trusted user id).
create or replace function public.service_count_unread_chat_threads(p_user_id uuid)
returns integer
language sql
stable
security definer
set search_path = public
set row_security = off
as $$
  select coalesce(count(distinct m.thread_id)::int, 0)
  from public.messages m
  inner join public.message_threads mt on mt.id = m.thread_id
  where (mt.traveler_user_id = p_user_id or mt.guardian_user_id = p_user_id)
    and m.is_read = false
    and m.sender_user_id is distinct from p_user_id;
$$;

revoke all on function public.service_count_unread_chat_threads(uuid) from public;
grant execute on function public.service_count_unread_chat_threads(uuid) to service_role;
