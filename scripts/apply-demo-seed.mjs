#!/usr/bin/env node
/**
 * supabase/demo-seed/2026-05-27-demo-content.sql 의 등가 작업을
 * @supabase/supabase-js + auth admin API로 적용한다.
 *
 * 왜 SQL을 직접 안 실행하나?
 *   - 로컬에 psql이 없고 pg dev-dep 추가는 lockfile을 오염시키므로,
 *     이미 설치된 supabase-js만 사용해서 1회용으로 적용.
 *
 * 멱등: 모두 upsert 또는 try/skip. 여러 번 실행해도 안전.
 *
 * 실행:
 *   node --env-file=.env.local scripts/apply-demo-seed.mjs
 */
import { createClient } from "@supabase/supabase-js";
import { DEMO_ROUTE_JOURNEY } from "./demo-route-journey-data.mjs";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}
const sb = createClient(url, key, { auth: { persistSession: false } });

// ── UUID (seedUuidV5 결과 — 데모 시드 SQL과 동일) ──────────────────────────
const GUARDIAN_MG14 = "2da22c42-ce72-5937-be7e-bddfbe036a4a";
const TRAVELER_1 = "4cc35b31-9c0a-5f22-93c6-01e14a032297";
const TRAVELER_2 = "6d2fd2a0-f55b-53ef-bbf0-9321211b3a30";
const TRAVELER_3 = "16c88145-8e0e-5987-be8b-0bbd79e41d67";
const SPOT_GYEONGBOK = "4d0927f4-1107-5e0b-b560-123b067bcab8";
const SPOT_TONGIN = "e36c8933-96d6-5fc6-a700-40132e2651de";
const SPOT_BUKCHON = "b8a2b3da-4e84-5640-b0fb-cf09a3517601";
const SPOT_ONION = "108565b5-ce33-5a5d-a653-4e87409268a9";
const SPOT_IKSEONDONG = "3228b525-ee25-5abd-8fa0-f76049d2496c";
const ROUTE_ID = "44553acb-fdef-5139-add4-9d1fbe92ff83";
const POST_ID = "9396611c-561c-5736-befd-baba8d3e3fd8";

const log = (label, res) => {
  if (res?.error) {
    console.error(`  ✗ ${label}:`, res.error.message);
    return false;
  }
  console.log(`  ✓ ${label}`);
  return true;
};

// ── 1. auth.users — 4명 (idempotent: 이미 있으면 skip) ─────────────────────
console.log("\n[1/8] auth.users …");
const authUsers = [
  { id: GUARDIAN_MG14, email: "demo-mg14@safemate.local", display: "김서호" },
  { id: TRAVELER_1, email: "demo-mai@safemate.local", display: "Mai" },
  { id: TRAVELER_2, email: "demo-linh@safemate.local", display: "Linh" },
  { id: TRAVELER_3, email: "demo-aiko@safemate.local", display: "Aiko" },
];
for (const u of authUsers) {
  const { data: existing } = await sb.auth.admin.getUserById(u.id);
  if (existing?.user) {
    console.log(`  ✓ ${u.email} (exists)`);
    continue;
  }
  const { error } = await sb.auth.admin.createUser({
    id: u.id,
    email: u.email,
    email_confirm: true,
    user_metadata: { display_name: u.display, demo: true },
    app_metadata: { provider: "demo", providers: ["demo"] },
  });
  if (error) {
    console.error(`  ✗ ${u.email}:`, error.message);
  } else {
    console.log(`  ✓ ${u.email} (created)`);
  }
}

// ── 2. public.users ─────────────────────────────────────────────────────────
console.log("\n[2/8] public.users …");
log("upsert",
  await sb.from("users").upsert([
    { id: GUARDIAN_MG14, email: "demo-mg14@safemate.local", role: "active_guardian" },
    { id: TRAVELER_1, email: "demo-mai@safemate.local", role: "traveler" },
    { id: TRAVELER_2, email: "demo-linh@safemate.local", role: "traveler" },
    { id: TRAVELER_3, email: "demo-aiko@safemate.local", role: "traveler" },
  ], { onConflict: "id" })
);

