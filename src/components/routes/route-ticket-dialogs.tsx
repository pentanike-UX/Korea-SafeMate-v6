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

/**
 * Trio/Penta 잔여 티켓 사용 컨펌 다이얼로그.
 * 정책: docs/payment-and-share-policy.md §2 (3)
 */
export function RouteTicketConsumeConfirmDialog({
  open,
  onOpenChange,
  ticketsRemaining,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  ticketsRemaining: number;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const t = useTranslations("TravelerHub");
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm text-left">
        <DialogHeader>
          <DialogTitle>{t("routeTicketConfirmTitle")}</DialogTitle>
          <DialogDescription>
            {t("routeTicketConfirmBody", { n: ticketsRemaining })}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex flex-row justify-end gap-2">
          <button
            type="button"
            onClick={() => {
              onCancel();
              onOpenChange(false);
            }}
            className="text-foreground hover:bg-muted rounded-xl px-4 py-2 text-sm font-semibold"
          >
            {t("routeTicketConfirmCancel")}
          </button>
          <button
            type="button"
            onClick={() => {
              onConfirm();
              onOpenChange(false);
            }}
            className="bg-[var(--brand-primary)] text-[var(--text-on-brand)] hover:opacity-95 rounded-xl px-4 py-2 text-sm font-bold"
          >
            {t("routeTicketConfirmCta")}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/**
 * 패키지 티켓 소진 — 재결제 안내.
 */
export function RouteTicketExhaustedDialog({
  open,
  onOpenChange,
  onGoPayment,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onGoPayment: () => void;
}) {
  const t = useTranslations("TravelerHub");
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm text-left">
        <DialogHeader>
          <DialogTitle>{t("routeTicketExhaustedTitle")}</DialogTitle>
          <DialogDescription>{t("routeTicketExhaustedBody")}</DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex flex-row justify-end">
          <button
            type="button"
            onClick={() => {
              onGoPayment();
              onOpenChange(false);
            }}
            className="bg-[var(--brand-primary)] text-[var(--text-on-brand)] hover:opacity-95 rounded-xl px-4 py-2 text-sm font-bold"
          >
            {t("routeTicketExhaustedCta")}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
