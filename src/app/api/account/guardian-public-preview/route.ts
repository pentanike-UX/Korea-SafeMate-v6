import { NextResponse } from "next/server";
import { mockContentPosts } from "@/data/mock";
import { getMockGuardianIdFromCookies } from "@/lib/dev/mock-guardian-cookies.server";
import { getPublicGuardianByIdMerged } from "@/lib/guardian-public-merged.server";
import { publicGuardianToSheetPreview, type GuardianProfileSheetPreview } from "@/lib/guardian-profile-sheet-preview";
import { getServerSupabaseForUser } from "@/lib/supabase/server-user";

export async function GET() {
  const mockId = await getMockGuardianIdFromCookies();
  let userId: string | null = mockId;

  if (!userId) {
    const sb = await getServerSupabaseForUser();
    if (!sb) return NextResponse.json({ error: "Auth not configured" }, { status: 503 });
    const {
      data: { user },
    } = await sb.auth.getUser();
    userId = user?.id ?? null;
  }

  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const g = await getPublicGuardianByIdMerged(userId);
  if (!g) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const repPosts = (g.representative_post_ids ?? [])
    .map((id) => mockContentPosts.find((p) => p.id === id))
    .filter(Boolean)
    .slice(0, 3)
    .map((p) => ({ id: p!.id, title: p!.title, summary: p!.summary }));

  const preview: GuardianProfileSheetPreview = publicGuardianToSheetPreview(g, repPosts);
  return NextResponse.json({ preview });
}
