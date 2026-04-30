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
      short_description: "[준비형] 들어오자마자 북쪽(궁)·남쪽(시청·지하철)만 구분해 두기.",
      body: "여기서 헷갈리면 뒤가 다 지연됩니다. 이순신상·세종상 있는 쪽이 경복궁·북쪽, 반대편이 세종로·광화문역 방향입니다. 행사 시에는 줄·펜스가 바뀌니 입구 안내판부터 보고 들어가세요. 화장실·물은 세종이야기 지하나 광장 주변 편의가 무난합니다.",
      image_urls: localPair(postId, "gwanghwamun", 30),
      recommend_reason: "만남 장소로 좌표 잡기 쉬움. 표지가 많아 길 물어보기도 편한 편입니다.",
      stay_duration_minutes: 20,
      photo_tip: "사진은 나중에. 먼저 동상 위치만 찍어두면 동선 설명이 빨라집니다. 측면에서 붙으면 사람 배경이 덜 지저분합니다.",
      caution: "주말·공휴일 행사 시 통제 구간 생김. 바람 강한 날 작은 짐 날림 주의.",
      featured: true,
      theme_reason: "준비형 스팟 — 방향·화장실·행사 여부만 여기서 정리하고 움직이면 됩니다.",
      what_to_do: "① 북쪽 손가락으로 경복궁 방향 가리키기 ② 세종이야기 입구(화장실) 위치 확인 ③ 행사 펜스 유무 확인 후 안쪽으로.",
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
      short_description: "[포토형] 인증샷·만남 기준점. 길 안내할 때 ‘동상 앞’보다 ‘동상에서 궁 쪽’이 정확함.",
      body: "사람 많으면 ‘동상 앞’만으로는 안 맞습니다. 동상 기준으로 궁이 보이는 면/반대편을 말해 주세요. 뒤 빌딩 라인은 역광 아니면 저녁 전후가 노출 맞추기 수월합니다.",
      image_urls: localPair(postId, "gwanghwamun", 51),
      recommend_reason: "짧게 찍고 빠지기 좋은 각도 많음. 바로 옆이 세종상이라 다음 스팟 이동도 짧음.",
      stay_duration_minutes: 15,
      photo_tip: "발 아래 기준점 두고 찍으면 인물 스케일 덜 이상해짐. 통행 안 되는 데서만 삼각대—바람 부는 날 조심.",
      caution: "관광버스 단체 시간대엔 어깨 부딪힘 많음. 가방 앞으로.",
      theme_reason: "포토형 스팟 — 여기서 오래 감상하기보다 각도만 정하고 넘어가면 동선이 빨라집니다.",
      what_to_do: "기준 사진 1장 → 세종상 쪽으로 3~4분 걸어 다음 스팟.",
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
      short_description: "[휴식형] 벤치·그늘 찾고 물 마실 타이밍. 세종이야기 지하 전시는 무료·짧게 보기 좋음.",
      body: "여름엔 중앙이 뜨겁습니다. 벤치는 동상 기준 멀고 그늘진 쪽이 붐비기 덜합니다. 세종이야기 입구는 화장실·에어컨·전시 한 번에 처리 가능. 궁까지 걸어가야 하니 여기서 물·화장실 정리하고 나오는 걸 추천.",
      image_urls: localPair(postId, "gwanghwamun", 72),
      recommend_reason: "이순신상 다음 코스로 호흡 조절하기 좋음. 전시 관심 없으면 동상만 보고 건너가도 됨.",
      stay_duration_minutes: 15,
      photo_tip: "아래에서 올려다보는 각도는 사람 줄 서면 실패 많음. 한쪽 끝에서 대각선으로 잡는 게 현실적.",
      caution: "횡단은 신호대기 줄 길 수 있음. 스마트폰 보며 건너지 말 것.",
      theme_reason: "휴식형 스팟 — 감상보다 ‘쉬었다 가기’ 용도로 쓰면 이후 경복궁까지 덜 힘듦.",
      what_to_do: "물·화장실 → (선택) 세종이야기 15분 → 광화문 쪽으로 발걸음 옮겨 경복궁 방향.",
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
      short_description: "[메인 목적지형] 입장 vs 담장만: 시간 없으면 매표 줄 보고 결정. 교대식은 공지 시간만 보고 기대치 조절.",
      body: "‘경복궁 왔다’로 끝낼지 ‘안 들어간다’로 끝낼지 여기서 갈립니다. 입장이면 대형 가방·막대 삼각대 규정 먼저 확인(현장 안내가 최종). 안 들어가면 담장 따라 동쪽으로 빠져도 산책 코스는 유지됩니다. 한여름 내부는 그늘 있어도 걷는 구간 길어요—물은 광장에서 미리.",
      image_urls: localPair(postId, "gwanghwamun", 93),
      recommend_reason: "이 루트의 종착·분기점. 사진만 찍고 가려면 성문 앞 스텝에서 사람 피해 짧게.",
      stay_duration_minutes: 40,
      photo_tip: "정면 성문샷은 오전 개장 직후가 사람 덜 붙음. 못 맞추면 측면 담장 대각선이 현실적.",
      caution: "화·일 휴무 등 공식 캘린더 확인. 마감 1시간 전 입장 제한 있는 날 많음. 줄 길면 담장 산책으로 만족도 조절.",
      featured: true,
      theme_reason: "메인 목적지형 — 여기서 입장이면 안까지 시간 따로 잡으세요. 밖만 보면 20분이면 충분할 수 있음.",
      what_to_do: "① 매표 줄 길이 확인 ② 가방 규정 ③ 입장 시 근정전까지 갈지 정하기—못 가면 중도 나와도 됨.",
      image_alt: "경복궁 광화문 정문 전경과 수문장",
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
      address_line: "서울 강남구 테헤란로 4길 10",
      short_description: "[준비형] 11번 출구 나와 바로. 줄 있으면 테이크아웃만 하고 다음 스팟으로 넘어가도 됨.",
      body: "유리 파사드라 안·밖 밝기 차 큼—창가 앉으면 여름엔 뜨겁습니다. 테이크아웃이면 입구 오른쪽 줄 규칙만 확인. 여기서 할 일: 다음 스팟 순서·지하철 역 방향(역삼 쪽으로 갈지) 스마트폰에 한 줄 메모.",
      image_urls: localPair(postId, "gangnam", 40),
      recommend_reason: "출발점으로 물·카페인 확보하기 좋음. 웨이팅 길면 억지로 안 앉아도 됨.",
      stay_duration_minutes: 20,
      photo_tip: "실내 조명·유리 반사 때문에 피부톤 깨짐 많음—찍고 싶으면 입구 밖에서 건물 라인만.",
      caution: "금요 저녁·토 오후 웨이팅 폭증. 짐 바닥 두면 사람 밟힘.",
      featured: true,
      theme_reason: "준비형 스팟 — ‘감상’보다 줄·좌석·테이크아웃 결정만 빨리.",
      what_to_do: "음료 수령 → 테헤란로 큰 길 붙어 동쪽(역삼 방향)으로 이동 시작.",
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
      short_description: "[이동형] 퇴근 피크(18~19시)면 보행 속도 반토막. 횡단은 신호 따로—대각선 안 될 때 많음.",
      body: "오피스구간이라 평일 점심·저녁 사람 폭증합니다. 인도 좁은 구간에선 뒤에서 밀리니 짐 앞으로. 사진은 걷다 멈추면 뒤 사람 신경—길가 아니라 건물 입구 전 포켓에서 짧게.",
      image_urls: localPair(postId, "gangnam", 61),
      recommend_reason: "테헤란로 전체를 다 안 걸어도 됨. 빌딩 사이 하늘 한 줄만 봐도 동선 이해됨.",
      stay_duration_minutes: 15,
      photo_tip: "횡단 대기 중 촬영은 신호 바뀌기 직전에만—그 외엔 발치 아래 킥보드 조심.",
      caution: "이어폰 크게 켜고 건너면 위험. 야간엔 자전거·킥보드 차로 침범 금지 구역 표시 확인.",
      theme_reason: "이동형 스팟 — 감상 문구 없이 ‘건너고 골목 들어가기 전 호흡 조절’ 용도.",
      what_to_do: "큰 길 따라 동쪽으로만 유지 → 다음 골목 들어가기 직전 지도 한 번만.",
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
      short_description: "[휴식형] 메인에서 한 블록만 안쪽—소음↓·와이파이·콘센트는 매장마다 다름.",
      body: "골목 들어오면 차량 거의 없고 사람도 줄어듭니다. 자리 잡기 전에 메뉴판에 ‘테이크아웃만’ 표시 있는지 확인—앉았다 나오기 애매한 데 있음. 충전 필요하면 카운터에 먼저 물어보는 게 빠름.",
      image_urls: localPair(postId, "gangnam", 82),
      recommend_reason: "테헤란로 걷고 들어와서 앉아 쉬기 좋은 간격. 혼잡도 낮아 통화·메모하기 편함.",
      stay_duration_minutes: 30,
      photo_tip: "골목 사진은 햇빛 들어오는 시간대만 포인트—야간엔 노이즈 많이 낌.",
      caution: "일부 매장 노키즈·노노트북—문 앞 표지 확인. 화장실 없는 소매장도 있음.",
      theme_reason: "휴식형 스팟 — 감성 문구보다 ‘앉아서 물·충전·화장실’ 체크리스트용.",
      what_to_do: "주문 → 자리(콘센트 유무) → 20~30분 쉬고 테헤란로 복귀.",
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
      short_description: "[포토형·야간] 역삼·선릉역 방향 큰 길. 야간엔 킥보드 차로·버스만 조심하면 됨.",
      body: "야간 조명은 빌딩 유리 반사 때문에 색깔 깨짐 많음—역광이면 실루엣만 노리거나 플래시 끄고 연속 촬영. 길 한복판 서서 찍지 말고 건물 입구 홈으로 비켜 서기.",
      image_urls: localPair(postId, "gangnam", 103),
      recommend_reason: "마지막 구간이라 역 선택만 정하면 끝—역삼역 vs 선릉역은 목적지 방향으로.",
      stay_duration_minutes: 20,
      photo_tip: "노출 길게 당기면 손떨림만 커짐—짧게 여러 장이 나음.",
      caution: "킥보드·자전거 차로 침범 금지 구간 페인트로 표시된 데 많음. 이어폰 소리 줄이고 횡단만 집중.",
      featured: true,
      theme_reason: "포토형 마무리 — ‘분위기’보다 안전하고 짧게 찍고 역으로 빠지기.",
      what_to_do: "사진 2~3장 → 가장 가까운 역 입구 찾기 → 지하로 하차.",
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
      short_description: "[준비형] 교차로 차 많음—사진 찍을 때 보도 안쪽으로만. 광장·이순신상 방향 한 번에 확인.",
      body: "여기서 서면 광장이 펼쳐짐. 오른쪽 시청·지하철 쪽, 반대가 궁 방향. 10분 안에 방향만 확정하고 안쪽으로 들어가세요—여기서 오래 서 있으면 신호 대기 인파에 섞임.",
      image_urls: localPair(postId, "gwanghwamun", 110),
      recommend_reason: "짧은 코스 시작점으로 좌표 잡기 좋음. 바로 다음이 광장이라 스텝 짧음.",
      stay_duration_minutes: 15,
      photo_tip: "교차로 근처는 차 진입 각도 보고 찍기—신호 바뀔 때 사람 몰림.",
      caution: "횡단 대기선 밖으로 나가면 차량 코너링 구간.",
      featured: true,
      theme_reason: "준비형 — 방향만 보고 광장 안으로 진입.",
      what_to_do: "사진 1장 → 횡단으로 광장 안쪽으로.",
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
      short_description: "[이동형·휴식] 평지라 무릎 부담 적음. 한여름엔 중앙 보다 그늘·벤치 쪽 먼저.",
      body: "행사 펜스 있으면 동선이 바뀜—막다른 펜스까지 가지 말고 표지 따라 우회. 물·화장실은 세종이야기 지하가 대체로 무난. 벤치는 동상 기준 멀고 나무 있는 쪽이 그늘.",
      image_urls: localPair(postId, "gwanghwamun", 131),
      recommend_reason: "짧은 루프의 실제 ‘걷는 구간’. 가족 동행이면 여기서 속도만 맞추면 됨.",
      stay_duration_minutes: 20,
      photo_tip: "넓게 담으려면 사람 적은 타이밍만—안 되면 동상 옆으로 붙어 세로 프레임.",
      caution: "햇빛 강한 날 탈수 빠름. 음수대 줄 길 수 있음—미리 편의점에서 물 사도 됨.",
      theme_reason: "이동+휴식 혼합 — 감상보다 그늘·물·화장실 체크.",
      what_to_do: "이순신상 지나 세종상까지 직선으로 → 벤치 5분 → 담장 쪽으로.",
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
      short_description: "[포토형·대안] 궁 안 안 들어가도 기와선·담장선 사진 가능. 자전거 도로 페인트 구간 겹침.",
      body: "입장 줄 길면 여기서 만족도 조절하면 됨. 담장 따라 걸을 때 자전거 도로와 보행 겹치는 데 있음—뒤에서 벨 울리면 한쪽으로 붙기. 교대식 보려면 광화문 쪽 시각만 확인—시간 아니면 그냥 담장만 걷기.",
      image_urls: localPair(postId, "gwanghwamun", 152),
      recommend_reason: "짧은 루프 종료용—‘궁 갔다’는 느낌만 살리고 체력 아낄 때.",
      stay_duration_minutes: 25,
      photo_tip: "대각선으로 담장만 잡으면 깊이 나옴—정면 기와는 사람만 많아짐.",
      caution: "일부 구간 자전거 우선—스마트폰 보며 서 있지 말 것.",
      featured: true,
      theme_reason: "포토형 마무리 + 입장 안 할 때 대체 플랜.",
      what_to_do: "담장 따라 북쪽 또는 광화문 쪽으로만 정하기—왔던 길 되돌아가도 됨.",
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
    reason_line: "현장에서 바로 쓰는 동선·혼잡·화장실 포인트 위주로 묶었습니다.",
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
        "행사 펜스·통제는 당일 표지가 우선입니다. 횡단·킥보드 차로는 신호 보고 건너세요. 사진은 길 한복판보다 건물 홈·대기선 안쪽이 안전합니다.",
      introBody: def.body,
      spotGuideLine: `아래 카드 ${route_journey.spots.length}곳 — 스팟 성격(준비·이동·휴식·사진·종착)마다 톤 나눠 두었습니다. 길게 읽기보다 카드만 타도 동선 잡힙니다.`,
      closing: "비 오거나 줄 길면 담장 산책·테이크아웃만 하는 플랜 B 하나만 더 두면 됩니다.",
      guardianLine: `${authorName}: 속도 다른 동행이면 ‘여기서 화장실만’ 같이 맞추고 출발하세요.`,
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
          "당일 통제·매표 줄·휴무는 현장·공지가 우선입니다. 보행 중 장시간 정지 촬영은 피하고, 횡단·킥보드 차로만 주의하면 동선 유지됩니다.",
        narrative: `${def.body.trim()}\n\n${spotGuideLine}`.trim(),
        closing: "날씨·줄 변수 대비해 짧게 끝내는 대안 동선 하나만 더 두면 됩니다.",
        guardian_signature: `${authorName}: 동행 속도 안 맞으면 화장실·그늘만 먼저 합치고 출발하세요.`,
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
  { withRoute: true, journey: journeyGwanghwamunClassic, title: "광화문 반나절 — 광장에서 경복궁까지 천천히", summary: "광장에서 방향·화장실만 정리하고 이순신·세종·광화문까지 도보. 입장은 줄 보고.", body: "만남은 광장이 제일 설명 쉬움.\n사진은 동상 옆·담장 대각선만 짧게. 경복궁은 매표 줄 길면 담장만 보고 빠지는 것도 현실적 선택.", tags: ["광화문권", "도보", "첫방문", "경복궁"], category_slug: "hot-places", kind: "hot_place", post_format: "route", route_highlights: ["광장에서 북·남 방향만 먼저", "세종이야기=화장실·물", "궁 입장 vs 담장만 결정"], hero_subject: "mixed" },
  { withRoute: true, journey: journeyGangnamWalk, title: "강남 — 카페·테헤란로·골목 도보", summary: "11번 출구→카페→큰 길→골목→야간 테헤란로. 웨이팅 길면 테이크아웃만 해도 됨.", body: "테헤란로는 퇴근 시간 인파 많음—큰 길 붙어 걷기.\n골목 카페는 노키즈·노노트북 표지 확인. 야간은 킥보드 차로만 조심.", tags: ["강남역권", "K-무드", "카페", "도보", "오후"], category_slug: "food", kind: "food", post_format: "hybrid", route_highlights: ["11번 출구 기준 잡기", "테헤란로는 횡단·킥보드", "야경은 짧게 찍고 역으로"] },
  { withRoute: true, journey: journeyGwangShort, title: "랜드마크 도보 — 광화문 삼각 루프 50분", summary: "교보빌딩→광장→담장만. 입장 안 해도 기와선 사진 가능.", body: "시간 없으면 스팟마다 사진 욕심 줄이고 방향·그늘만 챙기면 50분 안에 돕니다.", tags: ["광화문권", "사진", "짧은코스"], category_slug: "hot-places", kind: "hot_place", post_format: "route", route_highlights: ["교차로는 보도 안쪽", "광장은 벤치·그늘 우선", "담장은 자전거 겹침 구간 주의"] },
  { withRoute: true, journey: journeyGangnamWalk, title: "혼자 도보 — 강남역에서 테헤란로까지", summary: "혼행은 큰 길만 기억하면 됨. 창가는 햇빛·웨이팅 체크.", body: "밤에도 가로등 있는 메인으로만 다니면 방향 헷갈림 적음.\n카페 창가는 오후 서향이면 뜨거울 수 있음—겉옷·짧게 앉기.", tags: ["강남역권", "솔로", "K-무드", "야간"], category_slug: "local-tips", kind: "local_tip", post_format: "route", route_highlights: ["역→큰 길 우선", "골목 들어가기 전 지도 한 번", "야간 이어폰 소리 줄이기"] },
  { withRoute: true, journey: journeyGwanghwamunClassic, title: "사진 위주 광화문 루트", summary: "동상=기준점, 광장=넓이, 광화문=줄·각도. 삼각대는 통행 안 되는 곳만.", body: "인물은 배경 단순할 때만. 풍경은 대각선 담장이 사람 덜 붙음.", tags: ["광화문권", "사진", "풍경"], category_slug: "local-tips", kind: "local_tip", post_format: "hybrid", route_highlights: ["동상 앞은 ‘궁 쪽’으로 설명", "광장 중앙보다 측면", "입장 줄 길면 담장만"] },
  { withRoute: true, journey: journeyGangnamWalk, title: "강남 카페 2곳 — 밝은 실내→조용한 층", summary: "첫 매장은 줄·메뉴판 보고, 둘째는 콘센트·화장실 여부만 확인.", body: "같은 날 카페 두 번이면 카페인·물 분량만 조절—두 번째는 디카페인이 나을 때 많음.", tags: ["강남역권", "카페", "감성"], category_slug: "food", kind: "food", post_format: "route" },
  { withRoute: true, journey: journeyGwangShort, title: "서울 첫날 오전 — 광화문만", summary: "입국 직후 무리한 동선 말고 광장·담장만으로 오리엔테이션.", body: "짐 있으면 광장 한 바퀴만 잡아도 체력 아낌. 궁 입장은 줄 보고 그날 결정.", tags: ["광화문권", "첫날", "오전"], category_slug: "practical", kind: "practical", post_format: "route" },
  { withRoute: true, journey: journeyGangnamWalk, title: "강남 1시간 압축 — 카페·테헤란로", summary: "쇼핑몰 말고 길만 걸어도 역삼 방향 감 잡힘.", body: "한 시간이면 카페 줄에서 시간 다 갈 수 있음—테이크아웃으로 타협 각오.", tags: ["강남역권", "짧은코스", "K-무드", "카페"], category_slug: "hot-places", kind: "hot_place", post_format: "route" },
  { withRoute: true, journey: journeyGwanghwamunClassic, title: "경복궁 들어가기 전 광장 체크", summary: "화장실·물·그늘을 광장에서 끝내고 궁 안 들어가기.", body: "궁 안은 나오기까지 길 수 있음—화장실 타이밍이 실패하면 불편함 큼.", tags: ["광화문권", "준비", "경복궁"], category_slug: "practical", kind: "practical", post_format: "hybrid" },
  { withRoute: true, journey: journeyGangnamWalk, title: "강남 오후 — 실내 샷 vs 거리 샷", summary: "실내 조명이랑 거리 노출이 다름—같은 필터로 맞추려면 실패함.", body: "차라리 색 맞추지 말고 대비만 노리는 게 피드 정리에 빠름.", tags: ["강남역권", "사진", "카페"], category_slug: "local-tips", kind: "local_tip", post_format: "route" },
  { withRoute: true, journey: journeyGwangShort, title: "광화문 만남 — 세종상까지 직선", summary: "동상 이름으로만 말하면 위치 안 맞을 때 많음—‘궁 보이는 쪽’ 추가.", body: "동행 늦으면 동상 발치보다 광장 입구 펜스 근처가 찾기 쉬움.", tags: ["광화문권", "세종로", "만남"], category_slug: "local-tips", kind: "local_tip", post_format: "route" },
  { withRoute: true, journey: journeyGangnamWalk, title: "강남 식사·카페 도보", summary: "배고프면 골목만 짧게—복귀는 테헤란로 큰 길.", body: "지도 핀과 실제 입구 어긋나는 경우 많음—건물 번지까지 확인.", tags: ["강남역권", "식사", "도보"], category_slug: "food", kind: "food", post_format: "route" },
  { withRoute: true, journey: journeyGwanghwamunClassic, title: "광화문 랜드마크 일직선 — 이순신·세종·경복궁", summary: "스팟마다 3분 넘기면 뒤 일정 다 밀림.", body: "사진·영상 욕심 줄이고 이동 시간부터 역산.", tags: ["광화문권", "이순신", "세종대왕", "경복궁"], category_slug: "hot-places", kind: "hot_place", post_format: "route", recommended_boost: 8 },
  { withRoute: true, journey: journeyGwangShort, title: "반나절 산책 — 광장·담장", summary: "언덕 거의 없음—운동화만 확실히.", body: "햇빛 강한 날 모자 없으면 광장 중앙에서 지침.", tags: ["광화문권", "산책", "가벼운코스"], category_slug: "hot-places", kind: "hot_place", post_format: "route" },
  { withRoute: true, journey: journeyGangnamWalk, title: "강남 야간 — 네온·카페 실내", summary: "밤엔 노출 흔들림 많음—연속 촬영이 장노출보다 낫.", body: "이어폰 줄이고 횡단만 집중—킥보드 차로 침범 금지 페인트 확인.", tags: ["강남역권", "야경", "카페"], category_slug: "hot-places", kind: "hot_place", post_format: "hybrid" },
  { withRoute: true, journey: journeyGwanghwamunClassic, title: "첫 서울 최소 동선 — 광화문", summary: "지하철·버스 환승 기준점 잡기 좋은 한 블록.", body: "다음 날 다른 동네 가기 전 오늘은 방향 감만 익히면 됨.", tags: ["광화문권", "첫방문", "추천"], category_slug: "local-tips", kind: "local_tip", post_format: "route" },
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
  { withRoute: false, title: "광화문→경복궁 버퍼", summary: "늦을 각오면 광장에 20분 여유 먼저 잡기.", body: "궁 줄 길면 담장 산책으로 대체—입장 실패해도 동선은 유지됨.", tags: ["광화문권", "경복궁", "여유"], category_slug: "local-tips", kind: "local_tip" },
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
