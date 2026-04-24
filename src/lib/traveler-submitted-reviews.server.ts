import { cookies } from "next/headers";
import {
  parseSubmittedTravelerReviews,
  serializeSubmittedTravelerReviews,
  TRAVELER_SUBMITTED_REVIEWS_COOKIE,
  type SubmittedTravelerReviewPayload,
} from "@/lib/traveler-submitted-reviews";
import { cookieOpts } from "@/lib/traveler-match-requests.server";

export async function getSubmittedTravelerReviewsFromCookie(): Promise<SubmittedTravelerReviewPayload[]> {
  const jar = await cookies();
  return parseSubmittedTravelerReviews(jar.get(TRAVELER_SUBMITTED_REVIEWS_COOKIE)?.value);
}

export function withSubmittedTravelerReviewsCookie(
  res: import("next/server").NextResponse,
  rows: SubmittedTravelerReviewPayload[],
) {
  res.cookies.set(TRAVELER_SUBMITTED_REVIEWS_COOKIE, serializeSubmittedTravelerReviews(rows), cookieOpts());
  return res;
}
