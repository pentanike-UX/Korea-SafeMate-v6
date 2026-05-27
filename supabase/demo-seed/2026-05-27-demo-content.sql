-- =============================================================================
-- Demo content seed (MVP 시연용) — 2026-05-27
-- ---------------------------------------------------------------------------
-- 적용: psql "$DATABASE_URL" -f supabase/demo-seed/2026-05-27-demo-content.sql
-- 또는: Supabase Dashboard → SQL Editor → 파일 내용 붙여넣고 Run
--
-- 모든 INSERT는 멱등 (on conflict do nothing 또는 upsert).
-- 정확한 UUID는 src/lib/seed/deterministic-uuid.ts의 seedUuidV5로 계산됨.
-- =============================================================================

-- ─── 0. auth.users — 데모 가디언 1 + traveler 3 ─────────────────────────────
-- supabase의 auth.users는 supabase_admin role에서만 insert 가능 (SQL Editor 동작 OK).
-- email_confirmed_at을 채워 OAuth 외 가짜 로그인도 일단 막아둠 (시연 안정성).

insert into auth.users (
  id, instance_id, aud, role, email,
  encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data,
  created_at, updated_at, is_super_admin
)
values
  ('2da22c42-ce72-5937-be7e-bddfbe036a4a'::uuid,
   '00000000-0000-0000-0000-000000000000'::uuid,
   'authenticated', 'authenticated', 'demo-mg14@safemate.local',
   '', now(),
   '{"provider":"demo","providers":["demo"]}'::jsonb,
   '{"display_name":"김서호"}'::jsonb,
   now(), now(), false),
  ('4cc35b31-9c0a-5f22-93c6-01e14a032297'::uuid,
   '00000000-0000-0000-0000-000000000000'::uuid,
   'authenticated', 'authenticated', 'demo-mai@safemate.local',
   '', now(),
   '{"provider":"demo","providers":["demo"]}'::jsonb,
   '{"display_name":"Mai"}'::jsonb,
   now(), now(), false),
  ('6d2fd2a0-f55b-53ef-bbf0-9321211b3a30'::uuid,
   '00000000-0000-0000-0000-000000000000'::uuid,
   'authenticated', 'authenticated', 'demo-linh@safemate.local',
   '', now(),
   '{"provider":"demo","providers":["demo"]}'::jsonb,
   '{"display_name":"Linh"}'::jsonb,
   now(), now(), false),
  ('16c88145-8e0e-5987-be8b-0bbd79e41d67'::uuid,
   '00000000-0000-0000-0000-000000000000'::uuid,
   'authenticated', 'authenticated', 'demo-aiko@safemate.local',
   '', now(),
   '{"provider":"demo","providers":["demo"]}'::jsonb,
   '{"display_name":"Aiko"}'::jsonb,
   now(), now(), false)
on conflict (id) do nothing;

-- ─── 1. public.users ────────────────────────────────────────────────────────
insert into public.users (id, email, role, created_at)
values
  ('2da22c42-ce72-5937-be7e-bddfbe036a4a'::uuid, 'demo-mg14@safemate.local', 'active_guardian', now()),
  ('4cc35b31-9c0a-5f22-93c6-01e14a032297'::uuid, 'demo-mai@safemate.local', 'traveler', now()),
  ('6d2fd2a0-f55b-53ef-bbf0-9321211b3a30'::uuid, 'demo-linh@safemate.local', 'traveler', now()),
  ('16c88145-8e0e-5987-be8b-0bbd79e41d67'::uuid, 'demo-aiko@safemate.local', 'traveler', now())
on conflict (id) do nothing;

