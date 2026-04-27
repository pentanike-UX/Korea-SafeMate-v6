import { cn } from "@/lib/utils";
import type { MoveMethod } from "@/types/haru";

/** 스팟 사이 이동 정보 커넥터 */

const METHOD_CONFIG: Record<MoveMethod, { icon: string; label: string; labelKo: string }> = {
  walk:   { icon: "🚶", label: "walk",   labelKo: "도보" },
  subway: { icon: "🚇", label: "subway", labelKo: "지하철" },
  taxi:   { icon: "🚕", label: "taxi",   labelKo: "택시" },
};

interface LegConnectorProps {
  method: MoveMethod;
  durationMin: number;
  className?: string;
}

export function LegConnector({ method, durationMin, className }: LegConnectorProps) {
  const cfg = METHOD_CONFIG[method];

  return (
    <div
      className={cn(
        // 가로 중앙에 배치, 타임라인 점선 선 위에 올라옴
        "relative flex shrink-0 flex-col items-center justify-center",
        "w-24 sm:w-28",
        className,
      )}
      aria-label={`${cfg.labelKo} ${durationMin}분`}
    >
      {/* 점선 연결선 */}
      <div
        aria-hidden
        className="absolute top-1/2 inset-x-0 h-px -translate-y-1/2 border-t-2 border-dashed border-line"
      />

      {/* 배지 (선 위에 올라옴) */}
      <div className="relative z-10 flex flex-col items-center gap-0.5 rounded-full bg-bg px-2.5 py-1.5 ring-1 ring-line shadow-[var(--shadow-sm)]">
        <span className="text-base leading-none" aria-hidden>{cfg.icon}</span>
        <span className="text-[10px] font-semibold text-ink-muted leading-none tabular-nums">
          {durationMin}분
        </span>
      </div>
    </div>
  );
}
