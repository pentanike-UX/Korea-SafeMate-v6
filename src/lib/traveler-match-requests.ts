import { randomUUID } from "crypto";

export const TRAVELER_MATCH_REQUESTS_COOKIE = "fg_traveler_match_requests";
const MAX = 50;

export type MatchRequestStatus = "requested" | "accepted" | "completed";

export type StoredMatchRequest = {
  id: string;
  traveler_user_id: string;
  guardian_user_id: string;
  guardian_display_name: string | null;
  status: MatchRequestStatus;
  created_at: string;
  updated_at: string;
  /** `matches.booking_id` — 예약 메타(지역·의도·메모) 보강용; 쿠키 시드 행에는 없음 */
  booking_id?: string | null;
  /** DB 전용 — 상태 전환 시각 요약용 */
  traveler_confirmed_at?: string | null;
  guardian_confirmed_at?: string | null;
  completion_confirmed_at?: string | null;
};

export function parseMatchRequests(raw: string | undefined): StoredMatchRequest[] {
  if (!raw?.trim()) return [];
  try {
    const v = JSON.parse(raw) as unknown;
    if (!Array.isArray(v)) return [];
    const out: StoredMatchRequest[] = [];
    for (const row of v) {
      if (!row || typeof row !== "object") continue;
      const o = row as Record<string, unknown>;
      const id = typeof o.id === "string" ? o.id : "";
      const traveler_user_id = typeof o.traveler_user_id === "string" ? o.traveler_user_id : "";
      const guardian_user_id = typeof o.guardian_user_id === "string" ? o.guardian_user_id : "";
      const status = o.status === "accepted" || o.status === "completed" ? o.status : "requested";
      const created_at = typeof o.created_at === "string" ? o.created_at : new Date().toISOString();
      const updated_at = typeof o.updated_at === "string" ? o.updated_at : created_at;
      const guardian_display_name = typeof o.guardian_display_name === "string" ? o.guardian_display_name : null;
      const booking_id = typeof o.booking_id === "string" ? o.booking_id : null;
      if (!id || !traveler_user_id || !guardian_user_id) continue;
      out.push({
        id,
        traveler_user_id,
        guardian_user_id,
        guardian_display_name,
        status,
        created_at,
        updated_at,
        ...(booking_id ? { booking_id } : {}),
      });
    }
    return out.slice(0, MAX);
  } catch {
    return [];
  }
}

export function serializeMatchRequests(rows: StoredMatchRequest[]): string {
  return JSON.stringify(rows.slice(0, MAX));
}

export function newMatchRequestRow(
  travelerUserId: string,
  guardianUserId: string,
  guardianDisplayName: string | null,
): StoredMatchRequest {
  const now = new Date().toISOString();
  return {
    id: randomUUID(),
    traveler_user_id: travelerUserId,
    guardian_user_id: guardianUserId,
    guardian_display_name: guardianDisplayName,
    status: "requested",
    created_at: now,
    updated_at: now,
  };
}
