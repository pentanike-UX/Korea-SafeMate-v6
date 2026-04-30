/**
 * GET    /api/admin/spots/[spotId]/images          — 스팟 이미지 목록
 * POST   /api/admin/spots/[spotId]/images          — 이미지 추가
 * PATCH  /api/admin/spots/[spotId]/images/[imgId]  — 이미지 수정 (대표 지정 등)
 * DELETE /api/admin/spots/[spotId]/images/[imgId]  — 이미지 삭제
 *
 * is_primary=true 설정 시 동일 spot_catalog_id + image_type의 기존 primary를 자동 해제.
 */
import { NextResponse } from "next/server";
import { getServerSupabaseForUser } from "@/lib/supabase/server-user";
import { createServiceRoleSupabase } from "@/lib/supabase/service-role";
import { addSpotImageSchema, updateSpotImageSchema } from "@/lib/validation/spot-catalog";

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

type RouteContext = { params: Promise<{ spotId: string }> };

export async function GET(_req: Request, { params }: RouteContext) {
  if (!(await assertAdmin())) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { spotId } = await params;
  const sb = createServiceRoleSupabase();
  if (!sb) return NextResponse.json({ error: "DB unavailable" }, { status: 503 });

  const { data, error } = await sb
    .from("spot_images")
    .select("*")
    .eq("spot_catalog_id", spotId)
    .order("image_type")
    .order("sort_order");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ images: data ?? [] });
}

export async function POST(request: Request, { params }: RouteContext) {
  if (!(await assertAdmin())) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { spotId } = await params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = addSpotImageSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const sb = createServiceRoleSupabase();
  if (!sb) return NextResponse.json({ error: "DB unavailable" }, { status: 503 });

  // 스팟 존재 확인
  const { data: spot } = await sb
    .from("spot_catalog")
    .select("id")
    .eq("id", spotId)
    .maybeSingle();
  if (!spot) {
    return NextResponse.json({ error: "Spot not found" }, { status: 404 });
  }

  // is_primary=true 설정 시 기존 primary 해제
  if (parsed.data.is_primary) {
    await sb
      .from("spot_images")
      .update({ is_primary: false })
      .eq("spot_catalog_id", spotId)
      .eq("image_type", parsed.data.image_type);
  }

  const { data, error } = await sb
    .from("spot_images")
    .insert({
      spot_catalog_id: spotId,
      url: parsed.data.url,
      image_type: parsed.data.image_type,
      is_primary: parsed.data.is_primary,
      sort_order: parsed.data.sort_order,
      source: parsed.data.source,
      caption_ko: parsed.data.caption_ko ?? null,
      caption_en: parsed.data.caption_en ?? null,
      is_stored: parsed.data.is_stored,
    })
    .select()
    .single();

  if (error) {
    console.error("[api/admin/spots/images] POST error:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ image: data }, { status: 201 });
}

export async function PATCH(request: Request, { params }: RouteContext) {
  if (!(await assertAdmin())) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { spotId } = await params;
  const { searchParams } = new URL(request.url);
  const imgId = searchParams.get("imgId");
  if (!imgId) {
    return NextResponse.json({ error: "imgId query param required" }, { status: 400 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = updateSpotImageSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const sb = createServiceRoleSupabase();
  if (!sb) return NextResponse.json({ error: "DB unavailable" }, { status: 503 });

  // is_primary=true 설정 시 동일 타입의 기존 primary 해제
  if (parsed.data.is_primary && parsed.data.image_type) {
    await sb
      .from("spot_images")
      .update({ is_primary: false })
      .eq("spot_catalog_id", spotId)
      .eq("image_type", parsed.data.image_type)
      .neq("id", imgId);
  }

  const { data, error } = await sb
    .from("spot_images")
    .update(parsed.data)
    .eq("id", imgId)
    .eq("spot_catalog_id", spotId)
    .select()
    .single();

  if (error) {
    console.error("[api/admin/spots/images] PATCH error:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ image: data });
}

export async function DELETE(request: Request, { params }: RouteContext) {
  if (!(await assertAdmin())) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { spotId } = await params;
  const { searchParams } = new URL(request.url);
  const imgId = searchParams.get("imgId");
  if (!imgId) {
    return NextResponse.json({ error: "imgId query param required" }, { status: 400 });
  }

  const sb = createServiceRoleSupabase();
  if (!sb) return NextResponse.json({ error: "DB unavailable" }, { status: 503 });

  const { error } = await sb
    .from("spot_images")
    .delete()
    .eq("id", imgId)
    .eq("spot_catalog_id", spotId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
