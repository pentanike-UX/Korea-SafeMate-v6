import type { GuardianSeedRow } from "@/data/mock/guardian-seed-types";
import { resolveGuardianDisplayName } from "@/data/mock/guardian-seed-display-names";
import type {
  GuardianMarketingProfile,
  GuardianStrengthItem,
  GuardianTrustBadgeId,
  GuardianTrustReasonItem,
  LocalizedCopy,
} from "@/types/guardian-marketing";

function langLine(row: GuardianSeedRow): string {
  return row.languages.map((l) => l.code.toUpperCase()).join(" · ");
}

function strengthBlurbs(tag: string, row: GuardianSeedRow, name: string): LocalizedCopy {
  const t = tag.toLowerCase();
  if (t.includes("첫") || t.includes("첫날"))
    return {
      ko: "첫날 숙소·역·만남 장소를 한 줄로 잇는 ‘초반 2시간’ 동선을 정리해, 급한 판단을 줄입니다.",
      en: "First-day routing for hotel, station, and meetups—less rushed decisions in the first hours.",
    };
  if (t.includes("지하철") || t.includes("환승") || t.includes("교통"))
    return {
      ko: "환승·개찰구·표지판을 단계로 나눠 설명하고, 대안 노선이 있을 때만 짧게 옵션을 제시합니다.",
      en: "Transfers and exits broken into steps; alternate lines only when they clearly help.",
    };
  if (t.includes("야간") || t.includes("밤"))
    return {
      ko: "밤 이동은 밝은 주요로와 택시 승하차 지점을 기준으로 짧게 잡아, 불안한 구간을 피합니다.",
      en: "Night moves stick to lit arterials and clear taxi pick-up points.",
    };
  if (t.includes("식사") || t.includes("카페") || t.includes("맛"))
    return {
      ko: "웨이팅·예약 가능 여부를 먼저 짚고, 분위기가 비슷한 대안 식당 기준을 함께 적어 둡니다.",
      en: "Queues and booking first, then backup picks with a similar vibe.",
    };
  if (t.includes("촬영") || t.includes("사진") || t.includes("팝"))
    return {
      ko: "촬영지·팝업 동선은 사람 몰리는 시간을 피하고, 사진·이동을 번갈아 가며 피로를 줄입니다.",
      en: "Photo stops balanced with walking; avoids peak crush windows when possible.",
    };
  return {
    ko: `${name}이(가) ${tag} 구간에서 자주 안내하는 패턴을 한두 문장으로 정리해 드립니다. 급하게 결정하지 않아도 되도록 ‘다음 선택지’를 남겨 둡니다.`,
    en: `How ${name} usually guides around ${tag}: a short pattern plus one backup so you are not forced into snap choices.`,
  };
}

function trustItems(row: GuardianSeedRow, name: string): GuardianTrustReasonItem[] {
  const lang = langLine(row);
  const items: GuardianTrustReasonItem[] = [];

  if (row.product_tier === "Elite") {
    items.push({
      badge_id: "verified" as GuardianTrustBadgeId,
      headline: { ko: "검증·운영 기준 충족", en: "Meets verification standards" },
      detail: {
        ko: "프로필과 활동 기록이 플랫폼 기준으로 검토되었습니다. 매칭·동행은 정책 범위 안에서만 제안됩니다.",
        en: "Profile and activity reviewed under platform rules; offers stay within policy.",
      },
    });
  }

  items.push({
    badge_id: "language_checked",
    headline: { ko: `언어: ${lang}`, en: `Languages: ${lang}` },
    detail: {
      ko: "현장에서 한국어와 함께 쓸 표현을 짧게 적어 드리고, 막힐 때 바꿀 말을 미리 짚어 둡니다.",
      en: "Short phrases you can reuse on the spot, plus fallbacks when words fail.",
    },
  });

  items.push({
    badge_id: "reviewed",
    headline: {
      ko: row.avg_traveler_rating != null ? `여행자 평균 ${row.avg_traveler_rating.toFixed(1)}점` : "여행자 피드백 반영",
      en: row.avg_traveler_rating != null ? `Avg. traveler rating ${row.avg_traveler_rating.toFixed(1)}` : "Traveler feedback",
    },
    detail: {
      ko:
        row.avg_traveler_rating != null
          ? `${name}의 최근 동행 피드백이 누적되어 있습니다. 리뷰는 참고 지표이며, 개인 취향은 요청 시 함께 조정합니다.`
          : "매칭·동행이 쌓이면 리뷰가 프로필에 반영됩니다. 지금은 소개·포스트로 스타일을 확인해 주세요.",
      en:
        row.avg_traveler_rating != null
          ? "Recent traveler notes are aggregated; tastes still vary—say yours in the request."
          : "Reviews will appear as matches grow; use posts to sense style for now.",
    },
  });

  if (row.posts_approved_last_30d >= 3) {
    items.push({
      badge_id: "fast_response",
      headline: { ko: "최근 콘텐츠 활동", en: "Recent publishing activity" },
      detail: {
        ko: `최근 30일 승인 포스트 ${row.posts_approved_last_30d}건 — 동선·팁이 글로도 확인 가능합니다.`,
        en: `${row.posts_approved_last_30d} approved posts in 30d; routes and tips are readable before you book.`,
      },
    });
  }

  return items.slice(0, 4);
}

