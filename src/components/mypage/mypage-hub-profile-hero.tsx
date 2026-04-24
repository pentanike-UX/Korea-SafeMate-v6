"use client";

import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import type { AppAccountRole } from "@/lib/auth/app-role";
import type { GuardianProfileStatus } from "@/lib/auth/guardian-profile-status";
import { MypageAvatarEditTrigger } from "@/components/mypage/mypage-avatar-edit-trigger";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

function formatMemberSince(iso: string | null, locale: string) {
  if (!iso) return null;
  try {
    const tag = locale === "ko" ? "ko-KR" : locale === "ja" ? "ja-JP" : "en-US";
    return new Date(iso).toLocaleDateString(tag, { year: "numeric", month: "short", day: "numeric" });
  } catch {
    return null;
  }
}

export function MypageHubProfileHero({
  hubMode,
  appRole,
  guardianStatus,
  accountDisplayName,
  accountEmail,
  accountAvatarUrl,
  memberSinceIso,
  accountUserId,
}: {
  hubMode: "traveler" | "guardian";
  appRole: AppAccountRole;
  guardianStatus: GuardianProfileStatus;
  accountDisplayName: string;
  accountEmail: string | null;
  accountAvatarUrl: string | null;
  memberSinceIso: string | null;
  accountUserId: string | null;
}) {
  const locale = useLocale();
  const t = useTranslations("TravelerHub");
  const memberSince = formatMemberSince(memberSinceIso, locale);
  const initial = (accountDisplayName || accountEmail || "?").slice(0, 1).toUpperCase();

  const hubRoleSummary = () => {
    if (appRole === "guardian") {
      return t("hubRoleSummaryAccountGuardian", { status: t(`guardianStatus.${guardianStatus}`) });
    }
    if (guardianStatus !== "none") {
      return t("hubRoleSummaryTravelerPlusGuardian", { status: t(`guardianStatus.${guardianStatus}`) });
    }
    return t("hubRoleSummaryTravelerOnly");
  };

  return (
    <Card className="border-border/60 overflow-hidden rounded-[1.25rem] shadow-[var(--shadow-md)] ring-1 ring-border/40">
      <CardContent className="space-y-6 p-5 sm:p-7 md:p-8">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:gap-8" aria-label={t("hubIdentityCardAria")}>
          <div className="flex items-end gap-3 sm:flex-col sm:items-center sm:gap-2">
            <Avatar size="lg" className="size-20 ring-2 ring-border/60 sm:size-24">
              {accountAvatarUrl ? <AvatarImage src={accountAvatarUrl} alt="" /> : null}
              <AvatarFallback className="text-xl font-semibold sm:text-2xl">{initial}</AvatarFallback>
            </Avatar>
            <MypageAvatarEditTrigger className="sm:mt-0" />
          </div>
          <div className="min-w-0 flex-1 space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-text-strong text-xl font-semibold tracking-tight sm:text-2xl">
                {accountDisplayName || t("hubProfileFallbackName")}
              </h1>
            </div>
            <p className="text-muted-foreground text-sm leading-relaxed">{hubRoleSummary()}</p>
            <p className="text-muted-foreground text-sm break-all">{accountEmail || t("hubEmailPlaceholder")}</p>
            {accountUserId ? (
              <p className="text-muted-foreground font-mono text-[11px] break-all opacity-80">
                {t("hubUserIdLine", { id: accountUserId })}
              </p>
            ) : null}
            <p className="text-muted-foreground text-xs leading-relaxed">
              {memberSince ? t("hubProfileMemberSince", { date: memberSince }) : t("hubProfileMemberSinceUnknown")}
            </p>
            <div className="flex flex-wrap gap-2 pt-1">
              <Button asChild variant="default" size="default" className="h-11 rounded-xl font-semibold">
                <Link href={hubMode === "guardian" ? "/mypage/guardian/profile/edit" : "/mypage/profile"}>
                  {hubMode === "guardian" ? t("guardianNavEditProfile") : t("hubEditProfile")}
                </Link>
              </Button>
              <Button asChild variant="outline" size="default" className="h-11 rounded-xl font-medium">
                <Link href={hubMode === "guardian" ? "/mypage/guardian/profile/edit" : "/mypage/profile#profile-image-field"}>
                  {t("hubChangePhotoShort")}
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
