import type { TravelerReview } from "@/types/domain";
import { timeLabelJaFromKo } from "@/lib/traveler-review-time-labels";

type Seed = {
  tid: string;
  bid: string;
  iso: string;
  rating: number;
  comment: string | null;
  comment_en?: string | null;
  reviewer_display_name?: string;
  time_label_ko?: string;
  time_label_en?: string;
  time_label_ja?: string;
  image_url?: string | null;
  help_tag_ids?: string[];
};

function toReview(guardian_user_id: string, s: Seed, idx: number): TravelerReview {
  return {
    id: `tr-${guardian_user_id}-${String(idx).padStart(2, "0")}`,
    booking_id: s.bid,
    traveler_user_id: s.tid,
    guardian_user_id,
    rating: s.rating,
    comment: s.comment,
    comment_en: s.comment_en ?? null,
    created_at: s.iso,
    reviewer_display_name: s.reviewer_display_name,
    time_label_ko: s.time_label_ko,
    time_label_en: s.time_label_en,
    time_label_ja: s.time_label_ja ?? timeLabelJaFromKo(s.time_label_ko),
    image_url: s.image_url ?? null,
    help_tag_ids: s.help_tag_ids,
  };
}

/** 품질 고정: 홈 상단 3장 */
export const TRAVELER_REVIEW_HOME_IDS = ["tr-mg14-01", "tr-mg15-01", "tr-mg13-01"] as const;

const S_MG10: Seed[] = [
  {
    tid: "tv-mg10-a",
    bid: "bk-mg10-01",
    iso: "2026-02-20T10:00:00.000Z",
    rating: 5,
    reviewer_display_name: "Yuki · Tokyo",
    time_label_ko: "지난달",
    time_label_en: "Last month",
    comment:
      "광화문 일대가 처음이라 출구만 봐도 긴장됐는데, 만남 지점을 ‘땅에 붙은 표지판 기준’으로 짚어 주셔서 금방 안정됐어요. 궁궐 쪽은 사람 몰리는 시간을 피해 산책 동선을 잡아 주셔서 부모님도 무리 없이 다녀왔습니다.",
    comment_en:
      "First time near Gwanghwamun—I was stressed about exits until meet-up landmarks were grounded in real signage. For the palace route we dodged crush hours so my parents could walk comfortably.",
    help_tag_ids: ["routeEasy", "calming"],
    image_url: "/mock/posts/광화문_008.jpg",
  },
  {
    tid: "tv-mg10-b",
    bid: "bk-mg10-02",
    iso: "2026-02-08T14:20:00.000Z",
    rating: 5,
    reviewer_display_name: "Marc · Montréal",
    time_label_ko: "5주 전",
    time_label_en: "5 weeks ago",
    comment:
      "비가 갑자기 왔을 때 실내로 옮길 카페와 우산 쓰고 이동할 짧은 구간을 바로 제시해 줘서 일정이 안 무너졌어요. 설명이 길지 않고 ‘지금 이 선택이 왜 안전한지’만 짧게 말해 주는 스타일이 신뢰가 됐습니다.",
    comment_en:
      "When rain hit, I got an indoor café plus a short covered walk so the day didn’t collapse. Explanations stayed tight—just why each option was safe—which built trust fast.",
    help_tag_ids: ["flexPlan", "explainSimple"],
  },
  {
    tid: "tv-mg10-c",
    bid: "bk-mg10-03",
    iso: "2026-01-25T09:00:00.000Z",
    rating: 4,
    reviewer_display_name: "Hannah · UK",
    time_label_ko: "2달 전",
    time_label_en: "2 months ago",
    comment:
      "사진 포인트만 나열하지 않고, 주거 골목에서는 소음·예절을 먼저 짚어 준 점이 좋았어요. 제가 길을 잘못 들었을 때도 당황하지 않게 ‘원점 회기’ 동선을 알려 줘서 혼자 걷는 부담이 확 줄었습니다.",
    comment_en:
      "Not just photo spots—residential alleys started with noise and etiquette. When I took a wrong turn, the ‘reset’ route back removed a lot of solo-travel anxiety.",
    help_tag_ids: ["manners", "calming"],
    image_url: "/mock/posts/광화문_028.jpg",
  },
  {
    tid: "tv-mg10-d",
    bid: "bk-mg10-04",
    iso: "2026-01-12T16:40:00.000Z",
    rating: 5,
    reviewer_display_name: "Sora · Osaka",
    time_label_ko: "2달 전",
    time_label_en: "2 months ago",
    comment:
      "한자 표기가 비슷한 역 이름 때문에 헷갈렸는데, 표지판에서 어디를 먼저 읽으면 되는지 순서를 알려 주셔서 금방 적응했어요. 야간에는 밝은 대로만 잡아 주신 덕분에 첫날 밤 이동이 덜 무서웠습니다.",
    comment_en:
      "Similar kanji station names confused me—reading order on signs fixed that. Night routing stayed on lit arterials, so first-night moves felt less scary.",
    help_tag_ids: ["languageBridge", "routeEasy"],
  },
  {
    tid: "tv-mg10-e",
    bid: "bk-mg10-05",
    iso: "2025-12-30T11:10:00.000Z",
    rating: 4,
    reviewer_display_name: "Leo · Berlin",
    time_label_ko: "3달 전",
    time_label_en: "3 months ago",
    comment:
      "역사 이야기가 교과서식이 아니라 ‘지금 서 있는 위치’와 연결돼 있어서 기억에 남아요. 일정이 한 시간 밀렸을 때도 다음 구간만 줄여서 현실적으로 마무리하게 도와주셨습니다.",
    comment_en:
      "History tied to where we stood—not textbook mode. When we slipped an hour, we trimmed the next segment and still finished realistically.",
    help_tag_ids: ["localDepth", "flexPlan"],
  },
];

