import { NextResponse } from "next/server";
import { getServerSupabaseForUser } from "@/lib/supabase/server-user";

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
    display_name?: string;
    intro?: string;
    locale?: string;
    profile_image_url?: string | null;
    preferred_region?: string;
    interest_themes?: string[] | string;
    spoken_languages?: string[] | string;
    profile_note?: string;
    list_card_image_url?: string | null;
    detail_hero_image_url?: string | null;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const now = new Date().toISOString();
  const patch: Record<string, unknown> = {
    updated_at: now,
    profile_fields_locked: true,
  };

  if (typeof body.display_name === "string") patch.display_name = body.display_name.trim() || null;
  if (typeof body.intro === "string") patch.intro = body.intro.trim() || null;
  if (typeof body.locale === "string") patch.locale = body.locale.trim() || null;
  if (body.profile_image_url === null || typeof body.profile_image_url === "string") {
    patch.profile_image_url = body.profile_image_url?.trim() || null;
  }
  if (typeof body.preferred_region === "string") patch.preferred_region = body.preferred_region.trim() || null;
  if (typeof body.profile_note === "string") patch.profile_note = body.profile_note.trim() || null;
  if (body.list_card_image_url === null || typeof body.list_card_image_url === "string") {
    patch.list_card_image_url = body.list_card_image_url?.trim() || null;
  }
  if (body.detail_hero_image_url === null || typeof body.detail_hero_image_url === "string") {
    patch.detail_hero_image_url = body.detail_hero_image_url?.trim() || null;
  }
  if (Array.isArray(body.interest_themes)) {
    patch.interest_themes = body.interest_themes.filter((v): v is string => typeof v === "string").map((v) => v.trim()).filter(Boolean);
  } else if (typeof body.interest_themes === "string") {
    patch.interest_themes = body.interest_themes
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
  }
  if (Array.isArray(body.spoken_languages)) {
    patch.spoken_languages = body.spoken_languages.filter((v): v is string => typeof v === "string").map((v) => v.trim()).filter(Boolean);
  } else if (typeof body.spoken_languages === "string") {
    patch.spoken_languages = body.spoken_languages
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
  }

  const { error } = await sb.from("user_profiles").upsert(
    {
      user_id: user.id,
      ...patch,
    },
    { onConflict: "user_id" },
  );

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
