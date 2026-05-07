import type {
  ContentPost,
  ContentPostHeroSubject,
  ContentPostKind,
  MapLatLng,
  PostStructuredContentV1,
  RouteJourney,
  RouteJourneyMetadata,
  RouteSpot,
  StructuredExposureMeta,
} from "@/types/domain";
import { POST_STRUCTURED_CONTENT_VERSION } from "@/types/domain";
import { postHasRouteJourney } from "@/lib/content-post-route";
import { demoPickLocal, demoPickLocals, hashStringToInt } from "@/lib/post-demo-local-images";
import type { PostVisualBucket } from "@/lib/post-local-images";
import {
  formatRouteSummaryMeta,
  practicalArticleShell,
  routeArticleShell,
} from "@/lib/post-seed-content-templates";
import {
  IMG_GANGNAM_ALLEY_CAFE,
  IMG_GYEONGBOKGWUNG_GATE,
  IMG_GYEONGBOKGWUNG_WALL,
  IMG_GWANGHWAMUN_SQUARE,
  IMG_SEJONG_STATUE,
  IMG_SEOUL_STREET_NIGHT,
  IMG_SPECIALTY_COFFEE_STOREFRONT,
  IMG_TEHERAN_RO_WALK,
  IMG_YI_SUN_SHIN_STATUE,
} from "@/data/mock/mock-real-place-assets";

function densifyPath(pts: MapLatLng[], perLeg = 5): MapLatLng[] {
  if (pts.length < 2) return [...pts];
  const out: MapLatLng[] = [];
  for (let i = 0; i < pts.length - 1; i++) {
    const a = pts[i]!;
    const b = pts[i + 1]!;
    out.push(a);
    for (let s = 1; s < perLeg; s++) {
      const t = s / perLeg;
      out.push({ lat: a.lat + (b.lat - a.lat) * t, lng: a.lng + (b.lng - a.lng) * t });
    }
  }
  out.push(pts[pts.length - 1]!);
  return out;
}

function localPair(postId: string, bucket: PostVisualBucket, salt: number): string[] {
  return demoPickLocals(bucket, hashStringToInt(postId) + salt, 2);
}

const metaEasy: RouteJourneyMetadata = {
  transport_mode: "walk",
  estimated_total_duration_minutes: 75,
  estimated_total_distance_km: 1.6,
  recommended_time_of_day: "morning",
  difficulty: "easy",
  recommended_traveler_types: ["first_timer", "solo", "photo"],
  night_friendly: true,
};

const metaGangnam: RouteJourneyMetadata = {
  transport_mode: "walk",
  estimated_total_duration_minutes: 65,
  estimated_total_distance_km: 1.4,
  recommended_time_of_day: "afternoon",
  difficulty: "easy",
  recommended_traveler_types: ["first_timer", "cafe", "photo"],
  night_friendly: true,
};

/** 스팟 행 생성 — 실장소 메타·이미지 hero·검수 상태 등 RouteSpot 전 필드 전달 가능 */
function spot(postId: string, order: number, partial: Omit<RouteSpot, "id" | "order">): RouteSpot {
  return {
    id: `${postId}-s${order}`,
    order,
    ...partial,
  };
}

/** 하루 프리뷰·structured exposure 용 한 줄 요약 */
function routeChainSummary(journey: RouteJourney, maxSpots = 4): string {
  const sorted = [...journey.spots].sort((a, b) => a.order - b.order);
  return sorted
    .slice(0, maxSpots)
    .map((s) => s.real_place_name || s.display_name || s.place_name)
    .join(" → ");
}

