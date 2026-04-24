import fs from "fs";
import path from "path";
import { notFound } from "next/navigation";
import { mockGuardians } from "@/data/mock";
import { AdminGuardianMediaClient } from "@/app/admin/guardians/[guardianId]/media/admin-guardian-media-client";
import { getServerSupabaseForUser } from "@/lib/supabase/server-user";

type Props = { params: Promise<{ guardianId: string }> };

function loadAllGalleries(): Record<string, string[]> {
  try {
    const p = path.join(process.cwd(), "src", "data", "mock", "guardian-intro-galleries.json");
    return JSON.parse(fs.readFileSync(p, "utf8")) as Record<string, string[]>;
  } catch {
    return {};
  }
}

export default async function AdminGuardianMediaPage({ params }: Props) {
  const { guardianId } = await params;
  const g = mockGuardians.find((x) => x.user_id === guardianId);
  if (!g) notFound();
  const all = loadAllGalleries();
  let initial = all[guardianId] ?? [];

  const sb = await getServerSupabaseForUser();
  if (sb) {
    const { data } = await sb
      .from("guardian_profiles")
      .select("intro_gallery_image_urls")
      .eq("user_id", guardianId)
      .maybeSingle();
    const fromDb = data?.intro_gallery_image_urls;
    if (Array.isArray(fromDb) && fromDb.some((u) => typeof u === "string" && u.trim())) {
      initial = fromDb.map((u) => String(u).trim()).filter(Boolean);
    }
  }

  return <AdminGuardianMediaClient guardian={g} initialIntroUrls={initial} allGalleries={all} />;
}
