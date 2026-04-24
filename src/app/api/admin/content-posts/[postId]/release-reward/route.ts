import { NextResponse } from "next/server";
import { tryGrantPostRewardAfterModeration } from "@/lib/points/point-ledger-service";
import { createServiceRoleSupabase } from "@/lib/supabase/service-role";

type Ctx = { params: Promise<{ postId: string }> };

/** Sets moderation_reward_ok and attempts grant (post_reward_timing = approval). */
export async function POST(_req: Request, ctx: Ctx) {
  const { postId } = await ctx.params;
  const sb = createServiceRoleSupabase();
  if (!sb) {
    return NextResponse.json({ error: "Supabase not configured" }, { status: 503 });
  }

  const { error: up } = await sb.from("content_posts").update({ moderation_reward_ok: true }).eq("id", postId);
  if (up) {
    return NextResponse.json({ error: up.message }, { status: 500 });
  }

  const res = await tryGrantPostRewardAfterModeration(postId);
  return NextResponse.json({ granted: res.inserted });
}
