import { mockBookingHistory, mockBookings } from "@/data/mock";
import { AdminBookingsTable } from "@/components/admin/admin-bookings-table";
import { AdminOpsPillarHeader } from "@/components/admin/admin-ops-pillar";
import { BookingTimeline } from "@/components/booking/booking-timeline";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata = {
  title: "Bookings | Admin",
};

export default function AdminBookingsPage() {
  return (
    <div className="space-y-10">
      <div>
        <AdminOpsPillarHeader
          pillar="bookings"
          title="Booking operations"
          description="Separate from guardian tier changes and from content moderation. Lifecycle, assignment, and traveler–guardian handoff are owned here."
        />
        <h1 className="text-foreground mt-4 text-2xl font-semibold tracking-tight">Bookings</h1>
        <p className="text-muted-foreground mt-2 max-w-2xl text-sm leading-relaxed">
          {/* TODO(prod): Live booking integration — pagination, CSV export, incident linking, assignment drawer. */}
          Pipeline and audit trail (mock). Filters are client-side for UI preview only.
        </p>
      </div>

      <div>
        <h2 className="text-foreground mb-3 text-sm font-semibold tracking-tight">Pipeline</h2>
        <AdminBookingsTable bookings={mockBookings} />
      </div>

      <Card className="border-border/80 shadow-none">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold">Sample audit trail</CardTitle>
          <CardDescription className="text-xs">Booking <span className="font-mono">b1</span> · mock history</CardDescription>
        </CardHeader>
        <CardContent>
          <BookingTimeline items={mockBookingHistory} />
        </CardContent>
      </Card>
    </div>
  );
}
