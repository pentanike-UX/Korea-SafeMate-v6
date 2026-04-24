-- Account-scoped traveler saves (replaces cookie-only for real UUID users).

create table if not exists public.traveler_saved_guardians (
  traveler_user_id uuid not null references public.users (id) on delete cascade,
  guardian_user_id uuid not null references public.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (traveler_user_id, guardian_user_id),
  constraint traveler_saved_guardians_distinct check (traveler_user_id <> guardian_user_id)
);

create index if not exists traveler_saved_guardians_traveler_idx
  on public.traveler_saved_guardians (traveler_user_id, created_at desc);

create table if not exists public.traveler_saved_posts (
  traveler_user_id uuid not null references public.users (id) on delete cascade,
  post_id uuid not null references public.content_posts (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (traveler_user_id, post_id)
);

create index if not exists traveler_saved_posts_traveler_idx
  on public.traveler_saved_posts (traveler_user_id, created_at desc);

alter table public.traveler_saved_guardians enable row level security;
alter table public.traveler_saved_posts enable row level security;

drop policy if exists "traveler_saved_guardians_select_own" on public.traveler_saved_guardians;
create policy "traveler_saved_guardians_select_own"
  on public.traveler_saved_guardians for select
  using (auth.uid() = traveler_user_id);

drop policy if exists "traveler_saved_guardians_insert_own" on public.traveler_saved_guardians;
create policy "traveler_saved_guardians_insert_own"
  on public.traveler_saved_guardians for insert
  with check (auth.uid() = traveler_user_id);

drop policy if exists "traveler_saved_guardians_delete_own" on public.traveler_saved_guardians;
create policy "traveler_saved_guardians_delete_own"
  on public.traveler_saved_guardians for delete
  using (auth.uid() = traveler_user_id);

drop policy if exists "traveler_saved_posts_select_own" on public.traveler_saved_posts;
create policy "traveler_saved_posts_select_own"
  on public.traveler_saved_posts for select
  using (auth.uid() = traveler_user_id);

drop policy if exists "traveler_saved_posts_insert_own" on public.traveler_saved_posts;
create policy "traveler_saved_posts_insert_own"
  on public.traveler_saved_posts for insert
  with check (auth.uid() = traveler_user_id);

drop policy if exists "traveler_saved_posts_delete_own" on public.traveler_saved_posts;
create policy "traveler_saved_posts_delete_own"
  on public.traveler_saved_posts for delete
  using (auth.uid() = traveler_user_id);

comment on table public.traveler_saved_guardians is 'Traveler saved guardian user ids (per authenticated account).';
comment on table public.traveler_saved_posts is 'Traveler saved content post ids (per authenticated account).';