// ── 3. public.user_profiles (검색 풀 + 표시명) ─────────────────────────────
console.log("\n[3/8] user_profiles …");
log("upsert",
  await sb.from("user_profiles").upsert([
    {
      user_id: GUARDIAN_MG14, display_name: "김서호",
      intro: "서울 토박이 · K-드라마 촬영지 가이드", locale: "ko",
      profile_image_url: "/mock/profiles/profile_14_avatar.jpg",
      login_provider: "demo", profile_fields_locked: false,
    },
    { user_id: TRAVELER_1, display_name: "Mai", intro: "Bangkok → Seoul, K-pop fan", locale: "th", profile_image_url: null, login_provider: "demo", profile_fields_locked: false },
    { user_id: TRAVELER_2, display_name: "Linh", intro: "Hanoi · 첫 한국 여행", locale: "vi", profile_image_url: null, login_provider: "demo", profile_fields_locked: false },
    { user_id: TRAVELER_3, display_name: "Aiko", intro: "Tokyo · 카페 투어 좋아요", locale: "ja", profile_image_url: null, login_provider: "demo", profile_fields_locked: false },
  ], { onConflict: "user_id" })
);

// ── 4. guardian_profiles (mg14) + languages ────────────────────────────────
console.log("\n[4/8] guardian_profiles (mg14) …");
log("upsert",
  await sb.from("guardian_profiles").upsert([{
    user_id: GUARDIAN_MG14,
    display_name: "김서호",
    headline: "서울 토박이 · K-드라마 촬영지·궁궐 골목 가이드",
    bio: '서울에서 나고 자란 30년차. 사극부터 최근 K-드라마까지 촬영지 1,000곳 이상 답사했어요. 첫 한국 여행이 막막한 친구들을 위해 "헤매지 않는 하루"를 짜드려요.',
    guardian_tier: "verified_guardian",
    approval_status: "approved",
    primary_region_id: null,
    years_in_seoul: 30,
    photo_url: "/mock/profiles/profile_14_avatar.jpg",
    avatar_image_url: "/mock/profiles/profile_14_avatar.jpg",
    posts_approved_last_30d: 6,
    posts_approved_last_7d: 2,
    featured: true,
    influencer_seed: false,
    matching_enabled: true,
    avg_traveler_rating: 4.8,
    expertise_tags: ["k_drama", "palace", "foodie", "jongno"],
    is_sample: true,
    seed_guardian_key: "mg14",
    ai_auto_reply_enabled: true,
  }], { onConflict: "user_id" })
);

console.log("\n[5/8] guardian_languages …");
log("upsert",
  await sb.from("guardian_languages").upsert([
    { guardian_user_id: GUARDIAN_MG14, language_code: "ko", proficiency: "native" },
    { guardian_user_id: GUARDIAN_MG14, language_code: "en", proficiency: "fluent" },
    { guardian_user_id: GUARDIAN_MG14, language_code: "ja", proficiency: "conversational" },
  ], { onConflict: "guardian_user_id,language_code" })
);

