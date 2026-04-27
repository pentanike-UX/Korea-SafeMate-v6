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
    },
  ],
};
