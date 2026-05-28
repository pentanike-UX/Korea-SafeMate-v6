"use client";

import { useTranslations } from "next-intl";
import { Heart, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function RouteThanksCtaCard({
  onThanksClick,
  onShareClick,
  variant = "default",
  hasPriorThanks = false,
  className,
}: {
  onThanksClick: () => void;
  onShareClick?: () => void;
  variant?: "default" | "compact" | "footer";
  hasPriorThanks?: boolean;
  className?: string;
}) {
  const t = useTranslations("TravelerHub");

  const title = hasPriorThanks ? t("thanksCtaTitleRepeat") : t("thanksCtaTitle");
  const lead = hasPriorThanks ? t("thanksCtaLeadRepeat") : t("thanksCtaLeadFooter");
  const thanksLabel = hasPriorThanks ? t("thanksCtaButtonRepeat") : t("thanksCtaButton");

  if (variant === "footer") {
    return (
      <div
        className={cn(
          "border-border/60 from-[var(--brand-primary-soft)]/25 rounded-2xl border bg-gradient-to-br to-card p-5 shadow-[var(--shadow-sm)] sm:p-6",
          className,
        )}
      >
        <p className="text-foreground text-sm font-semibold leading-snug">{title}</p>
        <p className="text-muted-foreground mt-1.5 text-xs leading-relaxed sm:text-sm">{lead}</p>
        <div className="mt-4 flex flex-col gap-2 sm:flex-row">
          <Button
            type="button"
            onClick={onThanksClick}
            className="h-11 flex-1 rounded-xl bg-[var(--brand-primary)] font-semibold text-[var(--text-on-brand)] hover:opacity-95"
          >
            {thanksLabel}
          </Button>
          {onShareClick ? (
            <Button type="button" variant="outline" onClick={onShareClick} className="h-11 flex-1 rounded-xl gap-2">
              <Share2 className="size-4" aria-hidden />
              {t("thanksFooterShareCta")}
            </Button>
          ) : null}
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "border-border/60 from-[var(--brand-primary-soft)]/30 rounded-2xl border bg-gradient-to-br to-card shadow-[var(--shadow-sm)]",
        variant === "compact" ? "p-4" : "p-5 sm:p-6",
        className,
      )}
    >
      <div className="flex items-start gap-3">
        <span className="bg-[var(--brand-primary)]/15 flex size-10 shrink-0 items-center justify-center rounded-xl">
          <Heart className="size-5 text-[var(--brand-primary)]" aria-hidden />
        </span>
        <div className="min-w-0 flex-1 space-y-2">
          <p className="text-foreground text-sm font-semibold leading-snug">{title}</p>
          <p className="text-muted-foreground text-xs leading-relaxed sm:text-sm">
            {variant === "compact" ? t("thanksCtaLead") : lead}
          </p>
          <Button
            type="button"
            onClick={onThanksClick}
            className="h-10 rounded-xl bg-[var(--brand-primary)] font-semibold text-[var(--text-on-brand)] hover:opacity-95"
          >
            {thanksLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
