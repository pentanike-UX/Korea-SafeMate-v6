import type { ContentPostHeroSubject } from "@/types/domain";

/** AI(또는 mock)가 제안하는 초안 — 승인 전까지 저장 필드에 반영하지 않는다. */
export interface PostMetaAiSuggestionDraft {
  audience_tags_suggested: string[];
  duration_tags_suggested: string[];
  mobility_tags_suggested: string[];
  mood_tags_suggested: string[];
  summary_card_suggested: string[];
  reason_line_suggested: string[];
  best_for_context_suggested: string[];
  hero_subject_suggested: ContentPostHeroSubject;
  why_suggested: string[];
}

export type PostMetaTagCategory = "audience" | "duration" | "mobility" | "mood";

export const POST_META_AUDIENCE_IDS = [
  "solo",
  "friends",
  "couple",
  "family",
  "first_timer",
  "returning_visitor",
  "practical_traveler",
  "photo_spot_lover",
  "slow_pace_traveler",
] as const;

export const POST_META_DURATION_IDS = [
  "one_hour",
  "half_day",
  "one_day",
  "one_to_two_days",
  "first_day_good",
  "last_day_good",
] as const;

export const POST_META_MOBILITY_IDS = [
  "walking",
  "transit",
  "taxi_ok",
  "low_mobility_load",
  "medium_mobility_load",
  "easy_navigation",
] as const;

export const POST_META_MOOD_IDS = [
  "k_culture",
  "seoul_night_scene",
  "cafe_focused",
  "local_vibe",
  "quiet_route",
  "practical_tip",
  "photo_spot",
] as const;

export const POST_META_TAG_LABELS_KO: Record<string, string> = {
  solo: "솔로",
  friends: "친구 동행",
  couple: "커플",
  family: "가족",
  first_timer: "첫 방문",
  returning_visitor: "재방문",
  practical_traveler: "실속 여행",
  photo_spot_lover: "포토 스팟",
  slow_pace_traveler: "느린 여행",
  one_hour: "약 1시간",
  half_day: "반나절",
  one_day: "하루",
  one_to_two_days: "1~2일",
  first_day_good: "첫날에 좋음",
  last_day_good: "마지막 날에 좋음",
  walking: "도보 중심",
  transit: "대중교통",
  taxi_ok: "택시 병행 OK",
  low_mobility_load: "이동 부담 적음",
  medium_mobility_load: "이동 보통",
  easy_navigation: "길 찾기 쉬움",
  k_culture: "K-컬처",
  seoul_night_scene: "서울 야경",
  cafe_focused: "카페",
  local_vibe: "로컬 감성",
  quiet_route: "한적한 동선",
  practical_tip: "실용 팁",
  photo_spot: "사진·포토",
};

export function labelMetaTag(id: string): string {
  return POST_META_TAG_LABELS_KO[id] ?? id;
}

export const ALL_META_TAG_IDS: Record<PostMetaTagCategory, readonly string[]> = {
  audience: POST_META_AUDIENCE_IDS,
  duration: POST_META_DURATION_IDS,
  mobility: POST_META_MOBILITY_IDS,
  mood: POST_META_MOOD_IDS,
};
