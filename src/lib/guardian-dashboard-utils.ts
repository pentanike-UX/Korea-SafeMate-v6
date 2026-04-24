import type { BookingWithDetails, GuardianLanguage, GuardianProfile } from "@/types/domain";

const LANG_LABEL: Record<string, string> = {
  en: "English",
  ko: "Korean",
  ja: "Japanese",
  es: "Spanish",
  zh: "Chinese",
};

export function formatGuardianLanguages(langs: GuardianLanguage[]): string {
  return langs
    .map((l) => {
      const name = LANG_LABEL[l.language_code] ?? l.language_code.toUpperCase();
      return `${name} · ${l.proficiency}`;
    })
    .join(" · ");
}

/** Heuristic profile completeness for dashboard — TODO(prod): persisted completion checklist. */
export function guardianProfileCompleteness(profile: GuardianProfile): number {
  let score = 0;
  if (profile.photo_url) score += 15;
  if (profile.bio.length > 40) score += 25;
  else if (profile.bio.length > 0) score += 12;
  if (profile.headline.length > 5) score += 15;
  if (profile.languages.length >= 2) score += 20;
  else if (profile.languages.length > 0) score += 10;
  if (profile.expertise_tags.length >= 3) score += 15;
  else if (profile.expertise_tags.length > 0) score += 8;
  if (profile.years_in_seoul > 0) score += 10;
  return Math.min(100, score);
}

export function isUpcomingBooking(b: BookingWithDetails, now: Date): boolean {
  if (b.status !== "confirmed") return false;
  return new Date(b.requested_start) >= now;
}

export function isCompletedBooking(b: BookingWithDetails): boolean {
  return b.status === "completed";
}

/** Assigned to guardian and still in pipeline before completion. */
export function isPendingPipelineBooking(b: BookingWithDetails): boolean {
  return (
    b.guardian_user_id !== null &&
    (b.status === "matched" || b.status === "in_progress" || b.status === "issue_reported")
  );
}
