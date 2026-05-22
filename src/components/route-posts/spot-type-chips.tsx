"use client";

import { cn } from "@/lib/utils";
import {
  HARU_ROUTE_SPOT_TYPE_LABELS,
  type HaruRouteSpotType,
} from "@/types/domain";

/**
 * 스팟에 부여된 역할(scene/photo/buy/rest/...)을 칩 row로 노출.
 * 한 스팟이 복수 역할(scene+photo, buy+end 등)을 가질 수 있다.
 * 결제 가능(`buy`/`experience`)은 시각적으로 강조해 사용자가 한눈에 인지하게 한다.
 */
export function SpotTypeChips({
  spotTypes,
  className,
}: {
  spotTypes: HaruRouteSpotType[] | undefined;
  className?: string;
}) {
  if (!spotTypes?.length) return null;

  return (
    <div className={cn("flex flex-wrap gap-1.5", className)}>
      {spotTypes.map((type) => (
        <SpotTypeChip key={type} type={type} />
      ))}
    </div>
  );
}

function SpotTypeChip({ type }: { type: HaruRouteSpotType }) {
  const label = HARU_ROUTE_SPOT_TYPE_LABELS[type];
  const tone = SPOT_TYPE_TONE[type];

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10.5px] font-semibold whitespace-nowrap",
        tone.cls,
      )}
      title={label}
    >
      <span aria-hidden>{tone.emoji}</span>
      {label}
    </span>
  );
}

const SPOT_TYPE_TONE: Record<HaruRouteSpotType, { emoji: string; cls: string }> = {
  start: {
    emoji: "🚶",
    cls: "border-emerald-300/60 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300 dark:border-emerald-700/40",
  },
  end: {
    emoji: "🏁",
    cls: "border-slate-300/60 bg-slate-100 text-slate-700 dark:bg-slate-800/60 dark:text-slate-200 dark:border-slate-600/40",
  },
  scene: {
    emoji: "🎬",
    cls: "border-violet-300/60 bg-violet-50 text-violet-700 dark:bg-violet-950/30 dark:text-violet-300 dark:border-violet-700/40",
  },
  story: {
    emoji: "📖",
    cls: "border-indigo-300/60 bg-indigo-50 text-indigo-700 dark:bg-indigo-950/30 dark:text-indigo-300 dark:border-indigo-700/40",
  },
  photo: {
    emoji: "📸",
    cls: "border-sky-300/60 bg-sky-50 text-sky-700 dark:bg-sky-950/30 dark:text-sky-300 dark:border-sky-700/40",
  },
  rest: {
    emoji: "☕",
    cls: "border-amber-300/60 bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-300 dark:border-amber-700/40",
  },
  local: {
    emoji: "🏘",
    cls: "border-teal-300/60 bg-teal-50 text-teal-700 dark:bg-teal-950/30 dark:text-teal-300 dark:border-teal-700/40",
  },
  experience: {
    emoji: "🎟",
    cls: "border-rose-300/60 bg-rose-50 text-rose-700 dark:bg-rose-950/30 dark:text-rose-300 dark:border-rose-700/40",
  },
  buy: {
    // 결제 가능 — 가장 눈에 띄게
    emoji: "🛍",
    cls: "border-orange-400/70 bg-orange-100 text-orange-800 dark:bg-orange-950/40 dark:text-orange-200 dark:border-orange-600/50 ring-1 ring-orange-300/50",
  },
  transport: {
    emoji: "🚇",
    cls: "border-zinc-300/60 bg-zinc-100 text-zinc-700 dark:bg-zinc-800/60 dark:text-zinc-200 dark:border-zinc-600/40",
  },
};
