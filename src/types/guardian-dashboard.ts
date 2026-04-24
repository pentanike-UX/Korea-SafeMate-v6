import type { ServiceTypeCode } from "@/types/domain";

/** Aggregated dashboard view — TODO(prod): DB views + edge functions. */
export interface GuardianDashboardSnapshot {
  guardian_user_id: string;
  posts_submitted_this_month: number;
  posts_approved_this_month: number;
  posts_pending_review: number;
  contribution_streak_weeks: number;
  weekly_approved_target: number;
  monthly_approved_target: number;
  category_counts: { label: string; count: number }[];
  availability_slots: { day: string; ranges: string }[];
  secondary_region_slugs: string[];
  supported_service_codes: ServiceTypeCode[];
  trust_health: "strong" | "good" | "attention";
  trust_health_note: string;
  open_incidents_for_guardian: number;
  featured_spotlight: {
    eligible: boolean;
    headline: string;
    body: string;
  };
  quality_indicators: { label: string; value: string }[];
}
