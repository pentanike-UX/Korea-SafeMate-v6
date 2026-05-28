"use client";

import { useTranslations } from "next-intl";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export function RouteExitThanksDialog({
  open,
  onOpenChange,
  onThanks,
  onLeave,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onThanks: () => void;
  onLeave: () => void;
}) {
  const t = useTranslations("TravelerHub");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm rounded-2xl">
        <DialogHeader>
          <DialogTitle className="font-serif text-lg">{t("routeExitThanksTitle")}</DialogTitle>
          <DialogDescription className="text-sm leading-relaxed whitespace-pre-line">
            {t("routeExitThanksBody")}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex flex-col gap-2 sm:flex-col">
          <Button
            type="button"
            className="h-11 w-full rounded-xl bg-[var(--brand-primary)] font-semibold text-[var(--text-on-brand)]"
            onClick={() => {
              onOpenChange(false);
              onThanks();
            }}
          >
            {t("thanksCtaButton")}
          </Button>
          <Button type="button" variant="ghost" className="h-10 w-full rounded-xl" onClick={onLeave}>
            {t("routeExitThanksLeave")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
