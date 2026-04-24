import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import type { FeaturedGuardian, GuardianProfile } from "@/types/domain";
import { guardianProfileImageUrls, GUARDIAN_AVATAR_COVER_CLASS } from "@/lib/guardian-profile-images";
import { GUARDIAN_TIER_ROLE_BADGE_CLASSNAME, guardianTierBadgeVariant } from "@/lib/guardian-tier-ui";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Star } from "lucide-react";

type Props = {
  featured: FeaturedGuardian[];
  guardians: GuardianProfile[];
};

export async function FeaturedGuardiansSection({ featured, guardians }: Props) {
  const t = await getTranslations("Explore");
  const tTier = await getTranslations("GuardianTier");
  const rows = featured
    .filter((f) => f.active)
    .sort((a, b) => b.priority - a.priority)
    .map((f) => {
      const g = guardians.find((x) => x.user_id === f.guardian_user_id);
      return g ? { f, g } : null;
    })
    .filter(Boolean) as { f: FeaturedGuardian; g: GuardianProfile }[];

  if (rows.length === 0) return null;

  return (
    <section className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <div className="mb-6">
        <h2 className="text-xl font-semibold tracking-tight">{t("featuredTitle")}</h2>
        <p className="text-muted-foreground mt-1 text-sm">
          {t("featuredLead")}
          {/* TODO(prod): `featured_guardians` table + admin scheduling + disclosure labels. */}
        </p>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {rows.map(({ f, g }) => (
          <Card
            key={f.guardian_user_id}
            className="border-primary/15 scroll-mt-24 overflow-hidden shadow-sm"
            id={`guardian-${g.user_id}`}
          >
            <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex min-w-0 flex-1 gap-3 sm:gap-4">
                <div className="border-border/60 relative size-14 shrink-0 overflow-hidden rounded-full border bg-muted">
                  <Image
                    src={guardianProfileImageUrls(g).avatar}
                    alt=""
                    fill
                    className={GUARDIAN_AVATAR_COVER_CLASS}
                    sizes="56px"
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-foreground font-semibold">{g.display_name}</p>
                  <div className="mt-1.5 flex flex-wrap items-center gap-2">
                    <Badge variant={guardianTierBadgeVariant(g.guardian_tier)} className={cn(GUARDIAN_TIER_ROLE_BADGE_CLASSNAME)}>
                      {tTier(g.guardian_tier)}
                    </Badge>
                    {g.influencer_seed ? (
                      <Badge variant="secondary" className={cn(GUARDIAN_TIER_ROLE_BADGE_CLASSNAME)}>
                        {t("influencerSeed")}
                      </Badge>
                    ) : null}
                  </div>
                  <p className="text-primary mt-2 text-sm font-medium">{f.tagline}</p>
                  <div className="text-muted-foreground mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs">
                    {g.avg_traveler_rating != null ? (
                      <span className="inline-flex items-center gap-1">
                        <Star className="text-primary size-3.5 fill-current" aria-hidden />
                        {t("travelerAvgLine", { rating: g.avg_traveler_rating.toFixed(1) })}
                      </span>
                    ) : null}
                    <span>{t("posts30dOnly", { count: g.posts_approved_last_30d })}</span>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {g.expertise_tags.slice(0, 4).map((tag) => (
                      <span
                        key={tag}
                        className="bg-muted text-muted-foreground rounded-md px-2 py-0.5 text-[10px] font-medium"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
              <Button asChild variant="outline" className="mt-1 w-full shrink-0 rounded-xl sm:mt-0 sm:w-auto">
                <Link href={`/guardians#guardian-${g.user_id}`}>{t("viewProfile")}</Link>
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}
