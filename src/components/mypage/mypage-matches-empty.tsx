"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import type { AppAccountRole } from "@/lib/auth/app-role";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { HeartHandshake, Sparkles } from "lucide-react";

export function MypageMatchesEmpty({ appRole }: { appRole: AppAccountRole }) {
  const t = useTranslations("TravelerHub");
  const guardian = appRole === "guardian";

  return (
    <Card className="border-border/60 overflow-hidden rounded-[1.35rem] border bg-gradient-to-br from-[var(--brand-trust-blue-soft)]/40 via-card to-[var(--brand-primary-soft)]/25 shadow-[var(--shadow-sm)]">
      <CardContent className="flex flex-col items-center gap-5 px-6 py-12 text-center sm:px-10 sm:py-14">
        <div
          className="flex size-16 items-center justify-center rounded-2xl bg-card/90 shadow-[var(--shadow-sm)] ring-1 ring-border/60"
          aria-hidden
        >
          {guardian ? <HeartHandshake className="text-[var(--brand-trust-blue)] size-8" /> : <Sparkles className="text-[var(--brand-primary)] size-8" />}
        </div>
        <div className="max-w-md space-y-2">
          <h3 className="text-foreground text-lg font-semibold tracking-tight">
            {guardian ? t("emptyMatchesGuardianTitle") : t("emptyMatchesTravelerTitle")}
          </h3>
          <p className="text-muted-foreground text-sm leading-relaxed">
            {guardian ? t("emptyMatchesGuardianBody") : t("emptyMatchesTravelerBody")}
          </p>
        </div>
        <div className="flex w-full max-w-sm flex-col gap-2.5 sm:flex-row sm:justify-center">
          {guardian ? (
            <>
              <Button asChild className="h-11 flex-1 rounded-xl font-semibold sm:flex-initial sm:min-w-[9rem]">
                <Link href="/mypage/guardian/posts">{t("emptyMatchesGuardianCtaPosts")}</Link>
              </Button>
              <Button asChild variant="outline" className="h-11 flex-1 rounded-xl font-medium sm:flex-initial sm:min-w-[9rem]">
                <Link href="/mypage/guardian/posts/new">{t("emptyMatchesGuardianCtaNewPost")}</Link>
              </Button>
            </>
          ) : (
            <>
              <Button asChild className="h-11 flex-1 rounded-xl font-semibold sm:flex-initial sm:min-w-[9rem]">
                <Link href="/guardians">{t("emptyMatchesTravelerCtaGuardians")}</Link>
              </Button>
              <Button asChild variant="outline" className="h-11 flex-1 rounded-xl font-medium sm:flex-initial sm:min-w-[9rem]">
                <Link href="/posts">{t("emptyMatchesTravelerCtaPosts")}</Link>
              </Button>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