// ── 6. spot_catalog ─────────────────────────────────────────────────────────
console.log("\n[6/8] spot_catalog (5 spots) …");
log("upsert",
  await sb.from("spot_catalog").upsert([
    { id: SPOT_GYEONGBOK, name_ko: "경복궁", name_en: "Gyeongbokgung Palace", address_ko: "서울특별시 종로구 사직로 161", lat: 37.5796, lng: 126.977, region_tags: ["seoul","jongno"], category: "attraction", subcategory: "palace", avg_cost_krw: 3000, avg_stay_min: 90, reservation_required: false, images: [], source: "manual", is_verified: true, is_active: true },
    { id: SPOT_TONGIN, name_ko: "통인시장 도시락카페", name_en: "Tongin Market Lunchbox Cafe", address_ko: "서울특별시 종로구 자하문로 18", lat: 37.5803, lng: 126.9696, region_tags: ["seoul","jongno"], category: "food", subcategory: "market", avg_cost_krw: 8000, avg_stay_min: 45, reservation_required: false, images: [], source: "manual", is_verified: true, is_active: true },
    { id: SPOT_BUKCHON, name_ko: "북촌한옥마을", name_en: "Bukchon Hanok Village", address_ko: "서울특별시 종로구 계동길 37", lat: 37.5826, lng: 126.9837, region_tags: ["seoul","jongno"], category: "attraction", subcategory: "historic", avg_cost_krw: 0, avg_stay_min: 60, reservation_required: false, images: [], source: "manual", is_verified: true, is_active: true },
    { id: SPOT_ONION, name_ko: "어니언 안국", name_en: "Onion Anguk", address_ko: "서울특별시 종로구 계동길 5", lat: 37.575, lng: 126.9851, region_tags: ["seoul","jongno"], category: "cafe", subcategory: "dessert", avg_cost_krw: 9000, avg_stay_min: 40, reservation_required: false, images: [], source: "manual", is_verified: true, is_active: true },
    { id: SPOT_IKSEONDONG, name_ko: "익선동 골목", name_en: "Ikseondong Alley", address_ko: "서울특별시 종로구 익선동", lat: 37.5717, lng: 126.9905, region_tags: ["seoul","jongno"], category: "attraction", subcategory: "alley", avg_cost_krw: 0, avg_stay_min: 50, reservation_required: false, images: [], source: "manual", is_verified: true, is_active: true },
  ], { onConflict: "id" })
);

// ── 7. routes + route_spots ────────────────────────────────────────────────
console.log("\n[7/8] routes (1) + route_spots (5) …");
log("upsert route",
  await sb.from("routes").upsert([{
    id: ROUTE_ID,
    guardian_user_id: GUARDIAN_MG14,
    title_ko: "서울 궁궐 골목에서 만나는 K-드라마 씬",
    title_en: "K-Drama Scenes in Seoul Palace Alleys",
    title_th: "ตามรอยซีรีส์เกาหลีในซอกซอยพระราชวังโซล",
    title_vi: "Bối cảnh phim Hàn trong các con hẻm cung điện Seoul",
    region_tags: ["seoul", "jongno"],
    total_duration_min: 300,
    estimated_cost_min_krw: 22000,
    estimated_cost_max_krw: 35000,
    cover_image_url: null,
    status: "public",
    route_type: "sample",
  }], { onConflict: "id" })
);

// route_spots는 (route_id, sort_order) UNIQUE — 기존 행 삭제 후 재삽입
log("delete old route_spots",
  await sb.from("route_spots").delete().eq("route_id", ROUTE_ID)
);
log("insert route_spots",
  await sb.from("route_spots").insert([
    { route_id: ROUTE_ID, spot_id: SPOT_GYEONGBOK, sort_order: 1, stay_min: 90,
      guardian_note_ko: "오전 10시 입장이 사진이 가장 예뻐요. 한복 입으면 무료입장!",
      guardian_note_en: "Enter at 10am for the best light. Free entry in hanbok!",
      move_from_prev_method: null, move_from_prev_min: 0 },
    { route_id: ROUTE_ID, spot_id: SPOT_TONGIN, sort_order: 2, stay_min: 45,
      guardian_note_ko: "엽전 도시락이 5,000원. 양이 충분해요. 12시 이후 사람 많아져요.",
      guardian_note_en: "Lunchbox set is ₩5,000 in old coins. Get there before noon.",
      move_from_prev_method: "walk", move_from_prev_min: 15 },
    { route_id: ROUTE_ID, spot_id: SPOT_BUKCHON, sort_order: 3, stay_min: 60,
      guardian_note_ko: "<도깨비> 촬영지 골목 — 한옥 처마 라인이 가장 잘 보이는 view point 알려드려요.",
      guardian_note_en: "<Goblin> filming alley — I'll point out the best hanok roofline view.",
      move_from_prev_method: "walk", move_from_prev_min: 20 },
    { route_id: ROUTE_ID, spot_id: SPOT_ONION, sort_order: 4, stay_min: 40,
      guardian_note_ko: "한옥을 그대로 살린 카페. 판교파이가 인기. 안쪽 좌석이 사진 잘 나와요.",
      guardian_note_en: "Hanok-style cafe. Pandoro recommended. Inner seats are photo-friendly.",
      move_from_prev_method: "walk", move_from_prev_min: 10 },
    { route_id: ROUTE_ID, spot_id: SPOT_IKSEONDONG, sort_order: 5, stay_min: 50,
      guardian_note_ko: "저녁 5시쯤 가면 등불이 켜져요. <응답하라> 분위기 그대로.",
      guardian_note_en: "Lanterns light up around 5pm — <Reply 1988> vibes.",
      move_from_prev_method: "walk", move_from_prev_min: 12 },
  ])
);