/** 광화문광장 → 이순신 → 세종로 사이 → 경복궁 방향 (실도보 가능 거리) */
function journeyGwanghwamunClassic(postId: string): RouteJourney {
  const pts: MapLatLng[] = [
    { lat: 37.57595, lng: 126.97685 },
    { lat: 37.57552, lng: 126.97715 },
    { lat: 37.57385, lng: 126.97675 },
    { lat: 37.57245, lng: 126.97695 },
    { lat: 37.57915, lng: 126.97685 },
  ];
  const spots: RouteSpot[] = [
    spot(postId, 1, {
      lat: 37.57595,
      lng: 126.97685,
      title: "광화문광장 — 방향 잡기",
      place_name: "광화문광장",
      spot_name: "광화문광장",
      display_name: "광화문광장",
      real_place_name: "광화문광장",
      category: "광장",
      district: "종로구",
      address: "서울특별시 종로구 세종대로 172",
      road_address: "세종대로 172",
      address_line: "서울 종로구 세종대로 172",
      naver_link: "https://map.naver.com/p/search/%EA%B4%91%ED%99%94%EB%AC%B8%EA%B4%91%EC%9E%A5",
      image_query: "광화문광장 전경 세종대로",
      images: { hero: IMG_GWANGHWAMUN_SQUARE },
      source_status: "verified",
      short_description: "[준비형] 북(경복궁)·남(시청·지하철)만 먼저 구분. 행사 펜스는 당일 표지가 우선.",
      body: "동상이 보이는 방향이 경복궁·북쪽입니다. 반대로 걸으면 지하철 쪽으로 빠집니다. 화장실은 세종이야기 지하에서 먼저 끝내세요. 궁 안에 들어가면 중간에 다시 나오기가 번거롭습니다.",
      image_urls: localPair(postId, "gwanghwamun", 30),
      recommend_reason: "표지판 밀도가 높습니다. 방향 헷갈리면 순경 부스에 바로 물어보세요.",
      stay_duration_minutes: 20,
      photo_tip: "넓게 잡으면 사람만 나옵니다. 측면·그늘 쪽으로 붙어서 찍으세요.",
      caution: "주말·연휴 행사 시 통제 구간이 바뀝니다. 펜스 따라 걷지 말고 표지 화살표를 우선하세요.",
      featured: true,
      theme_reason: "준비형 — 방향과 화장실만 정리하고 움직이세요.",
      what_to_do: "① 북쪽=궁 방향 손으로 확인 ② 세종이야기 지하(화장실) 위치 ③ 펜스·행사 안내판 확인 후 안쪽으로.",
      image_place_type: "plaza",
      image_alt: "광화문광장과 세종대로, 경복궁 방향 랜드마크",
      next_move_minutes: 3,
      next_move_distance_m: 200,
      next_move_mode: "walk",
    }),
    spot(postId, 2, {
      lat: 37.57552,
      lng: 126.97715,
      title: "이순신장군상 앞 — 랜드마크 샷",
      place_name: "이순신장군 동상",
      spot_name: "이순신장군 동상",
      display_name: "광화문광장 이순신장군상",
      real_place_name: "광화문광장 이순신장군 동상",
      category: "기념물",
      district: "종로구",
      address: "서울특별시 종로구 세종대로 172",
      road_address: "광화문광장 내",
      address_line: "광화문광장 내",
      naver_link: "https://map.naver.com/p/search/%EC%9D%B4%EC%88%9C%EC%8B%A0%EC%9E%A5%EA%B5%B0%20%EB%8F%99%EC%83%81",
      image_query: "광화문 이순신장군 동상",
      images: { hero: IMG_YI_SUN_SHIN_STATUE },
      source_status: "verified",
      leg_from_previous:
        "단체 관광객이 몰리면 속도가 확 줄어듭니다. 중앙에서 멈추지 말고 측면 보행로로 붙으세요.",
      short_description: "[포토형] 만남 기준은 ‘동상 앞’보다 ‘동상에서 궁이 보이는 쪽 벤치’로 말해야 덜 엇갈립니다.",
      body: "’동상 앞’만 말하면 위치가 어긋납니다. ‘궁이 보이는 쪽 발치’까지 붙여야 맞습니다. 역광이면 플래시 끄고 연속으로 찍으세요. 플래시는 노이즈만 올립니다.",
      image_urls: localPair(postId, "gwanghwamun", 51),
      recommend_reason: "각도가 많습니다. 기준 컷 하나만 정하고 넘어가세요.",
      stay_duration_minutes: 15,
      photo_tip: "발 아래 기준선을 두면 인물 비율이 덜 이상해집니다. 삼각대·셀카봉은 뒤 통행에 걸리지 않게 짧게 접으세요.",
      caution: "단체 시간대엔 어깨 충돌이 잦습니다. 가방은 앞쪽·몸 안쪽으로 당기세요.",
      theme_reason: "포토형 — 각도만 정하고 넘어가세요.",
      what_to_do: "기준 컷 1장만 찍고 세종대왕상 방향으로 이동합니다.",
      image_place_type: "landmark",
      image_alt: "광화문광장 이순신장군 동상과 도심 배경",
      next_move_minutes: 4,
      next_move_distance_m: 280,
      next_move_mode: "walk",
    }),
    spot(postId, 3, {
      lat: 37.57245,
      lng: 126.97695,
      title: "세종대왕상 — 광장 중심 산책",
      place_name: "세종대왕 동상",
      spot_name: "세종대왕 동상",
      display_name: "광화문광장 세종대왕상",
      real_place_name: "광화문광장 세종대왕 동상",
      category: "기념물",
      district: "종로구",
      address: "서울특별시 종로구 세종대로 172",
      road_address: "광화문광장 내",
      address_line: "광화문광장 내 (세종대로)",
      naver_link: "https://map.naver.com/p/search/%EC%84%B8%EC%A2%85%EB%8C%80%EC%99%95%20%EB%8F%99%EC%83%81",
      image_query: "광화문 세종대왕 동상",
      images: { hero: IMG_SEJONG_STATUE },
      source_status: "verified",
      leg_from_previous:
        "이순신상에서 세종상까지는 같은 광장 안 직선입니다. 횡단이 필요하면 신호 대기 줄이 길어질 수 있어요. 급하면 지하 연결·세종이야기 입구 표지를 먼저 확인하세요.",
      short_description: "[휴식형] 그늘·벤치·물. 궁 입장 전 화장실은 여기서 끝내는 편이 덜 후회합니다.",
      body: "여름에 광장 중앙은 뜨겁습니다. 벤치는 동상 뒤 그늘 쪽으로 가세요. 화장실은 세종이야기 지하에서 먼저. 궁 안에서 찾으면 시간이 두 배로 걸립니다.",
      image_urls: localPair(postId, "gwanghwamun", 72),
      recommend_reason: "이순신상 다음 호흡 조절 지점입니다. 전시 관심 없으면 동상만 보고 이동해도 됩니다.",
      stay_duration_minutes: 15,
      photo_tip: "정면에 사람이 줄 서면 실패합니다. 측면 끝에서 대각선으로 잡으세요.",
      caution: "횡단 대기가 길면 스마트폰만 보고 끼어들지 마세요. 킥보드·자전거 겹치는 구간이 있습니다.",
      theme_reason: "휴식형 — ‘감상’보다 물·화장실·그늘 먼저. 나중에 발이 훨씬 가벼워집니다.",
      what_to_do: "물·화장실 → (선택) 세종이야기 → 광화문 쪽으로 발걸음.",
      image_place_type: "landmark",
      image_alt: "광화문광장 세종대왕 동상",
      next_move_minutes: 7,
      next_move_distance_m: 550,
      next_move_mode: "walk",
    }),
    spot(postId, 4, {
      lat: 37.57915,
      lng: 126.97685,
      title: "경복궁 광화문 — 궁궐 정문",
      place_name: "경복궁 광화문",
      spot_name: "경복궁 광화문",
      display_name: "경복궁 광화문",
      real_place_name: "경복궁 광화문",
      category: "문화재",
      district: "종로구",
      address: "서울특별시 종로구 사직로 161",
      road_address: "사직로 161",
      address_line: "서울 종로구 사직로 161",
      naver_link: "https://map.naver.com/p/search/%EA%B2%BD%EB%B3%B5%EA%B6%81%20%EA%B4%91%ED%99%94%EB%AC%B8",
      image_query: "경복궁 광화문 정문",
      images: { hero: IMG_GYEONGBOKGWUNG_GATE },
      source_status: "verified",
      leg_from_previous:
        "세종대로 북측 보행로를 따르세요. 행사 펜스가 있으면 표지 우회로를 따르세요. 교차로는 버스·킥보드 차로를 피해 보도 안쪽으로 붙어 걷는 게 안전합니다.",
      short_description: "[종착·분기] 입장할지 담장만 볼지 여기서 결정하세요. 줄이 길면 담장만 걸어도 됩니다.",
      body: "입장 전 대형 가방·삼각대 규정을 입구에서 확인하세요. 줄이 길면 담장만 걸어도 됩니다. 여름에 내부는 걷는 거리가 깁니다. 물은 광장에서 미리 채우세요.",
      image_urls: localPair(postId, "gwanghwamun", 93),
      recommend_reason: "루트 종착점입니다. 사진만 찍고 빠지려면 성문 앞에서 짧게만 하세요.",
      stay_duration_minutes: 40,
      photo_tip: "정문 정면은 개장 직후가 한산합니다. 아니면 담장 대각선으로 잡으세요.",
      caution: "휴무·조기 마감은 공지가 우선입니다. 줄이 길면 억지로 입장하지 말고 담장으로 조정하세요.",
      featured: true,
      theme_reason: "목적지형 — 입장이면 내부 이동 시간을 따로 잡으세요.",
      what_to_do: "매표 줄·가방 규정 확인 후 입장 여부 결정.",
      image_place_type: "palace",
      image_alt: "경복궁 광화문 정문",
    }),
  ];
  return { metadata: { ...metaEasy, estimated_total_duration_minutes: 90, estimated_total_distance_km: 2.1 }, spots, path: densifyPath(pts) };
}

