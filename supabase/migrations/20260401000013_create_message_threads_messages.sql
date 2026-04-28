-- v6: message_threads, messages (신규) — booking_id → bookings
create table if not exists public.message_threads (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null unique references public.bookings (id) on delete cascade,
  traveler_user_id uuid not null references public.users (id) on delete cascade,
  guardian_user_id uuid not null references public.users (id) on delete cascade,

  max_messages_traveler int not null default 1,
  traveler_message_count int not null default 0,

  last_message_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  thread_id uuid not null references public.message_threads (id) on delete cascade,
  sender_user_id uuid not null references public.users (id) on delete cascade,
  sender_role text not null check (sender_role in ('traveler', 'guardian', 'admin')),

  content text not null,
  content_type text not null default 'text'
    check (content_type in ('text', 'image', 'route_preview')),

  is_read boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists messages_thread_idx on public.messages (thread_id, created_at);
create index if not exists messages_sender_idx on public.messages (sender_user_id);

alter table public.message_threads enable row level security;

drop policy if exists "message_threads_participants" on public.message_threads;
create policy "message_threads_participants"
  on public.message_threads for select
  using (
    traveler_user_id = auth.uid()
    or guardian_user_id = auth.uid()
  );

alter table public.messages enable row level security;

drop policy if exists "messages_participants" on public.messages;
create policy "messages_participants"
  on public.messages for select
  using (
    thread_id in (
      select mt.id from public.message_threads mt
      where mt.traveler_user_id = auth.uid()
         or mt.guardian_user_id = auth.uid()
    )
  );

drop policy if exists "messages_insert_participants" on public.messages;
create policy "messages_insert_participants"
  on public.messages for insert
  with check (
    sender_user_id = auth.uid()
    and thread_id in (
      select mt.id from public.message_threads mt
      where mt.traveler_user_id = auth.uid()
         or mt.guardian_user_id = auth.uid()
    )
  );
