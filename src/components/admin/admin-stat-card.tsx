import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";

export function AdminStatCard({
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
        "border-border/80 shadow-none transition-colors hover:border-border",
        className,
      )}
    >
      <div className="px-5 py-4">
        <p className="text-muted-foreground text-[11px] font-semibold tracking-wide uppercase">{label}</p>
        <p className="text-foreground mt-2 text-3xl font-semibold tracking-tight tabular-nums">{value}</p>
        {hint ? (
          <p className="text-muted-foreground mt-2 text-xs leading-relaxed">{hint}</p>
        ) : null}
      </div>
    </Card>
  );
}
