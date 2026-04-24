import type { BookingRequestPayload, BookingHandoffChannel, BookingInterestId, BookingSupportNeedId } from "@/types/domain";
import type { ServiceTypeCode } from "@/types/domain";
import type { TravelerUserType } from "@/types/domain";
import { buildRequestedStartIso } from "@/lib/booking-wizard-validation";

export type GuardianRequestKind = "half_day" | "full_day" | "full_itinerary" | "inquiry";

export type GuardianIntakeFormInput = {
  requestKind: GuardianRequestKind;
  regionSlug: string;
  /** yyyy-mm-dd; if empty, caller should use tentative */
  preferredDate: string;
  mood: string;
  details: string;
  guestName: string;
  guestEmail: string;
  travelerUserType: TravelerUserType;
  preferredLanguage: string;
  travelerCount: number;
  guardianUserId: string;
  guardianDisplayName: string;
  relatedPost?: { id: string; title: string; summary?: string } | null;
};

function defaultTentativeDate(): string {
  const d = new Date();
  d.setDate(d.getDate() + 14);
  return d.toISOString().slice(0, 10);
}

function kindToService(kind: GuardianRequestKind): ServiceTypeCode {
  if (kind === "inquiry") return "k_route";
  return "k_route";
}

function kindToSupport(kind: GuardianRequestKind): BookingSupportNeedId[] {
  if (kind === "inquiry") return ["practical_guidance", "local_tips"];
  if (kind === "full_itinerary") return ["route_support", "practical_guidance"];
  return ["route_support", "local_tips"];
}

function buildSpecialRequests(input: GuardianIntakeFormInput, kindLabel: string): string {
  const lines = [
    `[Guardian request — intake sheet]`,
    `Guardian: ${input.guardianDisplayName} (${input.guardianUserId})`,
    `Request type: ${kindLabel}`,
    input.relatedPost ? `Related post: ${input.relatedPost.title} (${input.relatedPost.id})` : "",
    input.relatedPost?.summary?.trim() ? `Post summary: ${input.relatedPost.summary.trim()}` : "",
    `Preferred region slug: ${input.regionSlug}`,
    `Preferred date: ${input.preferredDate || "Flexible / to be coordinated"}`,
    input.mood.trim() ? `Mood / style: ${input.mood.trim()}` : "",
    input.details.trim() ? `Details:\n${input.details.trim()}` : "",
  ];
  return lines.filter(Boolean).join("\n");
}

/**
 * Builds a booking payload from the guardian detail/post detail request sheet.
 * Fills wizard-only fields with safe defaults so `/api/bookings` accepts the body.
 */
export function buildGuardianIntakePayload(
  input: GuardianIntakeFormInput,
  kindLabel: string,
  agreements: BookingRequestPayload["agreements"],
): BookingRequestPayload {
  const date = input.preferredDate.trim() || defaultTentativeDate();
  const time = "12:00";
  const special = buildSpecialRequests(input, kindLabel);

  const channel: BookingHandoffChannel = "email";
  const handle = input.guestEmail.trim();

  const interests: BookingInterestId[] = [];

  return {
    service_code: kindToService(input.requestKind),
    traveler_user_type: input.travelerUserType,
    region_slug: input.regionSlug,
    requested_date: date,
    requested_time: time,
    requested_start_iso: buildRequestedStartIso(date, time),
    traveler_count: Math.min(8, Math.max(1, input.travelerCount)),
    preferred_language: input.preferredLanguage,
    first_time_in_korea: false,
    meeting_point: "To coordinate after review (guardian request)",
    accommodation_area: input.regionSlug,
    interests,
    support_needs: kindToSupport(input.requestKind),
    guest_name: input.guestName.trim(),
    guest_email: input.guestEmail.trim(),
    special_requests: special,
    preferred_contact_channel: channel,
    contact_handle: handle,
    agreements,
    submitted_at: new Date().toISOString(),
  };
}
