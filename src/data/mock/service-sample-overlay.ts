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

function spot(
  postId: string,
  order: number,
  partial: Omit<RouteSpot, "id" | "order" | "lat" | "lng"> & { lat: number; lng: number },
): RouteSpot {
  return {
    id: `${postId}-s${order}`,
    order,
    lat: partial.lat,
    lng: partial.lng,
    title: partial.title,
    place_name: partial.place_name,
    address_line: partial.address_line,
    short_description: partial.short_description,
    body: partial.body,
    image_urls: partial.image_urls,
    recommend_reason: partial.recommend_reason,
    stay_duration_minutes: partial.stay_duration_minutes,
    photo_tip: partial.photo_tip,
    caution: partial.caution,
    featured: partial.featured,
    next_move_minutes: partial.next_move_minutes,
    next_move_distance_m: partial.next_move_distance_m,
    next_move_mode: partial.next_move_mode,
    theme_reason: partial.theme_reason,
    what_to_do: partial.what_to_do,
    image_alt: partial.image_alt,
  };
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
      address_line: "서울 종로구 세종대로 172",
      short_description: "서울 도심의 기준점이 되는 넓은 광장에서 이동 방향을 잡습니다.",
      body: "광화문광장은 조선 시대 핵심 도로였던 육조거리 자리에 조성된 광장입니다. 이순신장군상과 세종대왕상이 나란히 서 있어 방향 잡기가 쉽습니다. 첫 서울이라면 사진보다 먼저 ‘어느 쪽이 궁궐인지’만 짚고 가면 이후 동선이 편합니다.",
      image_urls: localPair(postId, "gwanghwamun", 30),
      recommend_reason: "드라마·다큐에서 자주 등장하는 광화문광장의 실제 스케일을 처음 느끼기 좋은 시작 지점입니다. 안내 표지판이 명확해 길 잃기 어렵습니다.",
      stay_duration_minutes: 20,
      photo_tip: "광장 중앙보다 건물 실루엣이 보이는 측면에서 찍으면 실루엣이 깔끔합니다. 아침 안개가 있는 날에는 동상과 궁궐 배경이 분위기 있게 나옵니다.",
      caution: "행사 기간에는 통제 구간이 생길 수 있어 현장 안내를 확인하세요. 바람이 강한 날에는 모자를 챙기세요.",
      featured: true,
      theme_reason: "조선 500년 역사의 중심이었던 자리에 서울 현대 도심이 겹쳐 있습니다. 한국 역사와 현대가 공존하는 특유의 풍경을 느낄 수 있습니다.",
      what_to_do: "광장 중앙에서 이순신상과 세종대왕상 위치를 확인하고, 경복궁 방향으로 오늘의 이동 동선을 머릿속으로 그려보세요.",
      image_alt: "광화문광장 전경과 이순신장군상, 배경의 경복궁 방향",
      next_move_minutes: 3,
      next_move_distance_m: 200,
      next_move_mode: "walk",
    }),
    spot(postId, 2, {
      lat: 37.57552,
      lng: 126.97715,
      title: "이순신장군상 앞 — 랜드마크 샷",
      place_name: "이순신장군 동상",
      address_line: "광화문광장 내",
      short_description: "광장의 상징적 랜드마크에서 대표 사진을 남깁니다.",
      body: "광화문광장의 기준점이 되는 랜드마크입니다. 사람이 몰릴 때는 동상 기준으로 ‘앞/뒤’를 정하면 길 설명이 쉬워집니다. 뒤편 고층 빌딩과 역사적 동상이 함께 담기면 서울 특유의 시간 겹침이 사진에 살아납니다.",
      image_urls: localPair(postId, "gwanghwamun", 51),
      recommend_reason: "서울의 대표 랜드마크로 방문 인증 사진을 남기기 좋습니다. 동상 뒤로 보이는 도심 빌딩과의 대비가 인상적입니다.",
      stay_duration_minutes: 15,
      photo_tip: "동상과 뒤편 고층 빌딩이 함께 들어오면 ‘도심 속 역사’ 느낌이 납니다. 인물 사진은 동상의 발 부분을 기준점으로 두면 스케일이 잘 나옵니다.",
      caution: "통행량이 많은 시간대엔 가방을 앞으로 두는 편이 안전합니다.",
      theme_reason: "수백 년 역사의 동상과 현대 서울 스카이라인이 한 프레임에 담기는 광화문만의 독특한 시각적 장면입니다.",
      what_to_do: "동상을 배경으로 사진을 남기세요. 주변 안내판을 확인해 세종대왕상 방향과 경복궁 방향을 파악해 두면 다음 이동이 수월합니다.",
      image_alt: "광화문광장 이순신장군 동상과 배경의 서울 빌딩 스카이라인",
      next_move_minutes: 4,
      next_move_distance_m: 280,
      next_move_mode: "walk",
    }),
    spot(postId, 3, {
      lat: 37.57245,
      lng: 126.97695,
      title: "세종대왕상 — 광장 중심 산책",
      place_name: "세종대왕 동상",
      address_line: "광화문광장 내 (세종대로)",
      short_description: "한글 창제의 세종대왕상을 보며 광장 산책을 즐깁니다.",
      body: "한글 창제로 잘 알려진 세종대왕의 동상이 있습니다. 동상 주변으로 한글 관련 전시가 있어 간단히 살펴볼 수 있습니다. 그늘 구간을 골라 천천히 걸으면 다음 코스인 경복궁까지 호흡이 안정됩니다.",
      image_urls: localPair(postId, "gwanghwamun", 72),
      recommend_reason: "이순신장군상과 함께 광화문광장의 두 번째 주요 랜드마크입니다. 사진·휴식을 나누기 좋은 위치입니다.",
      stay_duration_minutes: 15,
      photo_tip: "저녁 전후 조명이 바뀌면 분위기가 달라집니다. 동상 아래에서 올려다보는 각도가 스케일을 잘 표현합니다.",
      caution: "횡단은 신호 확인 후, 스마트폰 보행은 피하세요.",
      theme_reason: "한글을 창제한 세종대왕을 기리는 장소로, 한국 역사와 문화의 상징성을 직접 느낄 수 있습니다.",
      what_to_do: "동상 주변을 한 바퀴 둘러보고 아래쪽 세종이야기 지하 전시 입구를 확인해 보세요. 관심 있으면 무료 입장해 한글·역사 전시를 짧게 둘러볼 수 있습니다.",
      image_alt: "광화문광장 세종대왕 동상 전경과 주변 광장 분위기",
      next_move_minutes: 7,
      next_move_distance_m: 550,
      next_move_mode: "walk",
    }),
    spot(postId, 4, {
      lat: 37.57915,
      lng: 126.97685,
      title: "경복궁 광화문 — 궁궐 정문",
      place_name: "경복궁 광화문",
      address_line: "서울 종로구 사직로 161",
      short_description: "조선의 법궁 경복궁의 정문에서 반나절 코스를 마무리합니다.",
      body: "1395년에 창건된 경복궁의 정문인 광화문입니다. 입장 전 매표·가방 규정을 확인하고, 반나절 코스라면 ‘궁 안’과 ‘광장’ 중 하나에만 집중하는 편이 여유롭습니다. 수문장 교대식 시간에 맞추면 전통 의식도 볼 수 있습니다.",
      image_urls: localPair(postId, "gwanghwamun", 93),
      recommend_reason: "첫 방문자에게 한복과 궁궐을 한 번에 경험할 수 있는 최적의 종착점입니다. 한국 역사 드라마의 주요 배경지이기도 합니다.",
      stay_duration_minutes: 40,
      photo_tip: "광화문 성문을 정면에서 담을 때는 사람이 많지 않은 이른 오전이 유리합니다. 울타리 라인을 살짝 비스듬히 잡으면 인파가 덜 들어옵니다.",
      caution: "입장 마감·휴무일은 사전에 공식 홈페이지에서 확인하세요. 무더운 날에는 궁 안에서 그늘 쉬는 공간을 미리 파악해 두세요.",
      featured: true,
      theme_reason: "수많은 한국 역사 드라마의 촬영 배경이 된 조선의 법궁입니다. 실제로 보면 영상으로 보던 것보다 훨씬 웅장합니다.",
      what_to_do: "광화문 성문 앞에서 사진을 남기고, 수문장 교대식 일정을 확인해보세요. 시간 여유가 있으면 입장해 근정전까지 걸어보세요.",
      image_alt: "경복궁 광화문 정문 전경과 수문장",
    }),
  ];
  return { metadata: { ...metaEasy, estimated_total_duration_minutes: 90, estimated_total_distance_km: 2.1 }, spots, path: densifyPath(pts) };
}

