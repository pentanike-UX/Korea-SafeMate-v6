import type {
  BookingInterestId,
  BookingRequestPayload,
  BookingSupportNeedId,
  ServiceTypeCode,
} from "@/types/domain";
import { createServiceRoleSupabase } from "@/lib/supabase/service-role";
import type { StoredMatchRequest } from "@/lib/traveler-match-requests";
import type { PublicGuardian } from "@/lib/guardian-public";
import { formatRegionSlugForDisplay } from "@/lib/mypage/region-label-i18n";
import { regionKeyFromSlug, type TravelerHubRegionLabelKey } from "@/lib/mypage/traveler-hub-region-key";

export type RequestPageRequestType = "half_day" | "day" | "consult";

export type MatchRequestRowEnrichment = {
  region_label_key: TravelerHubRegionLabelKey | null;
  /** TravelerHub `region.*`에 없을 때 카드에 그대로 노출 */
  region_display: string;
  theme_slug: string;
  /** ExperienceThemes에 없을 때 카드 제목 대용 */
  theme_fallback_title: string | null;
  mood_interests: BookingInterestId[];
  mood_supports: BookingSupportNeedId[];
  note_summary: string;
  request_type: RequestPageRequestType;
  service_code: ServiceTypeCode | null;
  requested_at: string;
  status_changed_at: string;
};

const INTEREST_ORDER: BookingInterestId[] = ["k_pop", "k_drama", "k_movie", "food", "shopping", "local_support"];

const THEME_BY_INTEREST: Record<BookingInterestId, string> = {
  k_pop: "k_pop_day",
  k_drama: "k_drama_romance",
  k_movie: "movie_location",
  food: "photo_route",
  shopping: "k_pop_day",
  local_support: "safe_solo",
};

/** 프로덕션 `service_types.slug` → 앱 `ServiceTypeCode` */
const PROD_SERVICE_SLUG_TO_CODE: Record<string, ServiceTypeCode> = {
  arrival_companion: "arrival",
  k_route_companion: "k_route",
  first_24_hours: "first_24h",
  arrival: "arrival",
  k_route: "k_route",
  first_24h: "first_24h",
};

function pickLatestIso(...candidates: (string | null | undefined)[]): string {
  let best: string | null = null;
  let t = -Infinity;
  for (const c of candidates) {
    if (!c) continue;
    const n = Date.parse(c);
    if (!Number.isFinite(n)) continue;
    if (n >= t) {
      t = n;
      best = c;
    }
  }
  return best ?? "";
}

function requestTypeFromServiceCode(code: ServiceTypeCode): RequestPageRequestType {
  if (code === "arrival") return "consult";
  if (code === "k_route") return "half_day";
  return "day";
}

function requestTypeFromDurationHours(h: number | null | undefined, code: ServiceTypeCode): RequestPageRequestType {
  if (h == null || !Number.isFinite(h)) return requestTypeFromServiceCode(code);
  if (h <= 5) return "half_day";
  if (h >= 18) return "day";
  return "consult";
}

function parseBookingPayload(raw: unknown): BookingRequestPayload | null {
  if (!raw || typeof raw !== "object") return null;
  const p = raw as Partial<BookingRequestPayload>;
  if (typeof p.region_slug !== "string" || !p.region_slug.trim()) return null;
  return p as BookingRequestPayload;
}

function regionSlugFromNotes(notes: string): string {
  const m = notes.match(/Region:\s*([^\n]+)/i);
  return m?.[1]?.trim() ?? "";
}

function themeSlugFromPayload(p: BookingRequestPayload): string {
  for (const id of INTEREST_ORDER) {
    if (p.interests?.includes(id)) return THEME_BY_INTEREST[id];
  }
  return "safe_solo";
}

function themeSlugFromInterestList(ids: BookingInterestId[]): string {
  for (const id of INTEREST_ORDER) {
    if (ids.includes(id)) return THEME_BY_INTEREST[id];
  }
  return "safe_solo";
}

