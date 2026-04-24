"use client";

import Image from "next/image";
import { FILL_IMAGE_MARKETING_CTA_GUARDIAN, FILL_IMAGE_MARKETING_CTA_TRAVELER } from "@/lib/ui/fill-image";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { HOME_CTA_IMAGES } from "@/data/home-cta-images";
import { useViewerRole } from "@/hooks/use-viewer-role";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ArrowRight, HandHelping, Search } from "lucide-react";

const CARD_MEDIA =
  "relative aspect-[5/4] w-full shrink-0 overflow-hidden sm:aspect-auto sm:h-auto sm:min-h-[272px] sm:w-[min(40%,300px)]";

export function HomeDualCtaSection() {
  const t = useTranslations("Home");
  const tHeader = useTranslations("Header");
  const viewer = useViewerRole();
  const guest = viewer == null;
  const guardian = viewer === "guardian";
  const traveler = viewer !== null && viewer !== undefined && !guardian;

  const leftPrimaryHref = guest ? "/guardians" : guardian ? "/mypage/guardian/posts" : "/guardians";
  const leftSecondaryHref = guest ? "/posts" : guardian ? "/mypage/guardian/matches" : "/mypage/saved-guardians";
  const leftPrimaryLabel = guest ? t("dualCtaTravelerPrimary") : guardian ? t("dualPolicyGuardianPrimary") : t("dualPolicyTravelerPrimary");
  const leftSecondaryLabel = guest
    ? t("dualPolicyGuestSecondary")
    : guardian
      ? t("dualPolicyGuardianSecondary")
      : t("dualPolicyTravelerSecondary");

  const contentCol = "flex flex-1 flex-col justify-center gap-4 p-6 sm:gap-5 sm:p-8";
  const iconWrapLight =
    "flex size-10 shrink-0 items-center justify-center rounded-[var(--radius-sm)] bg-[var(--brand-trust-blue-soft)] text-[var(--brand-trust-blue)]";
  const iconWrapDark =
    "flex size-10 shrink-0 items-center justify-center rounded-[var(--radius-sm)] bg-white/14 text-white";

  return (
    <section className="bg-muted/25 border-t border-border/50">
      <div className="mx-auto max-w-6xl px-4 py-12 pb-16 sm:px-5 sm:py-14 sm:pb-20">
        <p className="text-primary mb-6 text-center text-[11px] font-semibold tracking-[0.2em] uppercase sm:mb-8">{t("dualCtaEyebrow")}</p>
        <div className="grid gap-6 lg:grid-cols-2 lg:gap-8">
          {/* 가디언 찾기 */}
          <article
            className={cn(
              "flex flex-col overflow-hidden rounded-[var(--radius-lg)] border border-border/60 bg-card shadow-[var(--shadow-sm)] sm:min-h-[272px] sm:flex-row sm:items-stretch",
            )}
          >
            <div className={contentCol}>
              <span className={iconWrapLight} aria-hidden>
                <Search className="size-[1.35rem]" strokeWidth={1.75} />
              </span>
              <div>
                <h2 className="text-text-strong text-lg font-semibold tracking-tight text-balance sm:text-xl">
                  {t("dualCtaTravelerTitle")}
                </h2>
                <p className="text-muted-foreground mt-3 text-[15px] leading-relaxed sm:text-base">{t("dualCtaTravelerLead")}</p>
              </div>
              <div className="flex w-full flex-col gap-2.5 sm:flex-row sm:flex-wrap">
                <Button asChild size="lg" className="w-full rounded-[var(--radius-md)] font-semibold sm:w-auto sm:min-w-[11rem]">
                  <Link href={leftPrimaryHref}>{leftPrimaryLabel}</Link>
                </Button>
                <Button
                  asChild
                  size="lg"
                  variant="outline"
                  className="group/cta2 w-full rounded-[var(--radius-md)] border-2 bg-background font-semibold sm:w-auto sm:min-w-[11rem]"
                >
                  <Link href={leftSecondaryHref} className="inline-flex items-center justify-center gap-2">
                    {leftSecondaryLabel}
                    <ArrowRight
                      className="size-4 shrink-0 transition-transform duration-200 group-hover/cta2:translate-x-0.5"
                      aria-hidden
                    />
                  </Link>
                </Button>
              </div>
              {traveler ? (
                <Link
                  href="/mypage/saved-posts"
                  className="text-muted-foreground hover:text-foreground text-sm font-medium underline-offset-4 hover:underline"
                >
                  {t("dualPolicyTravelerTertiary")}
                </Link>
              ) : null}
              {guardian ? (
                <Link
                  href="/mypage/points"
                  className="text-muted-foreground hover:text-foreground text-sm font-medium underline-offset-4 hover:underline"
                >
                  {t("dualPolicyGuardianTertiary")}
                </Link>
              ) : null}
            </div>
            <div className={CARD_MEDIA}>
              <Image
                src={HOME_CTA_IMAGES.travelerPortrait}
                alt={t("dualCtaTravelerImageAlt")}
                fill
                className={FILL_IMAGE_MARKETING_CTA_TRAVELER}
                sizes="(max-width:1024px) 100vw, 300px"
                priority={false}
              />
              <div
                className="pointer-events-none absolute inset-0 bg-gradient-to-t from-card via-transparent to-transparent sm:bg-gradient-to-l sm:from-card sm:via-card/25 sm:to-transparent"
                aria-hidden
              />
            </div>
          </article>

          {/* 가디언 지원 */}
          <article
            className={cn(
              "flex flex-col overflow-hidden rounded-[var(--radius-lg)] border border-zinc-800 bg-zinc-950 text-white shadow-[var(--shadow-md)] sm:min-h-[272px] sm:flex-row sm:items-stretch",
            )}
          >
            <div className={contentCol}>
              <span className={iconWrapDark} aria-hidden>
                <HandHelping className="size-[1.35rem]" strokeWidth={1.75} />
              </span>
              <div>
                <h2 className="text-lg font-semibold tracking-tight text-balance text-white sm:text-xl">{t("dualCtaGuardianTitle")}</h2>
                <p className="mt-3 text-[15px] leading-relaxed text-white/88 sm:text-base">{t("dualCtaGuardianLead")}</p>
              </div>
              <Button
                asChild
                size="lg"
                variant="secondary"
                className="w-full rounded-[var(--radius-md)] border border-white/35 bg-white font-semibold text-zinc-900 hover:bg-white/95 sm:w-auto sm:min-w-[11rem]"
              >
                <Link href={guest || !guardian ? "/guardians/apply" : "/guardian/profile"}>
                  {guest || !guardian ? t("dualCtaGuardianButton") : tHeader("accountGuardianProfile")}
                </Link>
              </Button>
            </div>
            <div className={CARD_MEDIA}>
              <Image
                src={HOME_CTA_IMAGES.guardianPortrait}
                alt={t("dualCtaGuardianImageAlt")}
                fill
                className={FILL_IMAGE_MARKETING_CTA_GUARDIAN}
                sizes="(max-width:1024px) 100vw, 300px"
                priority={false}
              />
              <div
                className="pointer-events-none absolute inset-0 bg-gradient-to-t from-zinc-950 via-transparent to-transparent sm:bg-gradient-to-l sm:from-zinc-950 sm:via-zinc-950/35 sm:to-transparent"
                aria-hidden
              />
            </div>
          </article>
        </div>
      </div>
    </section>
  );
}
