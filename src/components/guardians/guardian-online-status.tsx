"use client";

import { useTranslations } from "next-intl";
import { Circle } from "lucide-react";
import { cn } from "@/lib/utils";

export type OnlineStatus = "online" | "recently";

const ONLINE_WINDOW_MS = 30 * 60 * 1000; // 30분
const RECENTLY_WINDOW_MS = 24 * 60 * 60 * 1000; // 24시간
const MOCK_ONLINE_SENTINEL = "mock:online";

/**
 * 마지막 활동 시각으로 온라인 상태를 판정한다.
 * - `mock:online` 센티넬 또는 30분 이내 → online
 * - 24시간 이내 → recently
 * - 그 외 / null → null
 */
export function resolveOnlineStatus(lastSeenAt: string | null | undefined): OnlineStatus | null {
  if (!lastSeenAt) return null;
  if (lastSeenAt === MOCK_ONLINE_SENTINEL) return "online";
  const ts = new Date(lastSeenAt).getTime();
  if (Number.isNaN(ts)) return null;
  const diff = Date.now() - ts;
  if (diff < ONLINE_WINDOW_MS) return "online";
  if (diff < RECENTLY_WINDOW_MS) return "recently";
  return null;
}

/**
 * 아바타 우하단에 absolute로 얹는 작은 점.
 * 부모가 `relative`여야 한다. online일 때만 렌더, 그 외엔 null.
 */
export function OnlineDot({
  lastSeenAt,
  className,
  size = "md",
}: {
  lastSeenAt?: string | null;
  className?: string;
  /** sm: size-2.5, md: size-3, lg: size-3.5 */
  size?: "sm" | "md" | "lg";
}) {
  const t = useTranslations("OnlineStatus");
  const status = resolveOnlineStatus(lastSeenAt);
  if (status !== "online") return null;
  const sizeCls = size === "sm" ? "size-2.5" : size === "lg" ? "size-3.5" : "size-3";
  return (
    <span
      className={cn(
        "absolute right-0 bottom-0 rounded-full border-2 border-background bg-emerald-500",
        sizeCls,
        className,
      )}
      aria-label={t("online")}
    />
  );
}

/**
 * 텍스트 배지: "온라인" / "최근 활동". null이면 미렌더.
 */
export function OnlineStatusBadge({
  lastSeenAt,
  className,
}: {
  lastSeenAt?: string | null;
  className?: string;
}) {
  const t = useTranslations("OnlineStatus");
  const status = resolveOnlineStatus(lastSeenAt);
  if (!status) return null;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold",
        status === "online"
          ? "bg-emerald-500/12 text-emerald-600 dark:bg-emerald-400/15 dark:text-emerald-300"
          : "bg-amber-400/15 text-amber-600 dark:bg-amber-300/15 dark:text-amber-300",
        className,
      )}
    >
      <Circle
        className={cn(
          "size-2 fill-current",
          status === "online" ? "text-emerald-500" : "text-amber-400",
        )}
        aria-hidden
      />
      {status === "online" ? t("online") : t("recently")}
    </span>
  );
}

/**
 * 이미지 위 강조 칩 — explore 리스트 카드처럼 어두운 배경에 흰 글씨가 필요한 곳.
 * online일 때만 렌더.
 */
export function OnlineHighlightChip({
  lastSeenAt,
  className,
}: {
  lastSeenAt?: string | null;
  className?: string;
}) {
  const t = useTranslations("OnlineStatus");
  const status = resolveOnlineStatus(lastSeenAt);
  if (status !== "online") return null;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border border-white/20 bg-emerald-500/90 px-2 py-1 text-[11px] font-bold text-white shadow-sm backdrop-blur-sm",
        className,
      )}
    >
      <span className="size-1.5 rounded-full bg-white" aria-hidden />
      {t("online")}
    </span>
  );
}
