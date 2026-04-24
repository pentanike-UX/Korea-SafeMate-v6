import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { GuardianMatchesWorkspace } from "@/components/guardian/guardian-matches-workspace";
import { Button } from "@/components/ui/button";
import { BRAND } from "@/lib/constants";
import { getSessionUserId } from "@/lib/supabase/server-user";

export async function generateMetadata() {
  const t = await getTranslations("TravelerHub");
  return {
    title: `${t("guardianMatchesPageTitle")} | ${BRAND.name}`,
  };
}

export default async function MypageGuardianMatchesPage() {
  const t = await getTranslations("TravelerHub");
  const guardianId = await getSessionUserId();

  if (!guardianId) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-text-strong text-2xl font-semibold tracking-tight">{t("guardianMatchesPageTitle")}</h1>
          <p className="text-muted-foreground mt-2 max-w-2xl text-sm leading-relaxed">{t("guardianMatchesNeedSession")}</p>
        </div>
        <Button asChild className="h-11 rounded-xl font-semibold">
          <Link href="/login">{t("goLogin")}</Link>
        </Button>
      </div>
    );
  }

  return <GuardianMatchesWorkspace guardianId={guardianId} />;
}
