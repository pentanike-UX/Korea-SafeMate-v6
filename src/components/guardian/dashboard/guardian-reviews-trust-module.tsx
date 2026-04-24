import type { GuardianReview, TravelerReview } from "@/types/domain";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { GuardianMetricTile } from "@/components/guardian/dashboard/guardian-metric-tile";

function Stars({ rating }: { rating: number }) {
  return (
    <span className="text-amber-600 dark:text-amber-400 tabular-nums" aria-label={`${rating} of 5`}>
      {"★".repeat(rating)}
      <span className="text-muted-foreground/40">{"★".repeat(5 - rating)}</span>
    </span>
  );
}

export function GuardianReviewsTrustModule({
  avgTravelerRating,
  travelerReviews,
  guardianReviews,
  trustHealth,
  trustNote,
  openIncidents,
}: {
  avgTravelerRating: number | null;
  travelerReviews: TravelerReview[];
  guardianReviews: GuardianReview[];
  trustHealth: "strong" | "good" | "attention";
  trustNote: string;
  openIncidents: number;
}) {
  const travelerSorted = [...travelerReviews].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
  );
  const guardianSorted = [...guardianReviews].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
  );

  const healthLabel =
    trustHealth === "strong" ? "Strong" : trustHealth === "good" ? "Stable" : "Needs attention";

  return (
    <Card className="border-border/80 shadow-[var(--shadow-sm)] ring-1 ring-[color-mix(in_srgb,var(--brand-trust-blue)_18%,transparent)]">
      <CardHeader>
        <CardTitle className="text-lg font-semibold tracking-tight">Reviews & trust</CardTitle>
        <CardDescription className="text-sm leading-relaxed">
          {/* TODO(prod): Rating calculations from `traveler_reviews` / `guardian_reviews` with fraud resistance. */}
          Mutual reviews reinforce reputation; they do not automatically change matching eligibility.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-3 sm:grid-cols-3">
          <GuardianMetricTile
            label="Traveler → you (avg)"
            value={avgTravelerRating !== null ? avgTravelerRating.toFixed(1) : "—"}
            hint="TODO(prod): Weighted by recency & session count"
          />
          <GuardianMetricTile
            label="Trust health (mock)"
            value={healthLabel}
            hint="See summary below — TODO: live trust graph"
          />
          <GuardianMetricTile
            label="Open incidents"
            value={openIncidents}
            hint="Linked to bookings needing follow-up"
          />
        </div>

        <div
          className={cn(
            "rounded-xl border p-4",
            trustHealth === "attention"
              ? "border-destructive/40 bg-destructive/5"
              : "border-border/80 bg-muted/20",
          )}
        >
          <p className="text-foreground text-sm font-medium">Trust summary</p>
          <p className="text-muted-foreground mt-2 text-xs leading-relaxed">{trustNote}</p>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <div>
            <p className="text-foreground mb-3 text-sm font-semibold">Recent traveler reviews</p>
            {travelerSorted.length === 0 ? (
              <p className="text-muted-foreground text-sm">No traveler reviews yet.</p>
            ) : (
              <ul className="space-y-3">
                {travelerSorted.slice(0, 4).map((r) => (
                  <li key={r.id} className="border-border/60 rounded-lg border bg-muted/10 p-3 text-sm">
                    <div className="flex flex-wrap items-center gap-2">
                      <Stars rating={r.rating} />
                      <span className="text-muted-foreground text-xs">
                        {new Date(r.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    {r.comment ? (
                      <p className="text-muted-foreground mt-2 text-xs leading-relaxed">{r.comment}</p>
                    ) : null}
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div>
            <p className="text-foreground mb-3 text-sm font-semibold">Your reviews of travelers</p>
            {guardianSorted.length === 0 ? (
              <p className="text-muted-foreground text-sm">No mutual reviews filed yet.</p>
            ) : (
              <ul className="space-y-3">
                {guardianSorted.slice(0, 4).map((r) => (
                  <li key={r.id} className="border-border/60 rounded-lg border bg-muted/10 p-3 text-sm">
                    <div className="flex flex-wrap items-center gap-2">
                      <Stars rating={r.rating} />
                      <span className="text-muted-foreground text-xs">
                        {new Date(r.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    {r.comment ? (
                      <p className="text-muted-foreground mt-2 text-xs leading-relaxed">{r.comment}</p>
                    ) : null}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <Button
          type="button"
          variant="outline"
          size="sm"
          className="rounded-lg"
          disabled
          title="TODO(prod): Incident reporting flow + ops ticketing."
        >
          Report or escalate an issue
        </Button>
      </CardContent>
    </Card>
  );
}
