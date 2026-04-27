import { NextResponse } from "next/server";
import { getServerSupabaseForUser } from "@/lib/supabase/server-user";

type MoveMethod = "walk" | "subway" | "taxi";
type RouteStatus = "draft" | "under_review" | "public" | "private";

type SpotInput = {
  spot_id: string;
  stay_min?: number;
  guardian_note_ko?: string | null;
  guardian_note_en?: string | null;
  guardian_note_th?: string | null;
  guardian_note_vi?: string | null;
  move_from_prev_method?: MoveMethod | null;
  move_from_prev_min?: number | null;
};

type Body = {
  booking_id?: string;
  title_ko?: string | null;
  title_en?: string | null;
  title_th?: string | null;
  title_vi?: string | null;
  cover_image_url?: string | null;
  status?: RouteStatus;
  spots?: SpotInput[];
};

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function isUuid(v: string | null | undefined): v is string {
  return Boolean(v && UUID_RE.test(v.trim()));
}

function sanitizeTxt(v: string | null | undefined): string | null {
  if (typeof v !== "string") return null;
  const t = v.trim();
  return t.length > 0 ? t : null;
}

function toSafeStayMin(v: number | undefined): number {
  if (typeof v !== "number" || !Number.isFinite(v)) return 60;
  const n = Math.round(v);
  if (n < 10) return 10;
  if (n > 720) return 720;
  return n;
}

function toSafeMoveMin(v: number | null | undefined): number | null {
  if (typeof v !== "number" || !Number.isFinite(v)) return null;
  const n = Math.round(v);
  if (n < 1) return 1;
  if (n > 240) return 240;
  return n;
}

function normalizeStatus(v: string | undefined): RouteStatus {
  if (v === "draft" || v === "under_review" || v === "public" || v === "private") return v;
  return "private";
}

