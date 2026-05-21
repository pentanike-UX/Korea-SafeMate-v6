"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Clock, MapPin, Sparkles, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * 하루웨이(post) 하단에 노출되는 "관련 하루루트로 가기" 배너.
 *
 * 비즈니스 모델:
 * - 하루이는 한 번 입력으로 (post + route) 양쪽 자산 생성
 * - 하루웨이(post)는 콘텐츠/발견 (무료 자유 노출)
 * - 하루루트(route)는 실행 도구 (결제 발생 지점)
 *
 * 따라서 이 배너는 콘텐츠 → 거래의 전환 게이트 역할.
 */
export function RelatedRouteBanner({
  routeId,
  routeTitle,
  totalDurationMin,
  spotCount,
  priceLabel = "₩29,000",
  themeLabel,
  className,
}: {
  /** 연결될 하루루트 ID (e.g. 'mock' 또는 UUID) */
  routeId: string;
  /** 루트 제목 (locale 별 텍스트는 상위에서 해결) */
  routeTitle?: string;
  /** 총 소요시간 분 단위 */
  totalDurationMin?: number;
  /** 스팟 수 */
  spotCount?: number;
  /** 결제 가격 라벨 (브랜드 결정 가격 그대로) */
  priceLabel?: string;
  /** 테마 라벨 (e.g. "K-MOVIE", "역사 산책") */
  themeLabel?: string;
  className?: string;
}) {
  const t = useTranslations("Posts");

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

  return (
    <div className={cn("mx-auto max-w-3xl px-4 sm:px-6", className)}>
      <Link
        href={`/routes/${routeId}?preview=1`}
        className={cn(
          "group relative block overflow-hidden rounded-3xl border-2 border-[var(--brand-primary)]/30",
          "bg-gradient-to-br from-emerald-50/50 via-card to-card p-5 shadow-md sm:p-6",
          "transition-all hover:scale-[1.005] hover:shadow-lg active:scale-[0.995]",
          "dark:from-emerald-950/20",
        )}
      >
        {/* 글로우 */}
        <div
          className="pointer-events-none absolute -right-12 -top-12 size-40 rounded-full bg-emerald-400/20 blur-3xl transition-opacity group-hover:opacity-70"
          aria-hidden
        />

        <div className="relative">
          {/* Eyebrow */}
          <div className="mb-3 flex items-center gap-2 flex-wrap">
            <span className="inline-flex items-center gap-1 rounded-full bg-[var(--brand-primary)]/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[var(--brand-primary)]">
              <Sparkles className="size-3" aria-hidden />
              {t("relatedRouteEyebrow")}
            </span>
            {themeLabel ? (
              <span className="inline-flex items-center rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-amber-800 dark:bg-amber-900/30 dark:text-amber-300">
                {themeLabel}
              </span>
            ) : null}
          </div>

          {/* 헤더 */}
          <h3 className="text-lg font-bold tracking-tight text-foreground sm:text-xl">
            {routeTitle ?? t("relatedRouteFallbackTitle")}
          </h3>
          <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
            {t("relatedRouteLead")}
          </p>

          {/* 칩 그룹 */}
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

          {/* CTA 영역 */}
          <div className="mt-5 flex items-center justify-between gap-3 border-t border-border/40 pt-4">
            <div className="min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                {t("relatedRoutePriceEyebrow")}
              </p>
              <p className="text-base font-extrabold tracking-tight text-foreground">
                {priceLabel}
                <span className="ml-1 text-xs font-normal text-muted-foreground">
                  {t("relatedRoutePriceHint")}
                </span>
              </p>
            </div>
            <span
              className={cn(
                "inline-flex shrink-0 items-center gap-1.5 rounded-2xl bg-[var(--brand-primary)] px-4 py-2.5 text-sm font-semibold text-[var(--text-on-brand)] shadow-sm",
                "transition-transform group-hover:translate-x-0.5",
              )}
            >
              {t("relatedRouteCta")}
              <ArrowRight className="size-4" aria-hidden />
            </span>
          </div>
        </div>
      </Link>
    </div>
  );
}
