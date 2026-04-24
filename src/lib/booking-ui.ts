import type { BookingStatus, GuardianApprovalStatus } from "@/types/domain";

export function bookingStatusLabel(s: BookingStatus): string {
  const map: Record<BookingStatus, string> = {
    requested: "Requested",
    reviewing: "Reviewing",
    matched: "Matched",
    confirmed: "Confirmed",
    in_progress: "In progress",
    completed: "Completed",
    cancelled: "Cancelled",
    issue_reported: "Issue reported",
  };
  return map[s];
}

export function bookingStatusVariant(
  s: BookingStatus,
): "default" | "secondary" | "outline" | "destructive" {
  switch (s) {
    case "completed":
      return "default";
    case "cancelled":
    case "issue_reported":
      return "destructive";
    case "in_progress":
    case "confirmed":
    case "matched":
      return "secondary";
    default:
      return "outline";
  }
}

export function guardianApprovalLabel(s: GuardianApprovalStatus): string {
  const map: Record<GuardianApprovalStatus, string> = {
    pending: "Pending",
    under_review: "Under review",
    approved: "Approved",
    paused: "Paused",
    rejected: "Rejected",
  };
  return map[s];
}

export function guardianApprovalVariant(
  s: GuardianApprovalStatus,
): "default" | "secondary" | "trust" | "outline" | "destructive" {
  switch (s) {
    case "approved":
      return "default";
    case "under_review":
      return "trust";
    case "rejected":
      return "destructive";
    default:
      return "outline";
  }
}