/** 강남역 인근 도보 — 카페·테헤란로·골목 (도보 동선 샘플) */
function journeyGangnamWalk(postId: string): RouteJourney {
  const pts: MapLatLng[] = [
    { lat: 37.49805, lng: 127.0276 },
    { lat: 37.4992, lng: 127.0294 },
    { lat: 37.5006, lng: 127.0335 },
    { lat: 37.5014, lng: 127.0363 },
  ];
  const spots: RouteSpot[] = [
    spot(postId, 1, {
      lat: 37.49805,
      lng: 127.0276,
      title: "강남역 11번 출구 앞 시작 카페",
      place_name: "블루보틀 강남점",
      spot_name: "블루보틀 강남점",
      display_name: "블루보틀 커피 강남점",
      real_place_name: "블루보틀 커피 강남점",
      category: "카페",
      district: "강남구",
      address: "서울특별시 강남구 테헤란로4길 10",
      road_address: "테헤란로4길 10",
      address_line: "서울 강남구 테헤란로 4길 10",
      naver_link: "https://map.naver.com/p/search/%EB%B8%94%EB%A3%A8%EB%B3%B4%ED%8B%80%20%EA%B0%95%EB%82%A8",
      image_query: "블루보틀 강남점 외관 테헤란로",
      images: { hero: IMG_SPECIALTY_COFFEE_STOREFRONT },
      source_status: "needs_review",
      short_description: "[준비형] 11번 출구 기준으로 잡기 쉬움. 줄 길면 테이크아웃만 하고 테헤란로로 바로 빠져도 됩니다.",
      body: "창가는 여름에 직사광선이 강합니다. 오후엔 안쪽 자리를 잡으세요. 출발 전 역삼 방향을 폰에 한 줄 적어두세요. 팀원과 흩어지면 바로 꼬입니다.",
      image_urls: localPair(postId, "gangnam", 40),
      recommend_reason: "출발점에서 카페인·물을 확보하기 좋습니다. 웨이팅이 길면 테이크아웃만 들고 바로 테헤란로로 빠지세요.",
      stay_duration_minutes: 20,
      photo_tip: "실내 조명으로 피부톤이 깨집니다. 건물 외곽은 입구 밖에서 찍으세요.",
      caution: "금·토 저녁 웨이팅이 길어집니다. 짐을 바닥에 두면 통행에 걸립니다.",
      featured: true,
      theme_reason: "준비형 — 줄·테이크아웃·좌석만 빠르게 결정합니다.",
      what_to_do: "음료 수령 후 테헤란로를 따라 동쪽(역삼 방향) 보행을 시작합니다.",
      image_alt: "테헤란로 골목 카페 외관과 통유리 입구",
      next_move_minutes: 6,
      next_move_distance_m: 450,
      next_move_mode: "walk",
    }),
    spot(postId, 2, {
      lat: 37.4992,
      lng: 127.0294,
      title: "테헤란로 거리 포인트",
      place_name: "강남역~역삼역 테헤란로 보행로",
      spot_name: "테헤란로 보행로",
      display_name: "테헤란로 (강남역·역삼역 구간)",
      real_place_name: "테헤란로 보행로",
      category: "보행로",
      district: "강남구",
      address: "서울특별시 강남구 테헤란로 일대",
      road_address: "테헤란로",
      address_line: "서울 강남구 테헤란로 일대",
      naver_link: "https://map.naver.com/p/search/%ED%85%8C%ED%97%A4%EB%9E%80%EB%A1%9C%20%EA%B0%95%EB%82%A8",
      image_query: "강남 테헤란로 보행로 오피스",
      images: { hero: IMG_TEHERAN_RO_WALK },
      source_status: "needs_review",
      leg_from_previous:
        "지도상 직선이라도 한 블록 우회할 수 있습니다. 대각선 횡단이 안 되는 교차로가 있어서입니다. 퇴근 시간(18~19시)엔 인도 속도가 확 떨어집니다.",
      short_description: "[이동형] 오피스 밀집 구간—점심·저녁 피크에 인도가 좁아집니다. 건물 입구 홈에서 짧게 찍으세요.",
      body: "큰 길 하나만 기억하면 역삼 방향은 잡힙니다. 이어폰은 킥보드 소리가 들릴 정도로 줄이세요. 좁은 구간에서 짐은 앞으로 당기세요.",
      image_urls: localPair(postId, "gangnam", 61),
      recommend_reason: "랜드마크 빌딩만 기억하면 길 잃기 어렵습니다. 전 구간을 다 안 걸어도 됩니다.",
      stay_duration_minutes: 15,
      photo_tip: "횡단 대기 중 촬영은 신호 직전에만. 발치 킥보드를 먼저 보세요.",
      caution: "야간에 차로 침범 페인트 구역이 많습니다. 횡단할 때는 화면 보지 마세요.",
      theme_reason: "이동형 — 감상보다 건너고 골목 들어가기 전 속도 조절용.",
      what_to_do: "동쪽으로 큰 길 유지 → 다음 골목 직전 지도 한 번만 확인.",
      image_alt: "테헤란로와 강남 오피스 빌딩 거리",
      next_move_minutes: 7,
      next_move_distance_m: 520,
      next_move_mode: "walk",
    }),
    spot(postId, 3, {
      lat: 37.5006,
      lng: 127.0335,
      title: "역삼동 골목 로컬 카페",
      place_name: "언주로 카페거리 (역삼동 골목)",
      spot_name: "언주로 카페거리",
      display_name: "역삼동 언주로 골목 카페",
      real_place_name: "역삼동 언주로 일대 카페 골목",
      category: "카페거리",
      district: "강남구",
      address: "서울특별시 강남구 언주로 일대",
      road_address: "언주로",
      address_line: "서울 강남구 언주로 일대",
      naver_link: "https://map.naver.com/p/search/%EC%96%B8%EC%A3%BC%EB%A1%9C%20%EC%B9%B4%ED%8E%98",
      image_query: "역삼동 언주로 골목 카페",
      images: { hero: IMG_GANGNAM_ALLEY_CAFE },
      source_status: "needs_review",
      leg_from_previous:
        "지도 핀과 실제 입구가 어긋나는 경우가 많습니다. 언주로 큰 길에서 한 블록만 안쪽으로 들어가면 됩니다. 길에서 멈추면 뒤 보행자에게 방해됩니다.",
      short_description: "[휴식형] 메인 도로에서 한 블록 안쪽—소음이 줄어듭니다. 앉기 전 노노트북 표지를 문에서 확인하세요.",
      body: "앉기 전에 노노트북·노키즈 표지를 문에서 확인하세요. 들어가서 알면 민망합니다. 충전이 필요하면 자리 잡기 전에 카운터에 물어보세요.",
      image_urls: localPair(postId, "gangnam", 82),
      recommend_reason: "테헤란로를 걷고 들어와 쉬기 좋은 간격입니다. 통화·메모하기에도 조용합니다.",
      stay_duration_minutes: 30,
      photo_tip: "햇빛 각도가 있을 때 찍으세요. 흐린 날은 노이즈만 납니다.",
      caution: "노키즈·노노트북 매장은 문 앞에서 확인하세요. 화장실 없는 소매점도 있습니다.",
      theme_reason: "휴식형 — 앉아서 물·충전·화장실 체크용.",
      what_to_do: "주문 → 자리 → 20~30분 후 테헤란로로 복귀.",
      image_alt: "역삼동 골목과 카페 외관",
      next_move_minutes: 8,
      next_move_distance_m: 600,
      next_move_mode: "walk",
    }),
    spot(postId, 4, {
      lat: 37.5014,
      lng: 127.0363,
      title: "테헤란로 야경 마무리 포인트",
      place_name: "역삼역~선릉역 테헤란로 보행 구간",
      spot_name: "테헤란로 야경 구간",
      display_name: "테헤란로 (역삼·선릉역 방면)",
      real_place_name: "테헤란로 야간 보행 구간",
      category: "보행로",
      district: "강남구",
      address: "서울특별시 강남구 테헤란로",
      road_address: "테헤란로",
      address_line: "서울 강남구 테헤란로 (역삼역 방면)",
      naver_link: "https://map.naver.com/p/search/%ED%85%8C%ED%97%A4%EB%9E%80%EB%A1%9C%20%EC%95%BC%EA%B2%BD",
      image_query: "강남 테헤란로 야경 빌딩",
      images: { hero: IMG_SEOUL_STREET_NIGHT },
      source_status: "needs_review",
      leg_from_previous:
        "골목에서 나오면 큰 길 횡단이 한 번 더 있을 수 있습니다. 연속 촬영이 장노출보다 낫습니다—야간 유리 반사로 노출이 흔들립니다. 보도 안쪽으로 걸으세요.",
      short_description: "[포토형·야간] 큰 길이라 역 입구 찾기 쉽습니다. 사진은 짧게 찍고 빠지세요.",
      body: "유리 반사로 빌딩 색이 갈립니다. 건물 입구 홈에 서서 찍으세요. 길 한복판에서 멈추면 뒤에서 밀립니다.",
      image_urls: localPair(postId, "gangnam", 103),
      recommend_reason: "마지막 구간이라 역만 정하면 종료입니다. 역삼 vs 선릉은 목적지 방향으로 고르세요.",
      stay_duration_minutes: 20,
      photo_tip: "노출을 길게 당기면 손떨림이 더 커집니다. 짧게 여러 장 찍으세요.",
      caution: "킥보드·자전거 차로 침범 금지 구역이 많습니다. 횡단할 때 이어폰 볼륨을 줄이세요.",
      featured: true,
      theme_reason: "포토형 마무리 — 안전하게 짧게 찍고 지하로 하차.",
      what_to_do: "사진 2~3장 → 가장 가까운 역 입구로 이동.",
      image_alt: "테헤란로 야간 빌딩 조명",
    }),
  ];
  return { metadata: metaGangnam, spots, path: densifyPath(pts) };
}

