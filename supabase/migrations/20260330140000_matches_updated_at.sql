-- Optional touch column for match rows — enrichment / UI can prefer over created_at when present.
alter table public.matches
  add column if not exists updated_at timestamptz;

update public.matches
set updated_at = coalesce(updated_at, created_at)
where updated_at is null;

comment on column public.matches.updated_at is
  'Last mutation time when app updates matches; defaults to created_at for existing rows.';
