-- ─────────────────────────────────────────────────────────────────────────────
-- chat UX v3: dedup(client_msg_id) + 출처 포스트(source_post_id)
-- - messages.client_msg_id: 클라이언트 발급 uuid v4; (thread_id, client_msg_id) unique partial idx
-- - message_threads.source_post_id: 문의 시작 포스트 (null 허용)
-- ─────────────────────────────────────────────────────────────────────────────

alter table public.messages
  add column if not exists client_msg_id text;

create unique index if not exists messages_client_msg_id_uidx
  on public.messages (thread_id, client_msg_id)
  where client_msg_id is not null;

comment on column public.messages.client_msg_id is
  '클라이언트 발급 uuid v4. 동일 (thread_id, client_msg_id) 재전송은 멱등 처리.';

alter table public.message_threads
  add column if not exists source_post_id uuid references public.content_posts(id);

create index if not exists message_threads_source_post_idx
  on public.message_threads (source_post_id);

comment on column public.message_threads.source_post_id is
  '문의가 시작된 content_posts.id. null 허용(가디언 프로필에서 시작한 경우).';

-- ── Rollback (수동) ─────────────────────────────────────────────────────────
-- drop index if exists public.messages_client_msg_id_uidx;
-- alter table public.messages drop column if exists client_msg_id;
-- drop index if exists public.message_threads_source_post_idx;
-- alter table public.message_threads drop column if exists source_post_id;
