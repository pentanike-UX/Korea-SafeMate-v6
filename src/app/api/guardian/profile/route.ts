import { NextResponse } from "next/server";
import { getServerSupabaseForUser } from "@/lib/supabase/server-user";

export async function GET() {
  const sb = await getServerSupabaseForUser();
  if (!sb) return NextResponse.json({ error: "Auth not configured" }, { status: 503 });

  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: row, error } = await sb
    .from("guardian_profiles")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!row) return NextResponse.json({ error: "No guardian profile" }, { status: 404 });

  const [{ data: regions }, { data: langs }] = await Promise.all([
    sb.from("regions").select("id, slug"),
    sb.from("guardian_languages").select("language_code, proficiency").eq("guardian_user_id", user.id),
  ]);
  const regionSlug = regions?.find((r) => r.id === row.primary_region_id)?.slug ?? "";

  return NextResponse.json({
    ...row,
    primary_region_slug: regionSlug,
    languages: (langs ?? []).map((l) => ({ language_code: l.language_code, proficiency: l.proficiency })),
  });
}

export async function PATCH(req: Request) {
  const sb = await getServerSupabaseForUser();
  if (!sb) return NextResponse.json({ error: "Auth not configured" }, { status: 503 });
  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: {
    display_name?: string;
    headline?: string;
    bio?: string;
    primary_region_slug?: string;
    expertise_tags?: string[] | string;
    intro_gallery_image_urls?: string[] | string;
    theme_slugs?: string[] | string;
    style_slugs?: string[] | string;
    trust_reasons?: string[] | string;
    languages?: Array<{ language_code: string; proficiency: "basic" | "conversational" | "fluent" | "native" }>;
  };
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const toList = (v?: string[] | string) =>
    Array.isArray(v) ? v.map((x) => x.trim()).filter(Boolean) : (v ?? "").split(",").map((x) => x.trim()).filter(Boolean);

  const { data: reg } =
    typeof body.primary_region_slug === "string" && body.primary_region_slug.trim()
      ? await sb.from("regions").select("id").eq("slug", body.primary_region_slug.trim()).maybeSingle()
      : { data: null };

  const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (typeof body.display_name === "string") patch.display_name = body.display_name.trim();
  if (typeof body.headline === "string") patch.headline = body.headline.trim() || null;
  if (typeof body.bio === "string") patch.bio = body.bio.trim() || null;
  if (reg?.id) patch.primary_region_id = reg.id;
  if (body.expertise_tags) patch.expertise_tags = toList(body.expertise_tags);
  if (body.intro_gallery_image_urls) patch.intro_gallery_image_urls = toList(body.intro_gallery_image_urls);
  if (body.theme_slugs) patch.theme_slugs = toList(body.theme_slugs);
  if (body.style_slugs) patch.style_slugs = toList(body.style_slugs);
  if (body.trust_reasons) patch.trust_reasons = toList(body.trust_reasons);

  const { error: upErr } = await sb.from("guardian_profiles").update(patch).eq("user_id", user.id);
  if (upErr) return NextResponse.json({ error: upErr.message }, { status: 500 });

  if (body.languages) {
    const rows = body.languages
      .filter((x) => x.language_code && x.proficiency)
      .map((x) => ({
        guardian_user_id: user.id,
        language_code: x.language_code.trim(),
        proficiency: x.proficiency,
      }));
    await sb.from("guardian_languages").delete().eq("guardian_user_id", user.id);
    if (rows.length > 0) {
      const { error: langErr } = await sb.from("guardian_languages").insert(rows);
      if (langErr) return NextResponse.json({ error: langErr.message }, { status: 500 });
    }
  }

  return NextResponse.json({ ok: true });
}
