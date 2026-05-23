"use server";

import { revalidatePath } from "next/cache";
import { getServerSupabaseForUser, getSupabaseAuthUserIdOnly } from "@/lib/supabase/server-user";

export interface SubmitReviewResult {
  ok: boolean;
  error?: string;
}

/**
 * 여행자 리뷰 작성. RLS가 booking 소유·상태(delivered/completed)를 강제하므로
 * 여기서는 입력 검증 + 중복 작성 방지만 처리한다.
 */
export async function submitTravelerReviewAction(input: {
  bookingId: string;
  rating: number;
  comment: string;
  isAnonymous: boolean;
}): Promise<SubmitReviewResult> {
  const rating = Math.round(input.rating);
  if (!Number.isFinite(rating) || rating < 1 || rating > 5) {
    return { ok: false, error: "별점은 1~5 사이여야 합니다." };
  }
  const comment = input.comment.trim().slice(0, 2000);

  const userId = await getSupabaseAuthUserIdOnly();
  const sb = await getServerSupabaseForUser();
  if (!userId || !sb) {
    return { ok: false, error: "로그인이 필요합니다." };
  }

  // booking 소유·상태 확인 + guardian/route 식별
  const { data: booking, error: bErr } = await sb
    .from("bookings")
    .select("id, guardian_user_id, status, routes(id)")
    .eq("id", input.bookingId)
    .eq("traveler_user_id", userId)
    .maybeSingle();
  if (bErr || !booking) {
    return { ok: false, error: "예약을 찾을 수 없습니다." };
  }
  if (!booking.guardian_user_id) {
    return { ok: false, error: "아직 매칭된 하루이가 없어 리뷰를 쓸 수 없습니다." };
  }
  if (!["delivered", "completed"].includes(booking.status as string)) {
    return { ok: false, error: "루트 납품 완료 후에 리뷰를 작성할 수 있습니다." };
  }

  // 중복 작성 방지 (booking당 1개)
  const { data: existing } = await sb
    .from("traveler_reviews")
    .select("id")
    .eq("booking_id", input.bookingId)
    .eq("traveler_user_id", userId)
    .maybeSingle();
  if (existing) {
    return { ok: false, error: "이미 이 예약에 리뷰를 작성하셨습니다." };
  }

  const routeId =
    Array.isArray(booking.routes) && booking.routes.length > 0 ? booking.routes[0]?.id : null;

  const { error: insErr } = await sb.from("traveler_reviews").insert({
    booking_id: input.bookingId,
    traveler_user_id: userId,
    guardian_user_id: booking.guardian_user_id,
    route_id: routeId,
    rating,
    comment: comment || null,
    is_anonymous: input.isAnonymous,
  });
  if (insErr) {
    return { ok: false, error: insErr.message };
  }

  revalidatePath(`/mypage/requests/${input.bookingId}`);
  return { ok: true };
}
