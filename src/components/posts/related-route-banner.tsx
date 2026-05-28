"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Clock, MapPin, Sparkles, ArrowRight, Heart } from "lucide-react";
import { cn } from "@/lib/utils";
import { ENABLE_PAID_ROUTE_LOCK } from "@/lib/feature-flags";

/**
 * 하루웨이(post) 하단 — 연결된 하루루트로 이동.
 * v2026: 기본 무료 열람 + 선택적 고마움(루트 상세).
 */
export function RelatedRouteBanner({
  routeId,
  routeTitle,
  totalDurationMin,
  spotCount,
  themeLabel,
  className,
}: {
  routeId: string;
  routeTitle?: string;
  totalDurationMin?: number;
  spotCount?: number;
  themeLabel?: string;
  className?: string;
}) {
  const t = useTranslations("Posts");
  const paidLock = ENABLE_PAID_ROUTE_LOCK;

  const hours = totalDurationMin != null ? Math.floor(totalDurationMin / 60) : null;
  const mins = totalDurationMin != null ? totalDurationMin % 60 : 0;
  const durationLabel =
    hours != null
      ? hours > 0 && mins > 0
        ? `${hours}h ${mins}m`
        : hours > 0
          ? `${hours}h`
          : `${mins}m`
      : null;

  const href = paidLock && routeId === "mock" ? `/routes/${routeId}?preview=1` : `/routes/${routeId}`;

  return (
    <div className={cn("mx-auto max-w-3xl px-4 sm:px-6", className)}>
      <Link
        href={href}
        className={cn(
          "group relative block overflow-hidden rounded-3xl border-2 border-[var(--brand-primary)]/30",
          "bg-gradient-to-br from-emerald-50/50 via-card to-card p-5 shadow-md sm:p-6",
          "transition-all hover:scale-[1.005] hover:shadow-lg active:scale-[0.995]",
          "dark:from-emerald-950/20",
        )}
      >
        <div
          className="pointer-events-none absolute -right-12 -top-12 size-40 rounded-full bg-emerald-400/20 blur-3xl transition-opacity group-hover:opacity-70"
          aria-hidden
        />

        <div className="relative">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1 rounded-full bg-[var(--brand-primary)]/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[var(--brand-primary)]">
              <Sparkles className="size-3" aria-hidden />
              {t("relatedRouteEyebrow")}
            </span>
            {themeLabel ? (
              <span className="inline-flex items-center rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-amber-800 dark:bg-amber-900/30 dark:text-amber-300">
                {themeLabel}
              </span>
            ) : null}
            {!paidLock ? (
              <span className="inline-flex items-center rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200">
                {t("relatedRouteFreeBadge")}
              </span>
            ) : null}
          </div>

          <h3 className="text-lg font-bold tracking-tight text-foreground sm:text-xl">
            {routeTitle ?? t("relatedRouteFallbackTitle")}
          </h3>
          <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
            {paidLock ? t("relatedRouteLead") : t("relatedRouteLeadFree")}
          </p>

          {(durationLabel || spotCount != null) && (
            <div className="mt-4 flex flex-wrap gap-2">
              {durationLabel ? (
                <span className="inline-flex items-center gap-1 rounded-full border border-border/50 bg-background/60 px-2.5 py-1 text-xs font-medium text-foreground/85">
                  <Clock className="size-3.5 text-primary" />
                  {durationLabel}
                </span>
              ) : null}
              {spotCount != null ? (
                <span className="inline-flex items-center gap-1 rounded-full border border-border/50 bg-background/60 px-2.5 py-1 text-xs font-medium text-foreground/85">
                  <MapPin className="size-3.5 text-primary" />
                  {t("relatedRouteStopsLabel", { n: spotCount })}
                </span>
              ) : null}
            </div>
          )}

          <div className="mt-5 flex items-center justify-between gap-3 border-t border-border/40 pt-4">
            <div className="min-w-0">
              {paidLock ? (
                <>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--brand-primary)]">
                    {t("relatedRoutePriceEyebrow")}
                  </p>
                  <div className="mt-0.5 flex flex-wrap items-baseline gap-x-1.5">
                    <span className="text-2xl font-extrabold tracking-tighter text-foreground">
                      {t("relatedRoutePriceLead")}
                    </span>
                    <span className="text-[11px] font-medium text-muted-foreground">
                      {t("relatedRoutePriceLeadHint")}
                    </span>
                  </div>
                </>
              ) : (
                <>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--brand-primary)]">
                    {t("relatedRouteFreeEyebrow")}
                  </p>
                  <p className="text-muted-foreground mt-0.5 flex items-center gap-1 text-xs leading-relaxed sm:text-sm">
                    <Heart className="size-3.5 shrink-0 text-[var(--brand-primary)]" aria-hidden />
                    {t("relatedRouteFreeHint")}
                  </p>
                </>
              )}
            </div>
            <span
              className={cn(
                "inline-flex shrink-0 items-center gap-1.5 rounded-2xl bg-[var(--brand-primary)] px-4 py-2.5 text-sm font-semibold text-[var(--text-on-brand)] shadow-sm",
                "transition-transform group-hover:translate-x-0.5",
              )}
            >
              {paidLock ? t("relatedRouteCta") : t("relatedRouteCtaFree")}
              <ArrowRight className="size-4" aria-hidden />
            </span>
          </div>
        </div>
      </Link>
    </div>
  );
}
