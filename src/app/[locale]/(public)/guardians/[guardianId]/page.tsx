import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { mockTravelerReviews } from "@/data/mock/traveler-reviews";
import { GuardianDetailView } from "@/components/guardians/guardian-detail-view";
import { getIntroGalleryResolutionFromDb } from "@/lib/guardian-intro-gallery-db.server";
import { getPublicGuardianByIdMerged, listPublicGuardiansMerged } from "@/lib/guardian-public-merged.server";
import { payloadToTravelerReview } from "@/lib/traveler-submitted-reviews";
import { getSubmittedTravelerReviewsFromCookie } from "@/lib/traveler-submitted-reviews.server";
import { BRAND } from "@/lib/constants";

type Props = { params: Promise<{ locale: string; guardianId: string }> };

export async function generateStaticParams() {
  const guardians = await listPublicGuardiansMerged();
  return guardians.map((g) => ({ guardianId: g.user_id }));
}

export async function generateMetadata({ params }: Props) {
  const { guardianId } = await params;
  const g = await getPublicGuardianByIdMerged(guardianId);
  const t = await getTranslations("GuardianDetail");
  if (!g) {
    return { title: `${t("notFound")} | ${BRAND.name}` };
  }
  return {
    title: `${g.display_name} | ${BRAND.name}`,
    description: g.headline,
  };
}

export default async function GuardianDetailPage({ params }: Props) {
  const { guardianId } = await params;
  const g = await getPublicGuardianByIdMerged(guardianId);
  if (!g) notFound();

  const introRes = await getIntroGalleryResolutionFromDb(guardianId);
  const guardian =
    introRes.kind === "has"
      ? { ...g, intro_gallery_image_urls: introRes.urls }
      : introRes.kind === "empty"
        ? { ...g, intro_gallery_image_urls: [] }
        : g;

  const extra = await getSubmittedTravelerReviewsFromCookie();
  const forG = extra.filter((r) => r.guardian_user_id === guardianId).map(payloadToTravelerReview);
  const mock = mockTravelerReviews.filter((r) => r.guardian_user_id === guardianId);
  const merged = [...mock, ...forG].sort((a, b) => +new Date(b.created_at) - +new Date(a.created_at));
  return <GuardianDetailView guardian={guardian} mergedReviews={merged} />;
}