function parseInterestArray(raw: unknown): BookingInterestId[] {
  if (!Array.isArray(raw)) return [];
  const out: BookingInterestId[] = [];
  for (const x of raw) {
    if (typeof x === "string" && INTEREST_ORDER.includes(x as BookingInterestId)) {
      out.push(x as BookingInterestId);
    }
  }
  return out;
}

const SUPPORT_IDS: BookingSupportNeedId[] = [
  "transportation",
  "check_in",
  "ordering",
  "local_tips",
  "route_support",
  "practical_guidance",
];

function parseSupportArray(raw: unknown): BookingSupportNeedId[] {
  if (!Array.isArray(raw)) return [];
  const out: BookingSupportNeedId[] = [];
  for (const x of raw) {
    if (typeof x === "string" && SUPPORT_IDS.includes(x as BookingSupportNeedId)) {
      out.push(x as BookingSupportNeedId);
    }
  }
  return out;
}

function prodSlugToServiceCode(slug: string): ServiceTypeCode | null {
  const k = slug.trim().toLowerCase();
  return PROD_SERVICE_SLUG_TO_CODE[k] ?? null;
}

function latestTimestampByBooking(rows: { booking_id: string; at: string }[]): Map<string, string> {
  const best = new Map<string, { t: number; iso: string }>();
  for (const r of rows) {
    const n = Date.parse(r.at);
    if (!Number.isFinite(n)) continue;
    const cur = best.get(r.booking_id);
    if (!cur || n > cur.t) best.set(r.booking_id, { t: n, iso: r.at });
  }
  const out = new Map<string, string>();
  for (const [bid, v] of best) out.set(bid, v.iso);
  return out;
}

type ServiceCatalog = {
  durationByCode: Map<ServiceTypeCode, number>;
  nameByCode: Map<ServiceTypeCode, string>;
  serviceTypeIdToCode: Map<string, ServiceTypeCode>;
};

async function loadServiceTypeCatalog(sb: NonNullable<ReturnType<typeof createServiceRoleSupabase>>): Promise<ServiceCatalog> {
  const durationByCode = new Map<ServiceTypeCode, number>();
  const nameByCode = new Map<ServiceTypeCode, string>();
  const serviceTypeIdToCode = new Map<string, ServiceTypeCode>();

  const leg = await sb
    .from("service_types")
    .select("code, duration_hours, name, short_description")
    .limit(50);
  if (!leg.error && leg.data && leg.data.length > 0) {
    for (const s of leg.data) {
      const code = s.code as ServiceTypeCode;
      if (code !== "arrival" && code !== "k_route" && code !== "first_24h") continue;
      if (typeof s.duration_hours === "number") durationByCode.set(code, s.duration_hours);
      if (typeof s.name === "string" && s.name.trim()) nameByCode.set(code, s.name.trim());
    }
    return { durationByCode, nameByCode, serviceTypeIdToCode };
  }

  const pr = await sb
    .from("service_types")
    .select("id, slug, duration_hours, name_en, name_ko, short_description")
    .limit(50);
  if (!pr.error && pr.data) {
    for (const s of pr.data) {
      const id = typeof s.id === "string" ? s.id : "";
      const slug = typeof s.slug === "string" ? s.slug : "";
      const code = prodSlugToServiceCode(slug);
      if (!code || !id) continue;
      serviceTypeIdToCode.set(id, code);
      if (typeof s.duration_hours === "number") durationByCode.set(code, s.duration_hours);
      const nm = (typeof s.name_en === "string" && s.name_en.trim()) || (typeof s.name_ko === "string" && s.name_ko.trim()) || "";
      if (nm) nameByCode.set(code, nm);
    }
  }
  return { durationByCode, nameByCode, serviceTypeIdToCode };
}

