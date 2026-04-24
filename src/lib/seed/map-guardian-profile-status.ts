import type { GuardianApprovalStatus } from "@/types/domain";

/** DB `guardian_profiles.profile_status` — align with `approval_status` like migration 20260325220000. */
export function profileStatusFromApproval(approval: GuardianApprovalStatus): string {
  switch (approval) {
    case "approved":
      return "approved";
    case "rejected":
      return "rejected";
    case "paused":
      return "suspended";
    case "under_review":
      return "submitted";
    case "pending":
    default:
      return "draft";
  }
}
