import { cn } from "@/lib/utils";

export type AdminOpsPillarId = "bookings" | "trust" | "content";

const STYLES: Record<
  AdminOpsPillarId,
  { bar: string; kicker: string }
> = {
  bookings: {
    bar: "bg-sky-600 dark:bg-sky-500",
    kicker: "text-sky-700 dark:text-sky-400",
  },
  trust: {
    bar: "bg-violet-600 dark:bg-violet-500",
    kicker: "text-violet-700 dark:text-violet-400",
  },
  content: {
    bar: "bg-emerald-600 dark:bg-emerald-500",
    kicker: "text-emerald-700 dark:text-emerald-400",
  },
};

export function AdminOpsPillarHeader({
  pillar,
  title,
  description,
  className,
}: {
  pillar: AdminOpsPillarId;
  title: string;
  description: string;
  className?: string;
}) {
  const s = STYLES[pillar];
  return (
    <div className={cn("flex gap-4", className)}>
      <div className={cn("mt-1 w-1 shrink-0 rounded-full", s.bar)} aria-hidden />
      <div className="min-w-0">
        <p className={cn("text-[10px] font-bold tracking-widest uppercase", s.kicker)}>{title}</p>
        <p className="text-muted-foreground mt-1 max-w-2xl text-sm leading-relaxed">{description}</p>
      </div>
    </div>
  );
}
