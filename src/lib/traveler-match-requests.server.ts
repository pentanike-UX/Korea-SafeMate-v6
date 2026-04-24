import { cookies } from "next/headers";
import {
  parseMatchRequests,
  serializeMatchRequests,
  TRAVELER_MATCH_REQUESTS_COOKIE,
  type MatchRequestStatus,
  type StoredMatchRequest,
} from "@/lib/traveler-match-requests";
import { createServiceRoleSupabase } from "@/lib/supabase/service-role";

export async function getStoredMatchRequests(): Promise<StoredMatchRequest[]> {
  const jar = await cookies();
  return parseMatchRequests(jar.get(TRAVELER_MATCH_REQUESTS_COOKIE)?.value);
}

export async function getMatchRequestsForTraveler(travelerUserId: string): Promise<StoredMatchRequest[]> {
  const cookieRows = (await getStoredMatchRequests()).filter((r) => r.traveler_user_id === travelerUserId);
  const dbRows = await getDbMatchRequests({ travelerUserId });
  return mergeMatchRows(cookieRows, dbRows);
}

export async function getMatchRequestsForGuardian(guardianUserId: string): Promise<StoredMatchRequest[]> {
  const cookieRows = (await getStoredMatchRequests()).filter((r) => r.guardian_user_id === guardianUserId);
  const dbRows = await getDbMatchRequests({ guardianUserId });
  return mergeMatchRows(cookieRows, dbRows);
}

export function cookieOpts() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 400,
  };
}

export function withMatchRequestsCookie(res: import("next/server").NextResponse, rows: StoredMatchRequest[]) {
  res.cookies.set(TRAVELER_MATCH_REQUESTS_COOKIE, serializeMatchRequests(rows), cookieOpts());
  return res;
}

type DbMatchRow = {
  id: string;
  traveler_user_id: string;
  guardian_user_id: string;
  booking_id: string | null;
  created_at: string;
  updated_at?: string | null;
  traveler_confirmed_at: string | null;
  guardian_confirmed_at: string | null;
  completion_confirmed_at: string | null;
};

function deriveMatchStatusFromDbRow(m: Pick<DbMatchRow, "traveler_confirmed_at" | "guardian_confirmed_at" | "completion_confirmed_at">): MatchRequestStatus {
  if (m.completion_confirmed_at) return "completed";
  if (m.traveler_confirmed_at && m.guardian_confirmed_at) return "completed";
  if (m.traveler_confirmed_at || m.guardian_confirmed_at) return "accepted";
  return "requested";
}

async function enrichGuardianDisplayNames(sb: NonNullable<ReturnType<typeof createServiceRoleSupabase>>, rows: StoredMatchRequest[]): Promise<void> {
  if (rows.length === 0) return;
  const ids = [...new Set(rows.map((r) => r.guardian_user_id).filter(Boolean))];
  if (ids.length === 0) return;

  const nameByUser = new Map<string, string>();

  const { data: gp } = await sb.from("guardian_profiles").select("user_id, display_name").in("user_id", ids);
  for (const r of gp ?? []) {
    const uid = r.user_id as string;
    const dn = typeof r.display_name === "string" ? r.display_name.trim() : "";
    if (dn) nameByUser.set(uid, dn);
  }

  const missing = ids.filter((id) => !nameByUser.has(id));
  if (missing.length > 0) {
    const { data: up } = await sb.from("user_profiles").select("user_id, display_name").in("user_id", missing);
    for (const r of up ?? []) {
      const uid = r.user_id as string;
      const dn = typeof r.display_name === "string" ? r.display_name.trim() : "";
      if (dn) nameByUser.set(uid, dn);
    }
  }

  for (const row of rows) {
    if (!row.guardian_display_name && nameByUser.has(row.guardian_user_id)) {
      row.guardian_display_name = nameByUser.get(row.guardian_user_id) ?? null;
    }
  }
}

async function getDbMatchRequests(params: {
  travelerUserId?: string;
  guardianUserId?: string;
}): Promise<StoredMatchRequest[]> {
  const sb = createServiceRoleSupabase();
  if (!sb) return [];
  const base = sb
    .from("matches")
    .select(
      "id, traveler_user_id, guardian_user_id, booking_id, created_at, updated_at, traveler_confirmed_at, guardian_confirmed_at, completion_confirmed_at",
    )
    .order("created_at", { ascending: false })
    .limit(50);

  const query = params.travelerUserId
    ? base.eq("traveler_user_id", params.travelerUserId)
    : params.guardianUserId
      ? base.eq("guardian_user_id", params.guardianUserId)
      : null;
  if (!query) return [];

  const { data, error } = await query;
  if (error || !data) return [];

  const mapped: StoredMatchRequest[] = (data as DbMatchRow[]).map((r) => {
    const touch = typeof r.updated_at === "string" && r.updated_at.trim() ? r.updated_at : r.created_at;
    return {
      id: r.id,
      traveler_user_id: r.traveler_user_id,
      guardian_user_id: r.guardian_user_id,
      guardian_display_name: null,
      status: deriveMatchStatusFromDbRow(r),
      created_at: r.created_at,
      updated_at: touch,
      booking_id: r.booking_id,
      traveler_confirmed_at: r.traveler_confirmed_at,
      guardian_confirmed_at: r.guardian_confirmed_at,
      completion_confirmed_at: r.completion_confirmed_at,
    };
  });

  await enrichGuardianDisplayNames(sb, mapped);
  return mapped;
}

function mergeMatchRows(primary: StoredMatchRequest[], secondary: StoredMatchRequest[]): StoredMatchRequest[] {
  const map = new Map<string, StoredMatchRequest>();
  for (const row of [...secondary, ...primary]) {
    const prev = map.get(row.id);
    if (!prev) {
      map.set(row.id, row);
      continue;
    }
    if (prev.status === "requested" && row.status !== "requested") {
      map.set(row.id, row);
    }
  }
  return [...map.values()].sort((a, b) => (a.updated_at < b.updated_at ? 1 : a.updated_at > b.updated_at ? -1 : 0));
}
