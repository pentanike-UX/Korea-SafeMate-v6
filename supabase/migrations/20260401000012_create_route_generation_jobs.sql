-- v6: route_generation_jobs (신규)
create table if not exists public.route_generation_jobs (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references public.bookings (id) on delete cascade,
  guardian_user_id uuid not null references public.guardian_profiles (user_id) on delete cascade,

  ai_provider text not null default 'openai'
    check (ai_provider in ('openai', 'gemini', 'grok')),
  prompt_version text not null default 'v1',

  status text not null default 'queued'
    check (status in ('queued', 'running', 'completed', 'failed', 'cancelled')),
  attempt_count int not null default 0,
  max_attempts int not null default 3,

  result_route_id uuid references public.routes (id),
  error_message text,
  error_code text,

  started_at timestamptz,
  completed_at timestamptz,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists rg_jobs_status_idx on public.route_generation_jobs (status);
create index if not exists rg_jobs_booking_idx on public.route_generation_jobs (booking_id);

drop trigger if exists rg_jobs_updated_at on public.route_generation_jobs;
create trigger rg_jobs_updated_at
  before update on public.route_generation_jobs
  for each row execute function public.update_updated_at_column();

alter table public.route_generation_jobs enable row level security;

drop policy if exists "rg_jobs_guardian" on public.route_generation_jobs;
create policy "rg_jobs_guardian"
  on public.route_generation_jobs for select
  using (guardian_user_id = auth.uid());

drop policy if exists "rg_jobs_server_only" on public.route_generation_jobs;
create policy "rg_jobs_server_only"
  on public.route_generation_jobs for insert
  with check (false);

drop policy if exists "rg_jobs_admin" on public.route_generation_jobs;
create policy "rg_jobs_admin"
  on public.route_generation_jobs for all
  using (
    exists (
      select 1 from public.users
      where id = auth.uid()
      and app_role = 'admin'
    )
  );
