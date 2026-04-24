import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { GuardianProfileNeedsRevisionBoundary } from "@/components/guardian/guardian-profile-needs-revision-boundary";
import { GuardianProfileEditForm } from "@/components/guardian/guardian-profile-edit-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getServerSupabaseForUser } from "@/lib/supabase/server-user";

export async function GuardianProfileEditScreen() {
  const t = await getTranslations("GuardianProfileEdit");
  const sb = await getServerSupabaseForUser();

  if (!sb) {
    return (
      <div className="mx-auto max-w-2xl space-y-6 py-2">
        <p className="text-muted-foreground text-sm">{t("authUnavailable")}</p>
      </div>
    );
  }

  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!user) {
    return (
      <div className="mx-auto max-w-2xl space-y-6 py-2">
        <p className="text-muted-foreground text-sm">{t("authUnavailable")}</p>
      </div>
    );
  }

  const { data: row, error } = await sb
    .from("guardian_profiles")
    .select(
      "user_id, display_name, headline, bio, primary_region_id, expertise_tags, intro_gallery_image_urls, photo_url, avatar_image_url, list_card_image_url, detail_hero_image_url, theme_slugs, style_slugs, trust_reasons",
    )
    .eq("user_id", user.id)
    .maybeSingle();

  if (error) {
    return (
      <div className="mx-auto max-w-2xl space-y-6 py-2">
        <p className="text-destructive text-sm">
          {error.message.includes("column") ? `${error.message} (DB 마이그레이션을 적용했는지 확인해 주세요.)` : error.message}
        </p>
      </div>
    );
  }

  if (!row) {
    return (
      <div className="mx-auto max-w-2xl space-y-6 py-2">
        <Card className="rounded-2xl border-border/60 shadow-[var(--shadow-sm)]">
          <CardHeader>
            <CardTitle className="text-xl">{t("pageTitle")}</CardTitle>
            <CardDescription>{t("noRow")}</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            <Button asChild className="rounded-xl font-semibold">
              <Link href="/guardian/onboarding">{t("openOnboarding")}</Link>
            </Button>
            <Button asChild variant="outline" className="rounded-xl">
              <Link href="/guardian/profile">{t("backToProfile")}</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const [{ data: reg }, { data: langs }] = await Promise.all([
    sb.from("regions").select("id, slug").eq("id", row.primary_region_id).maybeSingle(),
    sb.from("guardian_languages").select("language_code, proficiency").eq("guardian_user_id", user.id),
  ]);

  return (
    <GuardianProfileNeedsRevisionBoundary>
    <div className="mx-auto max-w-2xl space-y-8 py-2">
      <div>
        <h1 className="text-text-strong text-2xl font-semibold tracking-tight">{t("pageTitle")}</h1>
        <p className="text-muted-foreground mt-2 max-w-xl text-[15px] leading-relaxed">{t("pageLead")}</p>
        <p className="text-muted-foreground mt-2 max-w-xl text-sm leading-relaxed">{t("marketingCopyLead")}</p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Button asChild variant="outline" className="rounded-xl">
            <Link href="/guardian/onboarding">{t("openOnboarding")}</Link>
          </Button>
          <Button asChild variant="ghost" className="rounded-xl">
            <Link href="/guardian/profile">{t("backToProfile")}</Link>
          </Button>
        </div>
      </div>

      <Card className="rounded-2xl border-border/60 shadow-[var(--shadow-sm)]">
        <CardContent className="p-6 sm:p-8">
          <GuardianProfileEditForm
            initial={{
              user_id: user.id,
              display_name: row.display_name ?? "",
              headline: row.headline ?? "",
              bio: row.bio ?? "",
              primary_region_slug: reg?.slug ?? "",
              expertise_tags: row.expertise_tags ?? [],
              theme_slugs: row.theme_slugs ?? [],
              style_slugs: row.style_slugs ?? [],
              trust_reasons: row.trust_reasons ?? [],
              intro_gallery_image_urls: row.intro_gallery_image_urls ?? [],
              languages:
                langs?.map((l) => ({
                  language_code: l.language_code,
                  proficiency: l.proficiency,
                })) ?? [],
              photo_url: row.photo_url,
              avatar_image_url: row.avatar_image_url,
              list_card_image_url: row.list_card_image_url,
              detail_hero_image_url: row.detail_hero_image_url,
            }}
          />
        </CardContent>
      </Card>
    </div>
    </GuardianProfileNeedsRevisionBoundary>
  );
}