const S_MG11: Seed[] = [
  {
    tid: "tv-mg11-a",
    bid: "bk-mg11-01",
    iso: "2026-02-18T08:30:00.000Z",
    rating: 4,
    reviewer_display_name: "Noah · Sydney",
    time_label_ko: "지난달",
    time_label_en: "Last month",
    comment:
      "한강 노을 시간에 바람이 강하게 불었는데, 바람 막히는 쪽 벤치와 화장실·물 위치를 미리 짚어 줘서 덜 피곤했어요. ‘사진 찍고 쉬고’ 리듬으로 움직여서 발이 덜 아팠습니다.",
    comment_en:
      "Strong wind at sunset—got a sheltered bench plus toilets/water upfront. A shoot-rest rhythm kept my feet happier.",
    help_tag_ids: ["photoFriendly", "routeEasy"],
    image_url: "/mock/posts/강남_020.jpg",
  },
  {
    tid: "tv-mg11-b",
    bid: "bk-mg11-02",
    iso: "2026-02-11T13:00:00.000Z",
    rating: 5,
    reviewer_display_name: "Irene · Singapore",
    time_label_ko: "5주 전",
    time_label_en: "5 weeks ago",
    comment:
      "짧은 동행이라 부담 없이 신청했는데, 목적지·화장실·물 같은 기본을 빠짐없이 챙겨 주셔서 마음이 편했어요. 영어로 짧게 확인해 주시는 패턴이 여행 내내 통했습니다.",
    comment_en:
      "Short companion slot—still covered basics (goal, toilets, water) thoroughly. Quick English check-ins worked the whole trip.",
    help_tag_ids: ["calming", "languageBridge"],
  },
  {
    tid: "tv-mg11-c",
    bid: "bk-mg11-03",
    iso: "2026-01-28T17:20:00.000Z",
    rating: 4,
    reviewer_display_name: "Chris · US",
    time_label_ko: "2달 전",
    time_label_en: "2 months ago",
    comment:
      "합정·망원 골목이 복잡한데, 랜드마크 기준으로만 설명해 줘서 지도 앱과 같이 보기 쉬웠어요. 혼자 여행이라 말 걸기 부담될 때도 먼저 템포를 맞춰 주셔서 편했습니다.",
    comment_en:
      "Hapjeong/Mangwon alleys—landmark-first directions synced well with maps. Solo traveler; pacing matched before I had to ask.",
    help_tag_ids: ["routeEasy", "vibeMatch"],
  },
  {
    tid: "tv-mg11-d",
    bid: "bk-mg11-04",
    iso: "2026-01-15T10:45:00.000Z",
    rating: 5,
    reviewer_display_name: "Amélie · Paris",
    time_label_ko: "2달 전",
    time_label_en: "2 months ago",
    comment:
      "예상보다 훨씬 세심했어요. 대기가 길어질 법한 식당 전에 대안 이름을 미리 적어 주셔서 선택지가 생겼습니다. 분위기 큐레이션이 과하지 않고 제 속도에 맞았습니다.",
    comment_en:
      "More thoughtful than expected—backup restaurant names before queues. Vibe curation matched my pace without being extra.",
    help_tag_ids: ["curated", "flexPlan"],
  },
  {
    tid: "tv-mg11-e",
    bid: "bk-mg11-05",
    iso: "2025-12-22T12:00:00.000Z",
    rating: 4,
    reviewer_display_name: "Tom · UK",
    time_label_ko: "3달 전",
    time_label_en: "3 months ago",
    comment:
      "한강 코스에서 ‘어디서부터 사진을 찍을지’만이 아니라, 사람 흐름이 어디서 꼬이는지 짚어 줘서 시간 낭비가 줄었습니다. 응답이 빨라서 당일 변경도 부담이 적었어요.",
    comment_en:
      "Han River route—called out crowd pinch points, not just photo spots. Fast replies made same-day tweaks easy.",
    help_tag_ids: ["fastResponse", "photoFriendly"],
  },
  {
    tid: "tv-mg11-f",
    bid: "bk-mg11-06",
    iso: "2025-12-05T09:15:00.000Z",
    rating: 5,
    reviewer_display_name: "Min · Seoul visitor",
    time_label_ko: "4달 전",
    time_label_en: "4 months ago",
    comment:
      "첫 방문이라 질문이 많았는데, 같은 질문도 짜증 없이 다른 표현으로 다시 설명해 주셨어요. 야간 이동은 택시 승차 위치까지 사진으로 남겨 주셔서 현장에서 헤매지 않았습니다.",
    comment_en:
      "Lots of first-visit questions—answered again in new wording without friction. Night rides included a photo of the taxi pick-up point.",
    help_tag_ids: ["explainSimple", "calming"],
    image_url: "/mock/posts/강남_011.jpg",
  },
];

