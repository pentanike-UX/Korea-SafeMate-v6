import { SERVICE_SCOPE } from "@/lib/constants";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Check, Shield, X } from "lucide-react";

/** Booking-flow copy: process expectations + scope (not a tour marketplace). */
export function BookingFlowScopePanel() {
  return (
    <Card className="border-primary/15 border-t-[3px] border-t-[var(--brand-trust-blue)] bg-card/90 shadow-[var(--shadow-sm)]">
      <CardHeader className="pb-2">
        <div className="flex items-start gap-2">
          <Shield className="text-primary mt-0.5 size-5 shrink-0" aria-hidden />
          <div>
            <CardTitle className="text-base font-semibold tracking-tight">
              Trusted support — not a casual tour booking
            </CardTitle>
            <p className="text-muted-foreground mt-2 text-sm leading-relaxed">
              Every request is <span className="text-foreground font-medium">reviewed by our team</span>{" "}
              before any Guardian match. There is{" "}
              <span className="text-foreground font-medium">no instant auto-connection</span> on external
              chat — handoff details are shared only after approval and alignment on scope.
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="grid gap-6 sm:grid-cols-2">
        <div>
          <p className="text-foreground mb-2 text-xs font-semibold uppercase tracking-wide">
            In scope
          </p>
          <ul className="text-muted-foreground space-y-2 text-sm">
            {SERVICE_SCOPE.included.map((line) => (
              <li key={line} className="flex gap-2">
                <Check className="text-primary mt-0.5 size-4 shrink-0" aria-hidden />
                <span>{line}</span>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <p className="text-foreground mb-2 text-xs font-semibold uppercase tracking-wide">
            Out of scope
          </p>
          <ul className="text-muted-foreground space-y-2 text-sm">
            {SERVICE_SCOPE.excluded.map((line) => (
              <li key={line} className="flex gap-2">
                <X className="text-destructive mt-0.5 size-4 shrink-0" aria-hidden />
                <span>{line}</span>
              </li>
            ))}
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
