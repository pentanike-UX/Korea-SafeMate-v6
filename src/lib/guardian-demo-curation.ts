/**
 * 데모 큐레이션 — 시연 시나리오 종착 하루이(박도윤 mg10)의 영어 본을 매핑.
 * 시드/DB의 한국어 원본은 그대로 두고, 영어 locale에서만 풍부한 영어 카피로 교체.
 *
 * 향후: 다국어 컬럼(`display_name_en`, `headline_en`, `bio_en`)을 DB에 추가하면
 * 이 헬퍼를 제거하고 하루이별 영어 본을 시드/DB에서 직접 관리하면 됩니다.
 */

import type { GuardianProfile } from "@/types/domain";
import type { GuardianMarketingProfile, LocalizedCopy } from "@/types/guardian-marketing";
import type { AppLocale } from "@/i18n/routing";

type GuardianI18nOverlay = {
  display_name?: string;
  headline?: string;
  bio?: string;
  /** 하루이 상세 long_bio 영어 본 (3 문단) */
  long_bio_en?: string;
  /** 시그니처 스타일 영어 본 */
  signature_style_en?: string;
  /** 응답 노트 영어 본 */
  response_note_en?: string;
};

/** mg10 박도윤의 실제 Supabase UUID — `MOCK_GUARDIAN_UUID_MAP.mg10` */
const MG10_UUID = "325e8a02-9683-5a53-8e26-42aca7a8f431";

const DEMO_GUARDIAN_OVERLAYS: Record<string, Partial<Record<AppLocale, GuardianI18nOverlay>>> = {
  // 박도윤 — 데모 시나리오의 종착 하루이
  [MG10_UUID]: {
    en: {
      display_name: "Dohyun Park",
      headline: "Gwanghwamun · Jongno — historic walks for first-day travelers",
      bio: "I lead a walk-first morning around Gwanghwamun Square through Gyeongbokgung — restrooms, queue points, and the right photo angles are mapped in advance. If your first Seoul day stacks meetups, meals, and palace visits, I keep the ground simple: where to stand, what to skip when it's crowded, and a short Plan B when weather turns.",
      long_bio_en:
        "Dohyun focuses on Gwanghwamun, Jongno, and Gyeongbokgung — best fit when your first Seoul day stacks meetups, meals, and palace visits, or when you want a confident first step before walking on your own.\n\nGuidance stays step-by-step: exits, meet points, then the next move. I map restrooms, queue patterns, and good photo angles in advance, so when crowds spike you get a quieter alternative and a simple detour rule — not a long story.\n\nAfter ~7 years in Seoul, I read the same blocks differently by daypart. Expect grounded picks for what works now in this weather and crowd, not generic hype. Walks where you want to go solo are respected; I appear at the connectors.",
      signature_style_en:
        "Dohyun's style: short check-ins, stepwise routes, quieter backups when it's crowded.",
      response_note_en:
        "I aim to reply within 1–2 business days. Share your dates, mood, and party size to get a tailored answer.",
    },
    ja: {
      display_name: "パク・ドユン",
      headline: "光化門・鍾路 — 初めての日に歩く歴史散策",
      bio: "光化門広場から景福宮までの徒歩ルートを、トイレ・待ち列・撮影スポットまで事前に整理してご案内します。",
    },
  },
  // 향후 큐레이션 추가 시 이 객체에 하루이별 항목 추가
};

/** mg10 짧은 식별자도 함께 지원 (URL이 shorthand로 들어왔을 때 fallback) */
const DEMO_GUARDIAN_OVERLAYS_BY_SHORTHAND: Record<string, Partial<Record<AppLocale, GuardianI18nOverlay>>> = {
  mg10: DEMO_GUARDIAN_OVERLAYS[MG10_UUID]!,
};

/**
 * 하루이 프로필을 locale에 맞춰 영어 본으로 덮어쓰기 (큐레이션된 하루이만).
 * 큐레이션되지 않은 하루이가나 한국어 locale은 그대로 반환.
 *
 * 가능하면 마케팅 카피(long_bio / signature_style / response_note)의 `en` 본도 같이 덮어쓴다.
 */
export function applyGuardianDemoCuration<
  T extends Pick<GuardianProfile, "user_id" | "display_name" | "headline" | "bio"> &
    Partial<Pick<GuardianMarketingProfile, "long_bio" | "signature_style" | "response_note">>,
>(guardian: T, locale: string): T {
  if (!locale || locale === "ko") return guardian;
  const overlayByLocale =
    DEMO_GUARDIAN_OVERLAYS[guardian.user_id] ?? DEMO_GUARDIAN_OVERLAYS_BY_SHORTHAND[guardian.user_id];
  if (!overlayByLocale) return guardian;
  const overlay = overlayByLocale[locale as AppLocale] ?? overlayByLocale.en;
  if (!overlay) return guardian;

  const next: T = {
    ...guardian,
    display_name: overlay.display_name ?? guardian.display_name,
    headline: overlay.headline ?? guardian.headline,
    bio: overlay.bio ?? guardian.bio,
  };

  // 마케팅 카피 — `en` 필드만 큐레이션 본으로 덮어쓰기 (ko 본은 그대로 유지)
  const overlayLocalized = (current: LocalizedCopy | undefined, en: string | undefined): LocalizedCopy | undefined => {
    if (!en) return current;
    if (!current) return { ko: en, en };
    return { ...current, en };
  };

  if (overlay.long_bio_en && "long_bio" in guardian) {
    (next as T & { long_bio?: LocalizedCopy }).long_bio = overlayLocalized(guardian.long_bio, overlay.long_bio_en);
  }
  if (overlay.signature_style_en && "signature_style" in guardian) {
    (next as T & { signature_style?: LocalizedCopy }).signature_style = overlayLocalized(
      guardian.signature_style,
      overlay.signature_style_en,
    );
  }
  if (overlay.response_note_en && "response_note" in guardian) {
    (next as T & { response_note?: LocalizedCopy }).response_note = overlayLocalized(
      guardian.response_note,
      overlay.response_note_en,
    );
  }

  return next;
}
