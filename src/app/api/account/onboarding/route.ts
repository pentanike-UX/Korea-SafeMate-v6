import { NextResponse } from "next/server";
import type { AppAccountRole } from "@/lib/auth/app-role";
import { legacyUserRoleFromAppRole } from "@/lib/auth/app-role";
import { getServerSupabaseForUser } from "@/lib/supabase/server-user";

const ALLOWED_LANGUAGES = new Set(["ko", "en", "th", "vi", "id", "fil"]);

type RequestBody = {
  preferredLanguage?: string;
  countryCode?: string;
  isFirstVisit?: boolean;
};

function sanitizeCountryCode(input: string | undefined) {
  if (!input) return "TH";
  const value = input.trim().toUpperCase();
  if (!/^[A-Z]{2}$/.test(value)) return "TH";
  return value;
}

function sanitizeLanguage(input: string | undefined) {
  const value = (input ?? "").trim().toLowerCase();
  if (!ALLOWED_LANGUAGES.has(value)) return "en";
  return value;
}

export async function POST(request: Request) {
  const sb = await getServerSupabaseForUser();
  if (!sb) {
    return NextResponse.json({ error: "Auth not configured" }, { status: 503 });
  }

  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const payload = (await request.json().catch(() => ({}))) as RequestBody;
  const preferredLanguage = sanitizeLanguage(payload.preferredLanguage);
  const countryCode = sanitizeCountryCode(payload.countryCode);
  const isFirstVisit = payload.isFirstVisit !== false;
  const now = new Date().toISOString();

  const meta = user.user_metadata ?? {};
  const fullName =
    (typeof meta.full_name === "string" && meta.full_name.trim()) ||
    (typeof meta.name === "string" && meta.name.trim()) ||
    user.email?.split("@")[0] ||
    "Traveler";

  const { data: userRow } = await sb.from("users").select("app_role").eq("id", user.id).maybeSingle();
  const appRole = ((userRow?.app_role as AppAccountRole | undefined) ?? "traveler");

  const { error: userErr } = await sb.from("users").upsert(
    {
      id: user.id,
      email: user.email ?? "",
      app_role: appRole,
      role: legacyUserRoleFromAppRole(appRole),
      auth_provider: "email",
      legal_name: fullName,
      onboarded: true,
      is_first_visit: isFirstVisit,
      last_login_at: now,
    },
    { onConflict: "id" },
  );
  if (userErr) {
    return NextResponse.json({ error: userErr.message }, { status: 500 });
  }

  const { error: profileErr } = await sb.from("user_profiles").upsert(
    {
      user_id: user.id,
      display_name: fullName,
      preferred_lang: preferredLanguage,
      updated_at: now,
    },
    { onConflict: "user_id" },
  );
  if (profileErr) {
    return NextResponse.json({ error: profileErr.message }, { status: 500 });
  }

  const { error: travelerErr } = await sb.from("traveler_profiles").upsert(
    {
      user_id: user.id,
      full_name: fullName,
      country_code: countryCode,
      preferred_language: preferredLanguage,
      updated_at: now,
    },
    { onConflict: "user_id" },
  );
  if (travelerErr) {
    return NextResponse.json({ error: travelerErr.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
