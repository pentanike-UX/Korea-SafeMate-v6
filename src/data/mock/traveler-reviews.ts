import type { TravelerReview } from "@/types/domain";
import { mockTravelerReviewsBuilt, TRAVELER_REVIEW_HOME_IDS } from "@/data/mock/traveler-reviews.seed";

export const mockTravelerReviews: TravelerReview[] = mockTravelerReviewsBuilt;

export function mockTravelerReviewsHomeSpotlight(): TravelerReview[] {
  const map = new Map(mockTravelerReviews.map((r) => [r.id, r]));
  return TRAVELER_REVIEW_HOME_IDS.map((id) => map.get(id)).filter(Boolean) as TravelerReview[];
}
