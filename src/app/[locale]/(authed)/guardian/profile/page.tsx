import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { getServerSupabaseForUser } from "@/lib/supabase/server-user";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BRAND } from "@/lib/constants";

export async function generateMetadata() {
  const t = await getTranslations("GuardianProfileEdit");
  return {
    title: `${t("viewMetaTitle")} | ${BRAND.name}`,
    description: t("metaDescription"),
  };
}

export default async function GuardianProfilePage() {
  const t = await getTranslations("GuardianProfileEdit");
  const sb = await getServerSupabaseForUser();
  let display = "—";
  let statusLine = t("noRow");

  if (sb) {
    const {
      data: { user },
    } = await sb.auth.getUser();
    if (user) {
      const { data: gp } = await sb
        .from("guardian_profiles")
        .select("display_name, profile_status, approval_status")
        .eq("user_id", user.id)
        .maybeSingle();
      if (gp) {
        display = gp.display_name ?? user.email ?? "—";
        statusLine = `${(gp.profile_status as string) ?? gp.approval_status ?? "unknown"}`;
      }
    }
  }

  return (
    <div className="page-container max-w-2xl space-y-6 py-8 sm:py-10">
      <Card className="rounded-2xl border-border/60 shadow-[var(--shadow-sm)]">
        <CardHeader>
          <CardTitle className="text-xl">{t("viewPageTitle")}</CardTitle>
          <CardDescription>{statusLine}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-foreground text-lg font-semibold">{display}</p>
          <div className="flex flex-wrap gap-2">
            <Button asChild className="rounded-xl font-semibold">
              <Link href="/mypage/guardian/profile/edit">{t("manageImages")}</Link>
            </Button>
            <Button asChild variant="secondary" className="rounded-xl">
              <Link href="/guardian">{t("backToGuardianHub")}</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
