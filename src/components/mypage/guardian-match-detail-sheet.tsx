"use client";

import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { GuardianMatchAcceptButton } from "@/components/mypage/match-request-row-actions";
import type { StoredMatchRequest } from "@/lib/traveler-match-requests";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { actionDrawerTriggerButtonClass } from "@/components/ui/action-variants";
import { cn } from "@/lib/utils";

function statusVariant(s: StoredMatchRequest["status"]): "default" | "secondary" | "outline" {
  if (s === "completed") return "secondary";
  if (s === "accepted") return "default";
  return "outline";
}

export function GuardianMatchDetailSheetTrigger({
  row,
  className,
  variant = "outline",
  size = "sm",
}: {
  row: StoredMatchRequest;
  className?: string;
  variant?: "outline" | "ghost";
  size?: "default" | "sm" | "lg";
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
        {t("guardianMatchSheetTrigger")}
      </Button>
      <SheetContent
        side={side}
        className={cn(
          "flex w-full flex-col gap-0 overflow-hidden p-0",
          side === "right" ? "sm:max-w-md" : "max-h-[90vh] rounded-t-2xl",
        )}
      >
        <SheetHeader className="border-border/60 shrink-0 space-y-2 border-b px-5 py-4 text-left sm:px-6">
          <SheetTitle className="text-left text-base sm:text-lg">{t("guardianMatchSheetTitle")}</SheetTitle>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant={statusVariant(row.status)} className="text-[10px] font-semibold">
              {t(`matchStatus.${row.status}`)}
            </Badge>
          </div>
          <p className="text-muted-foreground font-mono text-[11px] break-all">{row.id}</p>
        </SheetHeader>
        <div className="min-h-0 flex-1 space-y-5 overflow-y-auto overscroll-contain px-5 py-4 sm:px-6">
          <section className="space-y-2 rounded-xl border border-border/60 bg-muted/20 p-4">
            <p className="text-muted-foreground text-xs font-semibold uppercase">{t("guardianMatchSheetTravelerTitle")}</p>
            <p className="font-mono text-sm break-all text-foreground">{row.traveler_user_id}</p>
          </section>
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
          {row.status === "requested" ? (
            <div className="flex flex-wrap gap-2 border-t border-border/60 pt-4">
              <GuardianMatchAcceptButton matchId={row.id} onSuccess={() => setOpen(false)} />
            </div>
          ) : null}
        </div>
      </SheetContent>
    </Sheet>
  );
}
