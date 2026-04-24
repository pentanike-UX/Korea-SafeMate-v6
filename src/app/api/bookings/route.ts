import type { BookingRequestPayload } from "@/types/domain";
import { createServiceRoleSupabase } from "@/lib/supabase/service-role";

/**
 * Guest booking intake — persists to Supabase when service role + URL are configured.
 * TODO(prod): Zod schema validation; auth path with traveler_user_id; idempotency key; email queue.
 */
export async function POST(req: Request) {
  let payload: BookingRequestPayload;
  try {
    payload = (await req.json()) as BookingRequestPayload;
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!payload?.service_code || !payload.guest_email || !payload.agreements?.scope) {
    return Response.json({ error: "Missing required fields" }, { status: 400 });
  }

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
        traveler_user_id: null,
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
        request_payload: payload,
      })
      .select("id")
      .single();

    if (!error && data?.id) {
      await sb.from("booking_status_history").insert({
        booking_id: data.id,
        from_status: null,
        to_status: "requested",
        note: "Guest submission via web",
      });
      return Response.json({ id: data.id, saved: true });
    }
    // TODO(prod): Structured logging / Sentry
    console.error("Supabase booking insert error:", error);
  }

  const id = crypto.randomUUID();
  return Response.json({
    id,
    saved: false,
    message:
      "MVP: booking not persisted — set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY to enable storage.",
  });
}
