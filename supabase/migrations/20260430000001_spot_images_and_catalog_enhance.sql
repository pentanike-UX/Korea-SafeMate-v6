-- ─────────────────────────────────────────────────────────────────────────────
-- 20260430000001 · spot_catalog 보강 + spot_images 신규
--
-- 목적: 스팟별 타입 분리된 이미지 관리 (hero/practical/walking/timing/night)
--       Naver Local Search API 응답 원본 보존, 재사용 가능한 스팟 카탈로그 강화
-- ─────────────────────────────────────────────────────────────────────────────

-- ── spot_catalog 보강 ──────────────────────────────────────────────────────────

-- 행정구·동 단위 (지역 태그보다 더 구체적인 위치 컨텍스트)
alter table public.spot_catalog
  add column if not exists district text;

-- Naver API 원본 응답 (장소 검색 시 저장, 추후 재조회 없이 재활용)
alter table public.spot_catalog
  add column if not exists naver_data jsonb;

-- 이미지 전략 힌트 (에디터 메모용)
-- "practical": 동선·현장 중심, "aesthetic": 분위기 중심, "mixed": 혼합
alter table public.spot_catalog
  add column if not exists image_strategy text default 'mixed'
    check (image_strategy in ('practical', 'aesthetic', 'mixed'));

-- 스팟 설명 (관리자/가디언이 채우는 내부 메모)
alter table public.spot_catalog
  add column if not exists internal_note text;

-- 대표 이미지 캐시 (spot_images.is_primary = true, image_type = 'hero' URL 캐시)
-- 매번 JOIN 없이 카드·목록에서 빠르게 접근
alter table public.spot_catalog
  add column if not exists primary_image_url text;

comment on column public.spot_catalog.district is '행정구·동 (예: 강남구, 명동, 홍대입구)';
comment on column public.spot_catalog.naver_data is 'Naver Local Search API 원본 응답 jsonb';
comment on column public.spot_catalog.image_strategy is '이미지 큐레이션 전략 힌트';
comment on column public.spot_catalog.primary_image_url is 'hero + is_primary 이미지 URL 캐시';

-- ── spot_images (신규) ─────────────────────────────────────────────────────────

create table if not exists public.spot_images (
  id               uuid primary key default gen_random_uuid(),
  spot_catalog_id  uuid not null references public.spot_catalog (id) on delete cascade,

  -- Supabase Storage 경로 (예: spot-images/{spot_catalog_id}/hero_001.jpg)
  -- 외부 URL도 허용 (Naver 이미지 등은 임시 저장, 나중에 re-upload)
  url              text not null,

  -- 이미지 역할
  -- hero       : 대표 썸네일·상단 hero
  -- practical  : 현장 실사용 (좌석·동선·입구 등)
  -- walking    : 이동 방향·보행 흐름
  -- timing     : 혼잡·빛 조건·특정 시간대
  -- night      : 야간 전용
  image_type       text not null default 'hero'
    check (image_type in ('hero', 'practical', 'walking', 'timing', 'night')),

  -- 해당 타입에서 대표 이미지 여부 (타입당 1개만 true)
  is_primary       boolean not null default false,

  sort_order       int not null default 0,

  -- 출처
  source           text not null default 'admin_upload'
    check (source in ('naver', 'guardian_upload', 'admin_upload', 'stock')),

  -- 현장 주석 (예: "1번 출구에서 바라본 각도", "오전 10시 역광 주의")
  caption_ko       text,
  caption_en       text,

  -- Supabase Storage 업로드 여부 (외부 URL은 false)
  is_stored        boolean not null default false,

  created_by       uuid references public.users (id) on delete set null,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

-- 타입당 대표 이미지는 1개만
create unique index if not exists spot_images_primary_per_type
  on public.spot_images (spot_catalog_id, image_type)
  where is_primary = true;

create index if not exists spot_images_spot_idx
  on public.spot_images (spot_catalog_id, image_type, sort_order);

drop trigger if exists spot_images_updated_at on public.spot_images;
create trigger spot_images_updated_at
  before update on public.spot_images
  for each row execute function public.update_updated_at_column();

-- ── RLS ───────────────────────────────────────────────────────────────────────

alter table public.spot_images enable row level security;

-- 공개 읽기: is_active = true 인 스팟의 이미지
drop policy if exists "spot_images_select_public" on public.spot_images;
create policy "spot_images_select_public"
  on public.spot_images for select
  using (
    spot_catalog_id in (
      select id from public.spot_catalog
      where is_active = true and is_verified = true
    )
  );

-- Admin 전체 권한
drop policy if exists "spot_images_admin" on public.spot_images;
create policy "spot_images_admin"
  on public.spot_images for all
  using (
    exists (
      select 1 from public.users
      where id = auth.uid()
      and app_role in ('admin', 'super_admin')
    )
  );

-- ── 캐시 자동 갱신 함수 ────────────────────────────────────────────────────────

-- spot_images 변경 시 spot_catalog.primary_image_url 자동 갱신
create or replace function public.sync_spot_primary_image_url()
returns trigger language plpgsql security definer as $$
begin
  update public.spot_catalog
  set primary_image_url = (
    select url from public.spot_images
    where spot_catalog_id = coalesce(new.spot_catalog_id, old.spot_catalog_id)
      and image_type = 'hero'
      and is_primary = true
    limit 1
  )
  where id = coalesce(new.spot_catalog_id, old.spot_catalog_id);
  return coalesce(new, old);
end;
$$;

drop trigger if exists spot_images_sync_primary on public.spot_images;
create trigger spot_images_sync_primary
  after insert or update or delete on public.spot_images
  for each row execute function public.sync_spot_primary_image_url();

-- ── 주석 ─────────────────────────────────────────────────────────────────────

comment on table public.spot_images is
  '스팟별 타입 분리 이미지 관리. image_type: hero/practical/walking/timing/night';
comment on column public.spot_images.url is
  'Supabase Storage 경로 또는 외부 URL. 외부는 is_stored=false로 표시';
comment on column public.spot_images.caption_ko is
  '현장 주석 — "1번 출구 앞 각도", "오전 역광 주의" 같은 실용적 메모';
