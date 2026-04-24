import { Badge } from "@/components/ui/badge";
import type { BookingStatus } from "@/types/domain";
import { bookingStatusLabel, bookingStatusVariant } from "@/lib/booking-ui";
import { cn } from "@/lib/utils";

export function BookingStatusBadge({
  status,
  size = "default",
  className,
}: {
  status: BookingStatus;
  /** `compact` — denser ops / table styling */
  size?: "default" | "compact";
  className?: string;
}) {
  return (
    <Badge
      variant={bookingStatusVariant(status)}
      className={cn(
        size === "compact"
          ? "border-border/60 font-semibold tracking-wide uppercase ring-1 ring-border/40"
          : "font-medium capitalize",
        size === "compact" && "rounded-md px-2 py-0.5 text-[10px]",
        className,
      )}
    >
      {bookingStatusLabel(status)}
    </Badge>
  );
}
