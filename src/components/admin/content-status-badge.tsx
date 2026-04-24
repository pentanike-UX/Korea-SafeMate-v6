import type { ContentPostStatus } from "@/types/domain";
import { cn } from "@/lib/utils";

const MAP: Record<
  ContentPostStatus,
  { label: string; className: string }
> = {
  approved: {
    label: "Approved",
    className:
      "border-emerald-600/25 bg-emerald-600/10 text-emerald-900 dark:text-emerald-100",
  },
  pending: {
    label: "Pending",
    className: "border-amber-600/30 bg-amber-600/10 text-amber-950 dark:text-amber-100",
  },
  draft: {
    label: "Draft",
    className: "border-border bg-muted text-muted-foreground",
  },
  rejected: {
    label: "Rejected",
    className: "border-destructive/30 bg-destructive/10 text-destructive",
  },
};

export function ContentStatusBadge({ status }: { status: ContentPostStatus }) {
  const m = MAP[status];
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md border px-2 py-0.5 text-[11px] font-semibold tracking-wide uppercase",
        m.className,
      )}
    >
      {m.label}
    </span>
  );
}
