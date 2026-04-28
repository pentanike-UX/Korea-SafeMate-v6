-- v6: guardian_applications (신규)
create or replace function public.update_updated_at_column()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists public.guardian_applications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references public.users (id) on delete cascade,

  motivation text not null,
  languages text[] not null,
  sample_route jsonb,
  residence_proof text,

  status text not null default 'pending'
    check (status in ('pending', 'approved', 'rejected', 'needs_revision')),
  reviewer_id uuid references public.users (id),
  review_note text,
  reviewed_at timestamptz,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists guardian_applications_updated_at on public.guardian_applications;
create trigger guardian_applications_updated_at
  before update on public.guardian_applications
  for each row execute function public.update_updated_at_column();

alter table public.guardian_applications enable row level security;

drop policy if exists "guardian_applications_select_own" on public.guardian_applications;
create policy "guardian_applications_select_own"
  on public.guardian_applications for select
  using (user_id = auth.uid());

drop policy if exists "guardian_applications_insert_own" on public.guardian_applications;
create policy "guardian_applications_insert_own"
  on public.guardian_applications for insert
  with check (user_id = auth.uid());

drop policy if exists "guardian_applications_admin" on public.guardian_applications;
create policy "guardian_applications_admin"
  on public.guardian_applications for all
  using (
    exists (
      select 1 from public.users
      where id = auth.uid()
      and app_role = 'admin'
    )
  );