async function loadBookingStatusLatest(
  sb: NonNullable<ReturnType<typeof createServiceRoleSupabase>>,
  bookingIds: string[],
): Promise<Map<string, string>> {
  if (bookingIds.length === 0) return new Map();

  const tryChanged = await sb.from("booking_status_history").select("booking_id, changed_at").in("booking_id", bookingIds);
  if (!tryChanged.error && tryChanged.data) {
    const rows = (tryChanged.data as { booking_id: string; changed_at: string }[])
      .filter((h) => h.booking_id && h.changed_at)
      .map((h) => ({ booking_id: h.booking_id, at: h.changed_at }));
    return latestTimestampByBooking(rows);
  }

  const tryCreated = await sb.from("booking_status_history").select("booking_id, created_at").in("booking_id", bookingIds);
  if (!tryCreated.error && tryCreated.data) {
    const rows = (tryCreated.data as { booking_id: string; created_at: string }[])
      .filter((h) => h.booking_id && h.created_at)
      .map((h) => ({ booking_id: h.booking_id, at: h.created_at }));
    return latestTimestampByBooking(rows);
  }

  return new Map();
}

type RegionRow = { id: string; slug: string; name_en: string; name_ko: string | null };

async function loadRegionsByIds(
  sb: NonNullable<ReturnType<typeof createServiceRoleSupabase>>,
  ids: string[],
): Promise<Map<string, RegionRow>> {
  const uniq = [...new Set(ids.filter(Boolean))];
  const out = new Map<string, RegionRow>();
  if (uniq.length === 0) return out;
  const { data, error } = await sb.from("regions").select("id, slug, name_en, name_ko").in("id", uniq);
  if (error || !data) return out;
  for (const r of data as RegionRow[]) {
    if (r.id) out.set(r.id, r);
  }
  return out;
}

function requestedStartFromProdRow(b: Record<string, unknown>): string | null {
  const rs = b.requested_start;
  if (typeof rs === "string" && rs.trim()) return rs.trim();
  const td = b.travel_date;
  const tt = b.travel_time;
  if (typeof td === "string" && td.trim() && typeof tt === "string" && tt.trim()) {
    const combined = `${td.trim()}T${tt.trim()}`;
    const n = Date.parse(combined);
    if (Number.isFinite(n)) return new Date(n).toISOString();
  }
  const ca = b.created_at;
  if (typeof ca === "string" && ca.trim()) return ca.trim();
  return null;
}

function fallbackFromGuardian(g: PublicGuardian | undefined): Pick<
  MatchRequestRowEnrichment,
  "region_label_key" | "region_display" | "theme_slug" | "theme_fallback_title" | "note_summary" | "request_type"
> {
  const slug = g?.primary_region_slug?.trim() || "";
  const key = slug ? regionKeyFromSlug(slug) : null;
  const region_display = key ? "" : formatRegionSlugForDisplay(slug || "Seoul");
  const tag = g?.expertise_tags?.[0]?.trim();
  const headline = g?.headline?.trim();
  return {
    region_label_key: key,
    region_display: key ? "" : region_display || "Seoul",
    theme_slug: "safe_solo",
    theme_fallback_title: tag || headline || null,
    note_summary: "",
    request_type: "consult",
  };
}

/**
 * 매칭 행 + 연결 예약(`booking_id`)·서비스 타입으로 요청 카드용 메타를 채운다.
 * 레거시(schema.sql) / 프로덕션(schema_production) 컬럼 차이에 대응한다.
 * 예약이 없거나 조회 실패 시 맵에 해당 키가 없고, 호출측에서 가디언 폴백을 쓴다.
 */
