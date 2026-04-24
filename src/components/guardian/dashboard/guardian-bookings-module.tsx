import type { BookingWithDetails } from "@/types/domain";
import { CONTACT_CHANNEL_LABELS } from "@/lib/constants";
import {
  isCompletedBooking,
  isPendingPipelineBooking,
  isUpcomingBooking,
} from "@/lib/guardian-dashboard-utils";
import { BookingStatusBadge } from "@/components/booking/booking-status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

function BookingRow({ b }: { b: BookingWithDetails }) {
  return (
    <div className="space-y-2">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <p className="text-foreground font-medium">{b.service_name}</p>
          <p className="text-muted-foreground text-sm">
            {b.traveler_name} ·{" "}
            {new Date(b.requested_start).toLocaleString(undefined, {
              dateStyle: "medium",
              timeStyle: "short",
            })}
            {" · "}
            {b.party_size} traveler{b.party_size === 1 ? "" : "s"}
          </p>
        </div>
        <BookingStatusBadge status={b.status} />
      </div>
      {b.pickup_hint ? (
        <p className="text-muted-foreground text-xs">Meeting / arrival: {b.pickup_hint}</p>
      ) : null}
      {b.notes ? <p className="text-muted-foreground text-xs">Notes: {b.notes}</p> : null}
      {b.preferred_contact_channel ? (
        <p className="text-muted-foreground text-xs">
          Handoff preference: {CONTACT_CHANNEL_LABELS[b.preferred_contact_channel]}
          {b.contact_handle_hint ? ` · ${b.contact_handle_hint}` : ""}
        </p>
      ) : null}
      <div className="flex flex-wrap gap-2 pt-1">
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="rounded-lg"
          disabled
          title="TODO(prod): Live booking integration — open assignment detail drawer."
        >
          Assignment details
        </Button>
        {b.status === "issue_reported" ? (
          <Button
            type="button"
            size="sm"
            variant="secondary"
            className="rounded-lg"
            disabled
            title="TODO(prod): Escalation workflow with ops."
          >
            View incident context
          </Button>
        ) : null}
      </div>
    </div>
  );
}

export function GuardianBookingsModule({
  guardianUserId,
  assigned,
  openPool,
  matchingEnabled,
}: {
  guardianUserId: string;
  assigned: BookingWithDetails[];
  openPool: BookingWithDetails[];
  matchingEnabled: boolean;
}) {
  const now = new Date();
  const mine = assigned.filter((b) => b.guardian_user_id === guardianUserId);
  const pending = mine.filter(isPendingPipelineBooking);
  const upcoming = mine.filter((b) => isUpcomingBooking(b, now));
  const completed = mine.filter(isCompletedBooking);

  return (
    <Card className="border-border/80 shadow-sm">
      <CardHeader>
        <CardTitle className="text-lg font-semibold tracking-tight">Assignments & bookings</CardTitle>
        <CardDescription className="text-sm leading-relaxed">
          {/* TODO(prod): Live booking integration — RLS-scoped queries, real-time status, PII redaction rules. */}
          Practical support sessions you are linked to — handoff details stay limited until ops confirms match.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-8">
        <section className="space-y-4">
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-foreground text-sm font-semibold tracking-tight">Active pipeline</h3>
            <span className="text-muted-foreground text-xs">Matched · in progress · issues</span>
          </div>
          {pending.length === 0 ? (
            <p className="text-muted-foreground text-sm">No active pipeline items.</p>
          ) : (
            <div className="space-y-4">
              {pending.map((b, i) => (
                <div key={b.id}>
                  <BookingRow b={b} />
                  {i < pending.length - 1 ? <Separator className="mt-4" /> : null}
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="space-y-4">
          <h3 className="text-foreground text-sm font-semibold tracking-tight">Upcoming confirmed</h3>
          {upcoming.length === 0 ? (
            <p className="text-muted-foreground text-sm">No upcoming confirmed sessions on the calendar.</p>
          ) : (
            <div className="space-y-4">
              {upcoming.map((b, i) => (
                <div key={b.id}>
                  <BookingRow b={b} />
                  {i < upcoming.length - 1 ? <Separator className="mt-4" /> : null}
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="space-y-4">
          <h3 className="text-foreground text-sm font-semibold tracking-tight">Completed sessions</h3>
          {completed.length === 0 ? (
            <p className="text-muted-foreground text-sm">No completed sessions in this mock set.</p>
          ) : (
            <div className="space-y-4">
              {completed.map((b, i) => (
                <div key={b.id}>
                  <BookingRow b={b} />
                  {i < completed.length - 1 ? <Separator className="mt-4" /> : null}
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="space-y-4 rounded-xl border border-dashed bg-muted/15 p-4">
          <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
            <h3 className="text-foreground text-sm font-semibold tracking-tight">Open requests (ops pool)</h3>
            {!matchingEnabled ? (
              <span className="text-muted-foreground text-xs font-medium">Preview only — matching off</span>
            ) : (
              <span className="text-muted-foreground text-xs">Admin-assisted matching</span>
            )}
          </div>
          <p className="text-muted-foreground text-xs leading-relaxed">
            {/* TODO(prod): Admin review workflows — never expose raw traveler PII to ineligible guardians. */}
            Shown as a transparency preview. Production will gate pool visibility by eligibility, region fit, and
            admin rules.
          </p>
          {openPool.length === 0 ? (
            <p className="text-muted-foreground text-sm">No open requests in mock data.</p>
          ) : (
            <div className="space-y-4 pt-2">
              {openPool.map((b, i) => (
                <div key={b.id}>
                  <BookingRow b={b} />
                  {i < openPool.length - 1 ? <Separator className="mt-4" /> : null}
                </div>
              ))}
            </div>
          )}
        </section>
      </CardContent>
    </Card>
  );
}