/** 짧은 광화문 삼각 루프 (3스팟) */
function journeyGwangShort(postId: string): RouteJourney {
  const pts: MapLatLng[] = [
    { lat: 37.5761, lng: 126.9771 },
    { lat: 37.5754, lng: 126.9773 },
    { lat: 37.5768, lng: 126.9782 },
  ];
  const spots: RouteSpot[] = [
    spot(postId, 1, {
      lat: 37.5761,
      lng: 126.9771,
      title: "광화문 교보빌딩 앞 — 시작",
      place_name: "광화문 교보생명빌딩 앞",
      spot_name: "교보생명빌딩 광화문",
      display_name: "광화문 교보생명빌딩 앞",
      real_place_name: "교보생명빌딩·세종문화회관 일대",
      category: "출발점",
      district: "종로구",
      address: "서울특별시 종로구 종로1길 50",
      road_address: "종로1길 50",
      address_line: "서울 종로구 종로1길 50",
      naver_link: "https://map.naver.com/p/search/%EA%B5%90%EB%B3%B4%EC%83%9D%EB%AA%85%EB%B9%8C%EB%94%A9%20%EA%B4%91%ED%99%94%EB%AC%B8",
      image_query: "광화문 교보생명빌딩 앞 광장",
      images: { hero: IMG_GWANGHWAMUN_SQUARE },
      source_status: "verified",
      short_description: "[준비형] 교차로 차량 많음—사진은 보도 안쪽. 광장·이순신상 방향만 확정하고 들어갑니다.",
      body: "여기서 광장이 트입니다. 시청 쪽인지 궁 쪽인지 먼저 정하세요. 신호 대기 중에 방향을 확인하면 됩니다.",
      image_urls: localPair(postId, "gwanghwamun", 110),
      recommend_reason: "짧은 코스에서 좌표를 잡기 좋습니다. 다음 스팟이 광장이라 이동 스텝이 짧습니다.",
      stay_duration_minutes: 15,
      photo_tip: "교차로 근처는 차량 진입 각도를 보고 촬영하세요. 신호가 바뀔 때 보행자가 몰립니다.",
      caution: "횡단 대기선 밖으로 발을 내밀면 우회전 차량 코너에 걸릴 수 있습니다.",
      featured: true,
      theme_reason: "준비형 — 방향 확인 후 광장으로 진입합니다.",
      what_to_do: "광장 안쪽으로 횡단해 이순신상 방향을 맞춥니다.",
      image_alt: "교보생명빌딩과 광화문광장 방향",
      next_move_minutes: 3,
      next_move_distance_m: 220,
      next_move_mode: "walk",
    }),
    spot(postId, 2, {
      lat: 37.5754,
      lng: 126.9773,
      title: "광화문광장 — 중앙 산책",
      place_name: "광화문광장",
      spot_name: "광화문광장",
      display_name: "광화문광장",
      real_place_name: "광화문광장",
      category: "광장",
      district: "종로구",
      address: "서울특별시 종로구 세종대로 172",
      road_address: "세종대로 172",
      address_line: "서울 종로구 세종대로 172",
      naver_link: "https://map.naver.com/p/search/%EA%B4%91%ED%99%94%EB%AC%B8%EA%B4%91%EC%9E%A5",
      image_query: "광화문광장 산책",
      images: { hero: IMG_GWANGHWAMUN_SQUARE },
      source_status: "verified",
      leg_from_previous:
        "교보 앞에서 광장으로 들어올 때 횡단 신호가 길게 걸릴 수 있습니다. 행사 펜스가 있으면 중앙으로 직진하지 말고 표지 우회로를 따르세요. 단체 관광객이 몰리면 속도가 줄어듭니다.",
      short_description: "[이동·휴식] 평지라 무릎 부담은 적습니다. 한여름엔 중앙보다 그늘·벤치를 먼저 잡으세요.",
      body: "펜스가 있으면 표지 우회로를 따르세요. 중앙으로 고집하면 뺑뺑 돌게 됩니다. 화장실은 세종이야기 지하가 빠릅니다. 벤치는 동상 뒤 그늘 쪽이 덜 붐빕니다.",
      image_urls: localPair(postId, "gwanghwamun", 131),
      recommend_reason: "짧은 루프의 핵심 걷는 구간입니다. 동행 속도가 다르면 여기서만 맞추면 됩니다.",
      stay_duration_minutes: 20,
      photo_tip: "넓은 샷은 사람만 많아집니다. 세로 프레임으로 동상 옆을 노려보세요.",
      caution: "강한 햇볕에 탈수가 빠릅니다. 음수대 줄이 길면 편의점에서 물을 사도 됩니다.",
      theme_reason: "이동+휴식 — 그늘·물·화장실 우선.",
      what_to_do: "이순신상을 지나 세종대왕상 방향으로 직선 이동 후 담장 쪽으로 발을 돌립니다.",
      image_alt: "광화문광장과 세종대로",
      next_move_minutes: 5,
      next_move_distance_m: 380,
      next_move_mode: "walk",
    }),
    spot(postId, 3, {
      lat: 37.5768,
      lng: 126.9782,
      title: "경복궁 담장길 — 마무리 산책",
      place_name: "경복궁 서측 담장 산책로",
      spot_name: "경복궁 서측 담장길",
      display_name: "경복궁 서측 담장 산책로",
      real_place_name: "경복궁 서측 담장 산책로",
      category: "문화재",
      district: "종로구",
      address: "서울특별시 종로구 사직로 일대",
      road_address: "사직로 일대",
      address_line: "서울 종로구 사직로 일대",
      naver_link: "https://map.naver.com/p/search/%EA%B2%BD%EB%B3%B5%EA%B6%81%20%EB%8B%B4%EC%9E%A5",
      image_query: "경복궁 담장 산책로 기와",
      images: { hero: IMG_GYEONGBOKGWUNG_WALL },
      source_status: "verified",
      leg_from_previous:
        "담장길로 붙을 때 행사 통제가 있으면 우회합니다. 자전거 도로와 보행로가 겹치는 구간이 있습니다. 뒤에서 벨이 울리면 한쪽으로 붙으세요.",
      short_description: "[마무리] 입장 안 해도 기와선이 사진에 살아납니다. 줄이 길면 담장만 걸어도 됩니다.",
      body: "줄이 길면 담장만 걸어도 됩니다. 기와선이 사진에 살아납니다. 교대식은 당일 공지 시간을 먼저 확인하세요.",
      image_urls: localPair(postId, "gwanghwamun", 152),
      recommend_reason: "짧은 루프 종료용으로 체력을 아낄 수 있습니다.",
      stay_duration_minutes: 25,
      photo_tip: "대각선으로 담장만 잡으면 깊이가 살아납니다. 정면 기와는 사람이 많이 붙습니다.",
      caution: "일부 구간은 자전거 우선 도로와 겹칩니다. 스마트폰만 보며 서 있지 마세요.",
      featured: true,
      theme_reason: "포토형 마무리 — 입장을 안 할 때의 대체 플랜.",
      what_to_do: "담장 방향만 정하고 광화문 쪽으로 되돌아가도 됩니다.",
      image_alt: "경복궁 담장과 기와 지붕",
    }),
  ];
  return {
    metadata: { ...metaEasy, estimated_total_duration_minutes: 55, estimated_total_distance_km: 1.1 },
    spots,
    path: densifyPath(pts),
  };
}

