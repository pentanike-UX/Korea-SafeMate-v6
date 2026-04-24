import { cn } from "@/lib/utils";

export function GuardianProgressRow({
  label,
  current,
  target,
  suffix,
  className,
}: {
  label: string;
  current: number;
  target: number;
  suffix?: string;
  className?: string;
}) {
  const pct = target <= 0 ? 0 : Math.min(100, Math.round((current / target) * 100));
  const met = current >= target;

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex flex-wrap items-baseline justify-between gap-2 text-sm">
        <span className="text-foreground font-medium">{label}</span>
        <span className="text-muted-foreground tabular-nums">
          {current} / {target}
          {suffix ? ` ${suffix}` : ""}
          {met ? (
            <span className="text-primary ml-2 text-xs font-semibold">Met</span>
          ) : (
            <span className="ml-2 text-xs">Below target</span>
          )}
        </span>
      </div>
      <div className="bg-muted h-2 w-full overflow-hidden rounded-full">
        <div
          className={cn(
            "h-full rounded-full transition-[width] duration-500",
            met ? "bg-primary" : "bg-primary/70",
          )}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