export async function enrichMatchRowsForRequestsPage(
  rows: StoredMatchRequest[],
): Promise<Map<string, Partial<MatchRequestRowEnrichment>>> {
  const out = new Map<string, Partial<MatchRequestRowEnrichment>>();
  const sb = createServiceRoleSupabase();
  if (!sb || rows.length === 0) return out;

  const bookingIds = [...new Set(rows.map((r) => r.booking_id).filter((id): id is string => Boolean(id)))];
  if (bookingIds.length === 0) return out;

  const [catalog, lastHistByBooking] = await Promise.all([
    loadServiceTypeCatalog(sb),
    loadBookingStatusLatest(sb, bookingIds),
  ]);

  const legacySelect =
    "id, service_code, notes, request_payload, requested_start, updated_at, status, pickup_hint, created_at";
  const prodSelect =
    "id, service_type_id, region_id, interests, support_needs, special_requests, request_payload, requested_start, travel_date, travel_time, accommodation_area, meeting_point, updated_at, booking_status, created_at";

  let bookingRows: Record<string, unknown>[] | null = null;
  let variant: "legacy" | "production" = "legacy";

  const legRes = await sb.from("bookings").select(legacySelect).in("id", bookingIds);
  if (!legRes.error && legRes.data && legRes.data.length > 0) {
    bookingRows = legRes.data as Record<string, unknown>[];
    variant = "legacy";
  } else {
    const prRes = await sb.from("bookings").select(prodSelect).in("id", bookingIds);
    if (!prRes.error && prRes.data) {
      bookingRows = prRes.data as Record<string, unknown>[];
      variant = "production";
    } else {
      if (legRes.error) console.error("[requests-enrich] bookings legacy select", legRes.error);
      if (prRes.error) console.error("[requests-enrich] bookings production select", prRes.error);
      return out;
    }
  }

  let regionById = new Map<string, RegionRow>();
  if (variant === "production" && bookingRows) {
    const rids = bookingRows.map((b) => b.region_id as string | null | undefined).filter((x): x is string => Boolean(x));
    regionById = await loadRegionsByIds(sb, rids);
  }

  const bookingById = new Map(bookingRows!.map((b) => [b.id as string, b]));

  for (const row of rows) {
    const bid = row.booking_id;
    if (!bid) continue;
    const b = bookingById.get(bid);
    if (!b) continue;

    let service_code: ServiceTypeCode | null = null;
    let notes = "";
    let booking_updated: string | null = null;
    let requested_start: string | null = null;
    let pickup_hint = "";
    let regionSlug = "";
    let interests: BookingInterestId[] = [];
    let supports: BookingSupportNeedId[] = [];
    let noteTail: string[] = [];
    let regionNameFromCatalog = "";

    if (variant === "legacy") {
      const sc = b.service_code;
      if (sc === "arrival" || sc === "k_route" || sc === "first_24h") service_code = sc;
      notes = typeof b.notes === "string" ? b.notes : "";
      booking_updated = typeof b.updated_at === "string" ? b.updated_at : null;
      requested_start = typeof b.requested_start === "string" ? b.requested_start : null;
      pickup_hint = typeof b.pickup_hint === "string" ? b.pickup_hint.trim() : "";
    } else {
      const stid = typeof b.service_type_id === "string" ? b.service_type_id : "";
      service_code = stid ? catalog.serviceTypeIdToCode.get(stid) ?? null : null;
      notes = typeof b.notes === "string" ? b.notes : "";
      booking_updated = typeof b.updated_at === "string" ? b.updated_at : null;
      requested_start = requestedStartFromProdRow(b);
      const acc = typeof b.accommodation_area === "string" ? b.accommodation_area.trim() : "";
      const meet = typeof b.meeting_point === "string" ? b.meeting_point.trim() : "";
      if (acc) noteTail.push(acc);
      if (meet) noteTail.push(meet);
      interests = parseInterestArray(b.interests);
      supports = parseSupportArray(b.support_needs);
      const rid = typeof b.region_id === "string" ? b.region_id : "";
      const reg = rid ? regionById.get(rid) : undefined;
      if (reg?.slug) regionSlug = reg.slug;
      else if (reg?.name_en) regionNameFromCatalog = reg.name_en.trim();
    }

    const payload = parseBookingPayload(b.request_payload);
    if (payload) {
      if (!interests.length && payload.interests?.length) interests = parseInterestArray(payload.interests);
      if (!supports.length && payload.support_needs?.length) supports = parseSupportArray(payload.support_needs);
    }

    regionSlug =
      payload?.region_slug?.trim() ||
      regionSlug ||
      regionSlugFromNotes(notes) ||
      (variant === "legacy" ? pickup_hint : "") ||
      "";

    if (variant === "production" && !regionSlug && typeof b.region_id === "string") {
      const reg = regionById.get(b.region_id);
      if (reg?.slug) regionSlug = reg.slug;
      else if (reg?.name_en) regionSlug = reg.name_en.trim();
    }

    const regionKey = regionSlug ? regionKeyFromSlug(regionSlug) : null;
    let region_display = "";
    if (!regionKey) {
      if (regionSlug) region_display = formatRegionSlugForDisplay(regionSlug);
      else if (regionNameFromCatalog) region_display = regionNameFromCatalog;
      else if (noteTail.length) region_display = noteTail.join(" · ");
    }

    const theme_slug = payload ? themeSlugFromPayload(payload) : themeSlugFromInterestList(interests);

    const effectiveCode: ServiceTypeCode = service_code ?? "k_route";
    const svcDur = service_code ? catalog.durationByCode.get(service_code) : undefined;
    const request_type = requestTypeFromDurationHours(svcDur ?? null, effectiveCode);

    const noteFromPayload = payload?.special_requests?.trim() || "";
    const spec = typeof b.special_requests === "string" ? b.special_requests.trim() : "";
    const note_summary =
      noteFromPayload ||
      spec ||
      notes
        .split("\n")
        .find((line) => line.trim().startsWith("Notes:"))
        ?.replace(/^Notes:\s*/i, "")
        .trim() ||
      notes.trim() ||
      noteTail.join(" · ");

    const status_changed_at = pickLatestIso(
      lastHistByBooking.get(bid),
      booking_updated,
      row.completion_confirmed_at,
      row.traveler_confirmed_at,
      row.guardian_confirmed_at,
      row.updated_at,
      row.created_at,
    );

    const requested_at = pickLatestIso(requested_start, row.created_at) || row.created_at;

    const svcName = service_code ? catalog.nameByCode.get(service_code) : undefined;
    const theme_fallback_title = svcName || null;

    out.set(row.id, {
      region_label_key: regionKey,
      region_display,
      theme_slug,
      theme_fallback_title,
      mood_interests: interests,
      mood_supports: supports,
      note_summary,
      request_type,
      service_code,
      requested_at,
      status_changed_at: status_changed_at || row.created_at,
    });
  }

  return out;
}