const S_MG12: Seed[] = [
  {
    tid: "tv-mg12-a",
    bid: "bk-mg12-01",
    iso: "2026-02-22T11:00:00.000Z",
    rating: 5,
    reviewer_display_name: "Elena · Madrid",
    time_label_ko: "2주 전",
    time_label_en: "2 weeks ago",
    comment:
      "신촌 대학가 밀집 구간을 피해 조용히 앉을 카페를 제안해 주셔서 쉬는 시간이 진짜 쉼이 됐어요. 메뉴판이 한글만 있어도 주문 순서를 단계로 나눠 설명해 줘서 부담이 확 줄었습니다.",
    comment_en:
      "Escaped the crush for a quiet café—rest felt like rest. Korean-only menus became step-by-step ordering, less stress.",
    help_tag_ids: ["explainSimple", "curated"],
    image_url: "/mock/posts/강남_004.jpg",
  },
  {
    tid: "tv-mg12-b",
    bid: "bk-mg12-02",
    iso: "2026-02-14T15:30:00.000Z",
    rating: 4,
    reviewer_display_name: "James · NYC",
    time_label_ko: "3주 전",
    time_label_en: "3 weeks ago",
    comment:
      "식당 동선이 실용적이었고 설명 투어라기보다 실행 위주로 맞춰 주셔서 좋았어요. 웨이팅이 길어질 때 대체 식당 기준이 분위기·가격대까지 비슷하게 잡혀 있어 선택이 쉬웠습니다.",
    comment_en:
      "Practical food routing—execution-first, not a lecture tour. Backup picks matched vibe and price when queues grew.",
    help_tag_ids: ["curated", "flexPlan"],
  },
  {
    tid: "tv-mg12-c",
    bid: "bk-mg12-03",
    iso: "2026-02-03T12:00:00.000Z",
    rating: 5,
    reviewer_display_name: "Sofia · Milan",
    time_label_ko: "지난달",
    time_label_en: "Last month",
    comment:
      "길을 잃었을 때 ‘지금 위치에서 가장 안전한 되돌아가기’를 먼저 알려 주셔서 패닉이 안 왔어요. 그 다음에 목적지 재설정을 도와주셔서 흐름이 자연스러웠습니다.",
    comment_en:
      "When I got lost, ‘safest way back from here’ came first—no panic—then we re-aimed the destination smoothly.",
    help_tag_ids: ["calming", "routeEasy"],
  },
  {
    tid: "tv-mg12-d",
    bid: "bk-mg12-04",
    iso: "2026-01-20T18:00:00.000Z",
    rating: 5,
    reviewer_display_name: "Anna · Warsaw",
    time_label_ko: "2달 전",
    time_label_en: "2 months ago",
    comment:
      "지역 이해도가 높아서 ‘왜 이 시간대는 이쪽이 덜 붐비는지’ 설명이 설득력 있었어요. 카페 큐레이션이 인스타용이 아니라 앉아서 쉴 수 있는 의자·콘센트 기준이라 현실적이었습니다.",
    comment_en:
      "Strong local read—why a time slot is calmer felt convincing. Café picks prioritized seating/outlets, not just Instagram.",
    help_tag_ids: ["localDepth", "curated"],
  },
  {
    tid: "tv-mg12-e",
    bid: "bk-mg12-05",
    iso: "2026-01-08T10:20:00.000Z",
    rating: 5,
    reviewer_display_name: "Diego · Mexico City",
    time_label_ko: "2달 전",
    time_label_en: "2 months ago",
    comment:
      "언어 장벽을 줄여 주는 방식이 과잉 번역이 아니라 ‘현장에서 바로 쓸 한 줄’ 위주라 외웠다가 써먹기 좋았어요. 응답 속도도 빨라서 당일 약속 변경이 부담스럽지 않았습니다.",
    comment_en:
      "Language help was one-liners you can reuse on the spot—not over-translation. Fast replies made same-day changes easy.",
    help_tag_ids: ["languageBridge", "fastResponse"],
  },
  {
    tid: "tv-mg12-f",
    bid: "bk-mg12-06",
    iso: "2025-12-18T14:00:00.000Z",
    rating: 4,
    reviewer_display_name: "Linh · HCMC",
    time_label_ko: "3달 전",
    time_label_en: "3 months ago",
    comment:
      "일정이 바뀌었는데 유연하게 대응해 주셔서 감사했어요. 새 시간대에 맞춰 ‘배고프지 않게’ 간단히 먹을 곳만 먼저 잡고 본 일정으로 넘어가게 정리해 주셨습니다.",
    comment_en:
      "Plans shifted—flexible replan. New slot started with a quick bite plan so we weren’t hangry before the main stretch.",
    help_tag_ids: ["flexPlan", "calming"],
    image_url: "/mock/posts/강남_018.jpg",
  },
  {
    tid: "tv-mg12-g",
    bid: "bk-mg12-07",
    iso: "2025-11-30T09:45:00.000Z",
    rating: 5,
    reviewer_display_name: "Kate · Melbourne",
    time_label_ko: "4달 전",
    time_label_en: "4 months ago",
    comment:
      "혼자 여행하는 부담이 줄었어요. 사람 많은 횡단보너 앞에서 잠깐 멈출 때도 ‘지금은 여기까지’라고 범위를 말해 주셔서 통제감이 생겼습니다.",
    comment_en:
      "Solo-travel weight lifted—at busy crossings, naming ‘how far we go now’ gave me a sense of control.",
    help_tag_ids: ["calming", "routeEasy"],
  },
];