type SampleDef = {
  withRoute: boolean;
  journey?: (postId: string) => RouteJourney;
  title: string;
  summary: string;
  body: string;
  tags: string[];
  category_slug: string;
  kind: ContentPostKind;
  post_format?: ContentPost["post_format"];
  route_highlights?: string[];
  recommended_boost?: number;
  hero_subject?: ContentPostHeroSubject | null;
};

function visualBucketForSample(def: SampleDef): PostVisualBucket {
  return def.tags.some((t) => t.includes("강남")) ? "gangnam" : "gwanghwamun";
}

function sampleForWhoLine(def: SampleDef): string {
  const t = def.tags.join(" ");
  if (t.includes("첫") || t.includes("첫방문")) return "서울 첫 방문·오리엔테이션을 짧게 끝내고 싶은 분";
  if (t.includes("솔로")) return "혼자 이동하지만 밝은 도로와 짧은 휴게를 원하는 분";
  if (t.includes("사진") || t.includes("야경") || t.includes("야간")) return "사진·분위기를 남기되 통행을 해치지 않으려는 분";
  if (t.includes("카페") || t.includes("식사") || t.includes("먹자")) return "카페·식사 흐름을 부담 없이 잡고 싶은 분";
  if (def.kind === "practical") return "현장에서 작은 결정을 줄이고 실행 기준만 얻고 싶은 분";
  return "광화문·도심 랜드마크를 한 번에 잡고 싶은 분";
}

function structuredFromSample(def: SampleDef, journey: RouteJourney | undefined): StructuredExposureMeta {
  const audience: string[] = [];
  if (def.tags.some((x) => x.includes("솔로"))) audience.push("solo");
  if (def.tags.some((x) => x.includes("첫"))) audience.push("first_timer");
  if (audience.length === 0) audience.push("first_timer", "practical_traveler");
  const durMin = journey?.metadata.estimated_total_duration_minutes ?? 90;
  const duration = durMin <= 60 ? ["one_hour"] : ["half_day"];
  const mood: string[] = [];
  if (def.tags.some((x) => x.includes("카페"))) mood.push("cafe_focused");
  if (def.tags.some((x) => x.includes("야경") || x.includes("야간"))) mood.push("seoul_night_scene");
  if (mood.length === 0) mood.push("local_vibe");
  const sc = def.summary.length > 110 ? `${def.summary.slice(0, 108)}…` : def.summary;
  const summary_card =
    journey ?
      `${routeChainSummary(journey)}. 약 ${journey.metadata.estimated_total_duration_minutes}분 · ${journey.metadata.estimated_total_distance_km.toFixed(1)}km 도보. ${sc}`
    : sc;
  return {
    audience_tags: audience,
    duration_tags: duration,
    mobility_tags: ["walking", "easy_navigation"],
    mood_tags: mood,
    summary_card,
    reason_line:
      def.tags.some((x) => x.includes("강남")) ?
        "역 출구·테헤란로 큰 길만 기준으로 잡아도 길 잃기 어렵습니다. 카페는 웨이팅·좌석 규칙부터 확인하세요."
      : "광장·랜드마크 기준으로 방향을 잡고, 화장실·물·횡단은 짧게 끊습니다. 당일 펜스·행사는 현장 표지가 우선입니다.",
    best_for_context: `${def.tags.slice(0, 2).join("·")} 맞춰 보실 분`,
  };
}

function enhanceRouteSpots(journey: RouteJourney): RouteJourney {
  // Structured next_move_* fields now carry movement info; no need to append body text.
  // Just ensure spots are returned as-is.
  return { ...journey, spots: journey.spots };
}

