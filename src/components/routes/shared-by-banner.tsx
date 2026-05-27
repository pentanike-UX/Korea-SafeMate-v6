"use client";

import Image from "next/image";
import { useTranslations } from "next-intl";
import { Gift } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * 공유 초대로 입장한 사용자 상단 안내 배너.
 * 정책: docs/payment-and-share-policy.md §3.6
 */
export function SharedByBanner({
  ownerName,
  ownerAvatarUrl,
  className,
}: {
  ownerName: string;
  ownerAvatarUrl?: string | null;
  className?: string;
}) {
  const t = useTranslations("TravelerHub");
  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-2xl border border-emerald-300/50 bg-emerald-50/60 px-3 py-2.5 text-left dark:bg-emerald-950/30 dark:border-emerald-400/30",
        className,
      )}
      role="note"
    >
      <span className="relative size-9 shrink-0 overflow-hidden rounded-full border border-emerald-300/60 bg-emerald-100 dark:bg-emerald-900/40">
        {ownerAvatarUrl ? (
          <Image src={ownerAvatarUrl} alt="" fill className="object-cover" sizes="36px" />
        ) : (
          <span className="text-emerald-700 dark:text-emerald-300 flex h-full items-center justify-center">
            <Gift className="size-4" aria-hidden />
          </span>
        )}
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-emerald-800 dark:text-emerald-200 truncate text-sm font-semibold">
          {t("routeSharedByBannerLead", { name: ownerName })}
        </p>
        <p className="text-emerald-700/80 dark:text-emerald-300/80 text-[11px]">
          {t("routeSharedByBannerSub")}
        </p>
      </div>
    </div>
  );
}
