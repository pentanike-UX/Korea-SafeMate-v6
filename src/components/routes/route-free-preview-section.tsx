"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Clock, Wallet, MapPin, Sunrise, Sun, Moon, Sparkles, Lock, Check, ChevronRight, User, MessageCircle } from "lucide-react";
import { PlaybookUnlockSheet } from "@/components/route-posts/playbook-unlock-sheet";
import type { GuardianRequestOpenDetail } from "@/components/guardians/guardian-request-sheet";
import type { HaruRoute, AppLocale } from "@/types/haru";
import { cn } from "@/lib/utils";

/**
 * 무료 영역 — Hero + 통계 + 하루이 + 첫 스팟 미리보기 + 잠긴 스팟 카운트 + "결제하면 풀리는 것" + Unlock CTA.
 * preview 모드 (= 미결제)에서 노출. 결제 시 onUnlock 콜백으로 unlock 상태 전환.
 */
export function RouteFreePreviewSection({
  route,
  locale,
  onUnlock,
}: {
  route: HaruRoute;
  locale: AppLocale;
  onUnlock: () => void;
}) {
  const t = useTranslations("TravelerHub");
  const [payOpen, setPayOpen] = useState(false);

  const firstSpot = route.spots[0];
  const lockedCount = Math.max(0, route.spots.length - 1);

  const hours = Math.floor(route.total_duration_min / 60);
  const mins = route.total_duration_min % 60;
  const durationLabel =
    hours > 0 && mins > 0
      ? t("routeHoursMinutes", { h: hours, m: mins })
      : hours > 0
        ? t("routeHoursOnly", { h: hours })
        : t("routeMinutesOnly", { m: mins });

  const costLabel =
    route.estimated_cost_min_krw != null && route.estimated_cost_max_krw != null
      ? `₩${(route.estimated_cost_min_krw / 1000).toFixed(0)}k–${(route.estimated_cost_max_krw / 1000).toFixed(0)}k`
      : "—";

  const timeOfDayKey =
    route.recommended_time_of_day === "morning"
      ? "routeTimeOfDayMorning"
      : route.recommended_time_of_day === "afternoon"
        ? "routeTimeOfDayAfternoon"
        : route.recommended_time_of_day === "evening"
          ? "routeTimeOfDayEvening"
          : "routeTimeOfDayFlexible";

  const timeOfDayIcon =
    route.recommended_time_of_day === "morning" ? (
      <Sunrise className="size-3.5" />
    ) : route.recommended_time_of_day === "evening" ? (
      <Moon className="size-3.5" />
    ) : (
      <Sun className="size-3.5" />
    );

  // 가짜 결제 시트와 호환되는 detail (하루이 정보 일부)
  const guardianOpenDetail: GuardianRequestOpenDetail = {
    displayName: route.guardian.display_name,
    avatarUrl: route.guardian.photo_url ?? undefined,
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4 py-6 sm:px-6 md:py-8">
      {/* ── Hero · 통계 칩 ────────────────────────────────────────────── */}
      <section className="rounded-3xl border border-border/50 bg-card p-5 shadow-sm sm:p-6">
        <p className="text-[11px] font-bold uppercase tracking-wider text-primary">
          {t("routeFreeKickerOverview")}
        </p>

        {/* 4-up stats */}
        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatBlock
            icon={<Clock className="size-4" />}
            label={t("routeStatsTime")}
            value={durationLabel}
          />
          <StatBlock
            icon={<MapPin className="size-4" />}
            label={t("routeStatsStops")}
            value={t("routeStopsLabel", { n: route.spots.length })}
          />
          <StatBlock
            icon={<Wallet className="size-4" />}
            label={t("routeStatsCost")}
            value={costLabel}
          />
          <StatBlock
            icon={timeOfDayIcon}
            label={t("routeStatsTimeOfDay")}
            value={t(timeOfDayKey)}
          />
        </div>
      </section>

      {/* ── 하루이 카드 ──────────────────────────────────────────────── */}
      <section className="rounded-3xl border border-border/50 bg-card p-5 shadow-sm sm:p-6">
        <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
          {t("routeGuardianMadeBy")}
        </p>
        <div className="mt-3 flex items-center gap-4">
          <div className="relative size-12 shrink-0 overflow-hidden rounded-full bg-emerald-100">
            {route.guardian.photo_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={route.guardian.photo_url} alt={route.guardian.display_name} className="size-full object-cover" />
            ) : (
              <div className="flex h-full items-center justify-center text-emerald-700">
                <User className="size-5" />
              </div>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-base font-semibold text-foreground">{route.guardian.display_name}</p>
            <p className="text-xs text-muted-foreground">haruee</p>
          </div>
        </div>
      </section>

      {/* ── 첫 스팟 미리보기 ─────────────────────────────────────────── */}
      {firstSpot ? (
        <section className="rounded-3xl border border-border/50 bg-card p-5 shadow-sm sm:p-6">
          <p className="text-[11px] font-bold uppercase tracking-wider text-primary">
            {t("routeFirstSpotLabel")}
          </p>
          <div className="mt-4 flex items-start gap-3">
            <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-2xl dark:bg-emerald-950/40">
              {firstSpot.catalog.category_emoji}
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-base font-bold text-foreground">
                {firstSpot.catalog.name[locale] ?? firstSpot.catalog.name.en ?? "Spot"}
              </p>
              <p className="text-xs text-muted-foreground">
                {t("routeSpotStayMin", { m: firstSpot.stay_min })}
              </p>
              <p className="mt-3 text-sm leading-relaxed text-foreground/85">
                {firstSpot.guardian_note[locale] ?? firstSpot.guardian_note.en ?? ""}
              </p>
            </div>
          </div>
        </section>
      ) : null}

      {/* ── 잠긴 스팟 카운트 + 잠금 카드 ─────────────────────────────── */}
      {lockedCount > 0 ? (
        <section className="rounded-3xl border border-dashed border-border/60 bg-muted/20 p-5 sm:p-6">
          <div className="mb-3 flex items-center gap-2">
            <Lock className="size-4 text-muted-foreground" />
            <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
              {t("routeFreeUnlockKicker")}
            </p>
          </div>
          <p className="text-base font-bold text-foreground">
            {t("routeLockedStopsHeading", { n: lockedCount })}
          </p>
          <ul className="mt-4 space-y-2">
            {route.spots.slice(1).map((s) => (
              <li
                key={s.id}
                className="flex items-center gap-3 rounded-xl border border-border/40 bg-background/50 px-3 py-2 text-sm text-muted-foreground"
              >
                <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-muted/60 font-mono text-xs font-bold">
                  {s.order}
                </span>
                <span className="flex-1 truncate blur-[3px] select-none" aria-hidden>
                  {s.catalog.name[locale] ?? s.catalog.name.en ?? "Spot"}
                </span>
                <Lock className="size-3.5 shrink-0 opacity-60" />
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {/* ── "결제하면 풀리는 것" — 가치 어필 + Unlock CTA ─────────────── */}
      <section className="rounded-3xl border-2 border-[var(--brand-primary)]/30 bg-gradient-to-br from-emerald-50/40 via-card to-card p-5 shadow-md sm:p-6 dark:from-emerald-950/20">
        <div className="mb-3 flex items-center gap-2">
          <Sparkles className="size-4 text-[var(--brand-primary)]" />
          <p className="text-[11px] font-bold uppercase tracking-wider text-[var(--brand-primary)]">
            {t("routeWhatYouGetTitle")}
          </p>
        </div>
        <ul className="space-y-2.5 text-sm leading-relaxed text-foreground/85">
          {[1, 2, 3, 4, 5].map((n) => (
            <li key={n} className="flex items-start gap-2.5">
              <Check className="mt-0.5 size-4 shrink-0 text-emerald-600" />
              <span>{t(`routeWhatYouGet${n}`)}</span>
            </li>
          ))}
        </ul>

        {/* CTA */}
        <button
          type="button"
          onClick={() => setPayOpen(true)}
          className="mt-6 inline-flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-[var(--brand-primary)] text-base font-bold text-[var(--text-on-brand)] shadow-[var(--shadow-brand)] transition-all hover:opacity-95 hover:scale-[1.01]"
        >
          {t("routeUnlockCta")}
          <ChevronRight className="size-4" />
        </button>
        <p className="mt-2 text-center text-xs text-muted-foreground">
          <span className="font-bold text-foreground">{t("routeUnlockPrice")}</span>
          {" · "}
          {t("routeUnlockHint")}
        </p>
      </section>

      {/* 결제 시트 (기존 4단계 Toss/Kakao 가짜 결제) */}
      <PlaybookUnlockSheet
        open={payOpen}
        onOpenChange={setPayOpen}
        onConfirmDemoUnlock={onUnlock}
        guardianOpenDetail={guardianOpenDetail}
        routeId={route.id}
      />
    </div>
  );
}

function StatBlock({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-border/40 bg-background/60 px-3 py-3">
      <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        <span className="text-primary">{icon}</span>
        {label}
      </div>
      <p className={cn("mt-1.5 text-sm font-bold text-foreground", value.length > 10 && "text-xs")}>
        {value}
      </p>
    </div>
  );
}
