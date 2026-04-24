import { NextResponse } from "next/server";
import {
  getBlockSeenMapForUser,
  getSeenMapForUser,
  isAttentionBlockKey,
  isAttentionMenuKey,
  upsertBlockSeenSignature,
  upsertSeenSignature,
} from "@/lib/mypage-attention-seen.server";
import { getSessionUserId } from "@/lib/supabase/server-user";

/** GET — 메뉴·블록별 seen 시그니처 */
export async function GET() {
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const [seen, blockSeen] = await Promise.all([getSeenMapForUser(userId), getBlockSeenMapForUser(userId)]);
  return NextResponse.json({ seen, blockSeen });
}

type PostBody =
  | { scope: "menu"; menuKey: string; signature: string }
  | { scope: "block"; blockKey: string; signature: string }
  | { menuKey?: string; signature?: string };

/** POST — 메뉴 이탈(비파티션) 또는 블록 관측 시 seen 저장 */
export async function POST(req: Request) {
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: PostBody;
  try {
    body = (await req.json()) as PostBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (body && typeof body === "object" && "scope" in body && body.scope === "block") {
    const blockKey = typeof body.blockKey === "string" ? body.blockKey.trim() : "";
    const signature = typeof body.signature === "string" ? body.signature : "";
    if (!blockKey || !isAttentionBlockKey(blockKey)) {
      return NextResponse.json({ error: "Invalid blockKey" }, { status: 400 });
    }
    if (!signature) {
      return NextResponse.json({ error: "signature required" }, { status: 400 });
    }
    await upsertBlockSeenSignature(userId, blockKey, signature);
    return NextResponse.json({ ok: true });
  }

  const menuKey =
    body && typeof body === "object" && "menuKey" in body && typeof body.menuKey === "string"
      ? body.menuKey.trim()
      : "";
  const signature =
    body && typeof body === "object" && "signature" in body && typeof body.signature === "string"
      ? body.signature
      : "";

  if (!menuKey || !isAttentionMenuKey(menuKey)) {
    return NextResponse.json({ error: "Invalid menuKey" }, { status: 400 });
  }
  if (!signature) {
    return NextResponse.json({ error: "signature required" }, { status: 400 });
  }

  await upsertSeenSignature(userId, menuKey, signature);
  return NextResponse.json({ ok: true });
}
