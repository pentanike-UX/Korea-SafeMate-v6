"use client";

import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import type { StoredMatchRequest } from "@/lib/traveler-match-requests";
import { MypageMatchDetailActions } from "@/components/mypage/mypage-match-detail-actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { actionDrawerTriggerButtonClass } from "@/components/ui/action-variants";
import { cn } from "@/lib/utils";

function statusVariant(s: "requested" | "accepted" | "completed"): "default" | "secondary" | "outline" {
  if (s === "completed") return "secondary";
  if (s === "accepted") return "default";
  return "outline";
}

export function TravelerMatchDetailSheetTrigger({
  row,
  triggerLabel,
  alreadyReviewed,
  canWriteTravelerReview,
  variant = "outline",
  size = "sm",
  className,
}: {
  row: StoredMatchRequest;
  triggerLabel: string;
  alreadyReviewed: boolean;
  canWriteTravelerReview: boolean;
  variant?: "outline" | "ghost";
  size?: "default" | "sm" | "lg";
  className?: string;
}) {
  const t = useTranslations("TravelerHub");
  const locale = useLocale();
  const [open, setOpen] = useState(false);
  const [side, setSide] = useState<"right" | "bottom">("bottom");

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)");
    const sync = () => setSide(mq.matches ? "right" : "bottom");
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  const dateLocale = locale === "ko" ? "ko-KR" : locale === "ja" ? "ja-JP" : "en-US";

  function fmt(iso: string) {
    try {
      return new Intl.DateTimeFormat(dateLocale, { dateStyle: "medium", timeStyle: "short" }).format(new Date(iso));
    } catch {
      return iso;
    }
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <Button
        type="button"
        variant={variant}
        size={size}
        className={cn(actionDrawerTriggerButtonClass, className)}
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
          <SheetTitle className="text-left text-base sm:text-lg">{t("matchDetailTitle")}</SheetTitle>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-foreground font-semibold">
              {row.guardian_display_name || row.guardian_user_id}
            </span>
            <Badge variant={statusVariant(row.status)} className="text-[10px] font-semibold">
              {t(`matchStatus.${row.status}`)}
            </Badge>
          </div>
          <p className="text-muted-foreground font-mono text-[11px] break-all">{row.id}</p>
        </SheetHeader>
        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-contain px-5 py-4 sm:px-6">
          <dl className="text-muted-foreground grid gap-3 text-sm">
            <div>
              <dt className="text-foreground font-medium">{t("matchDetailCreated")}</dt>
              <dd className="mt-0.5 tabular-nums">{fmt(row.created_at)}</dd>
            </div>
            <div>
              <dt className="text-foreground font-medium">{t("matchDetailUpdated")}</dt>
              <dd className="mt-0.5 tabular-nums">{fmt(row.updated_at)}</dd>
            </div>
          </dl>
          <MypageMatchDetailActions
            row={row}
            canWriteTravelerReview={canWriteTravelerReview}
            alreadyReviewed={alreadyReviewed}
          />
          <Button asChild variant="link" className="text-muted-foreground h-auto px-0 text-xs font-medium">
            <Link href={`/mypage/matches/${row.id}`} onClick={() => setOpen(false)}>
              {t("matchDetailOpenFullPage")}
            </Link>
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