function mergeSampleBody(def: SampleDef, route_journey: RouteJourney | undefined, authorName: string): string {
  if (def.withRoute && route_journey) {
    return routeArticleShell({
      forWho: sampleForWhoLine(def),
      routeSummary: formatRouteSummaryMeta(route_journey.metadata),
      beforeYouGo:
        "행사 날 펜스는 표지 먼저 보세요. 지도보다 현장 표지가 맞습니다. 킥보드 차로는 횡단할 때만 보면 됩니다. 길 한가운데서 사진 찍으면 뒤에서 밀려옵니다. 건물 홈 쪽으로 빠지세요.",
      introBody: def.body,
      spotGuideLine: `카드 ${route_journey.spots.length}곳 — 스팟마다 할 것이 다릅니다. 전부 읽기보다 카드만 훑어도 흐름이 잡힙니다.`,
      closing: "비 오거나 줄 길면 테이크아웃이나 담장만 걸어도 됩니다. 억지로 다 채우면 지칩니다.",
      guardianLine: `${authorName}: 동행 속도가 다르면 ‘화장실 하나만’ 맞추고 출발하세요.`,
    });
  }
  const paras = def.body
    .split(/\n\s*\n+/)
    .map((x) => x.trim())
    .filter(Boolean);
  const tips =
    paras.length >= 3
      ? paras.slice(0, 5)
      : [def.summary, ...paras, def.body].map((x) => x.trim()).filter(Boolean).slice(0, 5);
  while (tips.length < 3) {
    tips.push("결정 하나를 줄이면 하루 피로도가 확 줄어듭니다.");
  }
  return practicalArticleShell({
    situation: def.tags.some((x) => x.includes("강남"))
      ? "강남·역세권에서 길·카페·만남이 겹칠 때"
      : "광화문·도심에서 이동·촬영·휴게가 한꺼번에 겹칠 때",
    conclusion: def.summary,
    coreTips: tips,
    checklist: [
      "큰 길·랜드마크 기준으로 위치를 설명했는가",
      "물·그늘·화장실 중 급한 것을 먼저 채웠는가",
      "통행 중 잠깐 멈춰 주변을 한 번 확인했는가",
    ],
    fieldTips: paras[0] ?? def.summary,
    mistakes: "표지판을 지나치거나 스마트폰만 보다 보면 방향이 흔들립니다. 짧게 멈춰 한 번에 확인하세요.",
    summary: `${def.title} — ${def.summary}`.slice(0, 160),
    guardianLine: `${authorName}: ‘한 번에 하나’만 고르면 됩니다.`,
  });
}

function buildSampleStructured(
  def: SampleDef,
  route_journey: RouteJourney | undefined,
  authorName: string,
): PostStructuredContentV1 {
  if (def.withRoute && route_journey) {
    const spotGuideLine = `아래 카드 ${route_journey.spots.length}곳 — 스팟별로 준비·이동·휴식·사진·종착 톤을 나눴습니다.`;
    const exposure = structuredFromSample(def, route_journey);
    return {
      version: POST_STRUCTURED_CONTENT_VERSION,
      template: "route_post",
      data: {
        intro: sampleForWhoLine(def),
        route_summary: formatRouteSummaryMeta(route_journey.metadata),
        route_best_for: exposure.best_for_context,
        route_notes:
          "매표 줄·휴무는 당일 공지가 기준입니다. 걸으면서 사진을 오래 잡으면 뒤에 사람이 쌓입니다. 짧게 찍고 빠지세요. 킥보드 차로 침범 구간은 횡단할 때만 주의하면 됩니다.",
        narrative: `${def.body.trim()}\n\n${spotGuideLine}`.trim(),
        closing: "비 오거나 줄 길면 테이크아웃이나 담장만 걸어도 됩니다. 억지로 다 채우면 지칩니다.",
        guardian_signature: `${authorName}: 속도가 안 맞으면 화장실 하나만 먼저 맞추고 출발하세요.`,
        spots: [],
      },
    };
  }
  const paras = def.body
    .split(/\n\s*\n+/)
    .map((x) => x.trim())
    .filter(Boolean);
  const tipSource =
    paras.length >= 3
      ? paras.slice(0, 5)
      : [def.summary, ...paras, def.body].map((x) => x.trim()).filter(Boolean).slice(0, 5);
  const tipArr = [...tipSource];
  while (tipArr.length < 3) {
    tipArr.push("결정 하나를 줄이면 하루 피로도가 확 줄어듭니다.");
  }
  const checklist = [
    "큰 길·랜드마크 기준으로 위치를 설명했는가",
    "물·그늘·화장실 중 급한 것을 먼저 채웠는가",
    "통행 중 잠깐 멈춰 주변을 한 번 확인했는가",
  ];
  return {
    version: POST_STRUCTURED_CONTENT_VERSION,
    template: "practical_tip_post",
    data: {
      context: def.tags.some((x) => x.includes("강남"))
        ? "강남·역세권에서 길·카페·만남이 겹칠 때"
        : "광화문·도심에서 이동·촬영·휴게가 한꺼번에 겹칠 때",
      one_line_conclusion: def.summary,
      tip_blocks: tipArr.slice(0, 5).map((primary) => ({ primary })),
      checklist,
      field_tips: paras[0] ?? def.summary,
      mistakes_notes: "표지판을 지나치거나 스마트폰만 보다 보면 방향이 흔들립니다. 짧게 멈춰 한 번에 확인하세요.",
      final_summary: `${def.title} — ${def.summary}`.slice(0, 160),
      guardian_signature: `${authorName}: ‘한 번에 하나’만 고르면 됩니다.`,
    },
  };
}

