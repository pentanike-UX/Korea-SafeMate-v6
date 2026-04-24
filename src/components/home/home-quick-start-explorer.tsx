"use client";

import Image from "next/image";
import { useMemo } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { mockExperienceThemes, mockLaunchAreas } from "@/data/mock";
import type { LaunchAreaSlug } from "@/types/launch-area";
import { Button } from "@/components/ui/button";
import { HomeAuxiliaryNoteSection } from "@/components/home/home-auxiliary-note";
import { HomeMoodOptionCard } from "@/components/home/home-mood-option-card";
import { Badge } from "@/components/ui/badge";
import { useHomeExplorePreferences } from "@/components/home/home-explore-preferences";
import { FILL_IMAGE_MARKETING_REGION_TILE } from "@/lib/ui/fill-image";
import { cn } from "@/lib/utils";
import {
  ArrowRight,
  Camera,
  Clapperboard,
  Heart,
  MapPin,
  Mic2,
  MoonStar,
  ShieldUser,
  Sparkles,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

type MoodSlug = (typeof mockExperienceThemes)[number]["slug"];

const REGION_DESC_KEY: Record<LaunchAreaSlug, "regionDesc_gwanghwamun" | "regionDesc_gangnam" | "regionDesc_busan" | "regionDesc_jeju"> = {
  gwanghwamun: "regionDesc_gwanghwamun",
  gangnam: "regionDesc_gangnam",
  busan: "regionDesc_busan",
  jeju: "regionDesc_jeju",
};

/** Mood icons — 문맥별 의미 전달 */
const MOOD_ICON: Record<MoodSlug, LucideIcon> = {
  k_drama_romance: Heart,
  seoul_night: MoonStar,
  k_pop_day: Mic2,
  movie_location: Clapperboard,
  safe_solo: ShieldUser,
  photo_route: Camera,
};

export function HomeQuickStartExplorer() {
  const t = useTranslations("HomeQuickStart");
  const tHome = useTranslations("Home");
  const tLaunch = useTranslations("LaunchAreas");
  const tTheme = useTranslations("ExperienceThemes");
  const { area, theme, setArea, setTheme } = useHomeExplorePreferences();

  const exploreHref = useMemo(() => {
    const p = new URLSearchParams();
    if (area) p.set("area", area);
    if (theme) p.set("theme", theme);
    const s = p.toString();
    return s ? `/explore?${s}` : "/explore#journey-steps";
  }, [area, theme]);

  const canExplore = area !== null || theme !== null;
  const selectedChips = [
    area ? (tLaunch.raw(area) as { name: string }).name : null,
    theme ? (tTheme.raw(theme as MoodSlug) as { title: string }).title : null,
  ].filter(Boolean) as string[];

  function regionLabel(slug: LaunchAreaSlug) {
    return (tLaunch.raw(slug) as { name: string }).name;
  }

  function themeCopy(slug: MoodSlug) {
    return tTheme.raw(slug) as { title: string; subtitle: string };
  }

  return (
    <section className="border-border/40 border-b bg-[var(--bg-quick-start)]">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-5 sm:py-11 md:py-12">
        <div className="mb-6 max-w-2xl sm:mb-8">
          <p className="text-[var(--brand-trust-blue)] text-[11px] font-semibold tracking-[0.18em] uppercase">{t("eyebrow")}</p>
          <h2 className="text-text-strong mt-2 text-lg font-semibold tracking-tight sm:mt-2.5 sm:text-2xl md:text-[1.65rem]">{t("title")}</h2>
          <p className="text-muted-foreground mt-2.5 text-sm leading-relaxed sm:mt-3 sm:text-[15px]">{t("lead")}</p>
        </div>

        {!canExplore ? (
          <p className="text-muted-foreground mb-6 text-sm">
            지역과 무드를 고르면 맞는 가디언을 바로 볼 수 있어요
          </p>
        ) : (
          <div className="mb-6 flex flex-wrap items-center gap-2">
            {selectedChips.map((c) => (
              <span
                key={c}
                className="bg-background text-foreground ring-border inline-flex min-h-8 items-center rounded-full px-3 text-xs font-semibold ring-1"
              >
                {c}
              </span>
            ))}
          </div>
        )}

        {/* 1. Regions */}
        <div className="mb-8 sm:mb-10">
          <h3 className="text-foreground mb-3 text-sm font-semibold tracking-tight sm:mb-4 sm:text-base">{t("step1Title")}</h3>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {mockLaunchAreas.map((a) => {
              const active = a.active && !a.comingSoon;
              const selected = area === a.slug;
              const copy = tLaunch.raw(a.slug) as { name: string; blurb: string; landmark: string; imageAlt: string };
              const descRaw = t(REGION_DESC_KEY[a.slug]);
              // next-intl key-miss can leak as "Home.regionDesc_*" (or similar). Never show raw keys in UI.
              const desc =
                descRaw.includes(".") && descRaw.endsWith(REGION_DESC_KEY[a.slug]) ? "" : descRaw;

              const media = (
                <div className="relative aspect-[16/10] overflow-hidden bg-muted">
                  <Image
                    src={a.imageUrl}
                    alt={copy.imageAlt}
                    fill
                    className={cn(
                      FILL_IMAGE_MARKETING_REGION_TILE,
                      active && "transition duration-500 group-hover:scale-[1.02]",
                      !active && "brightness-[0.66] contrast-[0.94] saturate-[0.48]",
                    )}
                    sizes="(max-width:640px) 100vw, 25vw"
                  />
                  {!active ? (
                    <div
                      className="pointer-events-none absolute inset-0 bg-slate-950/52 backdrop-blur-[1px]"
                      aria-hidden
                    />
                  ) : null}
                  <div
                    className={cn(
                      "pointer-events-none absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent",
                      selected && active && "from-black/75",
                      !active && "from-black/80 via-black/35",
                    )}
                  />
                  <div className="absolute top-2.5 right-2.5 flex flex-wrap justify-end gap-1.5">
                    {!active ? (
                      <Badge className="border-0 bg-amber-500 px-2.5 py-1 text-[10px] font-bold tracking-wide text-white uppercase shadow-md">
                        {tHome("launchBadgeSoon")}
                      </Badge>
                    ) : selected ? (
                      <Badge className="bg-white/95 text-[10px] font-semibold text-[var(--brand-trust-blue)]">
                        {t("selected")}
                      </Badge>
                    ) : (
                      <Badge className="bg-[var(--success)] text-[10px] font-semibold text-white hover:bg-[var(--success)]">
                        {tHome("launchBadgeLive")}
                      </Badge>
                    )}
                  </div>
                  <div className="absolute right-3 bottom-3 left-3">
                    <p
                      className={cn(
                        "line-clamp-2 text-sm font-semibold leading-tight text-balance text-white drop-shadow-md",
                        !active && "opacity-90",
                      )}
                    >
                      {copy.landmark}
                    </p>
                  </div>
                </div>
              );

              const body = (
                <div className={cn("flex flex-1 flex-col p-4", !active && "bg-muted/25")}>
                  <div className="flex items-center gap-2">
                    <MapPin
                      className={cn(
                        "size-4 shrink-0",
                        active ? "text-[var(--brand-trust-blue)]" : "text-muted-foreground/70",
                      )}
                      aria-hidden
                    />
                    <span className={cn("font-semibold", active ? "text-foreground" : "text-foreground/80")}>
                      {copy.name}
                    </span>
                  </div>
                  <p
                    className={cn(
                      "mt-2 flex-1 text-[13px] leading-relaxed",
                      active ? "text-muted-foreground" : "text-muted-foreground/75",
                    )}
                  >
                    {desc}
                  </p>
                </div>
              );

              if (!active) {
                return (
                  <div
                    key={a.slug}
                    role="group"
                    aria-label={`${copy.name} — ${tHome("launchBadgeSoon")}`}
                    className={cn(
                      "border-border/50 bg-card text-left",
                      "relative flex cursor-default flex-col overflow-hidden rounded-[var(--radius-md)] border border-dashed border-muted-foreground/25 shadow-none",
                    )}
                  >
                    {media}
                    {body}
                  </div>
                );
              }

              return (
                <button
                  key={a.slug}
                  type="button"
                  onClick={() => {
                    setArea(area === a.slug ? null : a.slug);
                  }}
                  className={cn(
                    "group border-border/70 bg-card text-left transition-all",
                    "relative flex flex-col overflow-hidden rounded-[var(--radius-md)] border shadow-[var(--shadow-sm)]",
                    "hover:shadow-[var(--shadow-md)] active:scale-[0.99]",
                    selected &&
                      "ring-[var(--brand-trust-blue)] ring-2 ring-offset-2 ring-offset-[var(--ring-offset-surface)]",
                  )}
                >
                  {media}
                  {body}
                </button>
              );
            })}
          </div>
        </div>

        {/* 2. Moods */}
        <div className="mb-8 sm:mb-10">
          <h3 className="text-foreground mb-4 text-sm font-semibold tracking-tight sm:mb-5 sm:text-base">{t("step2Title")}</h3>
          <div className="grid gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3">
            {mockExperienceThemes.map((th) => {
              const slug = th.slug as MoodSlug;
              const selected = theme === th.slug;
              const copy = themeCopy(slug);
              const Icon = MOOD_ICON[slug];

              return (
                <HomeMoodOptionCard
                  key={th.slug}
                  selected={selected}
                  onToggle={() => setTheme(theme === th.slug ? null : th.slug)}
                  icon={Icon}
                  title={copy.title}
                  subtitle={copy.subtitle}
                  name={`${copy.title}. ${copy.subtitle}${selected ? ` — ${t("selected")}` : ""}`}
                />
              );
            })}
          </div>
        </div>

        {/* Summary + CTA */}
        <div className="border-border/60 bg-card rounded-[var(--radius-lg)] border p-4 shadow-[var(--shadow-sm)] sm:p-6">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="min-w-0 flex-1">
              <p className="text-muted-foreground flex items-center gap-2 text-[11px] font-semibold tracking-wide uppercase">
                <Sparkles className="text-[var(--brand-trust-blue)] size-3.5" aria-hidden />
                {t("summaryTitle")}
              </p>
              <div className="mt-3 flex min-h-[2.5rem] flex-wrap gap-2">
                {!area && !theme ? (
                  <span className="text-muted-foreground text-sm">{t("summaryEmpty")}</span>
                ) : (
                  <>
                    {area ? (
                      <Badge
                        variant="secondary"
                        className="rounded-full border border-border/60 bg-card px-3 py-1.5 text-sm font-medium"
                      >
                        {regionLabel(area)}
                      </Badge>
                    ) : null}
                    {theme ? (
                      <Badge
                        variant="secondary"
                        className="rounded-full border border-border/60 bg-card px-3 py-1.5 text-sm font-medium"
                      >
                        {themeCopy(theme as MoodSlug).title}
                      </Badge>
                    ) : null}
                  </>
                )}
              </div>
            </div>
            <div className="flex w-full flex-col gap-2 sm:flex-row sm:w-auto sm:flex-wrap">
              {canExplore ? (
                <Button asChild size="lg" className="min-h-11 rounded-[var(--radius-md)] px-6 font-semibold sm:px-7">
                  <Link href={exploreHref} className="gap-2">
                    {t("ctaGuardians")}
                    <ArrowRight className="size-4" aria-hidden />
                  </Link>
                </Button>
              ) : (
                <Button type="button" size="lg" disabled className="min-h-11 rounded-[var(--radius-md)] px-6 font-semibold sm:px-7">
                  {t("ctaGuardiansDisabled")}
                </Button>
              )}
              <Button asChild size="lg" variant="outline" className="min-h-11 rounded-[var(--radius-md)] border-2 px-6 font-semibold sm:px-7">
                <Link href="/posts?content=route">{t("ctaPosts")}</Link>
              </Button>
            </div>
          </div>
        </div>

        {/* 라이트 플로우 보조 노트 — Hero 패턴과 분리 (home-auxiliary-note.tsx) */}
        <HomeAuxiliaryNoteSection>{tHome("processClarity")}</HomeAuxiliaryNoteSection>
      </div>
    </section>
  );
}
