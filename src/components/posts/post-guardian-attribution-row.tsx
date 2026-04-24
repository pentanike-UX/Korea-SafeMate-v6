"use client";

import Image from "next/image";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { FILL_IMAGE_AVATAR_COVER } from "@/lib/ui/fill-image";

export function PostGuardianAttributionRow({
  displayName,
  avatarUrl,
  variant,
  className,
}: {
  displayName: string;
  avatarUrl: string;
  variant: "article" | "route";
  className?: string;
}) {
  const t = useTranslations("Posts");

  return (
    <div
      className={cn(
        "border-border/60 flex items-center gap-3 rounded-2xl border bg-card/80 px-4 py-3 shadow-[var(--shadow-sm)] sm:gap-4 sm:px-5 sm:py-3.5",
        className,
      )}
    >
      <div className="relative size-11 shrink-0 overflow-hidden rounded-full border border-border/50 bg-muted sm:size-12">
        <Image src={avatarUrl} alt="" fill className={FILL_IMAGE_AVATAR_COVER} sizes="48px" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-muted-foreground text-[10px] font-bold tracking-wide uppercase">
          {variant === "route" ? t("guardianAttributionRoute") : t("guardianAttributionArticle")}
        </p>
        <p className="text-text-strong truncate text-sm font-semibold sm:text-base">{displayName}</p>
      </div>
    </div>
  );
}
