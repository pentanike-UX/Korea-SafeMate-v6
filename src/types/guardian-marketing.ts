import type { LaunchAreaSlug } from "@/types/launch-area";

export type GuardianTrustBadgeId = "verified" | "language_checked" | "reviewed" | "fast_response";

export type LocalizedCopy = { ko: string; en: string };

/** DB/API `public_marketing_overlay` — partial patch onto 시드 기본값 */
export type GuardianPublicMarketingOverlay = {
  short_bio?: LocalizedCopy;
  long_bio?: LocalizedCopy;
  strength_items?: GuardianStrengthItem[];
  trust_reason_items?: GuardianTrustReasonItem[];
  signature_style?: LocalizedCopy;
  representative_post_ids?: string[];
};

export type GuardianStrengthItem = {
  tag: string;
  blurb: LocalizedCopy;
};

export type GuardianTrustReasonItem = {
  badge_id: GuardianTrustBadgeId | null;
  headline: LocalizedCopy;
  detail: LocalizedCopy;
};

export interface GuardianMarketingProfile {
  user_id: string;
  launch_area_slug: LaunchAreaSlug;
  /** K-content & trip themes for matching */
  theme_slugs: string[];
  companion_style_slugs: string[];
  trust_badge_ids: GuardianTrustBadgeId[];
  photo_url: string;
  /** One-line positioning for detail hero */
  positioning: { ko: string; en: string };
  /** Legacy short intro — 상세 본문은 `long_bio` 우선 */
  intro: { ko: string; en: string };
  /** 히어로 한 줄(요약). 없으면 UI에서 `positioning` 사용 */
  short_bio?: LocalizedCopy;
  /** 상세 소개 2~3문단 (`\n\n` 구분) */
  long_bio: LocalizedCopy;
  /** 잘하는 경험 — 태그 + 짧은 설명 */
  strength_items?: GuardianStrengthItem[];
  /** 신뢰 근거 — 배지와 연결 가능한 설명 */
  trust_reason_items?: GuardianTrustReasonItem[];
  /** 동행·설명 톤 한 줄 */
  signature_style: LocalizedCopy;
  recommended_routes: { title: { ko: string; en: string }; blurb: { ko: string; en: string } }[];
  trip_type_labels: { ko: string; en: string }[];
  representative_post_ids: string[];
  /** Typical response time copy */
  response_note: { ko: string; en: string };
  review_count_display: number;
}
