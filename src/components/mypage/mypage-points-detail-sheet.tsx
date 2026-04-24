"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { usePathname } from "@/i18n/navigation";
import { Link } from "@/i18n/navigation";
import { BlockAttentionBadge } from "@/components/mypage/mypage-attention-primitives";
import { useMypageHubContext } from "@/components/mypage/mypage-hub-context";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { actionDrawerTriggerButtonClass } from "@/components/ui/action-variants";
import type { AttentionBlockKey } from "@/types/mypage-hub";
import type { MypagePointsApiResponse } from "@/lib/points/types";
import {
  clearClientPointsCacheIfUserMismatch,
  getClientPointsFetchCache,
  setClientPointsFetchCache,
} from "@/lib/points/client-points-fetch-cache";
import { cn } from "@/lib/utils";
import { ChevronDown, Info } from "lucide-react";

function payloadSignature(p: MypagePointsApiResponse | null | undefined) {
  if (!p) return "";
  return `${p.balance.balance}:${p.balance.lifetime_earned}:${p.ledger[0]?.id ?? ""}:${p.ledger.length}`;
}

function formatSignedP(n: number) {
  const sign = n >= 0 ? "+" : "−";
  return `${sign}${Math.abs(n).toLocaleString()}P`;
}

function eventTitle(t: (key: string) => string, ev: string) {
  if (ev === "guardian_profile_reward") return t("evProfile");
  if (ev === "post_publish_reward") return t("evPost");
  if (ev === "post_reward_revoke") return t("evPostRevoke");
  if (ev === "match_complete_reward") return t("evMatch");
  if (ev === "manual_adjustment") return t("evManual");
  return t("evOther");
}

