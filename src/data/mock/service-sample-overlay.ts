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
      title: "광화문광장에서 동선 잡기",
      place_name: "광화문광장",
      address_line: "세종대로, 종로구",
      short_description: "넓은 광장에서 이순신장군상·세종대왕상 방향을 한눈에 확인합니다.",
      body: "첫 서울이라면 여기서 사진보다 먼저 ‘어느 쪽이 궁궐인지’만 짚고 가면 이후가 편합니다. 바람이 강하면 모자를 챙기세요.",
      image_urls: localPair(postId, "gwanghwamun", 30),
      recommend_reason: "만남·방향 잡기에 좋고, 주변 안내 표지가 또렷합니다.",
      stay_duration_minutes: 20,
      photo_tip: "광장 중앙보다 건물 실루엣이 보이는 측면이 실루엣이 깔끔합니다.",
      caution: "행사가 있으면 통제 구간이 생길 수 있어 현장 안내를 확인하세요.",
      featured: true,
    }),
    spot(postId, 2, {
      lat: 37.57552,
      lng: 126.97715,
      title: "이순신장군상 앞",
      place_name: "이순신장군 동상",
      address_line: "광화문광장",
      short_description: "광장의 기준점으로 삼기 좋은 랜드마크입니다.",
      body: "사람이 몰릴 때는 동상 기준으로 ‘앞/뒤’를 정하면 길 설명이 짧아집니다.",
      image_urls: localPair(postId, "gwanghwamun", 51),
      recommend_reason: "주변 카페·화장실을 찾을 때 기준점으로 쓰기 좋습니다.",
      stay_duration_minutes: 15,
      photo_tip: "동상과 뒤편 고층 빌딩이 함께 들어오면 ‘도심 속 역사’ 느낌이 납니다.",
      caution: "통행량이 많은 시간대엔 가방을 앞으로 두는 편이 안전합니다.",
    }),
    spot(postId, 3, {
      lat: 37.57245,
      lng: 126.97695,
      title: "세종대왕상·세종로",
      place_name: "세종대왕 동상",
      address_line: "세종대로",
      short_description: "광장과 궁궐 사이를 잇는 산책 구간입니다.",
      body: "그늘 구간을 골라 천천히 걸으면 다음 코스인 경복궁까지 호흡이 안정됩니다.",
      image_urls: localPair(postId, "gwanghwamun", 72),
      recommend_reason: "사진·휴식을 나누기 좋은 짧은 이동 구간입니다.",
      stay_duration_minutes: 15,
      photo_tip: "저녁 전후 조명이 바뀌면 분위기가 달라집니다.",
      caution: "횡단은 신호 확인 후, 스마트폰 보행은 피하세요.",
    }),
    spot(postId, 4, {
      lat: 37.57915,
      lng: 126.97685,
      title: "경복궁 정문 방향 마무리",
      place_name: "경복궁 인근",
      address_line: "사직로",
      short_description: "궁궐 정문 일대에서 오전·오후 슬롯을 정리합니다.",
      body: "입장 전 매표·가방 규정을 확인하고, 반나절 코스라면 ‘궁 안’과 ‘광장’ 중 하나에만 집중하는 편이 여유롭습니다.",
      image_urls: localPair(postId, "gwanghwamun", 93),
      recommend_reason: "첫 방문자에게 ‘한복·궁궐’을 한 번에 경험시키기 좋은 종착점입니다.",
      stay_duration_minutes: 40,
      photo_tip: "울타리 라인을 살짝 비스듬히 두면 인파가 덜 들어옵니다.",
      caution: "입장 마감·휴무일은 공지를 꼭 확인하세요.",
      featured: true,
    }),
  ];
  return { metadata: { ...metaEasy, estimated_total_duration_minutes: 90, estimated_total_distance_km: 2.1 }, spots, path: densifyPath(pts) };
}