/** 강남역 인근 도보 — K-무드 카페 두 곳과 테헤란로 거리 */
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
      address_line: "서울 강남구 테헤란로 4길 10",
      short_description: "강남역 11번 출구에서 도보 1분, 오늘 동선의 시작점입니다.",
      body: "오픈형 공간과 통유리 파사드 덕분에 강남 도심의 K-콘텐츠 무드를 자연스럽게 느끼기 좋습니다. 커피 한 잔으로 오늘 이동 순서를 정리하고 출발하세요.",
      image_urls: localPair(postId, "gangnam", 40),
      recommend_reason: "드라마 속 강남 카페 분위기가 실제로 느껴지는 출발점입니다. 창가에서 거리 풍경을 보며 하루 흐름을 잡기 좋습니다.",
      stay_duration_minutes: 20,
      photo_tip: "입구 쪽 통유리와 강남 빌딩 라인을 함께 담으면 K-드라마 도심 무드가 살아납니다. 창가 좌석 우측 각도를 노려보세요.",
      caution: "주말 오후는 웨이팅이 있을 수 있습니다. 퇴근 시간대엔 유동 인구가 많으니 짐을 앞으로 두세요.",
      featured: true,
      theme_reason: "국내외 콘텐츠에서 자주 등장하는 강남 카페 분위기를 실제로 경험할 수 있는 시작 스팟입니다.",
      what_to_do: "커피를 주문하고 창가 자리에서 강남 거리 풍경을 5분만 바라보세요. 오늘 동선의 나머지 스팟 이름을 메모해 두면 이동이 훨씬 편합니다.",
      image_alt: "블루보틀 강남점 통유리 파사드와 강남 빌딩이 보이는 창가 분위기",
      next_move_minutes: 6,
      next_move_distance_m: 450,
      next_move_mode: "walk",
    }),
    spot(postId, 2, {
      lat: 37.4992,
      lng: 127.0294,
      title: "테헤란로 거리 포인트",
      place_name: "강남역~역삼역 테헤란로 보행로",
      address_line: "서울 강남구 테헤란로 일대",
      short_description: "강남을 가로지르는 테헤란로의 도심 분위기를 가볍게 담습니다.",
      body: "오피스 타워와 세련된 가게들이 늘어선 테헤란로는 서울 도심의 역동적인 무드를 한눈에 느끼기 좋은 거리입니다. 횡단보도 대기선에서 거리 원근감을 살린 사진 한 장을 남겨보세요.",
      image_urls: localPair(postId, "gangnam", 61),
      recommend_reason: "드라마·뮤직비디오에서 자주 나오는 강남 도심 거리 느낌을 실제로 걸으며 경험할 수 있는 구간입니다.",
      stay_duration_minutes: 15,
      photo_tip: "횡단보도 대기선 쪽에서 빌딩 라인과 함께 담으면 도심 원근감이 잘 살아납니다. 저녁에는 빌딩 조명이 더해져 분위기가 달라집니다.",
      caution: "보행 중 스마트폰 조작보다 잠깐 멈춰 찍는 편이 안전하고 사진도 더 잘 나옵니다.",
      theme_reason: "K-드라마와 뮤직비디오에서 배경으로 자주 쓰이는 강남 도심 거리의 실제 분위기를 걷는 구간입니다.",
      what_to_do: "천천히 걸으면서 빌딩 사이 하늘과 거리 흐름을 바라보세요. 사진은 횡단보도 앞이나 카페 앞 공간을 활용하면 자연스럽습니다.",
      image_alt: "테헤란로 보행로에서 바라본 강남 오피스 빌딩과 거리 풍경",
      next_move_minutes: 7,
      next_move_distance_m: 520,
      next_move_mode: "walk",
    }),
    spot(postId, 3, {
      lat: 37.5006,
      lng: 127.0335,
      title: "역삼동 골목 로컬 카페",
      place_name: "언주로 카페거리 (역삼동 골목)",
      address_line: "서울 강남구 언주로 일대",
      short_description: "테헤란로 한 블록 안쪽, 조용하고 로컬 감성의 카페를 찾습니다.",
      body: "메인 거리에서 한 블록만 들어오면 분위기가 크게 달라집니다. 한국 로컬 감성의 소규모 카페들이 모여 있어 관광지 느낌 없이 강남의 일상적인 K-카페 무드를 즐기기 좋습니다.",
      image_urls: localPair(postId, "gangnam", 82),
      recommend_reason: "화려한 강남 메인 거리와는 다른, 조용하고 현지인스러운 카페 분위기가 특징입니다. 혼자 쉬거나 대화하기 좋습니다.",
      stay_duration_minutes: 30,
      photo_tip: "2층 카페라면 난간이나 창문에서 골목 아래를 내려다보는 구도가 안정적입니다. 조명이 따뜻한 매장은 저녁에 더 분위기 있습니다.",
      caution: "골목 카페는 혼잡도가 낮아 대화하기 좋지만, 콘센트·와이파이 여부는 매장마다 다릅니다.",
      theme_reason: "한국 드라마·예능에서 자주 나오는 골목 로컬 카페 분위기를 실제로 경험할 수 있습니다. 관광지보다 현지인의 일상에 가까운 공간입니다.",
      what_to_do: "음료 한 잔을 주문하고 느긋하게 30분을 보내세요. 창가나 2층 자리에서 골목 풍경을 바라보는 것만으로도 충분합니다.",
      image_alt: "역삼동 골목 로컬 카페 외관과 한적한 골목 풍경",
      next_move_minutes: 8,
      next_move_distance_m: 600,
      next_move_mode: "walk",
    }),
    spot(postId, 4, {
      lat: 37.5014,
      lng: 127.0363,
      title: "테헤란로 야경 마무리 포인트",
      place_name: "역삼역~선릉역 테헤란로 보행 구간",
      address_line: "서울 강남구 테헤란로 (역삼역 방면)",
      short_description: "오피스 타워 불빛과 거리 조명이 어우러진 강남의 밤을 가볍게 마무리합니다.",
      body: "낮과는 전혀 다른 조명 분위기로 변하는 테헤란로의 저녁을 즐겨보세요. 긴 빌딩 라인과 거리 조명이 만드는 장면은 강남의 야경 포인트 중 하나입니다. 사진은 짧게, 통행은 우선으로 두면 여유롭게 마무리할 수 있습니다.",
      image_urls: localPair(postId, "gangnam", 103),
      recommend_reason: "서울 강남의 야경 분위기를 별도 이동 없이 도보 동선 마지막에 자연스럽게 담을 수 있는 구간입니다.",
      stay_duration_minutes: 20,
      photo_tip: "저녁에는 긴 노출보다 연속 촬영으로 흔들림을 줄이세요. 빌딩 불빛을 배경으로 인물과 함께 찍을 때는 역광을 활용하면 드라마틱합니다.",
      caution: "야간 촬영 시 자전거·킥보드 전용 차로를 침범하지 않도록 주의하세요. 이어폰 볼륨을 낮추고 이동하세요.",
      featured: true,
      theme_reason: "K-드라마에서 많이 나오는 강남 야경 분위기를 걸으면서 직접 느낄 수 있습니다. 빌딩 조명과 도심 거리 조명이 합쳐져 특유의 무드가 만들어집니다.",
      what_to_do: "천천히 걸으며 빌딩 불빛과 거리를 사진으로 담으세요. 마무리 시간을 여유 있게 잡아 근처 지하철역에서 편하게 귀가하세요.",
      image_alt: "테헤란로 저녁 빌딩 조명과 강남 야경 분위기",
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
      address_line: "서울 종로구 종로1길 50",
      short_description: "광화문광장·이순신상·경복궁이 한눈에 들어오는 최적의 시작 지점입니다.",
      body: "광화문 교보빌딩 앞은 광화문광장의 전경이 가장 잘 보이는 지점 중 하나입니다. 10~15분만 잡고 사진과 방향 확인에 집중하세요. 광장을 마주 보고 서면 오른쪽이 경복궁, 왼쪽이 청계천 방향입니다.",
      image_urls: localPair(postId, "gwanghwamun", 110),
      recommend_reason: "짧은 일정에 ‘서울 도심’ 인상을 빠르게 가져가기 좋은 관측 지점입니다. 사진 배경으로도 깔끔합니다.",
      stay_duration_minutes: 15,
      photo_tip: "광장 쪽 개방감이 있는 각도로 이순신상과 광화문 성문을 함께 담아보세요. 저녁에는 빌딩 조명이 더해져 분위기가 달라집니다.",
      caution: "차량 통행이 잦은 교차로 인근은 보도 안쪽으로 이동하세요.",
      featured: true,
      theme_reason: "역사적 광장과 현대 도심이 공존하는 서울 중심의 풍경을 한눈에 볼 수 있는 지점입니다.",
      what_to_do: "광장 전경을 사진으로 담고 이순신상 방향을 확인하세요. 이후 광장으로 들어가 산책을 이어갑니다.",
      image_alt: "광화문 교보빌딩 앞에서 바라본 광화문광장과 이순신장군상 전경",
      next_move_minutes: 3,
      next_move_distance_m: 220,
      next_move_mode: "walk",
    }),
    spot(postId, 2, {
      lat: 37.5754,
      lng: 126.9773,
      title: "광화문광장 — 중앙 산책",
      place_name: "광화문광장",
      address_line: "서울 종로구 세종대로 172",
      short_description: "광장 중앙을 가로지르며 이순신상·세종대왕상을 가까이 봅니다.",
      body: "넓은 광화문광장을 실제로 걸어보면 사진으로 보던 것보다 훨씬 웅장하게 느껴집니다. 그늘 구간과 벤치를 기준으로 쉬어 가면서 물을 조금씩 마시면 이후 경복궁 방향 동선이 편해집니다.",
      image_urls: localPair(postId, "gwanghwamun", 131),
      recommend_reason: "가족·시니어와 속도를 맞추기 좋은 넓고 평탄한 공간입니다. 벤치와 분수대가 있어 여유롭게 쉬어가기 좋습니다.",
      stay_duration_minutes: 20,
      photo_tip: "이순신상과 함께 넓게 프레임을 잡으면 광장의 스케일이 잘 표현됩니다. 사람이 적은 구도를 찾아 잠깐 기다리면 깔끔하게 담을 수 있습니다.",
      caution: "강한 햇빛에는 모자·선크림을 권장합니다. 음수대와 화장실은 광장 지하(세종이야기)에 있습니다.",
      theme_reason: "수많은 한국 드라마와 뉴스의 배경지로 직접 걸어보면 서울 도심의 특유한 역사적 분위기를 체감할 수 있습니다.",
      what_to_do: "광장을 천천히 가로질러 세종대왕상까지 걸어보세요. 중간중간 벤치에 앉아 주변 풍경을 감상하세요.",
      image_alt: "광화문광장 산책 중 보이는 이순신장군상과 세종대왕상",
      next_move_minutes: 5,
      next_move_distance_m: 380,
      next_move_mode: "walk",
    }),
    spot(postId, 3, {
      lat: 37.5768,
      lng: 126.9782,
      title: "경복궁 담장길 — 마무리 산책",
      place_name: "경복궁 서측 담장 산책로",
      address_line: "서울 종로구 사직로 일대",
      short_description: "경복궁 담장을 따라 걸으며 짧은 코스를 마무리합니다.",
      body: "경복궁 서쪽 담장을 따라 이어진 산책로는 궁 입장 없이도 고즈넉한 분위기를 느끼기 좋습니다. 담장의 기와 라인과 현대 서울 건물이 대비를 이루며 독특한 사진 배경을 만들어 줍니다. 수문장 교대식 시간에 맞추면 전통 의식도 구경할 수 있습니다.",
      image_urls: localPair(postId, "gwanghwamun", 152),
      recommend_reason: "궁 입장 대기가 길 때 대체 만족을 주는 코스입니다. 담장 안팎의 풍경 차이를 느끼며 여유롭게 마무리할 수 있습니다.",
      stay_duration_minutes: 25,
      photo_tip: "담장 직선을 대각선 구도로 배치하면 길이감과 깊이가 살아납니다. 기와 지붕과 하늘을 함께 담으면 한국적인 분위기가 납니다.",
      caution: "담장 주변에는 자전거 도로와 보행로가 겹치는 구간이 있으니 주의하세요.",
      featured: true,
      theme_reason: "조선 시대 궁궐의 담장 풍경이 현대 서울과 맞닿아 있습니다. 입장 없이도 경복궁의 역사적 분위기를 충분히 느낄 수 있습니다.",
      what_to_do: "담장길을 따라 광화문 방면까지 천천히 걸으세요. 담장의 기와 라인과 배경을 활용한 사진을 마지막으로 남겨보세요.",
      image_alt: "경복궁 서측 담장 산책로와 기와 지붕 풍경",
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
  if (t.includes("카페") || t.includes("식사") || t.includes("먹자")) return "카페·식사 동선을 부담 없이 짜고 싶은 분";
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
  return {
    audience_tags: audience,
    duration_tags: duration,
    mobility_tags: ["walking", "easy_navigation"],
    mood_tags: mood,
    summary_card: sc,
    reason_line: "동선·휴게·주의를 한 번에 정리했습니다.",
    best_for_context: `${def.tags.slice(0, 2).join("·")}에 관심 있는 여행자에게`,
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
        "행사·통제 안내가 바뀔 수 있어 현장 표지를 한 번 확인하세요. 통행 중 장시간 정지 촬영은 피하고, 짧게 끊어 찍는 편이 전체 동선에 도움이 됩니다.",
      introBody: def.body,
      spotGuideLine: `스팟별 상세는 지도·아래 카드 ${route_journey.spots.length}곳에 정리했습니다. 각 카드에 할 일·추천 체류·다음으로 이어지는 포인트를 넣었습니다.`,
      closing: "같은 날 플랜 B를 하나만 더 준비해 두면 날씨·체력 변수에 덜 흔들립니다.",
      guardianLine: `${authorName}: 속도가 다른 동행이면 ‘여기서 2분 쉼’을 먼저 합의해 보세요.`,
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
    tips.push("작은 결정 하나를 줄여도 하루 피로도는 확 줄어듭니다.");
  }
  return practicalArticleShell({
    situation: def.tags.some((x) => x.includes("강남"))
      ? "강남·역세권에서 길·카페·만남이 겹칠 때"
      : "광화문·도심에서 동선·촬영·휴게가 겹칠 때",
    conclusion: def.summary,
    coreTips: tips,
    checklist: [
      "큰 길·랜드마크 기준으로 위치를 설명했는지",
      "물·그늘·화장실 중 급한 것을 먼저 채웠는지",
      "통행 중에는 잠깐 멈춰 주변을 한 번 확인했는지",
    ],
    fieldTips: paras[0] ?? def.summary,
    mistakes: "표지판과 횡단 타이밍을 동시에 확인하지 않으면 방향이 자주 흔들립니다.",
    summary: `${def.title} — ${def.summary}`.slice(0, 160),
    guardianLine: `${authorName}: 오늘은 ‘한 번에 하나’만 고르는 연습을 해 보세요.`,
  });
}

function buildSampleStructured(
  def: SampleDef,
  route_journey: RouteJourney | undefined,
  authorName: string,
): PostStructuredContentV1 {
  if (def.withRoute && route_journey) {
    const spotGuideLine = `스팟별 상세는 지도·아래 카드 ${route_journey.spots.length}곳에 정리했습니다. 각 카드에 할 일·추천 체류·다음으로 이어지는 포인트를 넣었습니다.`;
    const exposure = structuredFromSample(def, route_journey);
    return {
      version: POST_STRUCTURED_CONTENT_VERSION,
      template: "route_post",
      data: {
        intro: sampleForWhoLine(def),
        route_summary: formatRouteSummaryMeta(route_journey.metadata),
        route_best_for: exposure.best_for_context,
        route_notes:
          "행사·통제 안내가 바뀔 수 있어 현장 표지를 한 번 확인하세요. 통행 중 장시간 정지 촬영은 피하고, 짧게 끊어 찍는 편이 전체 동선에 도움이 됩니다.",
        narrative: `${def.body.trim()}\n\n${spotGuideLine}`.trim(),
        closing: "같은 날 플랜 B를 하나만 더 준비해 두면 날씨·체력 변수에 덜 흔들립니다.",
        guardian_signature: `${authorName}: 속도가 다른 동행이면 ‘여기서 2분 쉼’을 먼저 합의해 보세요.`,
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
    tipArr.push("작은 결정 하나를 줄여도 하루 피로도는 확 줄어듭니다.");
  }
  const checklist = [
    "큰 길·랜드마크 기준으로 위치를 설명했는지",
    "물·그늘·화장실 중 급한 것을 먼저 채웠는지",
    "통행 중에는 잠깐 멈춰 주변을 한 번 확인했는지",
  ];
  return {
    version: POST_STRUCTURED_CONTENT_VERSION,
    template: "practical_tip_post",
    data: {
      context: def.tags.some((x) => x.includes("강남"))
        ? "강남·역세권에서 길·카페·만남이 겹칠 때"
        : "광화문·도심에서 동선·촬영·휴게가 겹칠 때",
      one_line_conclusion: def.summary,
      tip_blocks: tipArr.slice(0, 5).map((primary) => ({ primary })),
      checklist,
      field_tips: paras[0] ?? def.summary,
      mistakes_notes: "표지판과 횡단 타이밍을 동시에 확인하지 않으면 방향이 자주 흔들립니다.",
      final_summary: `${def.title} — ${def.summary}`.slice(0, 160),
      guardian_signature: `${authorName}: 오늘은 ‘한 번에 하나’만 고르는 연습을 해 보세요.`,
    },
  };
}

/** 33개 — 짝수 인덱스 포스트(정렬 후)에 순서대로 적용 */
const SAMPLE_DEFINITIONS: SampleDef[] = [
  { withRoute: true, journey: journeyGwanghwamunClassic, title: "광화문 반나절 — 광장에서 경복궁까지 천천히", summary: "광화문광장·이순신·세종로를 잇는 도보 루트로 첫 서울 동선을 잡아 보세요.", body: "만남은 광장이 편하고, 사진은 짧게·통행은 우선으로 두면 반나절이 한결 가볍습니다.\n경복궁 입장 전에는 가방 규정만 한 번 확인해 두세요.", tags: ["광화문권", "도보", "첫방문", "경복궁"], category_slug: "hot-places", kind: "hot_place", post_format: "route", route_highlights: ["광장에서 방향을 잡고 출발", "랜드마크를 기준점으로 사용", "입장 전 규정만 짧게 확인"], hero_subject: "mixed" },
  { withRoute: true, journey: journeyGangnamWalk, title: "강남 K-무드 하루 — 카페와 테헤란로 거리 걷기", summary: "블루보틀에서 시작해 골목 카페를 거쳐 테헤란로 야경까지, 강남의 K-콘텐츠 분위기를 가볍게 담는 도보 코스.", body: "드라마 속에서 보던 강남 카페와 도심 거리를 직접 걸어봅니다.\n카페는 외관을 먼저 보고 들어가면 자리 파악이 쉽고, 거리 산책은 통행을 먼저 두면 여유롭습니다.", tags: ["강남역권", "K-무드", "카페", "도보", "오후"], category_slug: "food", kind: "food", post_format: "hybrid", route_highlights: ["강남역 11번 출구에서 시작", "카페 외관·실내 분위기 모두 경험", "테헤란로 야경으로 마무리"] },
  { withRoute: true, journey: journeyGwangShort, title: "랜드마크 도보 — 광화문 삼각 루프 50분", summary: "광화문·광장·궁 담장을 잇는 짧은 루프로 사진과 휴식을 나눕니다.", body: "시간이 빠듯할 때 ‘넓게’보다 ‘선명하게’ 한 장면씩 남기는 용도로 좋습니다.", tags: ["광화문권", "사진", "짧은코스"], category_slug: "hot-places", kind: "hot_place", post_format: "route", route_highlights: ["3스팟만 반복 없이 루프", "그늘·벤치를 쉼표로", "담장 라인이 사진 배경으로 안정적"] },
  { withRoute: true, journey: journeyGangnamWalk, title: "혼자 즐기는 강남 K-카페 도보", summary: "강남역에서 출발해 테헤란로까지, 혼자 이동해도 자연스러운 K-무드 카페 코스.", body: "야간에도 가로등이 있는 큰 길을 축으로 두면 방향 전환이 단순해집니다.\n창가 자리에서 강남 거리를 바라보는 시간만으로도 충분히 K-콘텐츠 분위기를 느낄 수 있습니다.", tags: ["강남역권", "솔로", "K-무드", "야간"], category_slug: "local-tips", kind: "local_tip", post_format: "route", route_highlights: ["큰 길 우선으로 이동", "창가 카페에서 거리 풍경 감상", "야경은 자연스럽게 마무리"] },
  { withRoute: true, journey: journeyGwanghwamunClassic, title: "사진 찍기 좋은 광화문 루트", summary: "광장·동상·궁궐 담장을 프레임 나누기 좋은 순서로 배치했습니다.", body: "인물 사진은 배경이 단순한 순간을 골라 찍고, 풍경은 삼각대 없이도 될 각도를 먼저 찾습니다.", tags: ["광화문권", "사진", "풍경"], category_slug: "local-tips", kind: "local_tip", post_format: "hybrid", route_highlights: ["동상은 기준점 샷", "광장은 넓게", "담장은 대각선 구도"] },
  { withRoute: true, journey: journeyGangnamWalk, title: "강남 감성 카페 코스 — 창가와 실내를 번갈아", summary: "외부 테라스 느낌이 나는 파사드와 실내 좌석을 둘 다 경험합니다.", body: "첫 카페는 밝은 실내, 둘째는 조용한 층을 고르면 피로도가 덜 쌓입니다.", tags: ["강남역권", "카페", "감성"], category_slug: "food", kind: "food", post_format: "route" },
  { withRoute: true, journey: journeyGwangShort, title: "서울 첫날 오전 — 광화문만으로도 충분한 이유", summary: "입국 직후 무리한 이동 대신 광장·궁 일대만 잡아도 체감 만족이 큽니다.", body: "짐이 있으면 반나절 코스는 광장 중심이 피로 대비 효율이 좋습니다.", tags: ["광화문권", "첫날", "오전"], category_slug: "practical", kind: "practical", post_format: "route" },
  { withRoute: true, journey: journeyGangnamWalk, title: "강남 짧은 하루 — 카페와 테헤란로 1시간", summary: "강남역에서 출발해 1시간 안팎으로 K-카페 무드와 테헤란로 거리 분위기를 가볍게 담는 코스.", body: "쇼핑몰 안보다 도보로 ‘거리의 속도감’을 느끼는 데 초점을 둡니다. 짧지만 강남의 분위기를 압축적으로 경험할 수 있습니다.", tags: ["강남역권", "짧은코스", "K-무드", "카페"], category_slug: "hot-places", kind: "hot_place", post_format: "route" },
  { withRoute: true, journey: journeyGwanghwamunClassic, title: "경복궁 가기 전 광장 체크리스트", summary: "만남·화장실·물·그늘만 정리하면 이후 동선이 매끄럽습니다.", body: "궁 안은 시간이 길어질 수 있어, 광장에서 기본 니즈를 먼저 해소하는 편이 좋습니다.", tags: ["광화문권", "준비", "경복궁"], category_slug: "practical", kind: "practical", post_format: "hybrid" },
  { withRoute: true, journey: journeyGangnamWalk, title: "강남 오후 — 카페와 거리 사진의 밸런스", summary: "카페 2스팟 + 거리 마무리로 피드 구성이 자연스럽습니다.", body: "같은 필터보다 ‘실내 따뜻함’과 ‘거리 차가움’ 대비가 기억에 남습니다.", tags: ["강남역권", "사진", "카페"], category_slug: "local-tips", kind: "local_tip", post_format: "route" },
  { withRoute: true, journey: journeyGwangShort, title: "광화문에서 세종대왕상까지 여유 루트", summary: "무리한 각도보다 ‘서 있는 위치’만 맞춰도 설명이 쉬워집니다.", body: "동행 시에는 기준점을 말로 설명하기보다 눈에 보이는 조형물 이름으로 맞춥니다.", tags: ["광화문권", "세종로", "만남"], category_slug: "local-tips", kind: "local_tip", post_format: "route" },
  { withRoute: true, journey: journeyGangnamWalk, title: "강남역 ‘먹자·카페’ 밸런스 도보", summary: "군중 속에서도 큰 길을 붙잡고 이동하면 방향이 흔들리지 않습니다.", body: "배가 고프면 골목으로 짧게 빠지되, 복귀는 다시 큰 길로 오는 패턴이 안전합니다.", tags: ["강남역권", "식사", "도보"], category_slug: "food", kind: "food", post_format: "route" },
  { withRoute: true, journey: journeyGwanghwamunClassic, title: "광화문 랜드마크 풀코스 — 이순신·세종·경복궁", summary: "요청하신 랜드마크를 한 루트에 묶었습니다.", body: "사진 포인트마다 2~3분만 쓰고 이동하면 전체 시간이 지켜집니다.", tags: ["광화문권", "이순신", "세종대왕", "경복궁"], category_slug: "hot-places", kind: "hot_place", post_format: "route", recommended_boost: 8 },
  { withRoute: true, journey: journeyGwangShort, title: "반나절 산책 — 광장 바람과 궁 담장", summary: "운동화만 준비돼 있으면 충분한 가벼운 코스입니다.", body: "언덕이 거의 없어 첫 방문자·시니어와 동행하기 무난합니다.", tags: ["광화문권", "산책", "가벼운코스"], category_slug: "hot-places", kind: "hot_place", post_format: "route" },
  { withRoute: true, journey: journeyGangnamWalk, title: "강남역 야간 분위기 — 네온과 카페 실내", summary: "밤에는 거리 밝기와 실내 조명 대비가 사진에 잘 먹습니다.", body: "야간 도보는 이어폰 볼륨을 낮추고 횡단을 한 박자 느리게 건너는 습관이 안전합니다.", tags: ["강남역권", "야경", "카페"], category_slug: "hot-places", kind: "hot_place", post_format: "hybrid" },
  { withRoute: true, journey: journeyGwanghwamunClassic, title: "첫 서울 방문자용 짧은 추천 루트", summary: "‘한 번에 서울’이 느껴지는 최소 동선입니다.", body: "다음 날 홍대·강남으로 확장하기 전 오리엔테이션으로 쓰기 좋습니다.", tags: ["광화문권", "첫방문", "추천"], category_slug: "local-tips", kind: "local_tip", post_format: "route" },
  { withRoute: true, journey: journeyGangnamWalk, title: "테헤란로 카페거리 — 창밖 풍경이 있는 자리 잡기", summary: "2층 좌석이 있으면 거리 흐름이 한눈에 들어옵니다.", body: "창가 자리는 햇빛 각도에 따라 뜨거울 수 있어 겉옷을 챙기세요.", tags: ["강남역권", "테헤란로", "카페"], category_slug: "food", kind: "food", post_format: "route" },
  { withRoute: false, title: "광화문에서 시작하는 첫 하루 — 무리하지 않는 기준", summary: "광장·궁 일대는 ‘반나절=광장+담장’ 정도만 잡아도 충분합니다.", body: "첫날은 이동 거리보다 화장실·물·그늘 같은 기본 니즈를 채우는 데 점수를 주세요.\n광화문권은 표지판이 또렷한 편이라 길 물어보기도 수월합니다.", tags: ["광화문권", "첫날", "팁"], category_slug: "practical", kind: "practical" },
  { withRoute: false, title: "경복궁 앞에서 사진·예절을 동시에", summary: "촬영은 짧게, 통행과 주민·관광객 흐름을 먼저 봅니다.", body: "삼각대·셀카봉은 주변 동선을 가리지 않게 낮은 높이를 권합니다.\n담장 따라 걸을 때는 자전거 도로 표시를 함께 확인하세요.", tags: ["광화문권", "사진", "예절"], category_slug: "local-tips", kind: "local_tip" },
  { withRoute: false, title: "강남역에서 길 잃지 않는 습관", summary: "‘큰 길 + 랜드마크 빌딩’ 두 개만 기억해도 충분합니다.", body: "지하를 오래 돌다 지치면 일단 지상으로 올라와 방향을 다시 잡는 편이 마음이 편합니다.\n카페는 지도 핀과 실제 입구가 어긋나는 경우가 있어 건물 번지를 함께 확인하세요.", tags: ["강남역권", "길찾기", "팁"], category_slug: "practical", kind: "practical", hero_subject: "place" },
  { withRoute: false, title: "광화문광장 바람이 셀 때 체크할 것", summary: "모자·머리 묶음·가방 끈부터 정리하면 촬영도 편합니다.", body: "광장은 바람이 갑자기 세질 수 있어 작은 짐이 날리지 않게 정리합니다.\n이후 실내로 들어갈 계획이면 우산 물기를 털고 입장합니다.", tags: ["광화문권", "날씨", "광장"], category_slug: "local-tips", kind: "local_tip" },
  { withRoute: false, title: "강남 카페 — 외부 파사드와 내부 좌석을 나눠 보기", summary: "같은 매장이라도 입구 밖에서 분위기를 먼저 확인하면 실패가 줄어듭니다.", body: "유리 너머 좌석이 보이면 대기 인원을 가늠하기 쉽습니다.\n실내는 조명 색이 사진 톤을 좌우하니 화이트밸런스만 한 번 확인해 보세요.", tags: ["강남역권", "카페", "인테리어"], category_slug: "food", kind: "food" },
  { withRoute: false, title: "이순신장군상 앞 만남 — 기준점만 맞추기", summary: "‘동상 앞’보다 ‘동상에서 궁 쪽’처럼 방향을 붙이면 정확해집니다.", body: "광화문 일대는 행사로 통제가 바뀔 수 있어 당일 안내판을 한 번만 훑어도 마음이 편합니다.", tags: ["광화문권", "만남", "이순신"], category_slug: "practical", kind: "practical", hero_subject: "person" },
  { withRoute: false, title: "강남역 카페 투어 없이 ‘한 곳’만 고르기", summary: "메뉴는 단순하게, 자리는 창가 vs 조용한 구석 중 하나만 고릅니다.", body: "디저트와 음료를 한 번에 주문하면 결제 대기가 짧아집니다.\n혼자면 코너 자리, 대화면 소파측을 고르면 만족도가 안정적입니다.", tags: ["강남역권", "카페", "솔로"], category_slug: "food", kind: "food" },
  { withRoute: false, title: "세종대왕상·광장 산책 무드", summary: "넓은 공간은 ‘한 바퀴’보다 ‘한쪽 끝까지’ 목표만 정합니다.", body: "중간에 벤치가 보이면 그늘 쪽을 먼저 차지하는 편이 여름·가을 모두 편합니다.", tags: ["광화문권", "세종로", "산책"], category_slug: "hot-places", kind: "hot_place" },
  { withRoute: false, title: "강남 거리 분위기만 담는 30분", summary: "쇼핑 목적 없이 ‘거리의 속도’만 느끼는 가벼운 제안입니다.", body: "이어폰으로 음악을 줄이고, 횡단 전후로 주변만 한 번씩 돌아보면 방향 감각이 살아납니다.", tags: ["강남역권", "분위기", "도보"], category_slug: "local-tips", kind: "local_tip" },
  { withRoute: false, title: "광화문에서 경복궁까지 ‘천천히’ 가는 마음가짐", summary: "지각 스트레스를 줄이려면 버퍼 20분을 광장에 둡니다.", body: "궁 입장 줄이 길면 담장 산책으로 만족도를 채우는 선택도 합리적입니다.", tags: ["광화문권", "경복궁", "여유"], category_slug: "local-tips", kind: "local_tip" },
  { withRoute: false, title: "강남역 근처 실내 휴식 슬롯 잡기", summary: "밖이 붐비면 몰·카페 실내로 15분만 넣어도 컨디션이 회복됩니다.", body: "에어컨·난방이 강한 실내는 겉옷을 준비하고, 물을 조금씩 나눠 마십니다.", tags: ["강남역권", "휴식", "실내"], category_slug: "practical", kind: "practical" },
  { withRoute: false, title: "광화문 랜드마크 사진 — 사람이 많을 때", summary: "높이보다 ‘거리’를 두고 찍으면 인파가 덜 붙습니다.", body: "연속 촬영으로 표정만 고르고, 통행 중에는 셔터를 잠시 멈춥니다.", tags: ["광화문권", "사진", "혼잡"], category_slug: "local-tips", kind: "local_tip" },
  { withRoute: false, title: "테헤란로 카페 — 창가 자리의 햇빛", summary: "오후 서향 창가는 뜨거울 수 있어 음료 얼음량을 조절하세요.", body: "실내 사진은 창쪽 노출을 살짝 낮추면 거리 풍경이 살아납니다.", tags: ["강남역권", "카페", "오후"], category_slug: "food", kind: "food" },
  { withRoute: false, title: "서울 첫 방문 — 광화문이 좋은 이유 한 장으로", summary: "지하철·버스 접근, 안내 표지, 화장실·편의점 밀도가 균형 잡혀 있습니다.", body: "다음 코스(북촌·인사동 등)로 확장하기 전 ‘기준점’을 몸으로 익히기 좋습니다.", tags: ["광화문권", "첫방문", "오리엔테이션"], category_slug: "practical", kind: "practical" },
  { withRoute: false, title: "강남역 ‘짧은 약속’ 장소 잡기", summary: "10번·11번 출구 근처 큰 길을 기준으로 잡으면 설명이 짧아집니다.", body: "약속 변경 시에도 큰 길 기준으로만 말하면 재집결 속도가 빨라집니다.", tags: ["강남역권", "만남", "약속"], category_slug: "practical", kind: "practical" },
  { withRoute: false, title: "광화문·경복궁 사이 보행 매너", summary: "촬영·통행·자전거 도로를 한눈에 보고 속도를 맞춥니다.", body: "좁은 구간에서는 가방을 앞으로 돌려 여유 공간을 확보합니다.", tags: ["광화문권", "매너", "보행"], category_slug: "local-tips", kind: "local_tip" },
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
