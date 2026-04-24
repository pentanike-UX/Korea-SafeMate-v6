import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function GuardianMetricTile({
  label,
  value,
  hint,
  className,
}: {
  label: string;
  value: React.ReactNode;
  hint?: string;
  className?: string;
}) {
  return (
    <Card
      className={cn(
        "via-card overflow-hidden border-border/80 bg-gradient-to-br from-card to-[var(--brand-trust-blue-soft)]/30 shadow-[var(--shadow-sm)]",
        className,
      )}
    >
      <CardHeader className="pb-2">
        <p className="text-muted-foreground text-[11px] font-semibold uppercase tracking-wider">{label}</p>
        <div className="text-foreground text-2xl font-semibold tracking-tight tabular-nums">{value}</div>
      </CardHeader>
      {hint ? (
        <CardContent className="text-muted-foreground pt-0 text-xs leading-relaxed">{hint}</CardContent>
      ) : null}
    </Card>
  );
}