/** 강남역 인근 도보 — 역·테헤란로 카페·거리 */
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
      title: "강남역 지상 출구에서 시작",
      place_name: "강남역 일대",
      address_line: "강남대로·테헤란로 인근",
      short_description: "지하에서 올라온 뒤 ‘큰 길’ 기준으로 방향을 잡습니다.",
      body: "복잡해 보여도 큰 도로변을 등지고 스카이라인을 보면 테헤란로 방향이 잡히기 쉽습니다.",
      image_urls: localPair(postId, "gangnam", 40),
      recommend_reason: "첫 방문자도 길 잃기 어려운 출발점입니다.",
      stay_duration_minutes: 12,
      photo_tip: "횡단보도 대기선에서 거리 원근감이 살아납니다.",
      caution: "퇴근 시간대엔 유동 인구가 매우 많습니다.",
      featured: true,
    }),
    spot(postId, 2, {
      lat: 37.4992,
      lng: 127.0294,
      title: "카페 1 — 외관 확인 후 입장",
      place_name: "테헤란로 인근 카페",
      address_line: "강남구 테헤란로 일대",
      short_description: "창가 자리와 실내 좌석을 미리 보고 주문합니다.",
      body: "유리가 큰 매장은 밖에서 테이블 상황을 본 뒤 들어가면 대기 시간을 줄일 수 있습니다.",
      image_urls: localPair(postId, "gangnam", 61),
      recommend_reason: "도보 중간에 휴식·충전을 넣기 좋습니다.",
      stay_duration_minutes: 25,
      photo_tip: "실내는 창밖 거리 풍경과 함께 찍으면 깊이가 살아납니다.",
      caution: "촬영 시 다른 손님 얼굴이 들어가지 않게 배려해 주세요.",
    }),
    spot(postId, 3, {
      lat: 37.5006,
      lng: 127.0335,
      title: "골목·2차 카페",
      place_name: "강남 역세권 골목",
      address_line: "역삼동 일대",
      short_description: "큰 길에서 한 블록 안쪽, 조용한 카페를 찾습니다.",
      body: "메인 거리가 붐비면 평행 골목의 2층 카페가 시야가 트인 경우가 많습니다.",
      image_urls: localPair(postId, "gangnam", 82),
      recommend_reason: "혼자 쉬기·노트북 작업에 무난한 분위기를 찾기 좋습니다.",
      stay_duration_minutes: 25,
      photo_tip: "계단·난간 라인이 있는 매장은 위에서 내려다보는 구도가 안정적입니다.",
      caution: "일부 매장은 콘센트 좌석이 제한될 수 있습니다.",
    }),
    spot(postId, 4, {
      lat: 37.5014,
      lng: 127.0363,
      title: "테헤란로 거리 산책 마무리",
      place_name: "테헤란로 보행 구간",
      address_line: "강남구",
      short_description: "네온과 오피스 타워가 어우러진 짧은 야경·주간 산책입니다.",
      body: "사진은 짧게, 통행은 우선으로 두면 스트레스 없이 ‘강남 분위기’만 담기에 충분합니다.",
      image_urls: localPair(postId, "gangnam", 103),
      recommend_reason: "‘서울의 밤’ 인상을 가볍게 남기기 좋은 종료 구간입니다.",
      stay_duration_minutes: 18,
      photo_tip: "저녁에는 긴 노출 대신 연속 촬영으로 흔들림을 줄이세요.",
      caution: "촬영 시 자전거·킥보드 차로를 침범하지 않도록 주의하세요.",
      featured: true,
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
      title: "광화문 네거리 랜드마크",
      place_name: "광화문 일대",
      address_line: "종로구",
      short_description: "궁궐·광장·도심이 한 화면에 들어오는 구간입니다.",
      body: "10~15분만 잡고 사진과 방향 확인에 집중합니다.",
      image_urls: localPair(postId, "gwanghwamun", 110),
      recommend_reason: "짧은 일정에 ‘서울 도심’ 인상을 주기 좋습니다.",
      stay_duration_minutes: 15,
      photo_tip: "광장 쪽 개방감이 있는 각도를 찾아보세요.",
      caution: "차량 통행이 잦은 곳은 보도 안쪽으로 머무르세요.",
      featured: true,
    }),
    spot(postId, 2, {
      lat: 37.5754,
      lng: 126.9773,
      title: "광장 산책",
      place_name: "광화문광장",
      address_line: "세종대로",
      short_description: "그늘과 벤치를 기준으로 쉬어 갑니다.",
      body: "물을 조금씩 나눠 마시면 이후 경복궁·박물관 동선이 편합니다.",
      image_urls: localPair(postId, "gwanghwamun", 131),
      recommend_reason: "가족·시니어와 속도를 맞추기 좋습니다.",
      stay_duration_minutes: 20,
      photo_tip: "이순신상과 함께 프레임에 담으면 위치 설명이 쉬워집니다.",
      caution: "강한 햇빛에는 모자·선크림을 권장합니다.",
    }),
    spot(postId, 3, {
      lat: 37.5768,
      lng: 126.9782,
      title: "경복궁 방향 전망",
      place_name: "경복궁 인근 산책로",
      address_line: "사직로 인근",
      short_description: "궁궐 담장 라인을 따라 가볍게 마무리합니다.",
      body: "입장 없이도 담장·수문장 풍경만으로도 반나절 첫인상을 채울 수 있습니다.",
      image_urls: localPair(postId, "gwanghwamun", 152),
      recommend_reason: "입장 대기가 길 때 대체 만족을 주는 짧은 코스입니다.",
      stay_duration_minutes: 25,
      photo_tip: "담장 직선을 대각선으로 두면 깊이가 살아납니다.",
      caution: "자전거 도로와 보행로가 겹치는 구간을 확인하세요.",
      featured: true,
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
  const spots = journey.spots.map((s, i, arr) => {
    const tail =
      i < arr.length - 1
        ? `\n\n다음 장소로 이어지는 포인트\n다음 핀「${arr[i + 1]?.place_name ?? ""}」으로 이어집니다. 보도 안쪽을 유지하며 이동하세요.`
        : "";
    const base = (s.body ?? "").trim();
    const body = [base, tail].filter(Boolean).join("\n\n");
    return { ...s, body };
  });
  return { ...journey, spots };
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
  { withRoute: true, journey: journeyGangnamWalk, title: "강남역 도보 — 카페 두 곳과 테헤란로 거리", summary: "역에서 골목 카페까지, 외부·내부 분위기를 번갈아 즐기는 오후 코스.", body: "큰 길을 기준으로만 움직여도 길 잃을 확률이 크게 줄어듭니다.\n카페는 창가·실내 좌석을 먼저 보고 주문하면 대기가 덜 답답합니다.", tags: ["강남역권", "카페", "도보", "오후"], category_slug: "food", kind: "food", post_format: "hybrid", route_highlights: ["출구 기준으로 큰 도로 먼저", "카페는 외관·내부를 한 번에 확인", "거리 산책은 통행 우선"] },
  { withRoute: true, journey: journeyGwangShort, title: "랜드마크 도보 — 광화문 삼각 루프 50분", summary: "광화문·광장·궁 담장을 잇는 짧은 루프로 사진과 휴식을 나눕니다.", body: "시간이 빠듯할 때 ‘넓게’보다 ‘선명하게’ 한 장면씩 남기는 용도로 좋습니다.", tags: ["광화문권", "사진", "짧은코스"], category_slug: "hot-places", kind: "hot_place", post_format: "route", route_highlights: ["3스팟만 반복 없이 루프", "그늘·벤치를 쉼표로", "담장 라인이 사진 배경으로 안정적"] },
  { withRoute: true, journey: journeyGangnamWalk, title: "혼자 가기 좋은 강남 안전 동선", summary: "밝은 도로변 위주, 골목은 짧게만 들어가는 구성입니다.", body: "야간에도 가로등이 있는 큰 길을 축으로 두면 방향 전환이 단순해집니다.", tags: ["강남역권", "솔로", "야간"], category_slug: "local-tips", kind: "local_tip", post_format: "route", route_highlights: ["큰 길 우선", "골목은 목적지가 보일 때만", "휴식은 카페 실내"] },
  { withRoute: true, journey: journeyGwanghwamunClassic, title: "사진 찍기 좋은 광화문 루트", summary: "광장·동상·궁궐 담장을 프레임 나누기 좋은 순서로 배치했습니다.", body: "인물 사진은 배경이 단순한 순간을 골라 찍고, 풍경은 삼각대 없이도 될 각도를 먼저 찾습니다.", tags: ["광화문권", "사진", "풍경"], category_slug: "local-tips", kind: "local_tip", post_format: "hybrid", route_highlights: ["동상은 기준점 샷", "광장은 넓게", "담장은 대각선 구도"] },
  { withRoute: true, journey: journeyGangnamWalk, title: "강남 감성 카페 코스 — 창가와 실내를 번갈아", summary: "외부 테라스 느낌이 나는 파사드와 실내 좌석을 둘 다 경험합니다.", body: "첫 카페는 밝은 실내, 둘째는 조용한 층을 고르면 피로도가 덜 쌓입니다.", tags: ["강남역권", "카페", "감성"], category_slug: "food", kind: "food", post_format: "route" },
  { withRoute: true, journey: journeyGwangShort, title: "서울 첫날 오전 — 광화문만으로도 충분한 이유", summary: "입국 직후 무리한 이동 대신 광장·궁 일대만 잡아도 체감 만족이 큽니다.", body: "짐이 있으면 반나절 코스는 광장 중심이 피로 대비 효율이 좋습니다.", tags: ["광화문권", "첫날", "오전"], category_slug: "practical", kind: "practical", post_format: "route" },
  { withRoute: true, journey: journeyGangnamWalk, title: "강남역 ‘짧은 산책’ 루트", summary: "1시간 안팎으로 테헤란로 분위기만 담고 돌아오는 코스.", body: "쇼핑몰 안 말고 도보로 ‘거리의 속도감’을 느끼는 데 초점을 둡니다.", tags: ["강남역권", "산책", "짧은코스"], category_slug: "hot-places", kind: "hot_place", post_format: "route" },
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
