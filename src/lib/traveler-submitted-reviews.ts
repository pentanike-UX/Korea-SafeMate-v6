import type { TravelerReview } from "@/types/domain";
import { timeLabelJaFromKo } from "@/lib/traveler-review-time-labels";

export const TRAVELER_SUBMITTED_REVIEWS_COOKIE = "fg_traveler_submitted_reviews";
const MAX = 40;

export type SubmittedTravelerReviewPayload = {
  id: string;
  booking_id: string;
  traveler_user_id: string;
  guardian_user_id: string;
  rating: number;
  comment: string | null;
  comment_en: string | null;
  created_at: string;
  reviewer_display_name: string;
  image_url: string | null;
  help_tag_ids: string[];
  time_label_ko: string;
  time_label_en: string;
  /** 없으면 `time_label_ko`로부터 추론 */
  time_label_ja?: string;
};

export function parseSubmittedTravelerReviews(raw: string | undefined): SubmittedTravelerReviewPayload[] {
  if (!raw?.trim()) return [];
  try {
    const v = JSON.parse(raw) as unknown;
    if (!Array.isArray(v)) return [];
    const out: SubmittedTravelerReviewPayload[] = [];
    for (const row of v) {
      if (!row || typeof row !== "object") continue;
      const o = row as Record<string, unknown>;
      const id = typeof o.id === "string" ? o.id : "";
      const booking_id = typeof o.booking_id === "string" ? o.booking_id : "";
      const traveler_user_id = typeof o.traveler_user_id === "string" ? o.traveler_user_id : "";
      const guardian_user_id = typeof o.guardian_user_id === "string" ? o.guardian_user_id : "";
      const rating = typeof o.rating === "number" && o.rating >= 1 && o.rating <= 5 ? o.rating : 0;
      const comment = typeof o.comment === "string" ? o.comment : null;
      const comment_en = typeof o.comment_en === "string" ? o.comment_en : null;
      const created_at = typeof o.created_at === "string" ? o.created_at : new Date().toISOString();
      const reviewer_display_name = typeof o.reviewer_display_name === "string" ? o.reviewer_display_name : "Traveler";
      const image_url = typeof o.image_url === "string" ? o.image_url : null;
      const help_tag_ids = Array.isArray(o.help_tag_ids) ? o.help_tag_ids.filter((x): x is string => typeof x === "string") : [];
      const time_label_ko = typeof o.time_label_ko === "string" ? o.time_label_ko : "방금";
      const time_label_en = typeof o.time_label_en === "string" ? o.time_label_en : "Just now";
      const time_label_ja =
        typeof o.time_label_ja === "string"
          ? o.time_label_ja
          : (timeLabelJaFromKo(time_label_ko) ?? "たった今");
      if (!id || !booking_id || !traveler_user_id || !guardian_user_id || rating < 1) continue;
      out.push({
        id,
        booking_id,
        traveler_user_id,
        guardian_user_id,
        rating,
        comment,
        comment_en,
        created_at,
        reviewer_display_name,
        image_url,
        help_tag_ids,
        time_label_ko,
        time_label_en,
        time_label_ja,
      });
    }
    return out.slice(0, MAX);
  } catch {
    return [];
  }
}

export function serializeSubmittedTravelerReviews(rows: SubmittedTravelerReviewPayload[]): string {
  return JSON.stringify(rows.slice(0, MAX));
}

export function payloadToTravelerReview(p: SubmittedTravelerReviewPayload): TravelerReview {
  return {
    id: p.id,
    booking_id: p.booking_id,
    traveler_user_id: p.traveler_user_id,
    guardian_user_id: p.guardian_user_id,
    rating: p.rating,
    comment: p.comment,
    comment_en: p.comment_en,
    created_at: p.created_at,
    reviewer_display_name: p.reviewer_display_name,
    time_label_ko: p.time_label_ko,
    time_label_en: p.time_label_en,
    time_label_ja: p.time_label_ja ?? timeLabelJaFromKo(p.time_label_ko) ?? "たった今",
    image_url: p.image_url,
    help_tag_ids: p.help_tag_ids,
  };
}
