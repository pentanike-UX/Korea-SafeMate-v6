-- ALTER TYPE ADD VALUE 는 트랜잭션 외부에서 실행되어야 함 (Supabase/Postgres 버전에 따라 마이그레이션 트랜잭션과 충돌 가능).
-- idempotent: IF NOT EXISTS (Postgres 15+)
alter type public.booking_status add value if not exists 'in_progress';
alter type public.booking_status add value if not exists 'under_review';
alter type public.booking_status add value if not exists 'delivered';
alter type public.booking_status add value if not exists 'revision_requested';
alter type public.booking_status add value if not exists 'completed';
alter type public.booking_status add value if not exists 'refunded';
