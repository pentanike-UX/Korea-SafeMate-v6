-- App roles (traveler/guardian/admin/super_admin), user_profiles split, admin invitations.
-- Extends public.users; adds user_profiles, admin_accounts; RLS for self-read profile paths.

-- ——— Enum: app-facing account role ———
do $$ begin
  create type public.app_account_role as enum ('traveler', 'guardian', 'admin', 'super_admin');
exception when duplicate_object then null;
end $$;

do $$ begin
  alter type public.user_role add value 'super_admin';
exception
  when duplicate_object then null;
end $$;

-- ——— public.users extensions ———
alter table public.users
  add column if not exists app_role public.app_account_role not null default 'traveler',
  add column if not exists auth_provider text not null default 'google',
  add column if not exists provider_account_id text,
  add column if not exists avatar_url text,
  add column if not exists legal_name text,
  add column if not exists last_login_at timestamptz,
  add column if not exists account_status text not null default 'active'
    check (account_status in ('active', 'suspended'));

comment on column public.users.app_role is 'Traveler/guardian/admin/super_admin — primary app access plane.';
comment on column public.users.role is 'Legacy tier/label; prefer app_role for access control.';

update public.users u
set app_role = 'admin'
where u.role::text = 'admin' and u.app_role = 'traveler';

-- ——— Service profile (editable; OAuth does not overwrite when locked) ———
create table if not exists public.user_profiles (
  user_id uuid primary key references public.users (id) on delete cascade,
  display_name text,
  intro text,
  locale text,
  profile_image_url text,
  login_provider text not null default 'google',
  profile_fields_locked boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists user_profiles_locale_idx on public.user_profiles (locale)
  where locale is not null;

-- ——— Admin invitations (email allowlist; not public sign-up) ———
create table if not exists public.admin_accounts (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  role text not null check (role in ('admin', 'super_admin')),
  invited_by_user_id uuid references public.users (id) on delete set null,
  invited_at timestamptz not null default now(),
  accepted_at timestamptz,
  status text not null default 'pending' check (status in ('pending', 'active', 'revoked')),
  linked_user_id uuid references public.users (id) on delete set null
);

create unique index if not exists admin_accounts_email_uq on public.admin_accounts (email);

create index if not exists admin_accounts_status_idx on public.admin_accounts (status);

-- ——— RLS ———
alter table public.user_profiles enable row level security;

drop policy if exists "user_profiles_select_own" on public.user_profiles;
create policy "user_profiles_select_own"
  on public.user_profiles for select
  using (auth.uid() = user_id);

drop policy if exists "user_profiles_insert_own" on public.user_profiles;
create policy "user_profiles_insert_own"
  on public.user_profiles for insert
  with check (auth.uid() = user_id);

drop policy if exists "user_profiles_update_own" on public.user_profiles;
create policy "user_profiles_update_own"
  on public.user_profiles for update
  using (auth.uid() = user_id);

alter table public.users enable row level security;

drop policy if exists "users_select_own" on public.users;
create policy "users_select_own"
  on public.users for select
  using (auth.uid() = id);

-- Service role bypasses RLS for sync + admin_accounts writes.
