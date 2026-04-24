"use client";

import Image from "next/image";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { AboutParallaxBand } from "@/components/about/about-parallax-band";
import { AboutParallaxHero } from "@/components/about/about-parallax-hero";
import { Button } from "@/components/ui/button";
import { BRAND } from "@/lib/constants";
import { FILL_IMAGE_COVER_CENTER, FILL_IMAGE_MARKETING_REGION_TILE } from "@/lib/ui/fill-image";
import { cn } from "@/lib/utils";
import {
  ArrowRight,
  CheckCircle2,
  Compass,
  HeartHandshake,
  MapPinned,
  MessageCircle,
  Shield,
  Sparkles,
  Sunrise,
  Sunset,
  Users,
} from "lucide-react";

const IMG = {
  hero: "/images/hero/seoul6_BTS_Gwanghwamun.jpg",
  benefit1: "/images/hero/seoul5_NSeoulTower.jpg",
  benefit2: "/images/hero/seoul3_Dokebi_Gamgodang-gil.jpg",
  benefit3: "/images/hero/seoul4_aManWhoLivesWithAKing_Gyeongbokgung.jpg",
  guardian: "/images/hero/seoul2_MyLoveFromTheStar_NSeoulTower.jpg",
  story: "/images/hero/seoul5_NSeoulTower.jpg",
} as const;

function SectionShell({
  id,
  className,
  children,
}: {
  id?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className={cn("scroll-mt-24", className)}>
      {children}
    </section>
  );
}

