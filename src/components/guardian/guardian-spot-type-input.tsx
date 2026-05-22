"use client";

import { cn } from "@/lib/utils";
import {
  HARU_ROUTE_SPOT_TYPE_LABELS,
  type HaruRouteSpotType,
} from "@/types/domain";

const ALL_TYPES: HaruRouteSpotType[] = [
  "start",
  "scene",
  "story",
  "photo",
  "rest",
  "local",
  "buy",
  "experience",
  "transport",
  "end",
];

/**
 * 스팟 유형 멀티 선택(칩 토글). 한 스팟이 복수 유형(scene+photo, buy+end 등)을 가질 수 있다.
 * `buy`/`experience`가 선택되면 결제 가능 스팟임을 시각적으로 강조.
 */
export function GuardianSpotTypeInput({
  value,
  onChange,
}: {
  value: HaruRouteSpotType[] | undefined;
  onChange: (next: HaruRouteSpotType[]) => void;
}) {
  const set = new Set(value ?? []);
  const toggle = (t: HaruRouteSpotType) => {
    const next = new Set(set);
    if (next.has(t)) next.delete(t);
    else next.add(t);
    onChange(Array.from(next));
  };

  return (
    <div className="space-y-2">
      <p className="text-[11px] font-medium text-muted-foreground">
        한 스팟이 여러 유형을 가질 수 있습니다 (예: 영상 장면 + 사진 포인트)
      </p>
      <div className="flex flex-wrap gap-1.5">
        {ALL_TYPES.map((t) => {
          const active = set.has(t);
          const isCommerce = t === "buy" || t === "experience";
          return (
            <button
              key={t}
              type="button"
              onClick={() => toggle(t)}
              aria-pressed={active}
              className={cn(
                "rounded-full border px-2.5 py-1 text-[11px] font-semibold transition-colors",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                active
                  ? isCommerce
                    ? "border-orange-500 bg-orange-500 text-white"
                    : "border-foreground bg-foreground text-background"
                  : "border-input bg-background text-foreground/70 hover:bg-muted",
              )}
            >
              {HARU_ROUTE_SPOT_TYPE_LABELS[t]}
            </button>
          );
        })}
      </div>
    </div>
  );
}
