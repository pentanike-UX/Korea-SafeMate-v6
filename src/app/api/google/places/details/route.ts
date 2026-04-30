import { NextResponse } from "next/server";
import { z } from "zod";
import { googlePlaceDetails, resolveGooglePhotoMediaBatch } from "@/lib/google-places-server";

const qSchema = z.object({
  placeId: z.string().min(1).max(512),
  resolvePhotos: z.enum(["0", "1"]).optional(),
  placeQuery: z.string().max(256).optional(),
  spotLabel: z.string().max(128).optional(),
});

/**
 * GET — Place Details (New). `resolvePhotos=1`이면 최대 10장 `photoUri`(리다이렉트 해석 URL) 포함.
 */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const parsed = qSchema.safeParse({
    placeId: searchParams.get("placeId") ?? "",
    resolvePhotos: searchParams.get("resolvePhotos") ?? undefined,
    placeQuery: searchParams.get("placeQuery") ?? undefined,
    spotLabel: searchParams.get("spotLabel") ?? undefined,
  });
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_query" }, { status: 400 });
  }

  const { placeId, resolvePhotos, placeQuery, spotLabel } = parsed.data;
  const { details, rawError } = await googlePlaceDetails(placeId);

  if (rawError === "missing_api_key") {
    return NextResponse.json({ error: "server_misconfigured" }, { status: 503 });
  }
  if (!details) {
    console.warn("[google-places-details] details_not_found", {
      placeQuery: placeQuery ?? null,
      requestedPlaceId: placeId,
      spotLabel: spotLabel ?? null,
      fallbackReason: rawError ?? "not_found",
    });
    return NextResponse.json({ error: rawError ?? "not_found" }, { status: 404 });
  }

  let photoUris: string[] = [];
  let photoMedia: Array<{ name: string; url: string; width?: number; height?: number }> = [];
  let fallbackReason: string | null = null;
  if (resolvePhotos === "1" && details.photos.length > 0) {
    photoMedia = await resolveGooglePhotoMediaBatch(details.photos, 10);
    photoUris = photoMedia.map((p) => p.url);
    if (photoUris.length === 0) fallbackReason = "photo_media_unresolved";
  } else if (resolvePhotos === "1" && details.photos.length === 0) {
    fallbackReason = "photos_empty";
  } else if (resolvePhotos !== "1") {
    fallbackReason = "resolvePhotos_disabled";
  }

  console.info("[google-places-details] resolved", {
    placeQuery: placeQuery ?? null,
    requestedPlaceId: placeId,
    resolvedPlaceId: details.placeId,
    spotLabel: spotLabel ?? null,
    photosCount: details.photos.length,
    convertedPhotoUriCount: photoUris.length,
    firstPhotoUri: photoUris[0] ?? null,
    fallbackReason,
  });

  return NextResponse.json({
    placeId: details.placeId,
    displayName: details.displayName,
    formattedAddress: details.formattedAddress,
    location: details.location,
    photos: details.photos,
    photoUris,
    photoMedia,
    /** `resolvePhotos=1`일 때만 — 클라이언트 디버그용(이미지 없을 때 원인) */
    photoFallbackReason: fallbackReason,
  });
}
