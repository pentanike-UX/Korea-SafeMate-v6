/** MVP mock — 시드 가디언 ID·포스트 ID와 정합. */

import type { TravelerHubRegionLabelKey } from "@/lib/mypage/traveler-hub-region-key";

export type TravelerTripRequestStatus = "requested" | "reviewing" | "matched" | "declined";

export interface MockTravelerTripRequest {
  id: string;
  guardian_user_id: string | null;
  guardian_name: string | null;
  region_label_key: TravelerHubRegionLabelKey;
  theme_slug: string;
  status: TravelerTripRequestStatus;
  created_at: string;
  note: string;
}

export const mockTravelerSavedGuardianIds = ["mg12", "mg14", "mg11"];

export const mockTravelerSavedPostIds = ["seed-mg14-ap-01", "seed-mg13-ap-01", "seed-mg12-ap-01", "seed-mg11-ap-01"];

export const mockTravelerTripRequests: MockTravelerTripRequest[] = [
  {
    id: "req-1",
    guardian_user_id: "mg14",
    guardian_name: "홍서연",
    region_label_key: "gwanghwamun",
    theme_slug: "k_drama_romance",
    status: "reviewing",
    created_at: "2026-03-22T10:00:00.000Z",
    note: "북촌 산책 + 사진 매너 맞춤",
  },
  {
    id: "req-2",
    guardian_user_id: null,
    guardian_name: null,
    region_label_key: "gangnam",
    theme_slug: "k_pop_day",
    status: "requested",
    created_at: "2026-03-21T14:30:00.000Z",
    note: "앨범샵 + 저녁 코스",
  },
  {
    id: "req-3",
    guardian_user_id: "mg12",
    guardian_name: "오채원",
    region_label_key: "gangnam",
    theme_slug: "seoul_night",
    status: "matched",
    created_at: "2026-03-10T09:00:00.000Z",
    note: "신촌 식사 코스, 부담 없는 일정",
  },
  {
    id: "req-4",
    guardian_user_id: "mg08",
    guardian_name: "수아",
    region_label_key: "busan",
    theme_slug: "safe_solo",
    status: "requested",
    created_at: "2026-03-18T11:20:00.000Z",
    note: "해운대 일대 동선 · 바람 강한 날 실내 위주",
  },
];
