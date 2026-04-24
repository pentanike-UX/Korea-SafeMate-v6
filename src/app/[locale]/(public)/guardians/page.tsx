import { getTranslations } from "next-intl/server";
import { GuardiansDiscoverClient } from "@/components/guardians/guardians-discover-client";
import { listApprovedPostsMerged } from "@/lib/posts-public-merged.server";
import { listPublicGuardiansMerged } from "@/lib/guardian-public-merged.server";
import { BRAND } from "@/lib/constants";

export async function generateMetadata() {
  const t = await getTranslations("GuardiansDiscover");
  return {
    title: `${t("metaTitle")} | ${BRAND.name}`,
    description: t("metaDescription"),
  };
}

export default async function GuardiansPage() {
  const [guardians, approvedPosts] = await Promise.all([listPublicGuardiansMerged(), listApprovedPostsMerged()]);
  return <GuardiansDiscoverClient guardians={guardians} approvedPosts={approvedPosts} />;
}
