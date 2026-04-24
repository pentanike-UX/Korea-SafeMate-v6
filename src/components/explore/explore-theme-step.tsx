"use client";

import { useTranslations } from "next-intl";
import { mockExperienceThemes } from "@/data/mock";
import { HomeMoodOptionCard } from "@/components/home/home-mood-option-card";
import { Clapperboard, Camera, Heart, Mic2, MoonStar, ShieldUser } from "lucide-react";
import type { LucideIcon } from "lucide-react";

type MoodSlug = (typeof mockExperienceThemes)[number]["slug"];

const MOOD_ICON: Record<MoodSlug, LucideIcon> = {
  k_drama_romance: Heart,
  seoul_night: MoonStar,
  k_pop_day: Mic2,
  movie_location: Clapperboard,
  safe_solo: ShieldUser,
  photo_route: Camera,
};

export function ExploreThemeStep({
  value,
  onChange,
}: {
  value: string;
  onChange: (slug: string) => void;
}) {
  const t = useTranslations("HomeQuickStart");
  const tJ = useTranslations("ExploreJourney");
  const tHome = useTranslations("Home");
  const tTheme = useTranslations("ExperienceThemes");

  function themeCopy(slug: MoodSlug) {
    return tTheme.raw(slug) as { title: string; subtitle: string };
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div>
        <h2 className="text-text-strong text-xl font-semibold">{tJ("stepTheme")}</h2>
        <p className="text-muted-foreground mt-2 text-sm leading-relaxed">{tHome("themesSectionLead")}</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3">
        {mockExperienceThemes.map((th) => {
          const slug = th.slug as MoodSlug;
          const selected = value === th.slug;
          const copy = themeCopy(slug);
          const Icon = MOOD_ICON[slug];
          return (
            <HomeMoodOptionCard
              key={th.slug}
              selected={selected}
              onToggle={() => onChange(value === th.slug ? "" : th.slug)}
              icon={Icon}
              title={copy.title}
              subtitle={copy.subtitle}
              name={`${copy.title}. ${copy.subtitle}${selected ? ` — ${t("selected")}` : ""}`}
            />
          );
        })}
      </div>
    </div>
  );
}
