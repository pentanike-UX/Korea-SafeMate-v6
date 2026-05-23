-- 거주 증빙 등 민감 문서용 비공개 버킷.
-- 업로드/조회는 모두 service-role 경유(클라이언트 직접 접근 없음) → storage RLS 정책 불필요.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'guardian-docs',
  'guardian-docs',
  false,
  10485760,
  array['application/pdf','image/jpeg','image/png','image/webp']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;
