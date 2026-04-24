"use client";

import { Clock, Footprints, MapPin, Moon } from "lucide-react";
import { useTranslations } from "next-intl";
import type { RouteJourneyMetadata } from "@/types/domain";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export function RouteSummaryChips({
  meta,
  tags,
  spotCount,
  className,
}: {
  meta: RouteJourneyMetadata;
  tags: string[];
  spotCount: number;
  className?: string;
}) {
  const t = useTranslations("RoutePosts");

  return (
    <div className={cn("flex flex-wrap gap-2", className)}>
      <Badge variant="secondary" className="gap-1.5 rounded-full px-3 py-1 text-xs font-semibold">
        <Footprints className="size-3.5 opacity-80" aria-hidden />
        {t("chipDistance", { km: meta.estimated_total_distance_km.toFixed(1) })}
      </Badge>
      <Badge variant="secondary" className="gap-1.5 rounded-full px-3 py-1 text-xs font-semibold">
        <Clock className="size-3.5 opacity-80" aria-hidden />
        {t("chipDuration", { minutes: meta.estimated_total_duration_minutes })}
      </Badge>
      <Badge variant="secondary" className="gap-1.5 rounded-full px-3 py-1 text-xs font-semibold">
        <MapPin className="size-3.5 opacity-80" aria-hidden />
        {t("chipSpots", { count: spotCount })}
      </Badge>
      <Badge variant="outline" className="gap-1.5 rounded-full px-3 py-1 text-xs font-semibold">
        {t(`transport.${meta.transport_mode}` as "transport.walk")}
      </Badge>
      <Badge variant="outline" className="gap-1.5 rounded-full px-3 py-1 text-xs font-semibold">
        {t(`difficulty.${meta.difficulty}` as "difficulty.easy")}
      </Badge>
      <Badge variant="outline" className="gap-1.5 rounded-full px-3 py-1 text-xs font-semibold">
        <Moon className="size-3.5 opacity-70" aria-hidden />
        {meta.night_friendly ? t("nightYes") : t("nightNo")}
      </Badge>
      {tags.slice(0, 4).map((tag) => (
        <Badge key={tag} variant="secondary" className="rounded-full px-3 py-1 text-[11px] font-medium">
          {tag}
        </Badge>
      ))}
    </div>
  );
}
