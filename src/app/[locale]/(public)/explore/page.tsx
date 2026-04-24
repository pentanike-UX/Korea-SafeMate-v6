import { Suspense } from "react";
import { getTranslations } from "next-intl/server";
import { ExploreJourneyClient } from "@/components/explore/explore-journey-client";
import { BRAND } from "@/lib/constants";

export async function generateMetadata() {
  const t = await getTranslations("ExploreJourney");
  return {
    title: `${t("metaTitle")} | ${BRAND.name}`,
    description: t("metaDescription"),
  };
}

function ExploreFallback() {
  return (
    <div className="text-muted-foreground flex min-h-[50vh] items-center justify-center px-4 text-sm">…</div>
  );
}

export default function ExplorePage() {
  return (
    <Suspense fallback={<ExploreFallback />}>
      <ExploreJourneyClient />
    </Suspense>
  );
}
