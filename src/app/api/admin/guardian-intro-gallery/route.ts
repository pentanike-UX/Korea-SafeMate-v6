import { writeFile } from "fs/promises";
import path from "path";
import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { getServerSupabaseForUser } from "@/lib/supabase/server-user";

const ADMIN_ROLES = new Set(["admin", "super_admin"]);

const JSON_PATH = ["src", "data", "mock", "guardian-intro-galleries.json"];

/**
 * 관리자만: 공개 가디언 상세에 쓰이는 소개 갤러리 URL 맵을 저장합니다.
 * 로컬/자체 호스팅에서 `src/data/mock/guardian-intro-galleries.json`에 기록됩니다.
 */
export async function POST(req: Request) {
  const sb = await getServerSupabaseForUser();
  if (!sb) {
    return NextResponse.json({ error: "Auth unavailable" }, { status: 503 });
  }
  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { data: urow } = await sb.from("users").select("app_role").eq("id", user.id).maybeSingle();
  if (!ADMIN_ROLES.has((urow?.app_role as string) ?? "")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let body: { galleries: Record<string, string[]> };
  try {
    body = (await req.json()) as { galleries: Record<string, string[]> };
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  if (!body.galleries || typeof body.galleries !== "object") {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  for (const urls of Object.values(body.galleries)) {
    if (!Array.isArray(urls) || urls.some((u) => typeof u !== "string")) {
      return NextResponse.json({ error: "Each gallery must be an array of strings" }, { status: 400 });
    }
  }

  const filePath = path.join(/* turbopackIgnore: true */ process.cwd(), ...JSON_PATH);
  let fileOk = true;
  try {
    await writeFile(filePath, JSON.stringify(body.galleries, null, 2), "utf8");
  } catch {
    fileOk = false;
  }
  const dbErrors: string[] = [];
  for (const [userId, urls] of Object.entries(body.galleries)) {
    const { error } = await sb
      .from("guardian_profiles")
      .update({
        intro_gallery_image_urls: urls,
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", userId);
    if (error) dbErrors.push(`${userId}: ${error.message}`);
  }

  revalidatePath("/", "layout");

  const galleryKeys = Object.keys(body.galleries);
  if (!fileOk && galleryKeys.length > 0 && dbErrors.length === galleryKeys.length) {
    return NextResponse.json(
      { ok: false, error: "Could not persist intro gallery (filesystem and DB failed)." },
      { status: 503 },
    );
  }

  return NextResponse.json({ ok: true, fileWritten: fileOk, dbErrors: dbErrors.length ? dbErrors : undefined });
}
