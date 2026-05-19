import { getLocale, getTranslations } from "next-intl/server";
import { GuardiansDiscoverClient } from "@/components/guardians/guardians-discover-client";
import { listApprovedPostsMerged } from "@/lib/posts-public-merged.server";
import { listPublicGuardiansMerged } from "@/lib/guardian-public-merged.server";
import { applyGuardianDemoCuration } from "@/lib/guardian-demo-curation";
import { BRAND } from "@/lib/constants";

export async function generateMetadata() {
  const t = await getTranslations("GuardiansDiscover");
  return {
    title: `${t("metaTitle")} | ${BRAND.name}`,
    description: t("metaDescription"),
  };
}

export default async function GuardiansPage() {
  const locale = await getLocale();
  const [guardiansRaw, approvedPosts] = await Promise.all([listPublicGuardiansMerged(), listApprovedPostsMerged()]);
  // 데모 큐레이션 — 시연 종착 가디언은 영어 locale에서 영어 카피로 노출
  const guardians = guardiansRaw.map((g) => applyGuardianDemoCuration(g, locale));
  return <GuardiansDiscoverClient guardians={guardians} approvedPosts={approvedPosts} />;
}
