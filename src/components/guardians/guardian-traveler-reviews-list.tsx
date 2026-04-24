"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import type { TravelerReview } from "@/types/domain";
import { GuardianReviewAverageStars } from "@/components/guardians/guardian-review-average-stars";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { actionDrawerTriggerButtonClass } from "@/components/ui/action-variants";
import { FILL_IMAGE_REVIEW_UGC_WIDE } from "@/lib/ui/fill-image";
import { cn } from "@/lib/utils";
import { Star } from "lucide-react";

const INITIAL = 3;

function reviewBody(r: TravelerReview, locale: string) {
  if (locale === "ko") return r.comment ?? "";
  return r.comment_en ?? r.comment ?? "";
}

function reviewTimeLabel(r: TravelerReview, locale: string) {
  if (locale === "ko") return r.time_label_ko;
  if (locale === "ja") return r.time_label_ja ?? r.time_label_en ?? r.time_label_ko;
  return r.time_label_en;
}

export function GuardianTravelerReviewsList({
  reviews,
  locale,
  avg,
  sectionTitle,
  lead,
  avgAria,
  showMore,
  showLess: _showLess,
  sheetTitle,
}: {
  reviews: TravelerReview[];
  locale: string;
  avg: number;
  sectionTitle: string;
  lead: string;
  avgAria: string;
  showMore: string;
  showLess: string;
  sheetTitle: string;
}) {
  const t = useTranslations("TravelerHub");
  const helpTagLabels = t.raw("reviewHelpTag") as Record<string, string> | undefined;
  const [sheetOpen, setSheetOpen] = useState(false);
  const [side, setSide] = useState<"right" | "bottom">("bottom");

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)");
    const sync = () => setSide(mq.matches ? "right" : "bottom");
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);
  if (reviews.length === 0) {
    return (
      <section
        id="guardian-traveler-reviews"
        className="scroll-mt-[4.75rem] sm:scroll-mt-[5.5rem]"
        aria-labelledby="guardian-traveler-reviews-heading"
      >
        <h2 id="guardian-traveler-reviews-heading" className="text-text-strong text-lg font-semibold">
          {sectionTitle}
        </h2>
        <p className="text-muted-foreground mt-3 text-sm">{lead}</p>
        <p className="text-muted-foreground mt-4 text-sm">{t("reviewsEmptyGuardian")}</p>
      </section>
    );
  }

  const shown = reviews.slice(0, INITIAL);
  const hasMore = reviews.length > INITIAL;
  const rest = reviews.slice(INITIAL);

  return (
    <section
      id="guardian-traveler-reviews"
      className="scroll-mt-[4.75rem] sm:scroll-mt-[5.5rem]"
      aria-labelledby="guardian-traveler-reviews-heading"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 id="guardian-traveler-reviews-heading" className="text-text-strong text-lg font-semibold">
            {sectionTitle}
          </h2>
          <p className="text-muted-foreground mt-2 max-w-2xl text-sm leading-relaxed">{lead}</p>
        </div>
        <div className="flex flex-wrap items-center gap-3 rounded-xl border border-border/60 bg-card/80 px-4 py-3 shadow-sm">
          <GuardianReviewAverageStars value={avg} label={avgAria} />
          <div className="text-sm">
            <span className="font-semibold tabular-nums">{avg.toFixed(1)}</span>
            <span className="text-muted-foreground">
              {" "}
              · {t("reviewsCountLabel", { count: reviews.length })}
            </span>
          </div>
        </div>
      </div>

      <ul className="mt-5 space-y-3">
        {shown.map((r) => {
          const body = reviewBody(r, locale);
          const time = reviewTimeLabel(r, locale);
          const name = r.reviewer_display_name ?? t("reviewsAnonymous");
          return (
            <li key={r.id}>
              <Card className="rounded-2xl border-border/60 shadow-none">
                <CardContent className="p-4 sm:p-5">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <p className="text-foreground text-sm font-semibold">{name}</p>
                      {time ? <p className="text-muted-foreground mt-0.5 text-xs">{time}</p> : null}
                    </div>
                    <div className="flex gap-0.5 text-amber-500" aria-label={t("reviewsStarsAria", { n: r.rating })}>
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star key={i} className={i < r.rating ? "size-4 fill-current" : "size-4"} aria-hidden />
                      ))}
                    </div>
                  </div>
                  <p className="text-foreground mt-3 text-sm leading-relaxed">{body}</p>
                  {r.image_url ? (
                    <div className="border-border/50 relative mt-3 aspect-[16/10] w-full max-w-xs overflow-hidden rounded-xl border">
                      <Image src={r.image_url} alt="" fill className={FILL_IMAGE_REVIEW_UGC_WIDE} sizes="320px" />
                    </div>
                  ) : null}
                  {r.help_tag_ids?.length ? (
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {r.help_tag_ids.map((tid) => (
                        <Badge key={tid} variant="secondary" className="rounded-full text-[10px] font-medium">
                          {helpTagLabels?.[tid] ?? tid}
                        </Badge>
                      ))}
                    </div>
                  ) : null}
                </CardContent>
              </Card>
            </li>
          );
        })}
      </ul>

      {hasMore ? (
        <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
          <Button
            type="button"
            variant="outline"
            className={cn(actionDrawerTriggerButtonClass, "mt-4 h-11 w-full sm:w-auto")}
            onClick={() => setSheetOpen(true)}
          >
            {showMore}
          </Button>
          <SheetContent
            side={side}
            className={cn(
              "flex w-full flex-col gap-0 overflow-hidden p-0",
              side === "right" ? "sm:max-w-md" : "max-h-[90vh] rounded-t-2xl",
            )}
          >
            <SheetHeader className="border-border/60 shrink-0 border-b px-5 py-4 text-left sm:px-6">
              <SheetTitle className="text-left text-base sm:text-lg">{sheetTitle}</SheetTitle>
            </SheetHeader>
            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-3 py-3 sm:px-4">
              <ul className="space-y-3 pb-4">
                {rest.map((r) => {
                  const body = reviewBody(r, locale);
                  const time = reviewTimeLabel(r, locale);
                  const name = r.reviewer_display_name ?? t("reviewsAnonymous");
                  return (
                    <li key={r.id}>
                      <Card className="rounded-2xl border-border/60 shadow-none">
                        <CardContent className="p-4 sm:p-5">
                          <div className="flex flex-wrap items-start justify-between gap-2">
                            <div>
                              <p className="text-foreground text-sm font-semibold">{name}</p>
                              {time ? <p className="text-muted-foreground mt-0.5 text-xs">{time}</p> : null}
                            </div>
                            <div className="flex gap-0.5 text-amber-500" aria-label={t("reviewsStarsAria", { n: r.rating })}>
                              {Array.from({ length: 5 }).map((_, i) => (
                                <Star key={i} className={i < r.rating ? "size-4 fill-current" : "size-4"} aria-hidden />
                              ))}
                            </div>
                          </div>
                          <p className="text-foreground mt-3 text-sm leading-relaxed">{body}</p>
                          {r.image_url ? (
                            <div className="border-border/50 relative mt-3 aspect-[16/10] w-full max-w-xs overflow-hidden rounded-xl border">
                              <Image src={r.image_url} alt="" fill className={FILL_IMAGE_REVIEW_UGC_WIDE} sizes="320px" />
                            </div>
                          ) : null}
                          {r.help_tag_ids?.length ? (
                            <div className="mt-3 flex flex-wrap gap-1.5">
                              {r.help_tag_ids.map((tid) => (
                                <Badge key={tid} variant="secondary" className="rounded-full text-[10px] font-medium">
                                  {helpTagLabels?.[tid] ?? tid}
                                </Badge>
                              ))}
                            </div>
                          ) : null}
                        </CardContent>
                      </Card>
                    </li>
                  );
                })}
              </ul>
            </div>
          </SheetContent>
        </Sheet>
      ) : null}
    </section>
  );
}