-- ─── 2. public.user_profiles (검색 풀 + 표시명) ──────────────────────────────
insert into public.user_profiles (
  user_id, display_name, intro, locale, profile_image_url,
  login_provider, profile_fields_locked, created_at, updated_at
)
values
  ('2da22c42-ce72-5937-be7e-bddfbe036a4a'::uuid,
   '김서호', '서울 토박이 · K-드라마 촬영지 가이드', 'ko',
   '/mock/profiles/profile_14_avatar.jpg',
   'demo', false, now(), now()),
  ('4cc35b31-9c0a-5f22-93c6-01e14a032297'::uuid,
   'Mai', 'Bangkok → Seoul, K-pop fan', 'th',
   null, 'demo', false, now(), now()),
  ('6d2fd2a0-f55b-53ef-bbf0-9321211b3a30'::uuid,
   'Linh', 'Hanoi · 첫 한국 여행', 'vi',
   null, 'demo', false, now(), now()),
  ('16c88145-8e0e-5987-be8b-0bbd79e41d67'::uuid,
   'Aiko', 'Tokyo · 카페 투어 좋아요', 'ja',
   null, 'demo', false, now(), now())
on conflict (user_id) do update
  set display_name = excluded.display_name,
      intro = excluded.intro,
      locale = excluded.locale,
      profile_image_url = excluded.profile_image_url,
      updated_at = now();

-- ─── 3. guardian_profiles — mg14 김서호 (approved + AI auto-reply ON) ────────
insert into public.guardian_profiles (
  user_id, display_name, headline, bio,
  guardian_tier, approval_status,
  primary_region_id, years_in_seoul,
  photo_url, avatar_image_url,
  posts_approved_last_30d, posts_approved_last_7d,
  featured, influencer_seed, matching_enabled,
  avg_traveler_rating, expertise_tags,
  is_sample, seed_guardian_key,
  ai_auto_reply_enabled,
  updated_at
)
values (
  '2da22c42-ce72-5937-be7e-bddfbe036a4a'::uuid,
  '김서호',
  '서울 토박이 · K-드라마 촬영지·궁궐 골목 가이드',
  '서울에서 나고 자란 30년차. 사극부터 최근 K-드라마까지 촬영지 1,000곳 이상 답사했어요. 첫 한국 여행이 막막한 친구들을 위해 "헤매지 않는 하루"를 짜드려요.',
  'verified_guardian', 'approved',
  null, 30,
  '/mock/profiles/profile_14_avatar.jpg',
  '/mock/profiles/profile_14_avatar.jpg',
  6, 2, true, false, true,
  4.8, array['k_drama','palace','foodie','jongno'],
  true, 'mg14',
  true,
  now()
)
on conflict (user_id) do update
  set display_name = excluded.display_name,
      headline = excluded.headline,
      bio = excluded.bio,
      approval_status = excluded.approval_status,
      ai_auto_reply_enabled = excluded.ai_auto_reply_enabled,
      matching_enabled = excluded.matching_enabled,
      updated_at = now();

-- 가디언 사용 가능 언어
insert into public.guardian_languages (guardian_user_id, language_code, proficiency)
values
  ('2da22c42-ce72-5937-be7e-bddfbe036a4a'::uuid, 'ko', 'native'),
  ('2da22c42-ce72-5937-be7e-bddfbe036a4a'::uuid, 'en', 'fluent'),
  ('2da22c42-ce72-5937-be7e-bddfbe036a4a'::uuid, 'ja', 'conversational')
on conflict (guardian_user_id, language_code) do nothing;

