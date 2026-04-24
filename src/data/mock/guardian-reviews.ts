import type { GuardianReview } from "@/types/domain";

export const mockGuardianReviews: GuardianReview[] = [
  {
    id: "gr1",
    booking_id: "past1",
    guardian_user_id: "mg14",
    traveler_user_id: "t9",
    rating: 5,
    comment: "Punctual, respectful of scope, communicated delays early — easy to support.",
    created_at: "2026-02-10T18:00:00.000Z",
  },
  {
    id: "gr2",
    booking_id: "past2",
    guardian_user_id: "mg12",
    traveler_user_id: "t8",
    rating: 4,
    comment: "Clear on meeting points; flexible when plans shifted — would match again.",
    created_at: "2026-02-02T14:00:00.000Z",
  },
  {
    id: "gr3",
    booking_id: "past3",
    guardian_user_id: "mg14",
    traveler_user_id: "t7",
    rating: 5,
    comment: "Respectful, on time, and proactive about ICN elevator routing — professional support.",
    created_at: "2026-01-18T17:00:00.000Z",
  },
];