// ── 8. content_posts (related_route_id 매핑) ────────────────────────────────
console.log("\n[8/8] content_posts …");
const [{ data: region }, { data: category }] = await Promise.all([
  sb.from("regions").select("id").eq("slug", "seoul").maybeSingle(),
  sb.from("content_categories").select("id").eq("slug", "k-content").maybeSingle(),
]);
if (!region?.id || !category?.id) {
  console.error("  ✗ regions.seoul 또는 content_categories.k_content 가 없습니다. 운영 시드를 먼저 적용하세요.");
  process.exit(1);
}
log("upsert content_post",
  await sb.from("content_posts").upsert([{
    id: POST_ID,
    author_user_id: GUARDIAN_MG14,
    region_id: region.id,
    category_id: category.id,
    kind: "k_content",
    title: "서울 궁궐 골목에서 만나는 K-드라마 씬",
    summary: "경복궁부터 익선동까지 — 한복 입고 한 바퀴, 사진 100장 보장.",
    body: "첫 한국 여행에서 절대 헤매지 않는 종로 K-드라마 코스를 정리했어요. 한복 대여부터 카페 추천, 사진 포인트, 그리고 가장 사람 적은 시간대까지.\n\n이 코스는 제가 직접 50번 넘게 걸은 길이에요. 따라오시면 그날 저녁 SNS 피드가 풍성할 거예요.",
    tags: ["k_drama", "palace", "jongno", "hanok"],
    status: "approved",
    post_format: "route",
    cover_image_url: null,
    route_journey: DEMO_ROUTE_JOURNEY,
    route_highlights: ["경복궁 한복 무료입장", "통인시장 엽전 도시락", "북촌 도깨비 골목", "어니언 안국", "익선동 야경"],
    hero_subject: "place",
    is_sample: true,
    seed_content_key: "seed-mg14-route-demo",
    related_route_id: ROUTE_ID,
  }], { onConflict: "id" })
);

// ── 확인 쿼리 ──────────────────────────────────────────────────────────────
console.log("\n[verify] counts …");
const verify = async (label, q) => {
  const { count, error } = await q;
  if (error) console.error(`  ✗ ${label}:`, error.message);
  else console.log(`  ${label}: ${count}`);
};
await verify("routes (public)",
  sb.from("routes").select("*", { count: "exact", head: true }).eq("status", "public")
);
await verify("route_spots (demo route)",
  sb.from("route_spots").select("*", { count: "exact", head: true }).eq("route_id", ROUTE_ID)
);
await verify("content_posts (seed)",
  sb.from("content_posts").select("*", { count: "exact", head: true }).eq("seed_content_key", "seed-mg14-route-demo")
);

console.log("\n✅ Demo seed applied.");