export function MypagePointsDetailSheetTrigger({
  triggerLabel,
  variant = "outline",
  size = "sm",
  className,
  initialPointsPayload = null,
}: {
  triggerLabel: string;
  variant?: "outline" | "ghost" | "link" | "default";
  size?: "default" | "sm" | "lg";
  className?: string;
  /** 페이지 RSC에서 넘기면 컨텍스트보다 우선 (포인트 전용 페이지 등) */
  initialPointsPayload?: MypagePointsApiResponse | null;
}) {
  const t = useTranslations("TravelerPoints");
  const th = useTranslations("TravelerHub");
  const locale = useLocale();
  const pathname = usePathname();
  const ctx = useMypageHubContext();
  const [open, setOpen] = useState(false);
  const [side, setSide] = useState<"right" | "bottom">("bottom");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<MypagePointsApiResponse | null>(null);
  const dataRef = useRef<MypagePointsApiResponse | null>(null);
  dataRef.current = data;
  const openCycleRef = useRef(0);
  const prevAccountUserIdRef = useRef<string | null | undefined>(undefined);

  const pointsPageHref = pathname.includes("/mypage/guardian") ? "/mypage/guardian/points" : "/mypage/points";
  const userId = ctx?.accountUserId ?? null;
  const resolvedInitial = initialPointsPayload ?? ctx?.pointsSheetInitial ?? null;
  const resolvedSig = payloadSignature(resolvedInitial);

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)");
    const sync = () => setSide(mq.matches ? "right" : "bottom");
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    clearClientPointsCacheIfUserMismatch(userId);
  }, [userId]);

  useEffect(() => {
    if (prevAccountUserIdRef.current === undefined) {
      prevAccountUserIdRef.current = userId;
      return;
    }
    if (prevAccountUserIdRef.current !== userId) {
      prevAccountUserIdRef.current = userId;
      openCycleRef.current += 1;
      setData(resolvedInitial ?? null);
      setError(null);
      setLoading(false);
    }
  }, [userId, resolvedInitial, resolvedSig]);

  useEffect(() => {
    if (!resolvedInitial) return;
    setData((prev) => (payloadSignature(prev) === resolvedSig ? prev : resolvedInitial));
  }, [resolvedInitial, resolvedSig]);

  const fetchPoints = useCallback(async () => {
    const res = await fetch("/api/traveler/points", { credentials: "same-origin" });
    if (!res.ok) {
      setError(t("sheetFetchError"));
      return null;
    }
    const json = (await res.json()) as MypagePointsApiResponse;
    setError(null);
    if (userId) {
      setClientPointsFetchCache(userId, json);
    }
    return json;
  }, [t, userId]);

  useEffect(() => {
    if (!open) return;
    const cycle = ++openCycleRef.current;

    const cached = userId ? getClientPointsFetchCache(userId) : null;

    const mergedSeed = resolvedInitial ?? cached ?? dataRef.current;
    if (resolvedInitial) {
      setData(resolvedInitial);
      setError(null);
    } else if (cached) {
      setData(cached);
      setError(null);
    }

    setLoading(!mergedSeed);

    void (async () => {
      try {
        const json = await fetchPoints();
        if (cycle !== openCycleRef.current) return;
        if (json) setData(json);
        else if (!mergedSeed) setData(null);
      } catch {
        if (cycle !== openCycleRef.current) return;
        setError(t("sheetFetchError"));
        if (!mergedSeed) setData(null);
      } finally {
        if (cycle === openCycleRef.current) setLoading(false);
      }
    })();
  }, [open, fetchPoints, resolvedSig, t, userId]);

  const dateLocale = locale === "ko" ? "ko-KR" : locale === "ja" ? "ja-JP" : "en-US";
  function fmt(iso: string) {
    try {
      return new Intl.DateTimeFormat(dateLocale, { dateStyle: "medium", timeStyle: "short" }).format(new Date(iso));
    } catch {
      return iso;
    }
  }

  const pointsBlock: AttentionBlockKey = pathname.includes("/mypage/guardian")
    ? "guardian.points.newEarnings"
    : "traveler.points.newEarnings";
  const pointsBlockSig = ctx?.snapshot.blockAttentionSignatures[pointsBlock] ?? "0";
  const markBlock = ctx?.markBlockAttentionSeen;

  useEffect(() => {
    if (!open || !userId || pointsBlockSig === "0" || !markBlock) return;
    markBlock(pointsBlock, pointsBlockSig);
  }, [open, userId, pointsBlock, pointsBlockSig, markBlock]);

  const raw =
    pointsBlock === "guardian.points.newEarnings"
      ? (ctx?.snapshot.guardianWorkspaceBlockAttention?.pointsRecentLedgerCount ?? 0)
      : (ctx?.snapshot.travelerBlockAttention.pointsRecentLedgerCount ?? 0);
  const u = ctx?.attention.unreadBlockBadges[pointsBlock] ?? 0;
  const badgeCount = u > 0 && raw > 0 ? u : 0;

  const ledger = data?.ledger ?? [];
  const policy = data?.policy ?? null;

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <Button
        type="button"
        variant={variant === "link" ? "link" : variant}
        size={size}
        className={cn(variant !== "link" && actionDrawerTriggerButtonClass, variant === "link" && "h-auto px-0", className)}
        onClick={() => setOpen(true)}
      >
        {triggerLabel}
      </Button>
      <SheetContent
        side={side}
        className={cn(
          "flex w-full flex-col gap-0 overflow-hidden p-0",
          side === "right" ? "sm:max-w-md" : "max-h-[90vh] rounded-t-2xl",
        )}
      >
        <SheetHeader className="border-border/60 shrink-0 space-y-2 border-b px-5 py-4 text-left sm:px-6">
          <SheetTitle className="text-left text-base sm:text-lg">{t("sheetTitle")}</SheetTitle>
          <p className="text-muted-foreground text-sm leading-relaxed">{t("sheetLead")}</p>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-text-strong text-sm font-semibold">{t("historyTitle")}</span>
            <BlockAttentionBadge count={badgeCount} ariaLabel={th("attentionBlockPointsRecent")} />
          </div>
        </SheetHeader>

        <div className="flex min-h-0 flex-1 flex-col overflow-y-auto px-5 py-4 sm:px-6">
          {loading && !data ? (
            <p className="text-muted-foreground text-sm">{t("sheetLoading")}</p>
          ) : null}
          {error ? <p className="text-destructive text-sm">{error}</p> : null}

          {policy ? (
            <div className="border-border/60 bg-muted/20 mb-4 flex gap-3 rounded-xl border p-4">
              <Info className="text-muted-foreground mt-0.5 size-5 shrink-0" strokeWidth={1.75} aria-hidden />
              <div>
                <p className="text-foreground text-sm font-semibold">{t("policySummaryTitle")}</p>
                <p className="text-muted-foreground mt-1 text-xs leading-relaxed">{t("spendComingBody")}</p>
                <p className="text-muted-foreground mt-2 text-xs leading-relaxed">
                  {t("policySummaryLine", {
                    profile: policy.profile_signup_reward,
                    post: policy.post_publish_reward,
                    match: policy.match_complete_reward,
                  })}
                </p>
                <p className="text-muted-foreground mt-1 text-[11px] leading-relaxed opacity-90">
                  {t("policyVersionLabel", { code: policy.version_code })}
                </p>
              </div>
            </div>
          ) : (
            <div className="border-border/60 bg-muted/15 mb-4 rounded-xl border border-dashed p-4">
              <p className="text-muted-foreground text-sm leading-relaxed">{t("policyUnavailable")}</p>
            </div>
          )}

          {ledger.length === 0 && !loading ? (
            <div className="space-y-4">
              <p className="text-muted-foreground text-sm leading-relaxed">{t("historyEmpty")}</p>
              <div className="flex flex-wrap gap-2">
                <Button asChild variant="outline" size="sm" className="rounded-xl font-semibold">
                  <Link href="/mypage/matches">{th("hubQuickMatches")}</Link>
                </Button>
                <Button asChild variant="outline" size="sm" className="rounded-xl font-semibold">
                  <Link href="/guardians">{th("hubQuickFindGuardian")}</Link>
                </Button>
              </div>
            </div>
          ) : null}

          {ledger.length > 0 ? (
            <ul className="border-border/60 divide-border/60 divide-y overflow-hidden rounded-xl border bg-card">
              {ledger.map((row) => {
                const ev = row.event_type as string;
                return (
                  <li key={row.id}>
                    <details className="group">
                      <summary className="flex cursor-pointer list-none flex-col gap-2 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:gap-6 [&::-webkit-details-marker]:hidden">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-start gap-2">
                            <ChevronDown className="text-muted-foreground mt-0.5 size-4 shrink-0 transition-transform group-open:rotate-180" />
                            <div className="min-w-0">
                              <p className="text-foreground text-sm font-medium">{eventTitle(t, ev)}</p>
                              <p className="text-muted-foreground mt-1 text-xs leading-relaxed">{fmt(row.occurred_at)}</p>
                            </div>
                          </div>
                        </div>
                        <p
                          className={cn(
                            "text-lg font-semibold tabular-nums sm:text-right sm:pl-8",
                            row.amount >= 0 ? "text-primary" : "text-destructive",
                          )}
                        >
                          {formatSignedP(row.amount)}
                        </p>
                      </summary>
                      <div className="border-border/60 bg-muted/15 border-t px-4 py-3 pl-11 text-xs leading-relaxed">
                        <p className="text-muted-foreground font-medium">{t("entryBasisTitle")}</p>
                        <p className="text-foreground mt-1 break-all">{row.reason ?? t("entryReasonFallback")}</p>
                        <p className="text-muted-foreground mt-2">
                          {t("entryPolicyVersion", { version: row.policy_version })}
                        </p>
                      </div>
                    </details>
                  </li>
                );
              })}
            </ul>
          ) : null}
        </div>

        <div className="border-border/60 mt-auto shrink-0 border-t px-5 py-4 sm:px-6">
          <Button asChild variant="outline" size="sm" className="w-full rounded-xl font-semibold sm:w-auto">
            <Link href={pointsPageHref}>{t("openPointsPage")}</Link>
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
