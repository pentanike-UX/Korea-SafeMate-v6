"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import type { MockTravelerTripRequest } from "@/data/mock/traveler-hub";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { actionDrawerTriggerButtonClass } from "@/components/ui/action-variants";
import { cn } from "@/lib/utils";

export function TravelerTripRequestDetailSheetTrigger({
  request,
  guardianLine,
  regionLabel,
  triggerLabel,
  className,
}: {
  request: MockTravelerTripRequest;
  guardianLine: string;
  regionLabel: string;
  triggerLabel: string;
  className?: string;
}) {
  const t = useTranslations("TravelerHub");
  const [open, setOpen] = useState(false);
  const [side, setSide] = useState<"right" | "bottom">("bottom");

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)");
    const sync = () => setSide(mq.matches ? "right" : "bottom");
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <Button
        type="button"
        variant="outline"
        size="sm"
        className={cn(actionDrawerTriggerButtonClass, "rounded-xl shrink-0", className)}
        onClick={() => setOpen(true)}
      >
        {triggerLabel}
      </Button>
      <SheetContent
        side={side}
        className={cn(
          "flex w-full flex-col gap-0 overflow-hidden p-0",
          side === "right" ? "sm:max-w-md" : "max-h-[88vh] rounded-t-2xl",
        )}
      >
        <SheetHeader className="border-border/60 shrink-0 border-b px-5 py-4 text-left sm:px-6">
          <SheetTitle className="text-left text-base sm:text-lg">{t("tripRequestSheetTitle")}</SheetTitle>
        </SheetHeader>
        <div className="min-h-0 flex-1 space-y-3 overflow-y-auto overscroll-contain px-5 py-4 text-sm sm:px-6">
          <p className="text-foreground font-medium">{t(`status.${request.status}`)}</p>
          <p className="text-muted-foreground leading-relaxed">{request.note}</p>
          <p className="text-muted-foreground text-xs leading-relaxed">
            {guardianLine} · {regionLabel}
          </p>
          <p className="text-muted-foreground font-mono text-[11px] break-all">{request.id}</p>
          <Button asChild variant="link" className="text-muted-foreground h-auto px-0 text-xs font-medium">
            <Link href="/mypage/requests" onClick={() => setOpen(false)}>
              {t("tripRequestOpenListPage")}
            </Link>
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
