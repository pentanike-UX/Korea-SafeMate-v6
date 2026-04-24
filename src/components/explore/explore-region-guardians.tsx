import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import type { GuardianProfile } from "@/types/domain";
import { guardianProfileImageUrls, GUARDIAN_AVATAR_COVER_CLASS } from "@/lib/guardian-profile-images";
import { GUARDIAN_TIER_ROLE_BADGE_CLASSNAME, guardianTierBadgeVariant } from "@/lib/guardian-tier-ui";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Star } from "lucide-react";

type Props = {
  regionSlug: string;
  guardians: GuardianProfile[];
};

export async function ExploreRegionGuardians({ regionSlug, guardians }: Props) {
  const t = await getTranslations("Explore");
  const tTier = await getTranslations("GuardianTier");
  const local = guardians.filter((g) => g.primary_region_slug === regionSlug);
  if (local.length === 0) return null;

  return (
    <section className="bg-muted/20 border-y">
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <h2 className="text-xl font-semibold tracking-tight">{t("regionGuardiansTitle")}</h2>
        <p className="text-muted-foreground mt-1 text-sm">{t("regionGuardiansLead")}</p>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {local.map((g) => (
            <Card key={g.user_id} className="border-primary/10" id={`guardian-${g.user_id}`}>
              <CardHeader className="pb-2">
                <div className="flex gap-3">
                  <div className="border-border/60 relative size-12 shrink-0 overflow-hidden rounded-full border bg-muted">
                    <Image
                      src={guardianProfileImageUrls(g).avatar}
                      alt=""
                      fill
                      className={GUARDIAN_AVATAR_COVER_CLASS}
                      sizes="48px"
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <CardTitle className="text-base leading-snug">{g.display_name}</CardTitle>
                    <div className="mt-1.5 flex flex-wrap items-center gap-2">
                      <Badge variant={guardianTierBadgeVariant(g.guardian_tier)} className={cn(GUARDIAN_TIER_ROLE_BADGE_CLASSNAME)}>
                        {tTier(g.guardian_tier)}
                      </Badge>
                    </div>
                    <p className="text-muted-foreground mt-1.5 text-xs leading-snug">{g.headline}</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3 text-xs">
                <div className="text-muted-foreground flex flex-wrap gap-x-3">
                  <span>{t("posts30dOnly", { count: g.posts_approved_last_30d })}</span>
                  {g.avg_traveler_rating != null ? (
                    <span className="inline-flex items-center gap-1">
                      <Star className="text-primary size-3 fill-current" aria-hidden />
                      {g.avg_traveler_rating.toFixed(1)}
                    </span>
                  ) : null}
                </div>
                <div className="flex flex-wrap gap-1">
                  {g.expertise_tags.map((tag) => (
                    <span
                      key={tag}
                      className="bg-background rounded px-2 py-0.5 text-[10px] font-medium ring-1 ring-border"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
                <Button asChild variant="outline" size="sm" className="w-full rounded-lg">
                  <Link href={`/guardians#guardian-${g.user_id}`}>{t("fullProfile")}</Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
