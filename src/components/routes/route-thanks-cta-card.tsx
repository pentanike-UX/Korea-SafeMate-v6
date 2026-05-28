"use client";

import { useTranslations } from "next-intl";
import { Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function RouteThanksCtaCard({
  onClick,
  variant = "default",
  className,
}: {
  onClick: () => void;
  variant?: "default" | "compact";
  className?: string;
}) {
  const t = useTranslations("TravelerHub");

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
          <p className="text-foreground text-sm font-semibold leading-snug">{t("thanksCtaTitle")}</p>
          <p className="text-muted-foreground text-xs leading-relaxed sm:text-sm">{t("thanksCtaLead")}</p>
          <Button
            type="button"
            onClick={onClick}
            className="h-10 rounded-xl bg-[var(--brand-primary)] font-semibold text-[var(--text-on-brand)] hover:opacity-95"
          >
            {t("thanksCtaButton")}
          </Button>
        </div>
      </div>
    </div>
  );
}