const S_MG13: Seed[] = [
  {
    tid: "tv-mg13-a",
    bid: "bk-mg13-01",
    iso: "2026-02-25T10:00:00.000Z",
    rating: 5,
    reviewer_display_name: "Oliver · London",
    time_label_ko: "1주 전",
    time_label_en: "1 week ago",
    comment:
      "용산·삼각지처럼 역사와 쇼핑몰이 겹치는 구간에서 짐이 많을 때와 가벼울 때 동선을 나눠 추천해 주신 게 정확했어요. 지하 연결 통로 어느 쪽이 덜 굽이치는지도 짚어 줘서 이동이 빨라졌습니다.",
    comment_en:
      "Yongsan/Samgakji—different routes for heavy bags vs light. Which underground link had fewer turns—spot on.",
    help_tag_ids: ["routeEasy", "localDepth"],
    image_url: "/mock/posts/광화문_012.jpg",
  },
  {
    tid: "tv-mg13-b",
    bid: "bk-mg13-02",
    iso: "2026-02-17T13:20:00.000Z",
    rating: 5,
    reviewer_display_name: "Priya · Mumbai",
    time_label_ko: "2주 전",
    time_label_en: "2 weeks ago",
    comment:
      "실용 정보만 쏟아내는 스타일인데도 톤이 부드러워서 부담이 없었어요. 영어·일본어 표현을 섞어 주셔서 현장에서 바로 써먹기 좋았습니다.",
    comment_en:
      "Practical dumps but gentle tone. Mixed EN/JP phrases I could use immediately on the ground.",
    help_tag_ids: ["languageBridge", "explainSimple"],
  },
  {
    tid: "tv-mg13-c",
    bid: "bk-mg13-03",
    iso: "2026-02-09T08:50:00.000Z",
    rating: 4,
    reviewer_display_name: "Felix · Zürich",
    time_label_ko: "3주 전",
    time_label_en: "3 weeks ago",
    comment:
      "비가 왔을 때 실내 동선으로 자연스럽게 이어지는 쇼핑·휴식 루프를 제안해 줬어요. 예상보다 세심하게 ‘젖지 않게’ 우선순위를 정리해 주셨습니다.",
    comment_en:
      "Rain day became an indoor loop of shops/rest—thoughtful ‘stay dry first’ prioritization.",
    help_tag_ids: ["flexPlan", "curated"],
  },
  {
    tid: "tv-mg13-d",
    bid: "bk-mg13-04",
    iso: "2026-01-30T16:00:00.000Z",
    rating: 5,
    reviewer_display_name: "Nina · Stockholm",
    time_label_ko: "지난달",
    time_label_en: "Last month",
    comment:
      "초행자에게 안심이 됐어요. 첫 이동에서 ‘무엇을 확인하면 실수가 줄어드는지’ 체크리스트처럼 짧게 알려 주셔서 이후 며칠도 혼자 다닐 때 참고했습니다.",
    comment_en:
      "Reassuring for a first-timer—a short checklist for the first move helped me solo the next days too.",
    help_tag_ids: ["calming", "explainSimple"],
  },
  {
    tid: "tv-mg13-e",
    bid: "bk-mg13-05",
    iso: "2026-01-18T11:30:00.000Z",
    rating: 5,
    reviewer_display_name: "Wei · Shanghai",
    time_label_ko: "2달 전",
    time_label_en: "2 months ago",
    comment:
      "동선 설명이 쉬웠고 지도 앱 좌표와 실제 출구가 어긋날 때 바로 보정해 주셨어요. 사진 찍기 좋은 스팟은 사람이 몰리기 전 시간대를 같이 잡아 줬습니다.",
    comment_en:
      "Clear routing—when the map pin and exit misaligned, quick correction. Photo spots paired with pre-crowd timing.",
    help_tag_ids: ["routeEasy", "photoFriendly"],
  },
  {
    tid: "tv-mg13-f",
    bid: "bk-mg13-06",
    iso: "2026-01-05T14:10:00.000Z",
    rating: 4,
    reviewer_display_name: "Jon · Seattle",
    time_label_ko: "2달 전",
    time_label_en: "2 months ago",
    comment:
      "분위기가 잘 맞았어요. 제가 조용한 편인데 말을 많이 강요하지 않고 필요한 순간에만 질문을 던져 주셨습니다.",
    comment_en:
      "Vibe match—I’m quiet; no forced chatter, questions only when needed.",
    help_tag_ids: ["vibeMatch", "calming"],
  },
  {
    tid: "tv-mg13-g",
    bid: "bk-mg13-07",
    iso: "2025-12-28T09:00:00.000Z",
    rating: 5,
    reviewer_display_name: "Camille · Lyon",
    time_label_ko: "3달 전",
    time_label_en: "3 months ago",
    comment:
      "응답이 빨랐어요. 전날 밤에 일정이 바뀌었는데도 아침까지 대안 동선을 정리해 주셔서 감사했습니다.",
    comment_en:
      "Fast responses—late-night plan change, still got a clean alternate route by morning.",
    help_tag_ids: ["fastResponse", "flexPlan"],
  },
  {
    tid: "tv-mg13-h",
    bid: "bk-mg13-08",
    iso: "2025-12-10T12:40:00.000Z",
    rating: 4,
    reviewer_display_name: "Ravi · Bengaluru",
    time_label_ko: "4달 전",
    time_label_en: "4 months ago",
    comment:
      "지역 이해도가 높았고, ‘관광객 루트 vs 현지인이 피하는 구간’을 균형 있게 알려 주셨어요. 과장 없이 솔직한 편이라 신뢰가 갔습니다.",
    comment_en:
      "High local literacy—balanced tourist vs avoid zones. Honest, not hype—trusted that.",
    help_tag_ids: ["localDepth", "calming"],
    image_url: "/mock/posts/광화문_031.jpg",
  },
];

