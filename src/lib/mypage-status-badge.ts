import { cn } from "@/lib/utils";

export type RequestTimelineStatus = "reviewing" | "requested" | "matched" | "completed" | "cancelled" | "declined";

export function requestStatusChipClass(status: RequestTimelineStatus): string {
  if (status === "reviewing") return cn("border-amber-500/30 bg-amber-50 text-amber-900");
  if (status === "requested") return cn("border-sky-500/30 bg-sky-50 text-sky-900");
  if (status === "matched") return cn("border-emerald-500/30 bg-emerald-50 text-emerald-900");
  if (status === "completed") return cn("border-primary/25 bg-primary/10 text-primary");
  return cn("border-rose-500/30 bg-rose-50 text-rose-900");
}

export function matchStatusChipClass(status: "requested" | "accepted" | "completed"): string {
  if (status === "requested") return requestStatusChipClass("requested");
  if (status === "accepted") return requestStatusChipClass("matched");
  return requestStatusChipClass("completed");
}
