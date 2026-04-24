/**
 * IA: `none` when the user has no guardian_profiles row; otherwise DB `profile_status`.
 */
export type GuardianProfileStatus = "none" | "draft" | "submitted" | "approved" | "rejected" | "suspended";

export function guardianStatusFromRow(
  row: { profile_status?: string | null; approval_status?: string | null } | null,
): GuardianProfileStatus {
  if (!row) return "none";
  const ps = row.profile_status;
  if (ps === "draft" || ps === "submitted" || ps === "approved" || ps === "rejected" || ps === "suspended") {
    return ps;
  }
  const a = row.approval_status;
  if (a === "approved") return "approved";
  if (a === "rejected") return "rejected";
  if (a === "paused") return "suspended";
  if (a === "under_review") return "submitted";
  if (row.profile_status === null || row.profile_status === undefined) return "draft";
  return "submitted";
}

/** Routes that require an approved guardian application. */
export function guardianPathRequiresApproved(pathWithoutLocale: string): boolean {
  if (pathWithoutLocale === "/guardian/posts" || pathWithoutLocale.startsWith("/guardian/posts/")) return true;
  if (pathWithoutLocale === "/guardian/matches" || pathWithoutLocale.startsWith("/guardian/matches/")) return true;
  if (pathWithoutLocale === "/mypage/guardian/posts" || pathWithoutLocale.startsWith("/mypage/guardian/posts/")) return true;
  if (pathWithoutLocale === "/mypage/guardian/matches" || pathWithoutLocale.startsWith("/mypage/guardian/matches/")) return true;
  return false;
}

export function guardianPathIsAlwaysAllowed(pathWithoutLocale: string): boolean {
  if (pathWithoutLocale === "/guardian" || pathWithoutLocale === "/guardian/") return true;
  if (pathWithoutLocale === "/guardian/profile" || pathWithoutLocale.startsWith("/guardian/profile/")) return true;
  if (pathWithoutLocale === "/guardian/onboarding" || pathWithoutLocale.startsWith("/guardian/onboarding/")) return true;
  if (pathWithoutLocale === "/mypage/guardian/profile" || pathWithoutLocale.startsWith("/mypage/guardian/profile/")) return true;
  // Mock / preview dashboard — allowed before approval for internal demos (`?as=`).
  if (pathWithoutLocale === "/guardian/dashboard" || pathWithoutLocale.startsWith("/guardian/dashboard/")) return true;
  return false;
}
