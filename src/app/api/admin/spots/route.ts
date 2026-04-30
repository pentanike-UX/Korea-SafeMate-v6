/**
 * GET  /api/admin/spots          — spot_catalog 목록
 * POST /api/admin/spots          — 새 스팟 생성 (Naver 검색 결과 기반)
 */
import { NextResponse } from "next/server";
import { getServerSupabaseForUser } from "@/lib/supabase/server-user";
import { createServiceRoleSupabase } from "@/lib/supabase/service-role";
import { createSpotFromNaverSchema } from "@/lib/validation/spot-catalog";

async function assertAdmin(): Promise<boolean> {
  const sb = await getServerSupabaseForUser();
  if (!sb) return false;
  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!user) return false;
  const { data } = await sb.from("users").select("app_role").eq("id", user.id).maybeSingle();
  return data?.app_role === "admin" || data?.app_role === "super_admin";
}

export async function GET(request: Request) {
  if (!(await assertAdmin())) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const limit = Math.min(Number(searchParams.get("limit") ?? "50"), 200);
  const offset = Number(searchParams.get("offset") ?? "0");
  const category = searchParams.get("category") ?? undefined;
  const verifiedParam = searchParams.get("verified");
  const verified =
    verifiedParam === "true" ? true : verifiedParam === "false" ? false : undefined;

  const sb = createServiceRoleSupabase();
  if (!sb) return NextResponse.json({ error: "DB unavailable" }, { status: 503 });

  let q = sb
    .from("spot_catalog")
    .select(
      "id, name_ko, name_en, address_ko, district, lat, lng, category, subcategory, region_tags, naver_place_id, image_strategy, primary_image_url, is_verified, is_active, source, created_at",
      { count: "exact" },
    )
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (category) q = q.eq("category", category);
  if (verified !== undefined) q = q.eq("is_verified", verified);

  const { data, count, error } = await q;
  if (error) {
    console.error("[api/admin/spots] GET error:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ spots: data ?? [], total: count ?? 0 });
}

export async function POST(request: Request) {
  if (!(await assertAdmin())) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = createSpotFromNaverSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const sb = createServiceRoleSupabase();
  if (!sb) return NextResponse.json({ error: "DB unavailable" }, { status: 503 });

  // 중복 체크 — naver_place_id가 있으면 중복 방지
  if (parsed.data.naver_place_id) {
    const { data: existing } = await sb
      .from("spot_catalog")
      .select("id, name_ko")
      .eq("naver_place_id", parsed.data.naver_place_id)
      .maybeSingle();
    if (existing) {
      return NextResponse.json(
        { error: "Spot already exists", existing_id: existing.id, name: existing.name_ko },
        { status: 409 },
      );
    }
  }

  const { data, error } = await sb
    .from("spot_catalog")
    .insert({
      name_ko: parsed.data.name_ko,
      name_en: parsed.data.name_en ?? null,
      address_ko: parsed.data.address_ko ?? null,
      district: parsed.data.district ?? null,
      lat: parsed.data.lat,
      lng: parsed.data.lng,
      category: parsed.data.category,
      subcategory: parsed.data.subcategory ?? null,
      naver_place_id: parsed.data.naver_place_id ?? null,
      region_tags: parsed.data.region_tags,
      naver_data: parsed.data.naver_data ?? null,
      internal_note: parsed.data.internal_note ?? null,
      source: "naver_api",
      is_verified: false,
      is_active: true,
    })
    .select()
    .single();

  if (error) {
    console.error("[api/admin/spots] POST error:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ spot: data }, { status: 201 });
}