/** 33개 — 짝수 인덱스 포스트(정렬 후)에 순서대로 적용 */
const SAMPLE_DEFINITIONS: SampleDef[] = [
  { withRoute: true, journey: journeyGwanghwamunClassic, title: "광화문 반나절 — 광장에서 경복궁까지 천천히", summary: "광장에서 방향·화장실만 정리하고 이순신·세종·광화문까지 도보. 입장은 줄 보고.", body: "만남은 광장이 제일 설명 쉬움.\n사진은 동상 옆·담장 대각선만 짧게. 경복궁은 매표 줄 길면 담장만 보고 빠지는 것도 현실적 선택.", tags: ["광화문권", "도보", "첫방문", "경복궁"], category_slug: "hot-places", kind: "hot_place", post_format: "route", route_highlights: ["광장에서 북·남 방향만 먼저", "세종이야기=화장실·물", "궁 입장 vs 담장만 결정"], hero_subject: "mixed" },
  { withRoute: true, journey: journeyGangnamWalk, title: "강남 — 카페·테헤란로·골목 도보", summary: "11번 출구→카페→큰 길→골목→야간 테헤란로. 웨이팅 길면 테이크아웃만 해도 됨.", body: "테헤란로는 퇴근 시간 인파 많음—큰 길 붙어 걷기.\n골목 카페는 노키즈·노노트북 표지 확인. 야간은 킥보드 차로만 조심.", tags: ["강남역권", "K-무드", "카페", "도보", "오후"], category_slug: "food", kind: "food", post_format: "hybrid", route_highlights: ["11번 출구 기준 잡기", "테헤란로는 횡단·킥보드", "야경은 짧게 찍고 역으로"] },
  { withRoute: true, journey: journeyGwangShort, title: "랜드마크 도보 — 광화문 삼각 루프 50분", summary: "교보빌딩→광장→담장만. 입장 안 해도 기와선 사진 가능.", body: "시간 없으면 스팟마다 사진 욕심 줄이고 방향·그늘만 챙기면 50분 안에 돕니다.", tags: ["광화문권", "사진", "짧은코스"], category_slug: "hot-places", kind: "hot_place", post_format: "route", route_highlights: ["교차로는 보도 안쪽", "광장은 벤치·그늘 우선", "담장은 자전거 겹침 구간 주의"] },
  { withRoute: true, journey: journeyGangnamWalk, title: "혼자 도보 — 강남역에서 테헤란로까지", summary: "혼행은 큰 길만 기억하면 됨. 창가는 햇빛·웨이팅 체크.", body: "밤에도 가로등 있는 메인으로만 다니면 방향 헷갈림 적음.\n카페 창가는 오후 서향이면 뜨거울 수 있음—겉옷·짧게 앉기.", tags: ["강남역권", "솔로", "K-무드", "야간"], category_slug: "local-tips", kind: "local_tip", post_format: "route", route_highlights: ["역→큰 길 우선", "골목 들어가기 전 지도 한 번", "야간 이어폰 소리 줄이기"] },
  { withRoute: true, journey: journeyGwanghwamunClassic, title: "사진 위주 광화문 루트", summary: "동상=기준점, 광장=넓이, 광화문=줄·각도. 삼각대는 통행 안 되는 곳만.", body: "인물은 배경 단순할 때만. 풍경은 대각선 담장이 사람 덜 붙음.", tags: ["광화문권", "사진", "풍경"], category_slug: "local-tips", kind: "local_tip", post_format: "hybrid", route_highlights: ["동상 앞은 ‘궁 쪽’으로 설명", "광장 중앙보다 측면", "입장 줄 길면 담장만"] },
  { withRoute: true, journey: journeyGangnamWalk, title: "강남 카페 2곳 — 밝은 실내→조용한 층", summary: "첫 매장은 줄·메뉴판 보고, 둘째는 콘센트·화장실 여부만 확인.", body: "같은 날 카페 두 번이면 카페인·물 분량만 조절—두 번째는 디카페인이 나을 때 많음.", tags: ["강남역권", "카페", "감성"], category_slug: "food", kind: "food", post_format: "route" },
  { withRoute: true, journey: journeyGwangShort, title: "서울 첫날 오전 — 광화문만", summary: "입국 직후 무리한 이동 말고 광장·담장만으로 오리엔테이션.", body: "짐 있으면 광장 한 바퀴만 잡아도 체력 아낌. 궁 입장은 줄 보고 그날 결정.", tags: ["광화문권", "첫날", "오전"], category_slug: "practical", kind: "practical", post_format: "route" },
  { withRoute: true, journey: journeyGangnamWalk, title: "강남 1시간 압축 — 카페·테헤란로", summary: "쇼핑몰 말고 길만 걸어도 역삼 방향 감 잡힘.", body: "한 시간이면 카페 줄에서 시간 다 갈 수 있음—테이크아웃으로 타협 각오.", tags: ["강남역권", "짧은코스", "K-무드", "카페"], category_slug: "hot-places", kind: "hot_place", post_format: "route" },
  { withRoute: true, journey: journeyGwanghwamunClassic, title: "경복궁 들어가기 전 광장 체크", summary: "화장실·물·그늘을 광장에서 끝내고 궁 안 들어가기.", body: "궁 안은 나오기까지 길 수 있음—화장실 타이밍이 실패하면 불편함 큼.", tags: ["광화문권", "준비", "경복궁"], category_slug: "practical", kind: "practical", post_format: "hybrid" },
  { withRoute: true, journey: journeyGangnamWalk, title: "강남 오후 — 실내 샷 vs 거리 샷", summary: "실내 조명이랑 거리 노출이 다름—같은 필터로 맞추려면 실패함.", body: "차라리 색 맞추지 말고 대비만 노리는 게 피드 정리에 빠름.", tags: ["강남역권", "사진", "카페"], category_slug: "local-tips", kind: "local_tip", post_format: "route" },
  { withRoute: true, journey: journeyGwangShort, title: "광화문 만남 — 세종상까지 직선", summary: "동상 이름으로만 말하면 위치 안 맞을 때 많음—‘궁 보이는 쪽’ 추가.", body: "동행 늦으면 동상 발치보다 광장 입구 펜스 근처가 찾기 쉬움.", tags: ["광화문권", "세종로", "만남"], category_slug: "local-tips", kind: "local_tip", post_format: "route" },
  { withRoute: true, journey: journeyGangnamWalk, title: "강남 식사·카페 도보", summary: "배고프면 골목만 짧게—복귀는 테헤란로 큰 길.", body: "지도 핀과 실제 입구 어긋나는 경우 많음—건물 번지까지 확인.", tags: ["강남역권", "식사", "도보"], category_slug: "food", kind: "food", post_format: "route" },
  { withRoute: true, journey: journeyGwanghwamunClassic, title: "광화문 랜드마크 일직선 — 이순신·세종·경복궁", summary: "스팟마다 3분 넘기면 뒤 일정 다 밀림.", body: "사진·영상 욕심 줄이고 이동 시간부터 역산.", tags: ["광화문권", "이순신", "세종대왕", "경복궁"], category_slug: "hot-places", kind: "hot_place", post_format: "route", recommended_boost: 8 },
  { withRoute: true, journey: journeyGwangShort, title: "반나절 산책 — 광장·담장", summary: "언덕 거의 없음—운동화만 확실히.", body: "햇빛 강한 날 모자 없으면 광장 중앙에서 지침.", tags: ["광화문권", "산책", "가벼운코스"], category_slug: "hot-places", kind: "hot_place", post_format: "route" },
  { withRoute: true, journey: journeyGangnamWalk, title: "강남 야간 — 네온·카페 실내", summary: "밤엔 노출 흔들림 많음—연속 촬영이 장노출보다 낫.", body: "이어폰 줄이고 횡단만 집중—킥보드 차로 침범 금지 페인트 확인.", tags: ["강남역권", "야경", "카페"], category_slug: "hot-places", kind: "hot_place", post_format: "hybrid" },
  { withRoute: true, journey: journeyGwanghwamunClassic, title: "첫 서울 최소 코스 — 광화문", summary: "지하철·버스 환승 기준점 잡기 좋은 한 블록.", body: "다음 날 다른 동네 가기 전 오늘은 방향 감만 익히면 됨.", tags: ["광화문권", "첫방문", "추천"], category_slug: "local-tips", kind: "local_tip", post_format: "route" },
  { withRoute: true, journey: journeyGangnamWalk, title: "테헤란로 카페 — 창가·2층", summary: "2층이면 거리 한눈에 들어옴—다만 계단·웨이팅 추가.", body: "오후 서향 창가는 뜨거움—음료 얼음량만 조절해도 체감 좋아짐.", tags: ["강남역권", "테헤란로", "카페"], category_slug: "food", kind: "food", post_format: "route" },
  { withRoute: false, title: "광화문에서 시작하는 첫 하루 — 무리하지 않는 기준", summary: "반나절이면 광장+담장 정도만 잡아도 됨. 궁은 줄 보고.", body: "첫날은 이동 거리보다 화장실·물·그늘부터.\n광화문은 표지판 밀도 높아서 길 물어보기 수월한 편.", tags: ["광화문권", "첫날", "팁"], category_slug: "practical", kind: "practical" },
  { withRoute: false, title: "경복궁 앞에서 사진·예절", summary: "통행 먼저. 삼각대는 낮게·짧게.", body: "셀카봉은 뒤 사람 얼굴 안 들어오게 각도만 조절.\n담장 길은 자전거 도로 겹침 구간 있음.", tags: ["광화문권", "사진", "예절"], category_slug: "local-tips", kind: "local_tip" },
  { withRoute: false, title: "강남역 길 잃지 않기", summary: "큰 길 하나 + 랜드마크 빌딩 하나만.", body: "지하 오래 돌면 일단 지상으로—역 번출구부터 다시 맞추기.\n카페는 핀만 보지 말고 번지까지.", tags: ["강남역권", "길찾기", "팁"], category_slug: "practical", kind: "practical", hero_subject: "place" },
  { withRoute: false, title: "광화문광장 바람 셀 때", summary: "모자·가방 끈부터—날리면 뒤 사람 신경.", body: "바람 부는 날 광장 중앙 서 있으면 추워지기 빠름.\n실내 들어가기 전 우산 물기만 털어도 실내 반응 좋아짐.", tags: ["광화문권", "날씨", "광장"], category_slug: "local-tips", kind: "local_tip" },
  { withRoute: false, title: "강남 카페 — 밖에서 분위기 보고 들어가기", summary: "유리 너머 좌석 보이면 대기 길이 대략 감 잡힘.", body: "실내 조명 색 다른 매장 많음—사진 목적이면 입구에서 한 번 보고 결정.", tags: ["강남역권", "카페", "인테리어"], category_slug: "food", kind: "food" },
  { withRoute: false, title: "이순신상 앞 만남", summary: "‘동상 앞’ 말고 ‘궁 보이는 쪽 동상 발치’까지 붙이기.", body: "행사 날은 펜스만 바뀌어도 만남 장소가 달라짐—당일 표지 한 번.", tags: ["광화문권", "만남", "이순신"], category_slug: "practical", kind: "practical", hero_subject: "person" },
  { withRoute: false, title: "강남역 카페 한 곳만", summary: "메뉴는 단순·자리는 창가 vs 구석 하나만.", body: "한 번에 주문하면 줄 두 번 안 섬.\n혼자 코너·대화 소파만 정하면 실패 적음.", tags: ["강남역권", "카페", "솔로"], category_slug: "food", kind: "food" },
  { withRoute: false, title: "세종상·광장 산책", summary: "한 바퀴 말고 ‘저 벤치까지’만 목표.", body: "벤치는 그늘 있는 쪽이 여름에 유리.\n음수대 줄 길면 편의점이 빠를 때 있음.", tags: ["광화문권", "세종로", "산책"], category_slug: "hot-places", kind: "hot_place" },
  { withRoute: false, title: "강남 거리 30분만", summary: "살 거리 없이 테헤란로 속도만 보는 용도.", body: "이어폰 줄이고 횡단만 집중—킥보드 차로 유지.", tags: ["강남역권", "분위기", "도보"], category_slug: "local-tips", kind: "local_tip" },
  { withRoute: false, title: "광화문→경복궁 버퍼", summary: "늦을 각오면 광장에 20분 여유 먼저 잡기.", body: "궁 줄 길면 담장 산책으로 대체—입장 못 해도 오늘 계획은 그대로 씁니다.", tags: ["광화문권", "경복궁", "여유"], category_slug: "local-tips", kind: "local_tip" },
  { withRoute: false, title: "강남 실내 15분 쉼", summary: "밖 붐비면 몰·카페로만 들어가도 체력 회복.", body: "냉방 세면 겉옷 챙기기.\n물은 나눠 마시기—한 번에 많이 마시면 또 찾게 됨.", tags: ["강남역권", "휴식", "실내"], category_slug: "practical", kind: "practical" },
  { withRoute: false, title: "광화문 사진 — 붐벌 때", summary: "멀리서 찍기—통행 안 막는 거리 유지.", body: "연속 촬영으로 고르고 길 한복판에서는 멈추지 않기.", tags: ["광화문권", "사진", "혼잡"], category_slug: "local-tips", kind: "local_tip" },
  { withRoute: false, title: "테헤란로 카페 창가 햇빛", summary: "오후 서향은 음료 얼음만 줄여도 체감 좋아짐.", body: "창가 노출 낮추면 거리만 살아남—피부톤은 후보정이 빠름.", tags: ["강남역권", "카페", "오후"], category_slug: "food", kind: "food" },
  { withRoute: false, title: "서울 첫 방문 — 광화문 기준점", summary: "교통·편의점·표지판 밀도 균형.", body: "북촌·인사동 가기 전에 여기서 방향 감만 익히면 이후 덜 헤맴.", tags: ["광화문권", "첫방문", "오리엔테이션"], category_slug: "practical", kind: "practical" },
  { withRoute: false, title: "강남역 짧은 약속 장소", summary: "10·11번 출구 + 큰 길만 말하면 재집결 빠름.", body: "약속 바뀌어도 큰 길 기준으로만 문자하면 서로 덜 헤맴.", tags: ["강남역권", "만남", "약속"], category_slug: "practical", kind: "practical" },
  { withRoute: false, title: "광화문·경복궁 사이 보행", summary: "촬영·킥보드·보행 동시에 보기.", body: "좁은 데선 가방 앞으로—옆 사람 안 밀치게.", tags: ["광화문권", "매너", "보행"], category_slug: "local-tips", kind: "local_tip" },
];

