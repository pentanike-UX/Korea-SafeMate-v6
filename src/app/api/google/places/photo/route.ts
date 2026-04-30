import { NextResponse } from "next/server";
import { z } from "zod";
import { resolveGooglePhotoMedia } from "@/lib/google-places-server";

const qSchema = z.object({
  photoName: z.string().min(10).max(768),
  maxWidthPx: z.coerce.number().int().min(160).max(4800).optional(),
});

/**
 * GET — Photo media 리다이렉트를 따라 최종 `photoUri`(보통 googleusercontent) 반환.
 * 키는 서버에서만 사용.
 */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const parsed = qSchema.safeParse({
    photoName: searchParams.get("photoName") ?? "",
    maxWidthPx: searchParams.get("maxWidthPx") ?? undefined,
  });
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_query" }, { status: 400 });
  }

  const { photoName, maxWidthPx } = parsed.data;
  const resolved = await resolveGooglePhotoMedia(photoName, { maxWidthPx: maxWidthPx ?? 1600 });
  if (!resolved?.url) {
    console.warn("[google-places-photo] unresolved", {
      photoName,
      maxWidthPx: maxWidthPx ?? 1600,
    });
    return NextResponse.json({ error: "unresolved" }, { status: 404 });
  }

  return NextResponse.json({
    url: resolved.url,
    width: resolved.width,
    height: resolved.height,
    source: "google-places-photo",
  });
}
