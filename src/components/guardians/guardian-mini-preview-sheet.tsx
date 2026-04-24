"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import {
  FALLBACK_GUARDIAN_REQUEST_AVATAR,
  GUARDIAN_REQUEST_OPEN_EVENT,
  type GuardianRequestOpenDetail,
} from "@/components/guardians/guardian-request-sheet";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * When only author id + display name are available (e.g. route cards on listing pages).
 */
export function GuardianMiniPreviewSheetTrigger({
  guardianUserId,
  displayName,
  subtitle,
  triggerLabel,
  triggerClassName,
  size = "sm",
}: {
  guardianUserId: string;
  displayName: string;
  subtitle?: string;
  triggerLabel: string;
  triggerClassName?: string;
  size?: "default" | "sm" | "lg";
}) {
  const t = useTranslations("TravelerHub");
  const tReq = useTranslations("GuardianRequest");
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
        size={size}
        className={cn("rounded-xl font-semibold", triggerClassName)}
        onClick={() => setOpen(true)}
      >
        {triggerLabel}
      </Button>
      <SheetContent side={side} className={side === "right" ? "sm:max-w-md" : "max-h-[86vh] rounded-t-2xl"}>
        <SheetHeader>
          <SheetTitle>{displayName}</SheetTitle>
        </SheetHeader>
        <div className="space-y-4 px-4 pb-4 sm:px-6 sm:pb-6">
          {subtitle ? <p className="text-muted-foreground text-sm leading-relaxed">{subtitle}</p> : null}
          <p className="text-muted-foreground text-xs leading-relaxed">
            {t("guardianMiniSheetHint")}
          </p>
          <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
            <Button asChild className="rounded-xl font-semibold">
              <Link href={`/guardians/${guardianUserId}`} onClick={() => setOpen(false)}>
                {t("openGuardian")}
              </Link>
            </Button>
            <Button
              type="button"
              variant="outline"
              className="rounded-xl font-semibold"
              onClick={() => {
                setOpen(false);
                const detail: GuardianRequestOpenDetail = {
                  guardianUserId,
                  displayName,
                  headline: subtitle ?? "",
                  avatarUrl: FALLBACK_GUARDIAN_REQUEST_AVATAR,
                  suggestedRegionSlug: null,
                };
                window.requestAnimationFrame(() =>
                  window.dispatchEvent(
                    new CustomEvent<GuardianRequestOpenDetail>(GUARDIAN_REQUEST_OPEN_EVENT, { detail }),
                  ),
                );
              }}
            >
              {tReq("openCta")}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