export function AboutLanding() {
  const t = useTranslations("AboutPage");

  return (
    <div className="bg-[var(--bg-page)] text-[var(--text-primary)]">
      <AboutParallaxHero
        imageSrc={IMG.hero}
        imageAlt=""
        priority
        parallaxMax={88}
        overlayClassName="from-black/72 via-zinc-900/48"
      >
        <div className="page-container flex min-h-[min(100dvh,52rem)] max-w-6xl flex-col justify-end px-4 pb-16 pt-28 sm:px-6 sm:pb-20 sm:pt-32 md:pb-24">
          <p className="text-[11px] font-semibold tracking-[0.22em] text-white/80 uppercase">{BRAND.name}</p>
          <h1 className="mt-4 max-w-[18ch] text-4xl font-semibold tracking-tight text-white sm:text-5xl md:text-6xl md:leading-[1.05]">
            {t("landing.hero.title")}
          </h1>
          <p className="mt-6 max-w-xl text-base leading-relaxed text-white/88 sm:text-lg">{t("landing.hero.subtitle")}</p>
          <div className="mt-10 flex w-full max-w-lg flex-col gap-3 sm:max-w-none sm:flex-row sm:flex-wrap sm:gap-4">
            <Button
              asChild
              size="lg"
              className="h-12 rounded-[var(--radius-md)] border-0 bg-white px-6 font-semibold text-zinc-900 shadow-lg hover:bg-white/95"
            >
              <Link href="/explore" className="inline-flex w-full items-center justify-center gap-2 sm:w-auto">
                <Compass className="size-5 opacity-90" strokeWidth={1.75} aria-hidden />
                {t("landing.hero.ctaTraveler")}
                <ArrowRight className="size-4 opacity-80" aria-hidden />
              </Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="h-12 rounded-[var(--radius-md)] border-2 border-white/35 bg-white/10 px-6 font-semibold text-white backdrop-blur-sm hover:bg-white/18"
            >
              <Link href="/guardians/apply" className="inline-flex w-full items-center justify-center gap-2 sm:w-auto">
                <Users className="size-5 opacity-95" strokeWidth={1.75} aria-hidden />
                {t("landing.hero.ctaGuardian")}
                <ArrowRight className="size-4 opacity-80" aria-hidden />
              </Link>
            </Button>
          </div>
        </div>
      </AboutParallaxHero>

      <SectionShell className="page-container max-w-6xl px-4 py-16 sm:px-6 sm:py-20 md:py-24">
        <p className="text-primary text-[11px] font-semibold tracking-[0.2em] uppercase">{t("landing.problem.kicker")}</p>
        <h2 className="text-text-strong mt-3 text-2xl font-semibold tracking-tight sm:text-3xl md:text-4xl">
          {t("landing.problem.title")}
        </h2>
        <p className="text-muted-foreground mt-4 max-w-2xl text-base leading-relaxed sm:text-lg">{t("landing.problem.lead")}</p>
        <div className="mt-12 grid gap-5 sm:grid-cols-3">
          {(["one", "two", "three"] as const).map((key, i) => {
            const Icon = [MapPinned, MessageCircle, HeartHandshake][i]!;
            return (
              <div
                key={key}
                className="border-border/80 bg-card/50 flex flex-col rounded-[var(--radius-lg)] border p-6 shadow-[var(--shadow-sm)]"
              >
                <span className="bg-primary/10 text-primary inline-flex size-11 items-center justify-center rounded-xl">
                  <Icon className="size-5" strokeWidth={1.75} aria-hidden />
                </span>
                <h3 className="text-text-strong mt-4 text-lg font-semibold">{t(`landing.problem.${key}Title`)}</h3>
                <p className="text-muted-foreground mt-2 text-[15px] leading-relaxed">{t(`landing.problem.${key}Body`)}</p>
              </div>
            );
          })}
        </div>
      </SectionShell>

      <AboutParallaxBand
        imageSrc={IMG.benefit1}
        imageAlt=""
        parallaxMax={56}
        minHeightClass="min-h-[17rem] md:min-h-[23rem]"
        overlayClassName="from-zinc-950/88 via-zinc-900/50 to-zinc-950/80"
      >
        <div className="page-container relative z-[1] flex max-w-3xl flex-col justify-center px-4 py-12 sm:px-6 sm:py-16 md:min-h-[23rem] md:py-20">
          <p className="text-[11px] font-semibold tracking-[0.22em] text-white/72 uppercase">{t("landing.bridgeOne.kicker")}</p>
          <h2 className="mt-3 text-2xl font-semibold tracking-tight text-balance text-white sm:text-3xl md:text-4xl md:leading-tight">
            {t("landing.bridgeOne.title")}
          </h2>
          <p className="mt-4 max-w-xl text-base leading-relaxed text-white/84 sm:text-lg">{t("landing.bridgeOne.lead")}</p>
        </div>
      </AboutParallaxBand>

      <section className="border-border/60 border-y bg-[color-mix(in_srgb,var(--muted)_45%,var(--bg-page))] py-16 sm:py-20 md:py-24">
        <div className="page-container max-w-6xl px-4 sm:px-6">
          <div className="max-w-2xl">
            <p className="text-primary text-[11px] font-semibold tracking-[0.2em] uppercase">{t("landing.how.kicker")}</p>
            <h2 className="text-text-strong mt-3 text-2xl font-semibold tracking-tight sm:text-3xl md:text-4xl">
              {t("landing.how.title")}
            </h2>
            <p className="text-muted-foreground mt-4 text-base leading-relaxed sm:text-lg">{t("landing.how.lead")}</p>
          </div>
          <ol className="mt-12 grid gap-8 md:grid-cols-3 md:gap-10">
            {(["one", "two", "three"] as const).map((key, i) => (
              <li key={key} className="relative flex gap-4 md:flex-col md:gap-5">
                <span className="text-primary/25 font-mono text-5xl font-bold tabular-nums leading-none md:text-6xl">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <div>
                  <h3 className="text-text-strong text-lg font-semibold">{t(`landing.how.${key}Title`)}</h3>
                  <p className="text-muted-foreground mt-2 text-[15px] leading-relaxed">{t(`landing.how.${key}Body`)}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <AboutParallaxBand
        imageSrc={IMG.benefit2}
        imageAlt=""
        parallaxMax={48}
        minHeightClass="min-h-[16rem] md:min-h-[22rem]"
        overlayClassName="from-black/78 via-zinc-900/48 to-black/80"
      >
        <div className="page-container relative z-[1] flex max-w-3xl flex-col justify-center px-4 py-11 sm:px-6 sm:py-14 md:min-h-[22rem] md:py-16">
          <p className="text-[11px] font-semibold tracking-[0.22em] text-white/72 uppercase">{t("landing.bridgeTwo.kicker")}</p>
          <h2 className="mt-3 text-xl font-semibold tracking-tight text-balance text-white sm:text-2xl md:text-3xl">
            {t("landing.bridgeTwo.title")}
          </h2>
          <p className="mt-3 max-w-xl text-[15px] leading-relaxed text-white/82 sm:text-base">{t("landing.bridgeTwo.lead")}</p>
        </div>
      </AboutParallaxBand>

      <SectionShell className="page-container max-w-6xl px-4 py-16 sm:px-6 sm:py-20 md:py-24">
        <p className="text-primary text-[11px] font-semibold tracking-[0.2em] uppercase">{t("landing.traveler.kicker")}</p>
        <h2 className="text-text-strong mt-3 text-2xl font-semibold tracking-tight sm:text-3xl md:text-4xl">
          {t("landing.traveler.title")}
        </h2>
        <p className="text-muted-foreground mt-4 max-w-2xl text-base leading-relaxed sm:text-lg">{t("landing.traveler.lead")}</p>
        <div className="mt-12 grid gap-6 lg:grid-cols-3">
          {(
            [
              { key: "one" as const, src: IMG.benefit1 },
              { key: "two" as const, src: IMG.benefit2 },
              { key: "three" as const, src: IMG.benefit3 },
            ] as const
          ).map(({ key, src }) => (
            <article
              key={key}
              className="border-border/70 bg-card overflow-hidden rounded-[var(--radius-lg)] border shadow-[var(--shadow-sm)]"
            >
              <div className="relative aspect-[16/10] w-full overflow-hidden bg-muted">
                <Image
                  src={src}
                  alt=""
                  fill
                  className={FILL_IMAGE_MARKETING_REGION_TILE}
                  sizes="(max-width:1024px) 100vw, 33vw"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/35 to-transparent" aria-hidden />
              </div>
              <div className="p-5 sm:p-6">
                <h3 className="text-text-strong text-lg font-semibold">{t(`landing.traveler.${key}Title`)}</h3>
                <p className="text-muted-foreground mt-2 text-[15px] leading-relaxed">{t(`landing.traveler.${key}Body`)}</p>
              </div>
            </article>
          ))}
        </div>
      </SectionShell>

      <SectionShell className="relative overflow-hidden py-16 sm:py-20 md:py-24">
        <div className="page-container relative z-[1] grid max-w-6xl gap-12 px-4 sm:px-6 lg:grid-cols-2 lg:items-center lg:gap-16">
          <div>
            <p className="text-primary text-[11px] font-semibold tracking-[0.2em] uppercase">{t("landing.guardian.kicker")}</p>
            <h2 className="text-text-strong mt-3 text-2xl font-semibold tracking-tight sm:text-3xl md:text-4xl">
              {t("landing.guardian.title")}
            </h2>
            <p className="text-muted-foreground mt-4 text-base leading-relaxed sm:text-lg">{t("landing.guardian.lead")}</p>
            <ul className="mt-8 space-y-5">
              {(["one", "two", "three"] as const).map((key) => (
                <li key={key} className="flex gap-3">
                  <Sparkles className="text-primary mt-0.5 size-5 shrink-0" strokeWidth={1.75} aria-hidden />
                  <div>
                    <p className="text-text-strong font-medium">{t(`landing.guardian.${key}Title`)}</p>
                    <p className="text-muted-foreground mt-1 text-[15px] leading-relaxed">{t(`landing.guardian.${key}Body`)}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
          <div className="border-border/60 relative aspect-[4/3] overflow-hidden rounded-[var(--radius-lg)] border shadow-lg lg:aspect-square">
            <Image
              src={IMG.guardian}
              alt=""
              fill
              className={FILL_IMAGE_COVER_CENTER}
              sizes="(max-width:1024px) 100vw, 50vw"
            />
            <div className="absolute inset-0 bg-gradient-to-tr from-[var(--brand-trust-blue)]/15 to-transparent" aria-hidden />
          </div>
        </div>
        <div
          className="pointer-events-none absolute inset-x-0 top-1/2 -z-0 hidden h-px -translate-y-1/2 bg-gradient-to-r from-transparent via-border to-transparent lg:block"
          aria-hidden
        />
      </SectionShell>

      <SectionShell className="page-container max-w-6xl px-4 pb-16 sm:px-6 sm:pb-20">
        <div className="border-border/70 bg-card/60 rounded-[var(--radius-xl)] border px-6 py-10 sm:px-10 sm:py-12">
          <p className="text-primary text-[11px] font-semibold tracking-[0.2em] uppercase">{t("landing.trust.kicker")}</p>
          <h2 className="text-text-strong mt-3 text-2xl font-semibold tracking-tight sm:text-3xl">{t("landing.trust.title")}</h2>
          <p className="text-muted-foreground mt-4 max-w-2xl text-base leading-relaxed">{t("landing.trust.lead")}</p>
          <ul className="mt-10 grid gap-6 sm:grid-cols-3">
            {(["one", "two", "three"] as const).map((key, i) => {
              const Icon = [Shield, CheckCircle2, Users][i]!;
              return (
                <li key={key} className="flex flex-col gap-2">
                  <Icon className="text-[var(--brand-trust-blue)] size-6" strokeWidth={1.75} aria-hidden />
                  <p className="text-text-strong font-medium">{t(`landing.trust.${key}Title`)}</p>
                  <p className="text-muted-foreground text-sm leading-relaxed">{t(`landing.trust.${key}Body`)}</p>
                </li>
              );
            })}
          </ul>
        </div>
      </SectionShell>

      <AboutParallaxBand
        imageSrc={IMG.story}
        imageAlt=""
        parallaxMax={44}
        minHeightClass="min-h-[26rem] md:min-h-[32rem]"
        overlayClassName="from-zinc-950/85 via-zinc-900/70"
      >
        <div className="page-container relative z-[1] flex max-w-6xl flex-col justify-center px-4 py-16 sm:px-6 sm:py-20 md:min-h-[32rem] md:py-24">
          <p className="text-[11px] font-semibold tracking-[0.2em] text-white/70 uppercase">{t("landing.story.kicker")}</p>
          <h2 className="mt-3 max-w-xl text-2xl font-semibold tracking-tight text-white sm:text-3xl md:text-4xl">
            {t("landing.story.title")}
          </h2>
          <p className="mt-4 max-w-lg text-base leading-relaxed text-white/80">{t("landing.story.lead")}</p>
          <div className="mt-12 grid max-w-3xl gap-8 border-l-2 border-white/25 pl-6 sm:pl-8">
            <div className="relative">
              <Sunrise className="absolute -left-[calc(0.5rem+11px)] top-1 size-6 text-amber-200/90 sm:-left-[calc(1rem+11px)]" aria-hidden />
              <h3 className="text-lg font-semibold text-white">{t("landing.story.morningTitle")}</h3>
              <p className="mt-2 text-[15px] leading-relaxed text-white/78">{t("landing.story.morningBody")}</p>
            </div>
            <div className="relative">
              <MapPinned className="absolute -left-[calc(0.5rem+11px)] top-1 size-6 text-sky-200/90 sm:-left-[calc(1rem+11px)]" aria-hidden />
              <h3 className="text-lg font-semibold text-white">{t("landing.story.routeTitle")}</h3>
              <p className="mt-2 text-[15px] leading-relaxed text-white/78">{t("landing.story.routeBody")}</p>
            </div>
            <div className="relative">
              <Sunset className="absolute -left-[calc(0.5rem+11px)] top-1 size-6 text-rose-200/90 sm:-left-[calc(1rem+11px)]" aria-hidden />
              <h3 className="text-lg font-semibold text-white">{t("landing.story.eveningTitle")}</h3>
              <p className="mt-2 text-[15px] leading-relaxed text-white/78">{t("landing.story.eveningBody")}</p>
            </div>
          </div>
        </div>
      </AboutParallaxBand>

      <SectionShell className="bg-[var(--text-strong)] py-16 text-white sm:py-20 md:py-24">
        <div className="page-container max-w-6xl px-4 text-center sm:px-6">
          <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl md:text-4xl">{t("landing.final.title")}</h2>
          <p className="text-white/75 mx-auto mt-4 max-w-xl text-base leading-relaxed sm:text-lg">{t("landing.final.lead")}</p>
          <div className="mt-10 flex flex-col items-stretch justify-center gap-3 sm:mx-auto sm:max-w-2xl sm:flex-row sm:flex-wrap sm:gap-4">
            <Button
              asChild
              size="lg"
              className="h-12 rounded-[var(--radius-md)] border-0 bg-white px-8 font-semibold text-zinc-900 hover:bg-white/95"
            >
              <Link href="/explore" className="inline-flex items-center justify-center gap-2">
                <Compass className="size-5" strokeWidth={1.75} aria-hidden />
                {t("landing.final.ctaTraveler")}
              </Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="h-12 rounded-[var(--radius-md)] border-2 border-white/35 bg-transparent px-8 font-semibold text-white hover:bg-white/12"
            >
              <Link href="/guardians" className="inline-flex items-center justify-center gap-2">
                <Users className="size-5" strokeWidth={1.75} aria-hidden />
                {t("landing.final.ctaBrowse")}
              </Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="h-12 rounded-[var(--radius-md)] border-white/25 bg-white/8 px-8 font-semibold text-white hover:bg-white/14"
            >
              <Link href="/guardians/apply" className="inline-flex items-center justify-center gap-2">
                {t("landing.final.ctaGuardian")}
                <ArrowRight className="size-4" aria-hidden />
              </Link>
            </Button>
          </div>
        </div>
      </SectionShell>

      <SectionShell id="traveler-voices" className="page-container max-w-3xl px-4 py-12 sm:px-6 sm:py-14">
        <h2 className="text-text-strong text-xl font-semibold tracking-tight sm:text-2xl">{t("travelerVoicesTitle")}</h2>
        <p className="text-muted-foreground mt-3 max-w-2xl text-sm leading-relaxed sm:text-[15px]">{t("travelerVoicesLead")}</p>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          <Button asChild className="h-11 rounded-[var(--radius-md)] px-6 font-semibold">
            <Link href="/explore" className="inline-flex items-center justify-center gap-2">
              <Compass className="size-4 opacity-90" strokeWidth={1.75} aria-hidden />
              {t("travelerVoicesCtaExplore")}
            </Link>
          </Button>
          <Button asChild variant="outline" className="h-11 rounded-[var(--radius-md)] border-border/80 px-6 font-semibold">
            <Link href="/guardians" className="inline-flex items-center justify-center gap-2">
              <Users className="size-4 opacity-90" strokeWidth={1.75} aria-hidden />
              {t("travelerVoicesCtaGuardians")}
            </Link>
          </Button>
        </div>
      </SectionShell>

      <SectionShell className="page-container max-w-3xl px-4 py-14 sm:px-6 sm:py-16">
        <p className="text-muted-foreground text-center text-sm">{t("landing.legalIntro")}</p>
        <div className="mt-8 space-y-3">
          <div id="terms" className="border-border/70 bg-card/40 scroll-mt-24 rounded-[var(--radius-md)] border">
            <div className="text-muted-foreground flex items-center justify-between gap-2 px-4 py-3.5 text-sm font-semibold">
              <span className="opacity-75">{t("legalTermsTitle")}</span>
              <span aria-hidden className="text-xs">
                🔒
              </span>
            </div>
            <div className="text-muted-foreground border-border/60 border-t px-4 py-4 text-[15px] leading-relaxed">
              정식 오픈 전 공개 예정입니다.
            </div>
          </div>
          <div id="privacy" className="border-border/70 bg-card/40 scroll-mt-24 rounded-[var(--radius-md)] border">
            <div className="text-muted-foreground flex items-center justify-between gap-2 px-4 py-3.5 text-sm font-semibold">
              <span className="opacity-75">{t("legalPrivacyTitle")}</span>
              <span aria-hidden className="text-xs">
                🔒
              </span>
            </div>
            <div className="text-muted-foreground border-border/60 border-t px-4 py-4 text-[15px] leading-relaxed">
              정식 오픈 전 공개 예정입니다.
            </div>
          </div>
        </div>
      </SectionShell>
    </div>
  );
}
