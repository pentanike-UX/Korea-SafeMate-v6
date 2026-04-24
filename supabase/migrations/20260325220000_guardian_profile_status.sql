-- Application lifecycle for guardian onboarding (IA: none = no row; otherwise enum on row).
do $$ begin
  create type public.guardian_profile_status as enum (
    'draft',
    'submitted',
    'approved',
    'rejected',
    'suspended'
  );
exception when duplicate_object then null;
end $$;

alter table public.guardian_profiles
  add column if not exists profile_status public.guardian_profile_status not null default 'draft';

comment on column public.guardian_profiles.profile_status is
  'Product IA guardian_profile.status: draft/submitted/approved/rejected/suspended. none = no row.';

-- Align with legacy approval_status where possible.
update public.guardian_profiles gp
set profile_status = case gp.approval_status::text
  when 'approved' then 'approved'::public.guardian_profile_status
  when 'rejected' then 'rejected'::public.guardian_profile_status
  when 'paused' then 'suspended'::public.guardian_profile_status
  when 'under_review' then 'submitted'::public.guardian_profile_status
  else 'submitted'::public.guardian_profile_status
end;
