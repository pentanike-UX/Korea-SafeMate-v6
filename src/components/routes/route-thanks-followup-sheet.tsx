"use client";

import { useTranslations } from "next-intl";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";

export function RouteThanksFollowupSheet({
  open,
  onOpenChange,
  variant,
  onThanksClick,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  variant: "share" | "save";
  onThanksClick: () => void;
}) {
  const t = useTranslations("TravelerHub");
  const title = variant === "share" ? t("thanksFollowupShareTitle") : t("thanksFollowupSaveTitle");
  const body = variant === "share" ? t("thanksFollowupShareBody") : t("thanksFollowupSaveBody");

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-3xl px-6 pb-8 pt-6">
        <SheetHeader className="sr-only">
          <SheetTitle>{title}</SheetTitle>
          <SheetDescription>{body}</SheetDescription>
        </SheetHeader>
        <div className="space-y-4 pt-2 text-center sm:text-left">
          <div>
            <h2 className="text-foreground font-serif text-lg font-bold">{title}</h2>
            <p className="text-muted-foreground mt-1.5 text-sm leading-relaxed whitespace-pre-line">{body}</p>
          </div>
          <div className="flex flex-col gap-2">
            <Button
              type="button"
              variant="outline"
              className="h-11 rounded-xl font-semibold"
              onClick={() => {
                onOpenChange(false);
                onThanksClick();
              }}
            >
              {t("thanksCtaButton")}
            </Button>
            <Button type="button" variant="ghost" className="h-10 rounded-xl" onClick={() => onOpenChange(false)}>
              {variant === "save" ? t("thanksFollowupLater") : t("thanksSuccessClose")}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
