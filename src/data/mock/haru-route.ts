/**
 * Mock Haru Route — 성수동 하루 코스
 * T10 Route View 개발·시연용. 실 Supabase 데이터로 교체 예정.
 *
 * 경로: 성수 카페 → 서울숲 산책 → 뚝섬 한강 → 압구정 로데오 → 청담 디저트
 */
import type { HaruRoute } from "@/types/haru";

export const mockHaruRoute: HaruRoute = {
  id: "mock-route-seongsu-01",
  title: {
    ko: "성수·압구정 반나절 로컬 코스",
    en: "Seongsu & Apgujeong Half-Day Local Route",
    th: "เส้นทางท้องถิ่นครึ่งวัน Seongsu & Apgujeong",
    vi: "Lộ trình địa phương nửa ngày Seongsu & Apgujeong",
  },
  guardian: {
    display_name: "Minh · Seoul Tribe",
    photo_url: null,
  },
  total_duration_min: 360, // 6시간
  estimated_cost_min_krw: 40000,
  estimated_cost_max_krw: 80000,
  recommended_time_of_day: "morning",
  cover_image_url: null,
  spots: [
    {
      id: "spot-01",
      order: 1,
      catalog: {
        name: {
          ko: "어니언 성수",
          en: "Onion Seongsu",
          th: "Onion Seongsu",
          vi: "Onion Seongsu",
        },
        category: "cafe",
        category_emoji: "☕",
        image_url: null,
        address: "서울 성동구 아차산로9길 8",
        lat: 37.5446,
        lng: 127.0569,
      },
      stay_min: 60,
      guardian_note: {
        ko: "성수의 분위기를 제대로 느낄 수 있는 공장 개조 카페예요. 크루아상이 진짜 맛있어요.",
        en: "A converted factory café that defines Seongsu's vibe. The croissants are incredible.",
        th: "คาเฟ่ในโรงงานเก่าที่ให้ความรู้สึกของ Seongsu ได้อย่างชัดเจน",
        vi: "Quán cà phê cải tạo từ nhà máy mang hơi thở đặc trưng của Seongsu.",
      },
      move_from_prev_method: null,
      move_from_prev_min: null,
      featured: true,
      details: {
        gallery_image_urls: [
          "/mock/posts/강남_010.jpg",
          "/mock/posts/강남_005.jpg",
          "/mock/posts/강남_011.jpg",
        ],
        why_here: {
          ko: "성수의 하루를 여는 카페로는 가장 안전한 첫 선택이에요. 오전 시간 햇빛이 안쪽까지 들어와 사진도 잘 나옵니다. 자리 잡기 어려운 주말에는 테이크아웃만 해도 분위기는 충분히 느낄 수 있어요.",
          en: "Safest first pick to start a Seongsu day. Morning light reaches deep inside, so photos turn out well. On busy weekends a takeout alone still captures the vibe.",
        },
        what_to_do: {
          ko: "① 입구 오른쪽 줄에서 주문 → ② 안쪽 베이커리에서 크루아상 픽업 → ③ 야외 테이블 또는 안쪽 큰 창가 자리 잡기. 화장실은 안쪽 깊숙이.",
          en: "① Order in the right-side queue → ② Pick up the croissant at the bakery counter → ③ Grab the patio or the big interior window seat. Restroom is deep inside the back.",
        },
        photo_tip: {
          ko: "안쪽 벽돌 벽 + 햇빛 들어오는 시간(오전 10~11시) 조합이 가장 강합니다. 인물은 창가 측면 컷이 자연스러워요.",
          en: "Brick wall + morning light (10–11 AM) is the strongest combo. For portraits, side-window angles look most natural.",
        },
        caution: {
          ko: "주말 11~14시는 줄이 깁니다. 30분 이상 기다리고 싶지 않다면 평일 오전을 추천해요.",
          en: "Saturdays and Sundays 11 AM–2 PM get long lines. If you can't wait 30+ minutes, weekday mornings are best.",
        },
      },
    },
    {
      id: "spot-02",
      order: 2,
      catalog: {
        name: {
          ko: "서울숲",
          en: "Seoul Forest",
          th: "โซลฟอเรสต์",
          vi: "Rừng Seoul",
        },
        category: "park",
        category_emoji: "🌿",
        image_url: null,
        address: "서울 성동구 뚝섬로 273",
        lat: 37.5443,
        lng: 127.0378,
      },
      stay_min: 70,
      guardian_note: {
        ko: "도심 속 넓은 공원이에요. 나무 사이로 걸으면서 사진 찍기 좋아요. 사슴도 볼 수 있어요!",
        en: "A huge park in the middle of the city. Great photo spots through the trees — you can even see deer!",
        th: "สวนสาธารณะขนาดใหญ่ใจกลางเมือง ถ่ายรูปสวยมาก อาจเจอกวางด้วย!",
        vi: "Công viên rộng lớn giữa thành phố. Chụp ảnh rất đẹp, có thể thấy cả hươu!",
      },
      move_from_prev_method: "walk",
      move_from_prev_min: 12,
      details: {
        gallery_image_urls: ["/mock/posts/강남_004.jpg", "/mock/posts/강남_007.jpg"],
        why_here: {
          ko: "성수에서 한강 방향으로 자연스럽게 흐르는 동선의 첫 휴식 지점이에요. 시야가 넓고 사슴 방사장까지 짧게 들렀다 갈 수 있습니다.",
          en: "First natural break point as you head from Seongsu toward the river. Open sightlines and a quick stop at the deer enclosure on the way.",
        },
        what_to_do: {
          ko: "① 정문 안내판에서 사슴 방사장 위치 확인 → ② 큰 메인 산책로로 갈지 호숫가로 갈지 선택 → ③ 그늘 벤치에서 잠시 쉬기.",
          en: "① Check the map for the deer enclosure → ② Pick the main promenade or the lake loop → ③ Take a shaded bench break.",
        },
        photo_tip: {
          ko: "나무 사이로 들어오는 햇빛이 좋은 시간은 오후 2~4시. 사슴 방사장은 정해진 시간대 외엔 못 볼 수 있어요.",
          en: "Best dappled light is 2–4 PM. Deer may not be visible outside scheduled viewing hours.",
        },
        caution: {
          ko: "여름 한낮은 그늘이 짧습니다. 모자·물 챙기세요.",
          en: "Midsummer afternoons have limited shade — bring a hat and water.",
        },
      },
    },
    {
      id: "spot-03",
      order: 3,
      catalog: {
        name: {
          ko: "뚝섬 한강공원",
          en: "Ttukseom Hangang Park",
          th: "สวนหางกัง ทุกซอม",
          vi: "Công viên sông Hàn Ttukseom",
        },
        category: "park",
        category_emoji: "🌊",
        image_url: null,
        address: "서울 광진구 강변북로 139",
        lat: 37.5283,
        lng: 127.0654,
      },
      stay_min: 60,
      guardian_note: {
        ko: "편의점에서 라면 사 먹거나 맥주 한 캔 마시기 딱 좋아요. 한강 뷰 최고예요.",
        en: "Perfect for a convenience store ramen or a cold beer by the Han River. Best view in the city.",
        th: "เหมาะมากสำหรับราเมนร้านสะดวกซื้อหรือเบียร์เย็นริมแม่น้ำฮัน วิวดีสุด ๆ",
        vi: "Tuyệt vời để ăn mì cốc tiện lợi hoặc uống bia lạnh bên sông Hàn.",
      },
      move_from_prev_method: "walk",
      move_from_prev_min: 18,
      details: {
        gallery_image_urls: ["/mock/posts/강남_013.jpg", "/mock/posts/강남_014.jpg"],
        why_here: {
          ko: "한강 뷰가 가장 가까이서 잡히는 구간이에요. 편의점 도시락이나 컵라면을 들고 잠깐 앉아 쉬기 좋습니다.",
          en: "Closest stretch where the Han River view is right at your seat. Perfect for a convenience-store lunch or cup ramen break.",
        },
        what_to_do: {
          ko: "① 가장 가까운 편의점에서 음료·간식 픽업 → ② 강가 벤치 또는 잔디밭 자리 잡기 → ③ 강 건너편 야경(저녁) 또는 윈드서핑(낮) 구경.",
          en: "① Grab drinks/snacks at the nearest convenience store → ② Pick a riverside bench or grass spot → ③ Watch night skyline (PM) or windsurfing (day).",
        },
        photo_tip: {
          ko: "노을이 가장 진한 시각은 18~19시. 강 건너편 빌딩이 실루엣으로 들어옵니다.",
          en: "Sunset peaks at 6–7 PM. Far-bank towers come in as a clean silhouette.",
        },
        caution: {
          ko: "강가는 바람이 셉니다. 늦가을·겨울엔 윗옷 한 겹 더.",
          en: "It's windy by the river — bring one extra layer in late fall and winter.",
        },
      },
    },
    {
      id: "spot-04",
      order: 4,
      catalog: {
        name: {
          ko: "압구정 로데오 거리",
          en: "Apgujeong Rodeo Street",
          th: "ถนนโรดิโอ อัปกูจอง",
          vi: "Phố Rodeo Apgujeong",
        },
        category: "shopping",
        category_emoji: "🛍️",
        image_url: null,
        address: "서울 강남구 압구정로 일대",
        lat: 37.5275,
        lng: 127.0283,
      },
      stay_min: 80,
      guardian_note: {
        ko: "K-드라마 촬영지도 많고, 인스타 감성 카페도 많아요. 빈티지샵 탐방도 추천해요.",
        en: "Lots of K-drama filming locations and aesthetic cafés. Vintage shopping is a must.",
        th: "มีสถานที่ถ่ายทำซีรีส์เกาหลีและคาเฟ่สวย ๆ เยอะมาก ลองดูร้านวินเทจด้วย",
        vi: "Nhiều địa điểm quay phim K-drama và quán cà phê đẹp. Nhớ ghé cửa hàng vintage nhé.",
      },
      move_from_prev_method: "subway",
      move_from_prev_min: 22,
      featured: true,
      details: {
        gallery_image_urls: [
          "/mock/posts/강남_015.jpg",
          "/mock/posts/강남_016.jpg",
          "/mock/posts/강남_017.jpg",
        ],
        why_here: {
          ko: "K-드라마에 자주 나오는 거리예요. 카페·빈티지샵·플래그십이 한 골목 안에 모여 있어 짧게도 길게도 걸을 수 있어요.",
          en: "A street that shows up in many K-dramas. Cafés, vintage shops, and flagships all in one block — walk it short or long.",
        },
        what_to_do: {
          ko: "① 메인 로데오 큰 길에서 분위기 → ② 옆 골목 빈티지샵 한두 곳 → ③ 카페 한 잔으로 마무리.",
          en: "① Soak in the main Rodeo street vibe → ② Hit one or two vintage shops in the side alleys → ③ Cap it with a café.",
        },
        photo_tip: {
          ko: "골목 입구에서 큰 길 방향을 바라보면 가게 간판이 깔끔하게 정렬됩니다. 인물은 카페 안 창가 측면이 잘 나와요.",
          en: "Shooting from an alley entrance toward the main road lines the storefronts up cleanly. For portraits, café side-window seats work best.",
        },
        caution: {
          ko: "주말 오후엔 좁은 골목이 매우 혼잡합니다. 빈티지샵은 평일 오후 추천.",
          en: "Weekend afternoons get crowded in the narrow alleys — visit vintage shops on weekday afternoons if possible.",
        },
      },
    },
    {
      id: "spot-05",
      order: 5,
      catalog: {
        name: {
          ko: "청담 디저트 골목",
          en: "Cheongdam Dessert Lane",
          th: "ซอยของหวาน ชองดัม",
          vi: "Hẻm Dessert Cheongdam",
        },
        category: "dessert",
        category_emoji: "🍰",
        image_url: null,
        address: "서울 강남구 청담동 일대",
        lat: 37.5222,
        lng: 127.0536,
      },
      stay_min: 50,
      guardian_note: {
        ko: "하루 마무리로 딱이에요. 소규모 수제 디저트 카페들이 모여 있어요.",
        en: "Perfect way to end the day. Small artisan dessert cafés tucked in the alleyways.",
        th: "เหมาะมากสำหรับปิดท้ายวัน มีคาเฟ่ขนมหวานแฮนด์เมดเล็ก ๆ น่ารัก ๆ เยอะ",
        vi: "Kết thúc ngày hoàn hảo với những quán cà phê dessert thủ công nhỏ xinh.",
      },
      move_from_prev_method: "taxi",
      move_from_prev_min: 8,
      details: {
        gallery_image_urls: ["/mock/posts/강남_019.jpg", "/mock/posts/강남_028.jpg"],
        why_here: {
          ko: "하루의 마무리로 단맛 한 입. 골목 자체가 좁아 가게 회전이 빠릅니다. 한 자리에 오래 앉기보다 한두 가게 들렀다 가는 흐름이 자연스러워요.",
          en: "End the day with a sweet bite. The lane is narrow so seats turn over fast — better to hop one or two shops than to linger.",
        },
        what_to_do: {
          ko: "① 골목 입구에서 메뉴 빠르게 훑기 → ② 시그니처 메뉴 하나만 주문 → ③ 포장 또는 짧게 앉기.",
          en: "① Scan menus quickly at the alley entrance → ② Order one signature item → ③ Take it to go or sit briefly.",
        },
        photo_tip: {
          ko: "저녁 조명이 들어오는 시각(19시 이후)이 가장 분위기 있어요. 디저트는 위에서 내려찍기보다 측면 컷이 색이 잘 살아요.",
          en: "After 7 PM the warm lighting comes on for the best ambience. For desserts, side angles capture colors better than top-down.",
        },
        caution: {
          ko: "일부 가게는 일요일 휴무. 미리 확인 후 출발.",
          en: "Some shops close on Sundays — check before heading over.",
        },
      },
    },
  ],
};
