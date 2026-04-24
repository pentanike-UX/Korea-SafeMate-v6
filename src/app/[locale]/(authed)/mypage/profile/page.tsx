import { getTranslations, getLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { BRAND } from "@/lib/constants";
import { getServerSupabaseForUser, getSessionUserId } from "@/lib/supabase/server-user";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { TravelerAccountForm } from "@/components/traveler/traveler-account-form";
import { TravelerProfileMypageOverview } from "@/components/traveler/traveler-profile-mypage-overview";

export async function generateMetadata() {
  const t = await getTranslations("TravelerAccount");
  return {
    title: `${t("metaTitle")} | ${BRAND.name}`,
    description: t("metaDescription"),
  };
}

function formatCreatedAt(iso: string | null, locale: string) {
  if (!iso) return "—";
  try {
    return new Intl.DateTimeFormat(locale, { dateStyle: "medium" }).format(new Date(iso));
  } catch {
    return "—";
  }
}

export default async function TravelerAccountPage({
  searchParams,
}: {
  searchParams: Promise<{ mode?: string }>;
}) {
  await searchParams;
  const t = await getTranslations("TravelerAccount");
  const locale = await getLocale();
  const userId = await getSessionUserId();

  if (!userId) {
    return (
      <div className="space-y-6">
        <Card className="border-border/60 rounded-2xl shadow-[var(--shadow-sm)]">
          <CardHeader>
            <CardTitle className="text-lg">{t("needLoginTitle")}</CardTitle>
            <CardDescription>{t("needLoginLead")}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="rounded-xl font-semibold">
              <Link href="/login">{t("goLogin")}</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const sb = await getServerSupabaseForUser();
  if (!sb) {
    return <p className="text-muted-foreground text-sm">{t("error")}</p>;
  }

  const [{ data: appUser }, { data: profile }] = await Promise.all([
    sb.from("users").select("email, created_at, last_login_at, auth_provider").eq("id", userId).maybeSingle(),
    sb
      .from("user_profiles")
      .select(
        "display_name, intro, locale, login_provider, preferred_region, interest_themes, spoken_languages, profile_note",
      )
      .eq("user_id", userId)
      .maybeSingle(),
  ]);

  const email = appUser?.email ?? "";
  const initial = {
    display_name: profile?.display_name?.trim() ?? "",
    intro: profile?.intro?.trim() ?? "",
    locale: profile?.locale?.trim() ?? "",
    preferred_region: profile?.preferred_region?.trim() ?? "",
    interest_themes: Array.isArray(profile?.interest_themes) ? profile.interest_themes.filter((x): x is string => typeof x === "string") : [],
    spoken_languages: Array.isArray(profile?.spoken_languages) ? profile.spoken_languages.filter((x): x is string => typeof x === "string") : [],
    profile_note: profile?.profile_note?.trim() ?? "",
    email,
    login_provider: profile?.login_provider ?? appUser?.auth_provider ?? "google",
    created_at: appUser?.created_at ?? null,
    last_login_at: appUser?.last_login_at ?? null,
  };

  const overviewModel = {
    displayName: initial.display_name,
    email,
    createdAtLabel: formatCreatedAt(initial.created_at, locale),
    loginProvider: String(initial.login_provider || "google"),
    intro: initial.intro,
    locale: initial.locale,
    preferredRegion: initial.preferred_region,
    interestThemes: initial.interest_themes,
    spokenLanguages: initial.spoken_languages,
  };

  return (
    <div className="space-y-10">
      <div>
        <h2 className="text-text-strong text-xl font-semibold tracking-tight sm:text-2xl">{t("pageTitle")}</h2>
        <p className="text-muted-foreground mt-2 max-w-xl text-[15px] leading-relaxed">{t("pageLead")}</p>
      </div>

      <TravelerProfileMypageOverview model={overviewModel} />

      <section
        id="mypage-profile-edit"
        className="scroll-mt-28 space-y-4 rounded-[1.25rem] border border-border/60 bg-card/40 p-5 shadow-[var(--shadow-sm)] sm:p-6"
      >
        <div>
          <h3 className="text-foreground text-lg font-semibold">{t("sectionEditProfile")}</h3>
          <p className="text-muted-foreground mt-1 text-sm leading-relaxed">{t("pageLead")}</p>
        </div>
        <TravelerAccountForm initial={initial} locale={locale} />
      </section>
    </div>
  );
}
