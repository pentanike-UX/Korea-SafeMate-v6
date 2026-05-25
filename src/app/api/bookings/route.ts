import { z } from "zod";
import type { BookingRequestPayload } from "@/types/domain";
import { createServiceRoleSupabase } from "@/lib/supabase/service-role";
import { getSupabaseAuthUserIdOnly } from "@/lib/supabase/server-user";

/**
 * Guest/auth booking intake — persists to Supabase when service role + URL are configured.
 * - Zod 검증(타입·길이 캡·이메일·동의 게이트)
 * - 로그인 시 traveler_user_id를 세션에서 파생(클라 신뢰 X)
 * TODO(prod): idempotency key; email queue; Sentry 구조화 로깅.
 */
const code = z.string().trim().min(1).max(64);
const shortText = z.string().trim().max(200);

const bookingSchema = z.object({
  service_code: code,
  traveler_user_type: code,
  region_slug: code,
  requested_date: z.string().trim().max(40),
  requested_time: z.string().trim().max(40),
  requested_start_iso: z.string().trim().min(1).max(40),
  traveler_count: z.number().int().min(1).max(50),
  preferred_language: code,
  first_time_in_korea: z.boolean(),
  meeting_point: shortText,
  accommodation_area: shortText,
  interests: z.array(z.string().trim().max(64)).max(30),
  support_needs: z.array(z.string().trim().max(64)).max(30),
  guest_name: z.string().trim().max(120),
  guest_email: z.string().trim().email().max(254),
  special_requests: z.string().trim().max(2000),
  preferred_contact_channel: code,
  contact_handle: z.string().trim().max(200),
  agreements: z.object({
    scope: z.literal(true),
    admin_review: z.boolean(),
    no_immediate_chat: z.boolean(),
  }),
  submitted_at: z.string().trim().max(40),
});

export async function POST(req: Request) {
  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return Response.json({ error: "invalid_json" }, { status: 400 });
  }

  const parsed = bookingSchema.safeParse(json);
  if (!parsed.success) {
    return Response.json({ error: "invalid_payload", detail: parsed.error.flatten() }, { status: 400 });
  }
  const payload = parsed.data;

  // 클라이언트가 보낸 user id를 신뢰하지 않고 세션에서 파생. 미로그인은 게스트(null).
  const travelerUserId = await getSupabaseAuthUserIdOnly();

  const sb = createServiceRoleSupabase();

  if (sb) {
    const notesParts = [
      `User type: ${payload.traveler_user_type}`,
      `Region: ${payload.region_slug}`,
      `Language: ${payload.preferred_language}`,
      `First Korea: ${payload.first_time_in_korea}`,
      `Meeting: ${payload.meeting_point}`,
      `Stay: ${payload.accommodation_area}`,
      payload.interests.length ? `Interests: ${payload.interests.join(",")}` : "",
      `Support: ${payload.support_needs.join(",")}`,
      payload.special_requests ? `Notes: ${payload.special_requests}` : "",
    ].filter(Boolean);

    const { data, error } = await sb
      .from("bookings")
      .insert({
        traveler_user_id: travelerUserId,
        guardian_user_id: null,
        service_code: payload.service_code,
        status: "requested",
        requested_start: payload.requested_start_iso,
        party_size: payload.traveler_count,
        pickup_hint: payload.meeting_point,
        notes: notesParts.join("\n"),
        preferred_contact_channel: payload.preferred_contact_channel,
        contact_handle_hint: payload.contact_handle,
        guest_name: payload.guest_name,
        guest_email: payload.guest_email,
        request_payload: payload as BookingRequestPayload,
      })
      .select("id")
      .single();

    if (!error && data?.id) {
      await sb.from("booking_status_history").insert({
        booking_id: data.id,
        from_status: null,
        to_status: "requested",
        note: travelerUserId ? "Authenticated submission via web" : "Guest submission via web",
      });
      return Response.json({ id: data.id, saved: true });
    }
    console.error("Supabase booking insert error:", error);
    return Response.json({ error: "db_insert_failed" }, { status: 500 });
  }

  const id = crypto.randomUUID();
  return Response.json({
    id,
    saved: false,
    message:
      "MVP: booking not persisted — set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY to enable storage.",
  });
}