-- ─── 4. spot_catalog — 종로 K-드라마 5스팟 ─────────────────────────────────
insert into public.spot_catalog (
  id, name_ko, name_en,
  address_ko, lat, lng, region_tags,
  category, subcategory,
  avg_cost_krw, avg_stay_min, reservation_required,
  images, source, is_verified, is_active,
  created_at, updated_at
)
values
  ('4d0927f4-1107-5e0b-b560-123b067bcab8'::uuid,
   '경복궁', 'Gyeongbokgung Palace',
   '서울특별시 종로구 사직로 161',
   37.5796, 126.9770, array['seoul','jongno'],
   'attraction', 'palace',
   3000, 90, false,
   array[]::text[], 'manual', true, true,
   now(), now()),
  ('e36c8933-96d6-5fc6-a700-40132e2651de'::uuid,
   '통인시장 도시락카페', 'Tongin Market Lunchbox Cafe',
   '서울특별시 종로구 자하문로 18',
   37.5803, 126.9696, array['seoul','jongno'],
   'food', 'market',
   8000, 45, false,
   array[]::text[], 'manual', true, true,
   now(), now()),
  ('b8a2b3da-4e84-5640-b0fb-cf09a3517601'::uuid,
   '북촌한옥마을', 'Bukchon Hanok Village',
   '서울특별시 종로구 계동길 37',
   37.5826, 126.9837, array['seoul','jongno'],
   'attraction', 'historic',
   0, 60, false,
   array[]::text[], 'manual', true, true,
   now(), now()),
  ('108565b5-ce33-5a5d-a653-4e87409268a9'::uuid,
   '어니언 안국', 'Onion Anguk',
   '서울특별시 종로구 계동길 5',
   37.5750, 126.9851, array['seoul','jongno'],
   'cafe', 'dessert',
   9000, 40, false,
   array[]::text[], 'manual', true, true,
   now(), now()),
  ('3228b525-ee25-5abd-8fa0-f76049d2496c'::uuid,
   '익선동 골목', 'Ikseondong Alley',
   '서울특별시 종로구 익선동',
   37.5717, 126.9905, array['seoul','jongno'],
   'attraction', 'alley',
   0, 50, false,
   array[]::text[], 'manual', true, true,
   now(), now())
on conflict (id) do update
  set name_ko = excluded.name_ko,
      address_ko = excluded.address_ko,
      lat = excluded.lat, lng = excluded.lng,
      region_tags = excluded.region_tags,
      category = excluded.category,
      is_active = true, is_verified = true,
      updated_at = now();

-- ─── 5. routes — 데모 하루루트 1건 ──────────────────────────────────────────
insert into public.routes (
  id, guardian_user_id,
  title_ko, title_en, title_th, title_vi,
  region_tags,
  total_duration_min, estimated_cost_min_krw, estimated_cost_max_krw,
  cover_image_url,
  status, route_type,
  created_at, updated_at
)
values (
  '44553acb-fdef-5139-add4-9d1fbe92ff83'::uuid,
  '2da22c42-ce72-5937-be7e-bddfbe036a4a'::uuid,
  '서울 궁궐 골목에서 만나는 K-드라마 씬',
  'K-Drama Scenes in Seoul Palace Alleys',
  'ตามรอยซีรีส์เกาหลีในซอกซอยพระราชวังโซล',
  'Bối cảnh phim Hàn trong các con hẻm cung điện Seoul',
  array['seoul','jongno'],
  300, 22000, 35000,
  null,
  'public', 'sample',
  now(), now()
)
on conflict (id) do update
  set title_ko = excluded.title_ko,
      title_en = excluded.title_en,
      title_th = excluded.title_th,
      title_vi = excluded.title_vi,
      region_tags = excluded.region_tags,
      total_duration_min = excluded.total_duration_min,
      estimated_cost_min_krw = excluded.estimated_cost_min_krw,
      estimated_cost_max_krw = excluded.estimated_cost_max_krw,
      status = 'public',
      updated_at = now();

-- ─── 6. route_spots — 위 루트의 5스팟 순서 ─────────────────────────────────
delete from public.route_spots
  where route_id = '44553acb-fdef-5139-add4-9d1fbe92ff83'::uuid;