/** 시드 가디언 상세 카피 — 공개 상세·가디언 편집 API와 동일 필드 모델 */
export function buildDetailMarketingForRow(row: GuardianSeedRow): Pick<
  GuardianMarketingProfile,
  | "short_bio"
  | "long_bio"
  | "strength_items"
  | "trust_reason_items"
  | "signature_style"
  | "recommended_routes"
  | "response_note"
> {
  const name = resolveGuardianDisplayName(row.id, row.display_name);
  const tags = row.expertise_tags;
  const tagStr = tags.join(" · ");
  const v = row.profile_image_index % 3;

  const p1_ko = `${name}은(는) 「${row.headline}」을(를) 축으로 ${tagStr} 일대 동선과 만남·이동을 함께 정리합니다. 처음 서울에서 하루 안에 약속·식사·관광이 겹치거나, “어디서부터 걸어야 할지”가 막막한 분과 특히 잘 맞습니다.`;
  const p1_en = `${name} focuses on “${row.headline}” around ${tagStr}. Best fit if your first Seoul day stacks meetups, meals, and moves—or if you want a clear first step before walking solo.`;

  const p2_ko = `안내 방식은 표지판·출구·만남 장소처럼 바로 다음 한 스텝을 먼저 짚는 편입니다. ${row.bio} 붐비는 시간대에는 조용히 쉴 수 있는 대안과, 길이 막혔을 때의 우회 기준을 짧게 남겨 둡니다.`;
  const p2_en = `Guidance stays step-by-step: exits, meet points, then the next move. ${row.bio} During busy windows, you get quieter alternatives and simple detour rules instead of long theory.`;

  const p3_ko =
    v === 0
      ? `${row.years_in_seoul}년 가까이 서울에서 생활하며, 같은 구간이라도 요일·시간대에 따라 달라지는 동선 리듬을 짧게 설명해 드립니다. 과장된 약속 대신 “지금 이 조건에서 현실적인 선택”을 우선합니다.`
      : v === 1
        ? `K-콘텐츠·촬영지를 좋아하는 여행자에게는 장면 분위기와 실제 거리의 거리감을 같이 맞춥니다. 사진만을 위한 동선이 아니라, 발과 일정이 버티는 범위 안에서 움직입니다.`
        : `동행 중에는 질문을 한꺼번에 묻기보다, 필요한 순간에만 확인하는 리듬을 유지합니다. 여행자가 혼자 걷기로 한 구간은 존중하고, 연결 구간만 짧게 보강합니다.`;
  const p3_en =
    v === 0
      ? `After ${row.years_in_seoul} years in Seoul, same blocks feel different by daypart—${name} keeps advice grounded in “what works now,” not hype.`
      : v === 1
        ? `For K-content fans, ${name} aligns scene mood with real walking distance—photos yes, but feet and schedule come first.`
        : `${name} checks in only when needed and respects stretches you want to walk alone—support on the connectors.`;

  const long_bio: LocalizedCopy = {
    ko: [p1_ko, p2_ko, p3_ko].join("\n\n"),
    en: [p1_en, p2_en, p3_en].join("\n\n"),
  };

  const short_bio: LocalizedCopy = {
    ko: row.headline.length > 72 ? `${row.headline.slice(0, 70)}…` : row.headline,
    en: row.headline.length > 88 ? `${row.headline.slice(0, 86)}…` : row.headline,
  };

  const strength_items: GuardianStrengthItem[] = tags.slice(0, 4).map((tag) => ({
    tag,
    blurb: strengthBlurbs(tag, row, name),
  }));

  const signature_style: LocalizedCopy = {
    ko: `${name}의 스타일: 짧은 확인 질문, 단계별 동선, 붐빌 땐 조용한 대안.`,
    en: `${name}: short check-ins, stepwise routes, quieter backups when it’s crowded.`,
  };

  const response_note: LocalizedCopy = {
    ko:
      row.posts_approved_last_30d > 0
        ? "요청 후 검토·연결까지 평일 기준 1~2영업일 안내를 목표로 합니다. 일정·무드·인원을 남겨 주시면 맞춤 응답에 도움이 됩니다."
        : "요청 시 가능한 일정대와 선호 무드를 남겨 주세요. 검토 후 연결까지 시일이 걸릴 수 있습니다.",
    en:
      row.posts_approved_last_30d > 0
        ? "We aim to respond within ~1–2 business days. Dates, mood, and party size help tailor the reply."
        : "Share timing and mood; review and handoff may take a little time.",
  };

  const r1Title = tags[0] ?? "근처";
  const recommended_routes: GuardianMarketingProfile["recommended_routes"] = [
    {
      title: { ko: `${r1Title} 코어 동선`, en: `${r1Title} core loop` },
      blurb: {
        ko: `${r1Title}에서 자주 묻는 만남 장소·식사·이동을 한 번에 잇는 짧은 루프입니다. 첫 방문일 “오늘의 축”을 잡을 때 쓰기 좋습니다.`,
        en: `A short loop tying meetups, bites, and moves in ${r1Title}—a good “spine” for day one.`,
      },
    },
    {
      title: { ko: "피크 시간 피하기", en: "Skipping peak crush" },
      blurb: {
        ko: "점심·저녁 전후, 주말 오후처럼 사람이 몰리는 창구를 피해 동선을 바꾸는 기준을 짧게 정리합니다.",
        en: "Simple rules to shift timing around lunch, dinner, and weekend peaks.",
      },
    },
  ];

  return {
    short_bio,
    long_bio,
    strength_items,
    trust_reason_items: trustItems(row, name),
    signature_style,
    recommended_routes,
    response_note,
  };
}
