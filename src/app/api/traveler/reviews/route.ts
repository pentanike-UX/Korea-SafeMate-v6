import { randomUUID } from "crypto";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getMatchRequestsForTraveler, cookieOpts } from "@/lib/traveler-match-requests.server";
import { getServerSupabaseForUser } from "@/lib/supabase/server-user";
import { createServiceRoleSupabase } from "@/lib/supabase/service-role";
import {
  parseSubmittedTravelerReviews,
  serializeSubmittedTravelerReviews,
  TRAVELER_SUBMITTED_REVIEWS_COOKIE,
  type SubmittedTravelerReviewPayload,
} from "@/lib/traveler-submitted-reviews";

const IMAGE_PRESETS = new Set([
  "",
  "/mock/posts/강남_001.jpg",
  "/mock/posts/강남_010.jpg",
  "/mock/posts/광화문_003.jpg",
  "/mock/posts/광화문_022.jpg",
]);

const ALLOWED_TAGS = new Set([
  "routeEasy",
  "explainSimple",
  "calming",
  "vibeMatch",
  "photoFriendly",
  "fastResponse",
]);

export async function POST(req: Request) {
  const sb = await getServerSupabaseForUser();
  if (!sb) {
    return NextResponse.json({ ok: false, error: "auth_unavailable" }, { status: 401 });
  }
  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!user) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  const { data: urow } = await sb.from("users").select("app_role").eq("id", user.id).maybeSingle();
  const appRole = urow?.app_role as string | undefined;
  if (appRole === "guardian") {
    return NextResponse.json({ ok: false, error: "guardian_cannot_submit" }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_json" }, { status: 400 });
  }
  if (!body || typeof body !== "object") {
    return NextResponse.json({ ok: false, error: "invalid_body" }, { status: 400 });
  }
  const o = body as Record<string, unknown>;
  const matchId = typeof o.matchId === "string" ? o.matchId : "";
  const rating = typeof o.rating === "number" ? Math.round(o.rating) : 0;
  const comment = typeof o.comment === "string" ? o.comment.trim() : "";
  const tagIds = Array.isArray(o.tagIds) ? o.tagIds.filter((x): x is string => typeof x === "string") : [];
  const imagePreset = typeof o.imagePreset === "string" ? o.imagePreset : "";
  const reviewerName = typeof o.reviewerName === "string" ? o.reviewerName.trim().slice(0, 40) : "";

  if (!matchId || rating < 1 || rating > 5 || comment.length < 8) {
    return NextResponse.json({ ok: false, error: "validation" }, { status: 400 });
  }

  const matches = await getMatchRequestsForTraveler(user.id);
  const hit = matches.find((m) => m.id === matchId && m.status === "completed");
  if (!hit) {
    return NextResponse.json({ ok: false, error: "match_not_eligible" }, { status: 403 });
  }

  const jar = await cookies();
  const existing = parseSubmittedTravelerReviews(jar.get(TRAVELER_SUBMITTED_REVIEWS_COOKIE)?.value);
  if (existing.some((r) => r.booking_id === matchId)) {
    return NextResponse.json({ ok: false, error: "already_reviewed" }, { status: 409 });
  }

  const safeTags = tagIds.filter((t) => ALLOWED_TAGS.has(t)).slice(0, 6);
  const img = IMAGE_PRESETS.has(imagePreset) && imagePreset ? imagePreset : null;

  const row: SubmittedTravelerReviewPayload = {
    id: `tsr-${randomUUID()}`,
    booking_id: matchId,
    traveler_user_id: user.id,
    guardian_user_id: hit.guardian_user_id,
    rating,
    comment,
    comment_en: comment,
    created_at: new Date().toISOString(),
    reviewer_display_name: reviewerName || "Traveler",
    image_url: img,
    help_tag_ids: safeTags,
    time_label_ko: "방금 전",
    time_label_en: "Just now",
    time_label_ja: "さきほど",
  };

  const svc = createServiceRoleSupabase();
  if (svc) {
    await svc.from("traveler_reviews").insert({
      id: row.id,
      booking_id: row.booking_id,
      traveler_user_id: row.traveler_user_id,
      guardian_user_id: row.guardian_user_id,
      rating: row.rating,
      comment: row.comment,
      comment_en: row.comment_en,
      created_at: row.created_at,
      reviewer_display_name: row.reviewer_display_name,
      image_url: row.image_url,
      help_tag_ids: row.help_tag_ids,
      time_label_ko: row.time_label_ko,
      time_label_en: row.time_label_en,
      time_label_ja: row.time_label_ja,
    });
  }

  const next = [...existing, row];
  const res = NextResponse.json({ ok: true, reviewId: row.id });
  res.cookies.set(TRAVELER_SUBMITTED_REVIEWS_COOKIE, serializeSubmittedTravelerReviews(next), cookieOpts());
  return res;
}
