-- 데모 포스트 9396611c… — route_journey 채우기 (아티클 → 루트형 상세 + 하루루트 CTA)
-- Supabase Dashboard → SQL Editor에서 1회 실행.
-- 전체 JSON은 scripts/demo-route-journey-data.mjs 와 동일.

update public.content_posts
set
  post_format = 'route',
  status = 'approved',
  route_journey = $json${
  "metadata": {
    "transport_mode": "walk",
    "estimated_total_duration_minutes": 300,
    "estimated_total_distance_km": 4.2,
    "recommended_time_of_day": "morning",
    "difficulty": "easy",
    "recommended_traveler_types": ["first_time", "photo"],
    "night_friendly": false
  },
  "path": [
    {"lat": 37.5796, "lng": 126.977},
    {"lat": 37.5803, "lng": 126.9696},
    {"lat": 37.5826, "lng": 126.9837},
    {"lat": 37.575, "lng": 126.9851},
    {"lat": 37.5717, "lng": 126.9905}
  ],
  "spots": [
    {
      "id": "demo-spot-1", "order": 1, "title": "경복궁", "place_name": "경복궁",
      "address_line": "서울특별시 종로구 사직로 161",
      "short_description": "K-드라마·사극 촬영지로 자주 나오는 서울 대표 궁궐",
      "body": "오전 10시 입장이 사진이 가장 예뻐요. 한복을 입으면 무료 입장이에요.",
      "image_urls": [], "recommend_reason": "첫 스팟", "stay_duration_minutes": 90,
      "photo_tip": "", "caution": "", "lat": 37.5796, "lng": 126.977, "featured": true,
      "spot_catalog_id": "4d0927f4-1107-5e0b-b560-123b067bcab8"
    },
    {
      "id": "demo-spot-2", "order": 2, "title": "통인시장 도시락카페", "place_name": "통인시장",
      "address_line": "서울특별시 종로구 자하문로 18",
      "short_description": "엽전 도시락", "body": "12시 이전이 한산해요.",
      "image_urls": [], "recommend_reason": "점심", "stay_duration_minutes": 45,
      "photo_tip": "", "caution": "", "lat": 37.5803, "lng": 126.9696,
      "next_move_minutes": 15, "next_move_mode": "walk",
      "spot_catalog_id": "e36c8933-96d6-5fc6-a700-40132e2651de"
    },
    {
      "id": "demo-spot-3", "order": 3, "title": "북촌한옥마을", "place_name": "북촌한옥마을",
      "address_line": "서울특별시 종로구 계동길 37",
      "short_description": "도깨비 촬영지", "body": "한옥 처마 라인 뷰포인트",
      "image_urls": [], "recommend_reason": "K-드라마", "stay_duration_minutes": 60,
      "photo_tip": "", "caution": "", "lat": 37.5826, "lng": 126.9837,
      "next_move_minutes": 20, "next_move_mode": "walk",
      "spot_catalog_id": "b8a2b3da-4e84-5640-b0fb-cf09a3517601"
    },
    {
      "id": "demo-spot-4", "order": 4, "title": "어니언 안국", "place_name": "어니언 안국",
      "address_line": "서울특별시 종로구 계동길 5",
      "short_description": "한옥 카페", "body": "판교파이 인기",
      "image_urls": [], "recommend_reason": "휴식", "stay_duration_minutes": 40,
      "photo_tip": "", "caution": "", "lat": 37.575, "lng": 126.9851,
      "next_move_minutes": 10, "next_move_mode": "walk",
      "spot_catalog_id": "108565b5-ce33-5a5d-a653-4e87409268a9"
    },
    {
      "id": "demo-spot-5", "order": 5, "title": "익선동 골목", "place_name": "익선동",
      "address_line": "서울특별시 종로구 익선동",
      "short_description": "야경 골목", "body": "저녁 5시 등불",
      "image_urls": [], "recommend_reason": "마무리", "stay_duration_minutes": 50,
      "photo_tip": "", "caution": "", "lat": 37.5717, "lng": 126.9905,
      "next_move_minutes": 12, "next_move_mode": "walk",
      "spot_catalog_id": "3228b525-ee25-5abd-8fa0-f76049d2496c"
    }
  ]
}$json$::jsonb,
  updated_at = now()
where id = '9396611c-561c-5736-befd-baba8d3e3fd8'::uuid;
