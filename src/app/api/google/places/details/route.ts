import { NextResponse } from "next/server";
import { z } from "zod";
import { googlePlaceDetails, resolveGooglePhotoUris } from "@/lib/google-places-server";

const qSchema = z.object({
  placeId: z.string().min(1).max(512),
  resolvePhotos: z.enum(["0", "1"]).optional(),
});

/**
 * GET — Place Details (New). `resolvePhotos=1`이면 최대 10장 `photoUri`(리다이렉트 해석 URL) 포함.
 */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const parsed = qSchema.safeParse({
    placeId: searchParams.get("placeId") ?? "",
    resolvePhotos: searchParams.get("resolvePhotos") ?? undefined,
  });
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_query" }, { status: 400 });
  }

  const { placeId, resolvePhotos } = parsed.data;
  const { details, rawError } = await googlePlaceDetails(placeId);

  if (rawError === "missing_api_key") {
    return NextResponse.json({ error: "server_misconfigured" }, { status: 503 });
  }
  if (!details) {
    return NextResponse.json({ error: rawError ?? "not_found" }, { status: 404 });
  }

  let photoUris: string[] = [];
  if (resolvePhotos === "1" && details.photos.length > 0) {
    photoUris = await resolveGooglePhotoUris(details.photos, 10);
  }

  return NextResponse.json({
    placeId: details.placeId,
    displayName: details.displayName,
    formattedAddress: details.formattedAddress,
    location: details.location,
    photos: details.photos,
    photoUris,
  });
}
