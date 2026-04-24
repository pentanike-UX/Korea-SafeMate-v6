import { getTranslations } from "next-intl/server";
import type { ContactMethod, GuardianProfile } from "@/types/domain";
import type { GuardianDashboardSnapshot } from "@/types/guardian-dashboard";
import { mockServiceTypes } from "@/data/mock/service-types";
import { CONTACT_CHANNEL_LABELS } from "@/lib/constants";
import { regionDisplayLabelFromSlug } from "@/lib/mypage/region-label-i18n";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export async function GuardianAvailabilityContactModule({
  profile,
  snapshot,
  contacts,
}: {
  profile: GuardianProfile;
  snapshot: GuardianDashboardSnapshot;
  contacts: ContactMethod[];
}) {
  const services = mockServiceTypes.filter((s) => snapshot.supported_service_codes.includes(s.code));
  const t = await getTranslations("TravelerHub");
  const tRegion = (k: string) => t(k);
  const primaryRegionLabel = regionDisplayLabelFromSlug(profile.primary_region_slug, tRegion);
  const secondaryRegionLabels = snapshot.secondary_region_slugs.map((slug) => regionDisplayLabelFromSlug(slug, tRegion));

  return (
    <Card className="border-border/80 shadow-sm">
      <CardHeader>
        <CardTitle className="text-lg font-semibold tracking-tight">Availability & contact</CardTitle>
        <CardDescription className="text-sm leading-relaxed">
          {/* TODO(prod): Persist preferences in Supabase; verify handles out-of-band before exposing to travelers. */}
          What you publish here helps operations plan handoffs — travelers only receive details after a confirmed
          match.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6 text-sm">
        <div>
          <p className="text-muted-foreground text-xs font-semibold uppercase tracking-wide">Typical windows</p>
          {snapshot.availability_slots.length === 0 ? (
            <p className="text-muted-foreground mt-2 text-sm">No availability blocks on file (mock).</p>
          ) : (
            <ul className="mt-2 space-y-2">
              {snapshot.availability_slots.map((row) => (
                <li
                  key={`${row.day}-${row.ranges}`}
                  className="border-border/60 flex flex-wrap items-center justify-between gap-2 rounded-lg border bg-muted/10 px-3 py-2"
                >
                  <span className="text-foreground font-medium">{row.day}</span>
                  <span className="text-muted-foreground text-xs">{row.ranges}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div>
          <p className="text-muted-foreground text-xs font-semibold uppercase tracking-wide">Service regions</p>
          <p className="text-foreground mt-2">{primaryRegionLabel}</p>
          {secondaryRegionLabels.length > 0 ? (
            <p className="text-muted-foreground mt-1 text-xs">
              Secondary: {secondaryRegionLabels.join(" · ")}
            </p>
          ) : null}
        </div>

        <div>
          <p className="text-muted-foreground text-xs font-semibold uppercase tracking-wide">Supported services</p>
          <ul className="mt-2 space-y-1">
            {services.map((s) => (
              <li key={s.code} className="text-foreground text-sm">
                {s.name}
              </li>
            ))}
          </ul>
        </div>

        <div>
          <p className="text-muted-foreground text-xs font-semibold uppercase tracking-wide">
            Preferred external channels
          </p>
          {contacts.length === 0 ? (
            <p className="text-muted-foreground mt-2 text-sm">Add at least one verified channel for handoff.</p>
          ) : (
            <ul className="mt-2 space-y-2">
              {contacts.map((c) => (
                <li
                  key={c.id}
                  className="border-border/60 flex flex-wrap items-center justify-between gap-2 rounded-lg border bg-muted/10 px-3 py-2 text-sm"
                >
                  <span className="text-foreground font-medium">
                    {CONTACT_CHANNEL_LABELS[c.channel]}
                    {c.is_preferred ? (
                      <span className="text-primary ml-2 text-xs font-normal">Preferred</span>
                    ) : null}
                  </span>
                  <span className="text-muted-foreground max-w-[14rem] truncate text-xs">{c.handle}</span>
                  <span className="text-muted-foreground text-[10px]">
                    {c.verified ? "Verified" : "Unverified"}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <Button
          type="button"
          variant="outline"
          size="sm"
          className="rounded-lg"
          disabled
          title="TODO(prod): Settings form + Supabase upsert for availability & contact methods."
        >
          Update availability & channels
        </Button>
      </CardContent>
    </Card>
  );
}
