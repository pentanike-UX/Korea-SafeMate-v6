import type { BookingRequestPayload } from "@/types/domain";
import { mockRegions, mockServiceTypes } from "@/data/mock";
import {
  HANDOFF_CHANNEL_OPTIONS,
  INTEREST_OPTIONS,
  SUPPORT_NEED_OPTIONS,
  TRAVELER_USER_TYPE_OPTIONS,
} from "@/lib/booking-wizard-config";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

type Props = { payload: BookingRequestPayload };

function labelInterest(id: BookingRequestPayload["interests"][number]) {
  return INTEREST_OPTIONS.find((x) => x.id === id)?.label ?? id;
}

function labelSupport(id: BookingRequestPayload["support_needs"][number]) {
  return SUPPORT_NEED_OPTIONS.find((x) => x.id === id)?.label ?? id;
}

export function BookingSummaryCard({ payload }: Props) {
  const svc = mockServiceTypes.find((s) => s.code === payload.service_code);
  const region = mockRegions.find((r) => r.slug === payload.region_slug);
  const userType = TRAVELER_USER_TYPE_OPTIONS.find((o) => o.value === payload.traveler_user_type);
  const handoff = HANDOFF_CHANNEL_OPTIONS.find((h) => h.value === payload.preferred_contact_channel);

  return (
    <Card className="border-primary/10 shadow-[var(--shadow-sm)] ring-1 ring-[color-mix(in_srgb,var(--brand-primary)_10%,transparent)]">
      <CardHeader>
        <CardTitle className="text-lg">Request summary</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 text-sm">
        <div className="grid gap-1">
          <p className="text-muted-foreground text-xs uppercase tracking-wide">Service</p>
          <p className="font-medium">{svc?.name ?? payload.service_code}</p>
        </div>
        <Separator />
        <div className="grid gap-1 sm:grid-cols-2">
          <div>
            <p className="text-muted-foreground text-xs uppercase tracking-wide">Traveler</p>
            <p className="font-medium">{userType?.label}</p>
          </div>
          <div>
            <p className="text-muted-foreground text-xs uppercase tracking-wide">Region</p>
            <p className="font-medium">{region?.name ?? payload.region_slug}</p>
          </div>
        </div>
        <div className="grid gap-1 sm:grid-cols-2">
          <div>
            <p className="text-muted-foreground text-xs uppercase tracking-wide">When</p>
            <p className="font-medium">
              {payload.requested_date} · {payload.requested_time} (KST)
            </p>
          </div>
          <div>
            <p className="text-muted-foreground text-xs uppercase tracking-wide">Party & language</p>
            <p className="font-medium">
              {payload.traveler_count} traveler(s) · {payload.preferred_language}
            </p>
          </div>
        </div>
        <div>
          <p className="text-muted-foreground text-xs uppercase tracking-wide">First time in Korea</p>
          <p className="font-medium">{payload.first_time_in_korea ? "Yes" : "No"}</p>
        </div>
        <Separator />
        <div>
          <p className="text-muted-foreground text-xs uppercase tracking-wide">Meeting / arrival</p>
          <p className="leading-relaxed">{payload.meeting_point}</p>
        </div>
        <div>
          <p className="text-muted-foreground text-xs uppercase tracking-wide">Stay area</p>
          <p className="leading-relaxed">{payload.accommodation_area}</p>
        </div>
        {payload.interests.length > 0 ? (
          <div>
            <p className="text-muted-foreground text-xs uppercase tracking-wide">Interests</p>
            <p className="mt-1">{payload.interests.map(labelInterest).join(" · ")}</p>
          </div>
        ) : null}
        <div>
          <p className="text-muted-foreground text-xs uppercase tracking-wide">Support needs</p>
          <p className="mt-1">{payload.support_needs.map(labelSupport).join(" · ")}</p>
        </div>
        {payload.special_requests ? (
          <div>
            <p className="text-muted-foreground text-xs uppercase tracking-wide">Special requests</p>
            <p className="text-muted-foreground mt-1 leading-relaxed">{payload.special_requests}</p>
          </div>
        ) : null}
        <Separator />
        <div className="grid gap-1 sm:grid-cols-2">
          <div>
            <p className="text-muted-foreground text-xs uppercase tracking-wide">Contact</p>
            <p className="font-medium">{payload.guest_name}</p>
            <p className="text-muted-foreground text-xs">{payload.guest_email}</p>
          </div>
          <div>
            <p className="text-muted-foreground text-xs uppercase tracking-wide">Handoff channel</p>
            <p className="font-medium">{handoff?.label}</p>
            <p className="text-muted-foreground font-mono text-xs">{payload.contact_handle}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