const S_MG14: Seed[] = [
  {
    tid: "tv-mg14-a",
    bid: "bk-mg14-01",
    iso: "2026-02-26T09:00:00.000Z",
    rating: 5,
    reviewer_display_name: "Mina · LA",
    time_label_ko: "이번 주",
    time_label_en: "This week",
    comment:
      "북촌·삼청 골목에서 촬영 매너를 먼저 맞춰 주셔서 주민분께 피해가 가지 않게 움직일 수 있었어요. 햇살 각도에 따라 붐비지 않는 시간대를 제안해 줘서 사진도 여유 있게 찍었습니다.",
    comment_en:
      "Bukchon/Samcheong—photo etiquette first, respectful moves. Sun-angle timing avoided crush; shots felt unhurried.",
    help_tag_ids: ["manners", "photoFriendly"],
    image_url: "/mock/posts/광화문_041.jpg",
  },
  {
    tid: "tv-mg14-b",
    bid: "bk-mg14-02",
    iso: "2026-02-19T15:00:00.000Z",
    rating: 5,
    reviewer_display_name: "Claire · Vancouver",
    time_label_ko: "2주 전",
    time_label_en: "2 weeks ago",
    comment:
      "첫날이 한결 편했어요. 교통과 만남 장소가 분명해서 마음이 놓였고, 프랑스어로 짧게 확인해 주시는 표현도 적어 주셨습니다.",
    comment_en:
      "First day felt manageable—clear transit and meetups; even short FR phrases jotted for me.",
    help_tag_ids: ["routeEasy", "languageBridge", "calming"],
  },
  {
    tid: "tv-mg14-c",
    bid: "bk-mg14-03",
    iso: "2026-02-10T12:00:00.000Z",
    rating: 5,
    reviewer_display_name: "t9",
    time_label_ko: "3주 전",
    time_label_en: "3 weeks ago",
    comment:
      "김서호 님과 북촌 일대를 첫날에 잡았는데, 골목 예절부터 짚어 주셔서 주민분께 피해 없이 움직일 수 있었어요. 지하철·만남 장소도 표지판 기준으로 명확해서 길 잃을 틈이 없었습니다.",
    comment_en:
      "First-day Bukchon—etiquette first so we moved respectfully; stations/meetups tied to clear signage—hard to get lost.",
    help_tag_ids: ["routeEasy", "explainSimple", "manners"],
  },
  {
    tid: "tv-mg14-d",
    bid: "bk-mg14-04",
    iso: "2026-01-28T10:00:00.000Z",
    rating: 5,
    reviewer_display_name: "Giulia · Rome",
    time_label_ko: "지난달",
    time_label_en: "Last month",
    comment:
      "사진·산책·분위기 큐레이션이 한 흐름으로 이어졌어요. 촬영지만 찍고 끝이 아니라 그 다음에 쉴 벤치까지 연결해 주셔서 발이 덜 아팠습니다.",
    comment_en:
      "Photo, walk, vibe flowed as one arc—not just a shoot-then-stop, a bench came next.",
    help_tag_ids: ["photoFriendly", "curated", "routeEasy"],
    image_url: "/mock/posts/광화문_039.jpg",
  },
  {
    tid: "tv-mg14-e",
    bid: "bk-mg14-05",
    iso: "2026-01-14T17:30:00.000Z",
    rating: 4,
    reviewer_display_name: "t7",
    time_label_ko: "2달 전",
    time_label_en: "2 months ago",
    comment:
      "공항·엘리베이터 동선까지 세심하게 챙겨 주셔서 가족 이동이 편했습니다.",
    comment_en:
      "Airport and elevator details—made family moves easier.",
    help_tag_ids: ["calming", "routeEasy"],
  },
  {
    tid: "tv-mg14-f",
    bid: "bk-mg14-06",
    iso: "2026-01-02T11:00:00.000Z",
    rating: 5,
    reviewer_display_name: "Emma · Dublin",
    time_label_ko: "2달 전",
    time_label_en: "2 months ago",
    comment:
      "예상보다 훨씬 세심했어요. 비 오는 날 실내 전시와 산책로를 번갈아 제안해 주셔서 우산만 들고 헤매지 않았습니다.",
    comment_en:
      "More thoughtful than expected—rain day alternated indoor exhibits and walks, no umbrella wandering.",
    help_tag_ids: ["flexPlan", "curated"],
  },
  {
    tid: "tv-mg14-g",
    bid: "bk-mg14-07",
    iso: "2025-12-20T13:20:00.000Z",
    rating: 5,
    reviewer_display_name: "Henrik · Oslo",
    time_label_ko: "3달 전",
    time_label_en: "3 months ago",
    comment:
      "혼자 여행하는 부담이 줄었습니다. 골목에서 사람이 갑자기 몰릴 때 잠깐 옆 골목으로 빼 주시는 ‘호흡’을 알려 주셨어요.",
    comment_en:
      "Less solo anxiety—when alleys suddenly packed, a short ‘breather’ side lane trick.",
    help_tag_ids: ["calming", "localDepth"],
  },
  {
    tid: "tv-mg14-h",
    bid: "bk-mg14-08",
    iso: "2025-12-01T09:40:00.000Z",
    rating: 5,
    reviewer_display_name: "Aya · Fukuoka",
    time_label_ko: "4달 전",
    time_label_en: "4 months ago",
    comment:
      "언어 장벽을 줄여 주는 방식이 자연스러웠어요. 한국어 문장을 너무 길게 외우게 하지 않고, 상황별로 두 세 단어만 반복하게 해 주셨습니다.",
    comment_en:
      "Language help felt natural—repeat two-three words per situation instead of long memorization.",
    help_tag_ids: ["languageBridge", "explainSimple"],
  },
  {
    tid: "tv-mg14-i",
    bid: "bk-mg14-09",
    iso: "2025-11-15T14:00:00.000Z",
    rating: 4,
    reviewer_display_name: "Lucas · São Paulo",
    time_label_ko: "4달 전",
    time_label_en: "4 months ago",
    comment:
      "일정이 바뀌었는데 유연하게 대응해 주셨고, 새 동선에서도 사진 포인트를 과하지 않게 유지해 주셨습니다.",
    comment_en:
      "Flexible when plans shifted; photo stops stayed tasteful on the new route too.",
    help_tag_ids: ["flexPlan", "photoFriendly"],
  },
];

