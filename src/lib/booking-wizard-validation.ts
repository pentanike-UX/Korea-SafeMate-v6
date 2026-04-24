import type { WizardFormState } from "@/lib/booking-wizard-config";

export type StepValidation = { ok: true } | { ok: false; message: string };

export function validateStep(step: number, s: WizardFormState): StepValidation {
  switch (step) {
    case 0:
      return { ok: true };
    case 1:
      if (!s.userType) return { ok: false, message: "Select whether you are a foreign or Korean traveler." };
      if (!s.regionSlug) return { ok: false, message: "Choose a city or region." };
      if (!s.date) return { ok: false, message: "Pick a date." };
      if (!s.time) return { ok: false, message: "Pick a time." };
      if (s.travelerCount < 1 || s.travelerCount > 8)
        return { ok: false, message: "Traveler count must be between 1 and 8." };
      if (!s.preferredLanguage) return { ok: false, message: "Select a preferred language." };
      if (s.firstTimeKorea === null)
        return { ok: false, message: "Let us know if this is your first time in Korea." };
      return { ok: true };
    case 2:
      if (!s.meetingPoint.trim())
        return { ok: false, message: "Add an arrival or meeting point (airport terminal, station exit, etc.)." };
      if (!s.accommodationArea.trim())
        return { ok: false, message: "Add your accommodation area or neighborhood." };
      if (s.supportNeeds.length === 0)
        return { ok: false, message: "Select at least one type of support you need." };
      if (!s.guestName.trim()) return { ok: false, message: "Enter your full name." };
      if (!s.guestEmail.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s.guestEmail))
        return { ok: false, message: "Enter a valid email for booking updates." };
      return { ok: true };
    case 3:
      if (!s.contactHandle.trim())
        return { ok: false, message: "Enter your handle, ID, or email for the selected channel." };
      if (s.contactChannel === "email" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s.contactHandle.trim()))
        return { ok: false, message: "Enter a valid email for the handoff channel." };
      return { ok: true };
    case 4:
      if (!s.agreedScope) return { ok: false, message: "Confirm you understand the service scope." };
      if (!s.agreedAdminReview)
        return { ok: false, message: "Confirm that requests are reviewed before matching." };
      if (!s.agreedNoImmediateChat)
        return { ok: false, message: "Confirm that external chat is not immediate or automatic." };
      return { ok: true };
    default:
      return { ok: true };
  }
}

export function buildRequestedStartIso(date: string, time: string): string {
  return `${date}T${time}:00+09:00`;
}
