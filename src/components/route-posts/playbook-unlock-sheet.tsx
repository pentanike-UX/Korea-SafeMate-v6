"use client";

import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { GuardianRequestOpenTrigger, type GuardianRequestOpenDetail } from "@/components/guardians/guardian-request-sheet";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirmDemoUnlock: () => void;
  guardianOpenDetail: GuardianRequestOpenDetail;
};

/**
 * 데모: 스팟 상세(실명·갤러리) 잠금 해제 — `결제하기`로 세션 동안만 열림(새로고침 시 초기화).
 * TODO: 실제 결제(인앱/웹) 연동 시 `onConfirmDemoUnlock` 대입.
 */
export function PlaybookUnlockSheet({ open, onOpenChange, onConfirmDemoUnlock, guardianOpenDetail }: Props) {
  const t = useTranslations("RoutePosts");

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="max-h-[min(90dvh,32rem)]">
        <SheetHeader>
          <SheetTitle>{t("unlockSheetTitle")}</SheetTitle>
          <SheetDescription className="text-left">{t("unlockSheetDescription")}</SheetDescription>
        </SheetHeader>
        <div className="px-5 sm:px-6">
          <ul className="text-muted-foreground space-y-1.5 text-sm">
            {(
              [t("paywallItem1"), t("paywallItem2"), t("paywallItem3"), t("paywallItem4"), t("paywallItem5")] as string[]
            ).map((item) => (
              <li key={item} className="flex gap-2">
                <span className="text-primary font-bold">✓</span>
                {item}
              </li>
            ))}
          </ul>
        </div>
        <SheetFooter className="gap-2 sm:flex-col">
          <Button
            type="button"
            className="w-full rounded-xl"
            onClick={() => {
              onConfirmDemoUnlock();
              onOpenChange(false);
            }}
          >
            {t("unlockSheetPayCta")}
          </Button>
          <GuardianRequestOpenTrigger
            variant="ghost"
            size="sm"
            className="text-muted-foreground w-full"
            openDetail={guardianOpenDetail}
          >
            {t("paywallCtaSecondary")}
          </GuardianRequestOpenTrigger>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