const S_MG15: Seed[] = [
  {
    tid: "tv-mg15-a",
    bid: "bk-mg15-01",
    iso: "2026-02-24T10:30:00.000Z",
    rating: 5,
    reviewer_display_name: "Zoe · Toronto",
    time_label_ko: "1주 전",
    time_label_en: "1 week ago",
    comment:
      "쇼핑이든 전시든 ‘오늘 하루 무리 없이 끝내기’ 기준으로 짧은 리포트를 주셔서 결정 피로가 줄었어요. 이탈·휴식 타이밍을 명확히 말해 주셔서 몸이 버텼습니다.",
    comment_en:
      "Shopping or exhibits—‘finish the day without overload’ briefs cut decision fatigue. Clear break windows saved my body.",
    help_tag_ids: ["curated", "calming"],
    image_url: "/mock/posts/강남_030.jpg",
  },
  {
    tid: "tv-mg15-b",
    bid: "bk-mg15-02",
    iso: "2026-02-16T11:00:00.000Z",
    rating: 5,
    reviewer_display_name: "Ben · Chicago",
    time_label_ko: "2주 전",
    time_label_en: "2 weeks ago",
    comment:
      "동선 설명이 쉬웠고, 큰 도로와 조용한 골목을 번갈아 가며 체력을 맞춰 주셨어요. 응답이 빨라서 당일 예약 확인도 빠르게 마무리됐습니다.",
    comment_en:
      "Easy routing—alternated main roads and quiet alleys for stamina. Fast replies, same-day booking checks landed quickly.",
    help_tag_ids: ["routeEasy", "fastResponse"],
  },
  {
    tid: "tv-mg15-c",
    bid: "bk-mg15-03",
    iso: "2026-02-08T09:15:00.000Z",
    rating: 5,
    reviewer_display_name: "Chloe · Auckland",
    time_label_ko: "3주 전",
    time_label_en: "3 weeks ago",
    comment:
      "지역 이해도가 높았어요. ‘지금 이 구역은 왜 사람이 몰리는지’를 짧게 설명해 주셔서 굳이 들어가지 않아도 됐습니다.",
    comment_en:
      "Strong local read—why a block was crowded—saved me from walking into it blindly.",
    help_tag_ids: ["localDepth", "routeEasy"],
  },
  {
    tid: "tv-mg15-d",
    bid: "bk-mg15-04",
    iso: "2026-01-29T16:45:00.000Z",
    rating: 4,
    reviewer_display_name: "Sam · Austin",
    time_label_ko: "지난달",
    time_label_en: "Last month",
    comment:
      "분위기가 잘 맞았고 유머도 과하지 않았어요. 길을 잃었을 때 지도 앱과 실제 건물 번호를 같이 대조해 주셔서 금방 찾았습니다.",
    comment_en:
      "Vibe match, light humor. When lost, cross-checked the app with building numbers—found fast.",
    help_tag_ids: ["vibeMatch", "routeEasy"],
  },
  {
    tid: "tv-mg15-e",
    bid: "bk-mg15-05",
    iso: "2026-01-17T13:00:00.000Z",
    rating: 5,
    reviewer_display_name: "Julia · Berlin",
    time_label_ko: "2달 전",
    time_label_en: "2 months ago",
    comment:
      "카페·산책 큐레이션이 좋았어요. 각 구간마다 ‘여기서 무엇을 느끼면 좋은지’ 한 문장씩만 덧붙여 주셔서 여행이 풍부해졌습니다.",
    comment_en:
      "Great café/walk curation—one sentence per stop on what to notice enriched the day.",
    help_tag_ids: ["curated", "localDepth"],
  },
  {
    tid: "tv-mg15-f",
    bid: "bk-mg15-06",
    iso: "2026-01-06T10:00:00.000Z",
    rating: 5,
    reviewer_display_name: "Matt · Denver",
    time_label_ko: "2달 전",
    time_label_en: "2 months ago",
    comment:
      "초행자에게 안심이 됐어요. 첫 만남에서 비상 연락·화장실·현금 사용처만 먼저 정리해 주셔서 이후 혼자 이동할 때도 기준이 생겼습니다.",
    comment_en:
      "Reassuring—first meet covered emergency contact, toilets, cash spots—baseline for solo legs later.",
    help_tag_ids: ["calming", "explainSimple"],
  },
  {
    tid: "tv-mg15-g",
    bid: "bk-mg15-07",
    iso: "2025-12-27T12:30:00.000Z",
    rating: 5,
    reviewer_display_name: "Ingrid · Copenhagen",
    time_label_ko: "3달 전",
    time_label_en: "3 months ago",
    comment:
      "사진 찍기 좋았고, 사람 배경이 어수선할 때는 프레임을 바꿔 주셔서 결과물이 깔끔했어요.",
    comment_en:
      "Great photos—when backgrounds got messy, reframed cleanly.",
    help_tag_ids: ["photoFriendly", "curated"],
    image_url: "/mock/posts/강남_027.jpg",
  },
  {
    tid: "tv-mg15-h",
    bid: "bk-mg15-08",
    iso: "2025-12-14T09:00:00.000Z",
    rating: 5,
    reviewer_display_name: "Paul · Brussels",
    time_label_ko: "3달 전",
    time_label_en: "3 months ago",
    comment:
      "비가 왔는데 대안을 잘 제안해 줬어요. 실내 전시와 짧은 실외만 섞어서 신발이 젖지 않게 끝냈습니다.",
    comment_en:
      "Rain plan worked—indoor exhibits plus tiny outdoor bits—finished with dry shoes.",
    help_tag_ids: ["flexPlan", "curated"],
  },
  {
    tid: "tv-mg15-i",
    bid: "bk-mg15-09",
    iso: "2025-11-28T15:20:00.000Z",
    rating: 5,
    reviewer_display_name: "Yara · Dubai",
    time_label_ko: "4달 전",
    time_label_en: "4 months ago",
    comment:
      "설명이 쉬웠어요. 복잡한 환승도 표로 한 번만 그려 주시고 이후에는 현장에서 확인하는 리듬으로 맞춰 주셨습니다.",
    comment_en:
      "Easy explanations—complex transfer drawn once in a mini table, then field-check rhythm.",
    help_tag_ids: ["explainSimple", "routeEasy"],
  },
  {
    tid: "tv-mg15-j",
    bid: "bk-mg15-10",
    iso: "2025-11-10T11:50:00.000Z",
    rating: 4,
    reviewer_display_name: "Victor · Madrid",
    time_label_ko: "4달 전",
    time_label_en: "4 months ago",
    comment:
      "전시 큐레이션과 쇼핑 동선을 같은 날 섞지 않고 반나절씩 나눠 주신 덕분에 집중이 유지됐어요. 마지막에 짧은 산책으로 마무리해 주셔서 좋았습니다.",
    comment_en:
      "Split exhibits and shopping into half-days—focus held. Short closing walk was a nice seal.",
    help_tag_ids: ["curated", "routeEasy"],
  },
];

function pack(gid: string, seeds: Seed[]): TravelerReview[] {
  return seeds.map((s, i) => toReview(gid, s, i + 1));
}

/** 홈/마케팅용 스포트라이트 순서 */
const byHomeOrder = (list: TravelerReview[]): TravelerReview[] => {
  const map = new Map(list.map((r) => [r.id, r]));
  const first = TRAVELER_REVIEW_HOME_IDS.map((id) => map.get(id)).filter(Boolean) as TravelerReview[];
  const rest = list.filter((r) => !TRAVELER_REVIEW_HOME_IDS.includes(r.id as (typeof TRAVELER_REVIEW_HOME_IDS)[number]));
  return [...first, ...rest];
};

const MG10 = pack("mg10", S_MG10);
const MG11 = pack("mg11", S_MG11);
const MG12 = pack("mg12", S_MG12);
const MG13 = pack("mg13", S_MG13);
const MG14 = byHomeOrder(pack("mg14", S_MG14));
const MG15 = pack("mg15", S_MG15);

export const mockTravelerReviewsBuilt: TravelerReview[] = [...MG14, ...MG15, ...MG13, ...MG12, ...MG11, ...MG10];
