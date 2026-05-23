-- 지원서 리뷰 자족성을 위해 신청자 식별 정보 컬럼 추가(폼에서 수집).
alter table public.guardian_applications
  add column if not exists real_name text,
  add column if not exists display_name text,
  add column if not exists contact_email text;
