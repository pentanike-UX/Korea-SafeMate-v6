import type { GuardianActivityLog } from "@/types/domain";

export const mockGuardianActivityLogs: GuardianActivityLog[] = [
  {
    id: "a1",
    guardian_user_id: "mg14",
    action: "post_submitted",
    detail: "content_post:seed-mg14-ap-01",
    created_at: "2026-03-20T08:00:00.000Z",
  },
  {
    id: "a2",
    guardian_user_id: "mg14",
    action: "post_approved",
    detail: "content_post:seed-mg14-ap-01",
    created_at: "2026-03-20T08:20:00.000Z",
  },
  {
    id: "a3",
    guardian_user_id: "mg14",
    action: "tier_recomputed",
    detail: "verified_guardian",
    created_at: "2026-03-21T00:00:00.000Z",
  },
];