function mergeSample(base: ContentPost, def: SampleDef): ContentPost {
  const bucket = visualBucketForSample(def);
  const cover_image_url = demoPickLocal(bucket, hashStringToInt(`${base.id}:${def.title}`));

  let route_journey = def.withRoute && def.journey ? def.journey(base.id) : undefined;
  if (route_journey) {
    route_journey = enhanceRouteSpots(route_journey);
    route_journey = {
      ...route_journey,
      structured_exposure_meta: structuredFromSample(def, route_journey),
    };
  }

  const post_format = def.withRoute ? (def.post_format ?? "route") : "article";
  const body = mergeSampleBody(def, route_journey, base.author_display_name);
  const structured_content = buildSampleStructured(def, route_journey, base.author_display_name);

  return {
    ...base,
    title: def.title,
    summary: def.summary,
    body,
    structured_content,
    tags: def.tags,
    category_slug: def.category_slug,
    kind: def.kind,
    cover_image_url,
    post_format,
    route_journey,
    route_highlights: def.route_highlights,
    hero_subject: def.hero_subject !== undefined ? def.hero_subject : base.hero_subject,
    recommended_score: Math.min(99, base.recommended_score + (def.recommended_boost ?? 8)),
    popular_score: Math.min(99, base.popular_score + 4),
    is_sample: true,
    has_route: Boolean(route_journey),
  };
}

/**
 * 시드 포스트(id 오름차순) 중 짝수 인덱스(0-based)만 서비스 소개용 샘플로 덮어씁니다.
 * 나머지는 `is_sample: false` 로 유지되어 실제 시드 톤과 섞입니다.
 */
export function applyServiceSampleOverlay(posts: ContentPost[]): ContentPost[] {
  const sorted = [...posts].sort((a, b) => a.id.localeCompare(b.id));
  let defIdx = 0;
  return sorted.map((p, i) => {
    if (i % 2 !== 0) {
      return {
        ...p,
        is_sample: false,
        has_route: postHasRouteJourney(p),
      };
    }
    const def = SAMPLE_DEFINITIONS[defIdx];
    if (!def) {
      return { ...p, is_sample: false, has_route: postHasRouteJourney(p) };
    }
    defIdx += 1;
    return mergeSample(p, def);
  });
}