insert into public.route_spots (
  route_id, spot_id, sort_order,
  stay_min, guardian_note_ko, guardian_note_en,
  move_from_prev_method, move_from_prev_min,
  created_at, updated_at
)
values
  ('44553acb-fdef-5139-add4-9d1fbe92ff83'::uuid,
   '4d0927f4-1107-5e0b-b560-123b067bcab8'::uuid, 1,
   90, '오전 10시 입장이 사진이 가장 예뻐요. 한복 입으면 무료입장!',
   'Enter at 10am for the best light. Free entry in hanbok!',
   null, 0, now(), now()),
  ('44553acb-fdef-5139-add4-9d1fbe92ff83'::uuid,
   'e36c8933-96d6-5fc6-a700-40132e2651de'::uuid, 2,
   45, '엽전 도시락이 5,000원. 양이 충분해요. 12시 이후 사람 많아져요.',
   'Lunchbox set is ₩5,000 in old coins. Get there before noon.',
   'walk', 15, now(), now()),
  ('44553acb-fdef-5139-add4-9d1fbe92ff83'::uuid,
   'b8a2b3da-4e84-5640-b0fb-cf09a3517601'::uuid, 3,
   60, '<도깨비> 촬영지 골목 — 한옥 처마 라인이 가장 잘 보이는 view point 알려드려요.',
   '<Goblin> filming alley — I''ll point out the best hanok roofline view.',
   'walk', 20, now(), now()),
  ('44553acb-fdef-5139-add4-9d1fbe92ff83'::uuid,
   '108565b5-ce33-5a5d-a653-4e87409268a9'::uuid, 4,
   40, '한옥을 그대로 살린 카페. 판교파이가 인기. 안쪽 좌석이 사진 잘 나와요.',
   'Hanok-style cafe. Pandoro recommended. Inner seats are photo-friendly.',
   'walk', 10, now(), now()),
  ('44553acb-fdef-5139-add4-9d1fbe92ff83'::uuid,
   '3228b525-ee25-5abd-8fa0-f76049d2496c'::uuid, 5,
   50, '저녁 5시쯤 가면 등불이 켜져요. <응답하라> 분위기 그대로.',
   'Lanterns light up around 5pm — <Reply 1988> vibes.',
   'walk', 12, now(), now());

-- ─── 7. content_posts — 데모 하루웨이 포스트 (related_route_id 매핑) ────────
-- ※ related_route_id 컬럼은 별도 마이그레이션에서 추가 — 본 시드 적용 전에
--   해당 마이그레이션이 먼저 적용되어 있어야 합니다.

insert into public.content_posts (
  id, author_user_id,
  region_id, category_id,
  kind, title, summary, body, tags,
  status, post_format, cover_image_url,
  route_journey, route_highlights,
  hero_subject,
  is_sample, seed_content_key,
  related_route_id,
  created_at, updated_at
)
select
  '9396611c-561c-5736-befd-baba8d3e3fd8'::uuid,
  '2da22c42-ce72-5937-be7e-bddfbe036a4a'::uuid,
  r.id, c.id,
  'guide', '서울 궁궐 골목에서 만나는 K-드라마 씬',
  '경복궁부터 익선동까지 — 한복 입고 한 바퀴, 사진 100장 보장.',
  '첫 한국 여행에서 절대 헤매지 않는 종로 K-드라마 코스를 정리했어요. 한복 대여부터 카페 추천, 사진 포인트, 그리고 가장 사람 적은 시간대까지.\n\n이 코스는 제가 직접 50번 넘게 걸은 길이에요. 따라오시면 그날 저녁 SNS 피드가 풍성할 거예요.',
  array['k_drama','palace','jongno','hanok'],
  'published', 'hybrid', null,
  null, '["경복궁 한복 무료입장","통인시장 엽전 도시락","북촌 도깨비 골목","어니언 안국","익선동 야경"]'::jsonb,
  'place',
  true, 'seed-mg14-route-demo',
  '44553acb-fdef-5139-add4-9d1fbe92ff83'::uuid,
  now(), now()
from public.regions r,
     public.content_categories c
where r.slug = 'seoul'
  and c.slug = 'k-content'
on conflict (id) do update
  set title = excluded.title,
      summary = excluded.summary,
      body = excluded.body,
      tags = excluded.tags,
      status = excluded.status,
      post_format = excluded.post_format,
      route_highlights = excluded.route_highlights,
      related_route_id = excluded.related_route_id,
      updated_at = now();

-- =============================================================================
-- 적용 후 확인
-- =============================================================================
-- select count(*) as routes_count from public.routes where status = 'public';
-- select count(*) as spots_count from public.route_spots
--   where route_id = '44553acb-fdef-5139-add4-9d1fbe92ff83';
-- select id, title, related_route_id from public.content_posts
--   where seed_content_key = 'seed-mg14-route-demo';