export async function POST(req: Request) {
  const sb = await getServerSupabaseForUser();
  if (!sb) return NextResponse.json({ error: "Auth not configured" }, { status: 503 });

  const {
    data: { user },
    error: authErr,
  } = await sb.auth.getUser();
  if (authErr || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const bookingId = sanitizeTxt(body.booking_id);
  if (!isUuid(bookingId)) {
    return NextResponse.json({ error: "booking_id must be UUID" }, { status: 400 });
  }

  const rawSpots = Array.isArray(body.spots) ? body.spots : [];
  if (rawSpots.length === 0) {
    return NextResponse.json({ error: "spots is required" }, { status: 400 });
  }

  for (const s of rawSpots) {
    if (!isUuid(s.spot_id)) {
      return NextResponse.json({ error: "each spot_id must be UUID" }, { status: 400 });
    }
    if (
      s.move_from_prev_method != null &&
      s.move_from_prev_method !== "walk" &&
      s.move_from_prev_method !== "subway" &&
      s.move_from_prev_method !== "taxi"
    ) {
      return NextResponse.json({ error: "move_from_prev_method must be walk|subway|taxi|null" }, { status: 400 });
    }
  }

  const { data: booking, error: bookingErr } = await sb
    .from("bookings")
    .select("id, guardian_user_id, status, revision_count, max_revisions")
    .eq("id", bookingId)
    .maybeSingle();
  if (bookingErr || !booking) {
    return NextResponse.json({ error: "Booking not found" }, { status: 404 });
  }
  if (booking.guardian_user_id !== user.id) {
    return NextResponse.json({ error: "Forbidden: this booking is not assigned to current guardian" }, { status: 403 });
  }

  const bookingStatus = (booking.status as string | null) ?? null;
  const revisionCount = (booking.revision_count as number | null) ?? 0;
  const maxRevisions = (booking.max_revisions as number | null) ?? 1;
  if (maxRevisions < 0 || revisionCount < 0 || revisionCount > maxRevisions) {
    return NextResponse.json(
      { error: "Invalid revision policy state", revision_count: revisionCount, max_revisions: maxRevisions },
      { status: 409 },
    );
  }

  const uniqueSpotIds = [...new Set(rawSpots.map((s) => s.spot_id))];
  const { data: spotRows, error: spotErr } = await sb.from("spot_catalog").select("id").in("id", uniqueSpotIds);
  if (spotErr) {
    return NextResponse.json({ error: spotErr.message }, { status: 500 });
  }
  const available = new Set((spotRows ?? []).map((r) => r.id as string));
  const missing = uniqueSpotIds.filter((id) => !available.has(id));
  if (missing.length > 0) {
    return NextResponse.json({ error: "Some spot_ids are not visible or not found", missing }, { status: 400 });
  }

  const status = normalizeStatus(body.status);
  const routePatch = {
    title_ko: sanitizeTxt(body.title_ko),
    title_en: sanitizeTxt(body.title_en),
    title_th: sanitizeTxt(body.title_th),
    title_vi: sanitizeTxt(body.title_vi),
    cover_image_url: sanitizeTxt(body.cover_image_url),
    status,
    route_type: "custom" as const,
    order_id: bookingId,
    total_duration_min: rawSpots.reduce((sum, s) => sum + toSafeStayMin(s.stay_min), 0),
    updated_at: new Date().toISOString(),
  };

  const { data: existing, error: existingErr } = await sb
    .from("routes")
    .select("id")
    .eq("guardian_user_id", user.id)
    .eq("order_id", bookingId)
    .eq("route_type", "custom")
    .is("deleted_at", null)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (existingErr) {
    return NextResponse.json({ error: existingErr.message }, { status: 500 });
  }

  let routeId = existing?.id as string | undefined;
  if (routeId) {
    const { error: updateErr } = await sb.from("routes").update(routePatch).eq("id", routeId);
    if (updateErr) return NextResponse.json({ error: updateErr.message }, { status: 500 });
    const { error: delErr } = await sb.from("route_spots").delete().eq("route_id", routeId);
    if (delErr) return NextResponse.json({ error: delErr.message }, { status: 500 });
  } else {
    const { data: inserted, error: insErr } = await sb
      .from("routes")
      .insert({
        guardian_user_id: user.id,
        ...routePatch,
      })
      .select("id")
      .single();
    if (insErr || !inserted) {
      return NextResponse.json({ error: insErr?.message ?? "Failed to insert route" }, { status: 500 });
    }
    routeId = inserted.id as string;
  }

  const routeSpots = rawSpots.map((s, idx) => ({
    route_id: routeId!,
    spot_id: s.spot_id,
    sort_order: idx + 1,
    stay_min: toSafeStayMin(s.stay_min),
    guardian_note_ko: sanitizeTxt(s.guardian_note_ko),
    guardian_note_en: sanitizeTxt(s.guardian_note_en),
    guardian_note_th: sanitizeTxt(s.guardian_note_th),
    guardian_note_vi: sanitizeTxt(s.guardian_note_vi),
    move_from_prev_method: idx === 0 ? null : s.move_from_prev_method ?? null,
    move_from_prev_min: idx === 0 ? null : toSafeMoveMin(s.move_from_prev_min),
  }));

  const { error: spotsErr } = await sb.from("route_spots").insert(routeSpots);
  if (spotsErr) {
    return NextResponse.json({ error: spotsErr.message }, { status: 500 });
  }

  const now = new Date().toISOString();
  const { error: bookingUpdateErr } = await sb
    .from("bookings")
    .update({
      status: "delivered",
      delivered_at: now,
      updated_at: now,
    })
    .eq("id", bookingId);
  if (bookingUpdateErr) {
    return NextResponse.json({ error: bookingUpdateErr.message }, { status: 500 });
  }

  return NextResponse.json({
    ok: true,
    route_id: routeId,
    booking_id: bookingId,
    route_spot_count: routeSpots.length,
    booking_status: "delivered",
    revision_count: revisionCount,
    max_revisions: maxRevisions,
    revision_policy_state: revisionCount >= maxRevisions ? "limit_reached" : "open",
    delivery_mode: bookingStatus === "revision_requested" ? "revision_delivery" : "initial_delivery",
  });
}
