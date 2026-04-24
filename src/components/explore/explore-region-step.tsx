"use client";

import Image from "next/image";
import { useTranslations } from "next-intl";
import { mockLaunchAreas } from "@/data/mock";
import type { LaunchAreaSlug } from "@/types/launch-area";
import { isLaunchAreaSelectable } from "@/lib/launch-area-selectable";
import { Badge } from "@/components/ui/badge";
import { FILL_IMAGE_MARKETING_REGION_TILE } from "@/lib/ui/fill-image";
import { cn } from "@/lib/utils";
import { Check, MapPin } from "lucide-react";

const REGION_DESC_KEY: Record<LaunchAreaSlug, "regionDesc_gwanghwamun" | "regionDesc_gangnam" | "regionDesc_busan" | "regionDesc_jeju"> = {
  gwanghwamun: "regionDesc_gwanghwamun",
  gangnam: "regionDesc_gangnam",
  busan: "regionDesc_busan",
  jeju: "regionDesc_jeju",
};

export function ExploreRegionStep({
  value,
  onChange,
}: {
  value: LaunchAreaSlug | "";
  onChange: (slug: LaunchAreaSlug) => void;
}) {
  const tLaunch = useTranslations("LaunchAreas");
  const tHome = useTranslations("Home");
  const tQuick = useTranslations("HomeQuickStart");
  const tJ = useTranslations("ExploreJourney");

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div>
        <h2 className="text-text-strong text-xl font-semibold">{tJ("stepRegion")}</h2>
        <p className="text-muted-foreground mt-2 text-sm leading-relaxed">{tHome("regionsSectionLead")}</p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        {mockLaunchAreas.map((a) => {
          const selectable = isLaunchAreaSelectable(a.slug);
          const selected = value === a.slug;
          const copy = tLaunch.raw(a.slug) as { name: string; blurb: string; landmark: string; imageAlt: string };
          const descRaw = tQuick(REGION_DESC_KEY[a.slug]);
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
                  selectable && "transition duration-500 group-hover:scale-[1.02]",
                  !selectable && "brightness-[0.66] contrast-[0.94] saturate-[0.48]",
                )}
                sizes="(max-width:640px) 100vw, 50vw"
              />
              {!selectable ? (
                <div className="pointer-events-none absolute inset-0 bg-slate-950/52 backdrop-blur-[1px]" aria-hidden />
              ) : null}
              <div
                className={cn(
                  "pointer-events-none absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent",
                  selected && selectable && "from-black/75",
                  !selectable && "from-black/80 via-black/35",
                )}
              />
              {selectable && !selected ? (
                <div className="pointer-events-none absolute inset-0 bg-black/15" aria-hidden />
              ) : null}
              <div className="absolute top-2.5 right-2.5 flex flex-wrap justify-end gap-1.5">
                {!selectable ? (
                  <Badge className="border-0 bg-amber-500 px-2.5 py-1 text-[10px] font-bold tracking-wide text-white uppercase shadow-md">
                    {tHome("comingSectionBadge")}
                  </Badge>
                ) : selected ? (
                  <Badge className="flex items-center gap-1 border-0 bg-[var(--brand-trust-blue)] px-2.5 py-1 text-[10px] font-bold text-white shadow-md">
                    <Check className="size-3 stroke-[2.5]" aria-hidden />
                    {tQuick("selected")}
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
                    !selectable && "opacity-90",
                  )}
                >
                  {copy.landmark}
                </p>
              </div>
            </div>
          );

          const body = (
            <div className={cn("flex flex-1 flex-col p-4", !selectable && "bg-muted/25")}>
              <div className="flex items-center gap-2">
                <MapPin
                  className={cn("size-4 shrink-0", selectable ? "text-[var(--brand-trust-blue)]" : "text-muted-foreground/70")}
                  aria-hidden
                />
                <span className={cn("font-semibold", selectable ? (selected ? "text-[var(--brand-trust-blue)]" : "text-foreground") : "text-foreground/80")}>{copy.name}</span>
              </div>
              <p className={cn("mt-2 flex-1 text-[13px] leading-relaxed", selectable ? "text-muted-foreground" : "text-muted-foreground/75")}>
                {desc}
              </p>
            </div>
          );

          if (!selectable) {
            return (
              <div
                key={a.slug}
                role="group"
                aria-disabled
                aria-label={`${copy.name} — ${tHome("comingSectionBadge")}`}
                className={cn(
                  "border-border/50 bg-card text-left",
                  "relative flex cursor-not-allowed flex-col overflow-hidden rounded-[var(--radius-md)] border border-dashed border-muted-foreground/25 shadow-none",
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
              onClick={() => onChange(a.slug)}
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
  );
}