export function mergeEnrichmentWithGuardianFallback(
  row: StoredMatchRequest,
  partial: Partial<MatchRequestRowEnrichment> | undefined,
  guardian: PublicGuardian | undefined,
  fallbackCopy: { matchContext: string },
): MatchRequestRowEnrichment {
  const fb = fallbackFromGuardian(guardian);
  const status_changed_at = pickLatestIso(
    partial?.status_changed_at,
    row.completion_confirmed_at,
    row.traveler_confirmed_at,
    row.guardian_confirmed_at,
    row.updated_at,
    row.created_at,
  );

  const region_label_key = partial?.region_label_key ?? fb.region_label_key;
  const region_display =
    partial?.region_display?.trim() ||
    fb.region_display ||
    (guardian?.primary_region_slug ? formatRegionSlugForDisplay(guardian.primary_region_slug) : "Seoul");

  const theme_slug = partial?.theme_slug ?? fb.theme_slug;
  const theme_fallback_title = partial?.theme_fallback_title ?? fb.theme_fallback_title;

  const mood_interests = partial?.mood_interests ?? [];
  const mood_supports = partial?.mood_supports ?? [];

  let note_summary = partial?.note_summary?.trim() || fb.note_summary;
  if (!note_summary) {
    note_summary = `${fallbackCopy.matchContext} · ${guardian?.display_name ?? row.guardian_display_name ?? "—"}`;
  }
  if (note_summary.length > 220) note_summary = `${note_summary.slice(0, 217)}…`;

  return {
    region_label_key,
    region_display: region_label_key ? "" : region_display,
    theme_slug,
    theme_fallback_title,
    mood_interests,
    mood_supports,
    note_summary,
    request_type: partial?.request_type ?? fb.request_type,
    service_code: partial?.service_code ?? null,
    requested_at: partial?.requested_at ?? row.created_at,
    status_changed_at: status_changed_at || row.created_at,
  };
}

export function matchToTimelineStatus(status: StoredMatchRequest["status"]): "requested" | "matched" | "completed" {
  if (status === "accepted") return "matched";
  if (status === "completed") return "completed";
  return "requested";
}
