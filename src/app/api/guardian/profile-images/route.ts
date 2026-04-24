import { NextResponse } from "next/server";
import { getServerSupabaseForUser } from "@/lib/supabase/server-user";

const SELECT_FIELDS =
  "avatar_image_url, list_card_image_url, detail_hero_image_url, photo_url";

export async function GET() {
  const sb = await getServerSupabaseForUser();
  if (!sb) {
    return NextResponse.json({ error: "Auth not configured" }, { status: 503 });
  }
  const {
    data: { user },
    error: authErr,
  } = await sb.auth.getUser();
  if (authErr || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: row, error } = await sb
    .from("guardian_profiles")
    .select(SELECT_FIELDS)
    .eq("user_id", user.id)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  if (!row) {
    return NextResponse.json({ error: "No guardian profile" }, { status: 404 });
  }

  return NextResponse.json(row);
}

export async function PATCH(req: Request) {
  const sb = await getServerSupabaseForUser();
  if (!sb) {
    return NextResponse.json({ error: "Auth not configured" }, { status: 503 });
  }
  const {
    data: { user },
    error: authErr,
  } = await sb.auth.getUser();
  if (authErr || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: {
    avatar_image_url?: string | null;
    list_card_image_url?: string | null;
    detail_hero_image_url?: string | null;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { data: existing, error: loadErr } = await sb
    .from("guardian_profiles")
    .select("user_id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (loadErr) {
    return NextResponse.json({ error: loadErr.message }, { status: 500 });
  }
  if (!existing) {
    return NextResponse.json({ error: "No guardian profile" }, { status: 404 });
  }

  const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };

  const setNullable = (key: string, val: unknown) => {
    if (val === null || typeof val === "string") {
      patch[key] = typeof val === "string" ? val.trim() || null : null;
    }
  };

  if ("avatar_image_url" in body) setNullable("avatar_image_url", body.avatar_image_url);
  if ("list_card_image_url" in body) setNullable("list_card_image_url", body.list_card_image_url);
  if ("detail_hero_image_url" in body) setNullable("detail_hero_image_url", body.detail_hero_image_url);

  const { error } = await sb.from("guardian_profiles").update(patch).eq("user_id", user.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
