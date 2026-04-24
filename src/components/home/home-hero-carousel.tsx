"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { HOME_HERO_INTERVAL_MS, HOME_HERO_SLIDES } from "@/data/home-hero-slides";
import { useViewerRole } from "@/hooks/use-viewer-role";
import { HomeAuxiliaryNoteHero } from "@/components/home/home-auxiliary-note";
import { Button } from "@/components/ui/button";
import { FILL_IMAGE_MARKETING_HERO_FULLBLEED } from "@/lib/ui/fill-image";
import { cn } from "@/lib/utils";
import {
  ArrowRight,
  Bookmark,
  ChevronLeft,
  ChevronRight,
  FileText,
  Heart,
  Sparkles,
  Users,
} from "lucide-react";

/**
 * 홈 히어로 `scopeNoteDetail`(부 노트) — `secondaryFromSm`은 서버에서 env 기반으로 전달
 * (`getHomeHeroScopeNoteSecondaryFromSm` / `HOME_HERO_SCOPE_NOTE_SECONDARY_FROM_SM`).
 */
export function HomeHeroCarousel({
  scopeNoteSecondaryFromSm = true,
}: {
  /** `true`: sm 미만에서 부 노트 숨김. `false`: 모바일에서도 부 노트 표시. */
  scopeNoteSecondaryFromSm?: boolean;
}) {
  const t = useTranslations("Home");
  const viewer = useViewerRole();
  const heroGuest = viewer == null;
  const heroGuardian = viewer === "guardian";
  const heroTraveler = viewer !== null && viewer !== undefined && !heroGuardian;
  const total = HOME_HERO_SLIDES.length;
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setPrefersReducedMotion(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  const go = useCallback(
    (dir: -1 | 1) => {
      setIndex((i) => (i + dir + total) % total);
    },
    [total],
  );

  useEffect(() => {
    if (paused || prefersReducedMotion) {
      if (timerRef.current) clearInterval(timerRef.current);
      timerRef.current = null;
      return;
    }
    timerRef.current = setInterval(() => {
      setIndex((i) => (i + 1) % total);
    }, HOME_HERO_INTERVAL_MS);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [paused, prefersReducedMotion, total]);

  const slide = HOME_HERO_SLIDES[index]!;
  const metaLabel = t(slide.metaKey);
  const progressLabel = t("heroCarouselProgress", {
    current: String(index + 1).padStart(2, "0"),
    total: String(total).padStart(2, "0"),
  });

  return (
    <section
      id="home-hero-root"
      className="relative isolate -mt-14 min-h-[min(100dvh,56rem)] overflow-hidden pt-14 sm:-mt-16 sm:min-h-[min(100dvh,60rem)] sm:pt-16"
      aria-label={t("heroCarouselAria")}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node)) setPaused(false);
      }}
    >
      {/* Background images — crossfade */}
      <div className="absolute inset-0" aria-hidden>
        {HOME_HERO_SLIDES.map((slide, i) => (
          <div
            key={slide.src}
            className={cn(
              "absolute inset-0 transition-opacity duration-[900ms] ease-[cubic-bezier(0.4,0,0.2,1)] motion-reduce:transition-none",
              i === index ? "z-[1] opacity-100" : "z-0 opacity-0",
            )}
          >
            <Image
              src={slide.src}
              alt=""
              fill
              className={FILL_IMAGE_MARKETING_HERO_FULLBLEED}
              sizes="100vw"
              priority={i === 0}
              fetchPriority={i === 0 ? "high" : "low"}
            />
          </div>
        ))}
      </div>

      {/* Readability: stronger darkening on the left, lighter on the right */}
      <div
        className="pointer-events-none absolute inset-0 z-[2]"
        style={{
          background: `
            linear-gradient(90deg,
              rgba(6, 10, 28, 0.78) 0%,
              rgba(6, 10, 28, 0.52) 38%,
              rgba(6, 10, 28, 0.22) 62%,
              rgba(6, 10, 28, 0.12) 100%
            ),
            linear-gradient(180deg,
              rgba(6, 10, 28, 0.35) 0%,
              transparent 28%,
              transparent 55%,
              rgba(6, 10, 28, 0.5) 100%
            )
          `,
        }}
      />

      {/* Content */}
      <div className="relative z-[3] mx-auto flex min-h-[min(100dvh,56rem)] max-w-6xl flex-col justify-center px-4 py-16 sm:min-h-[min(100dvh,60rem)] sm:px-6 sm:py-20 lg:py-24">
        <div className="max-w-xl lg:max-w-[28rem]">
          <p className="inline-flex items-center gap-1.5 text-[11px] font-semibold tracking-[0.2em] text-white/80 uppercase">
            <Sparkles className="size-3.5 text-white/90" aria-hidden />
            {t("eyebrow")}
          </p>
          <h1 className="mt-4 text-3xl font-semibold tracking-tight text-balance text-white drop-shadow-[0_2px_12px_rgba(0,0,0,0.45)] sm:text-4xl md:text-[2.35rem] md:leading-[1.12]">
            {t("heroTitle")}
          </h1>
          <p className="mt-4 max-w-lg text-[15px] leading-relaxed text-white/90 sm:text-[16px]">{t("heroLead")}</p>
          <div className="mt-9 flex flex-col gap-3 sm:flex-row sm:flex-nowrap sm:items-stretch sm:gap-4">
            <Button
              asChild
              size="lg"
              className="h-auto min-h-12 w-full gap-2.5 rounded-[var(--radius-md)] border-0 bg-white px-8 py-3.5 text-base font-semibold text-zinc-900 shadow-xl shadow-black/35 ring-2 ring-white/25 hover:bg-white/95 sm:w-auto"
            >
              <Link
                href={
                  heroGuest ? "/guardians" : heroGuardian ? "/mypage/guardian/posts" : "/guardians"
                }
                className="gap-2.5"
              >
                {heroGuest || heroTraveler ? (
                  <Users className="size-5 shrink-0" aria-hidden />
                ) : (
                  <FileText className="size-5 shrink-0" aria-hidden />
                )}
                {heroGuest
                  ? t("ctaPrimaryRequest")
                  : heroGuardian
                    ? t("heroPolicyGuardianWrite")
                    : t("heroPolicyTravelerFind")}
              </Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="h-auto min-h-12 w-full gap-2.5 rounded-[var(--radius-md)] border-2 border-white/45 bg-white/10 px-8 py-3.5 text-base font-semibold text-white shadow-sm backdrop-blur-sm sm:w-auto hover:border-white/70 hover:bg-white/18 active:scale-[0.99]"
            >
              <Link
                href={
                  heroGuest ? "/posts" : heroGuardian ? "/mypage/guardian/matches" : "/mypage/saved-guardians"
                }
                className="gap-2 whitespace-nowrap"
              >
                {heroGuest ? (
                  <FileText className="size-5 shrink-0 text-white" aria-hidden />
                ) : heroGuardian ? (
                  <Heart className="size-5 shrink-0 text-white" aria-hidden />
                ) : (
                  <Bookmark className="size-5 shrink-0 text-white" aria-hidden />
                )}
                <span>
                  {heroGuest
                    ? t("heroPolicyGuestPosts")
                    : heroGuardian
                      ? t("heroPolicyGuardianMatches")
                      : t("heroPolicyTravelerSaved")}
                </span>
                <ArrowRight className="size-5 shrink-0 text-white/90" aria-hidden />
              </Link>
            </Button>
          </div>
          <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-2">
            {heroTraveler ? (
              <Link
                href="/mypage/saved-posts"
                className="inline-flex min-h-9 items-center text-xs font-medium text-white/72 underline-offset-4 transition-colors hover:text-white hover:underline sm:text-sm"
              >
                {t("heroPolicyTravelerRecentPosts")}
              </Link>
            ) : null}
            {heroGuardian ? (
              <Link
                href="/mypage/points"
                className="inline-flex min-h-9 items-center text-xs font-medium text-white/72 underline-offset-4 transition-colors hover:text-white hover:underline sm:text-sm"
              >
                {t("heroPolicyGuardianPoints")}
              </Link>
            ) : null}
            {heroGuest ? (
              <>
                <Link
                  href="/guardians/apply"
                  className="inline-flex min-h-9 items-center text-xs font-medium text-white/65 underline-offset-4 transition-colors hover:text-white/90 hover:underline sm:text-sm"
                >
                  {t("heroPolicyGuestGuardianApply")}
                </Link>
                <Link
                  href="/about"
                  className="inline-flex min-h-9 items-center text-xs font-medium text-white/55 underline-offset-4 transition-colors hover:text-white/80 hover:underline sm:text-sm"
                >
                  {t("heroLinkStory")}
                </Link>
              </>
            ) : null}
          </div>
          {/* 보조 노트: 주=항상 · 부 노출은 HOME_HERO_SCOPE_NOTE_SECONDARY_FROM_SM (세부는 home-auxiliary-note.tsx) */}
          <HomeAuxiliaryNoteHero
            className="mt-5"
            primary={t("scopeNote")}
            secondary={t("scopeNoteDetail")}
            secondaryFromSm={scopeNoteSecondaryFromSm}
          />
        </div>

        {/* Bottom bar: progress + meta + dots + arrows */}
        <div className="mt-auto flex flex-col gap-4 pt-12 sm:pt-16 lg:pt-20">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div
              key={`meta-${index}`}
              className="min-w-0 flex-1 animate-in fade-in duration-500 motion-reduce:animate-none space-y-2"
            >
              <p
                className="text-[11px] font-medium tracking-[0.12em] text-white/50 uppercase"
                aria-live="polite"
                aria-atomic="true"
              >
                {progressLabel}
              </p>
              <p className="text-sm font-medium tracking-tight text-white/90">{metaLabel}</p>
              <div className="h-px w-full max-w-xs overflow-hidden rounded-full bg-white/20">
                <div
                  key={index}
                  className="home-hero-progress-bar h-full rounded-full bg-white/75"
                  style={{ animationDuration: `${HOME_HERO_INTERVAL_MS}ms` }}
                />
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => go(-1)}
                className="flex size-10 items-center justify-center rounded-full text-white/70 transition-colors hover:bg-white/10 hover:text-white"
                aria-label={t("heroCarouselPrev")}
              >
                <ChevronLeft className="size-5" />
              </button>
              <button
                type="button"
                onClick={() => go(1)}
                className="flex size-10 items-center justify-center rounded-full text-white/70 transition-colors hover:bg-white/10 hover:text-white"
                aria-label={t("heroCarouselNext")}
              >
                <ChevronRight className="size-5" />
              </button>
            </div>
          </div>
          <div className="flex flex-wrap gap-2" role="tablist" aria-label={t("heroCarouselIndicators")}>
            {HOME_HERO_SLIDES.map((_, i) => (
              <button
                key={i}
                type="button"
                role="tab"
                aria-selected={i === index}
                aria-label={t("heroCarouselGoTo", { n: i + 1 })}
                onClick={() => setIndex(i)}
                className={cn(
                  "h-1.5 rounded-full transition-all duration-500 ease-out motion-reduce:transition-none",
                  i === index ? "w-8 bg-white" : "w-1.5 bg-white/35 hover:bg-white/55",
                )}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
