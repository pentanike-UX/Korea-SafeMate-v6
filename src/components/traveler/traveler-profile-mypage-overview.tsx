import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export type ProfileOverviewModel = {
  displayName: string;
  email: string;
  createdAtLabel: string;
  loginProvider: string;
  intro: string;
  locale: string;
  preferredRegion: string;
  interestThemes: string[];
  spokenLanguages: string[];
};

function FieldRow({ label, value, emptyHint }: { label: string; value: string; emptyHint: string }) {
  const has = value.trim().length > 0;
  return (
    <div className="space-y-1">
      <p className="text-muted-foreground text-[11px] font-semibold tracking-wide uppercase">{label}</p>
      {has ? (
        <p className="text-foreground text-sm font-medium leading-relaxed">{value}</p>
      ) : (
        <p className="text-muted-foreground text-sm leading-relaxed">{emptyHint}</p>
      )}
    </div>
  );
}

export async function TravelerProfileMypageOverview({ model }: { model: ProfileOverviewModel }) {
  const t = await getTranslations("TravelerAccount");
  const th = await getTranslations("TravelerHub");

  return (
    <div className="space-y-6">
      <Card className="border-border/60 rounded-2xl shadow-[var(--shadow-sm)]">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg">{th("profileOverviewBasicTitle")}</CardTitle>
          <CardDescription>{th("profileOverviewBasicLead")}</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-5 sm:grid-cols-2">
          <FieldRow label={t("fieldDisplayName")} value={model.displayName} emptyHint={th("emptyFieldDisplayName")} />
          <FieldRow label={t("fieldEmail")} value={model.email} emptyHint={th("emptyFieldEmail")} />
          <FieldRow
            label={t("fieldCreatedAt")}
            value={model.createdAtLabel === "—" ? "" : model.createdAtLabel}
            emptyHint={th("emptyFieldGeneric")}
          />
          <FieldRow
            label={t("fieldLoginMethod")}
            value={model.loginProvider}
            emptyHint={th("emptyFieldGeneric")}
          />
          <div className="space-y-1 sm:col-span-2">
            <p className="text-muted-foreground text-[11px] font-semibold tracking-wide uppercase">{th("fieldAccountStatus")}</p>
            <p className="text-foreground text-sm font-medium">{t("accountStatusActive")}</p>
          </div>
        </CardContent>
      </Card>

      <Card className="border-border/60 rounded-2xl shadow-[var(--shadow-sm)]">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg">{th("profileOverviewExtraTitle")}</CardTitle>
          <CardDescription>{th("profileOverviewExtraLead")}</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-5 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <FieldRow label={t("fieldIntro")} value={model.intro} emptyHint={th("emptyFieldIntro")} />
            {!model.intro.trim() ? <p className="text-muted-foreground mt-1.5 text-xs leading-relaxed">{th("emptyFieldHint")}</p> : null}
          </div>
          <FieldRow label={th("fieldPreferredRegion")} value={model.preferredRegion} emptyHint={th("emptyFieldRegion")} />
          <FieldRow
            label={th("fieldInterestThemes")}
            value={model.interestThemes.join(", ")}
            emptyHint={th("emptyFieldTheme")}
          />
          <FieldRow
            label="Languages"
            value={model.spokenLanguages.join(", ")}
            emptyHint={th("emptyFieldLocale")}
          />
          <FieldRow label={t("fieldLocale")} value={model.locale} emptyHint={th("emptyFieldLocale")} />
        </CardContent>
      </Card>

      <div className="flex flex-col gap-2.5 sm:flex-row sm:flex-wrap">
        <Button asChild className="h-11 rounded-xl font-semibold sm:min-w-[10rem]">
          <Link href="/mypage/profile?mode=profile">{th("profileEditCta")}</Link>
        </Button>
        <Button asChild variant="outline" className="h-11 rounded-xl font-medium sm:min-w-[10rem]">
          <Link href="/mypage/profile?mode=image">{th("profileImageChangeCta")}</Link>
        </Button>
      </div>
    </div>
  );
}
