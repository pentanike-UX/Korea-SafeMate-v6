import { NextResponse } from "next/server";
import { z } from "zod";
import { resolveGooglePhotoUri } from "@/lib/google-places-server";

const qSchema = z.object({
  name: z.string().min(10).max(768),
});

/**
 * GET — Photo media 리다이렉트를 따라 최종 `photoUri`(보통 googleusercontent) 반환.
 * 키는 서버에서만 사용.
 */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const parsed = qSchema.safeParse({ name: searchParams.get("name") ?? "" });
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_query" }, { status: 400 });
  }

  const photoUri = await resolveGooglePhotoUri(parsed.data.name);
  if (!photoUri) {
    return NextResponse.json({ error: "unresolved" }, { status: 404 });
  }

  return NextResponse.json({ photoUri });
}
