import type { BookingRequestPayload, BookingHandoffChannel } from "@/types/domain";
import type { WizardFormState } from "@/lib/booking-wizard-config";
import { buildRequestedStartIso } from "@/lib/booking-wizard-validation";

export function wizardStateToPayload(s: WizardFormState): BookingRequestPayload {
  if (!s.userType) throw new Error("Invalid wizard state: userType");
  return {
    service_code: s.serviceCode,
    traveler_user_type: s.userType,
    region_slug: s.regionSlug,
    requested_date: s.date,
    requested_time: s.time,
    requested_start_iso: buildRequestedStartIso(s.date, s.time),
    traveler_count: s.travelerCount,
    preferred_language: s.preferredLanguage,
    first_time_in_korea: s.firstTimeKorea ?? false,
    meeting_point: s.meetingPoint.trim(),
    accommodation_area: s.accommodationArea.trim(),
    interests: s.interests,
    support_needs: s.supportNeeds,
    guest_name: s.guestName.trim(),
    guest_email: s.guestEmail.trim(),
    special_requests: s.specialRequests.trim(),
    preferred_contact_channel: s.contactChannel,
    contact_handle: s.contactHandle.trim(),
    agreements: {
      scope: s.agreedScope,
      admin_review: s.agreedAdminReview,
      no_immediate_chat: s.agreedNoImmediateChat,
    },
    submitted_at: new Date().toISOString(),
  };
}

export function handoffChannelForDb(ch: BookingHandoffChannel): BookingHandoffChannel {
  return ch;
}
