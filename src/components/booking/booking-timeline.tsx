import type { BookingStatusHistory } from "@/types/domain";
import { bookingStatusLabel } from "@/lib/booking-ui";
import { ScrollArea } from "@/components/ui/scroll-area";

export function BookingTimeline({ items }: { items: BookingStatusHistory[] }) {
  const sorted = [...items].sort(
    (a, b) => new Date(a.changed_at).getTime() - new Date(b.changed_at).getTime(),
  );

  return (
    <ScrollArea className="h-[220px] w-full rounded-lg border bg-card pr-3">
      <ol className="relative space-y-0 px-4 py-3">
        <span
          className="bg-border absolute top-3 bottom-3 left-[1.15rem] w-px"
          aria-hidden
        />
        {sorted.map((row) => (
          <li key={row.id} className="relative flex gap-3 pb-6 last:pb-1">
            <span
              className="bg-primary ring-background z-10 mt-1.5 size-2.5 shrink-0 rounded-full ring-4"
              aria-hidden
            />
            <div>
              <p className="text-foreground text-sm font-medium">
                {row.from_status ? (
                  <>
                    {bookingStatusLabel(row.from_status)}
                    <span className="text-muted-foreground font-normal"> → </span>
                    {bookingStatusLabel(row.to_status)}
                  </>
                ) : (
                  bookingStatusLabel(row.to_status)
                )}
              </p>
              <p className="text-muted-foreground text-xs">
                {new Date(row.changed_at).toLocaleString(undefined, {
                  dateStyle: "medium",
                  timeStyle: "short",
                })}
              </p>
              {row.note ? (
                <p className="text-muted-foreground mt-1 text-xs">{row.note}</p>
              ) : null}
            </div>
          </li>
        ))}
      </ol>
    </ScrollArea>
  );
}
