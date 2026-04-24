import { getLocale, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { mockTravelerTripRequests } from "@/data/mock";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { BRAND } from "@/lib/constants";
import type { BookingInterestId, BookingSupportNeedId, ServiceTypeCode } from "@/types/domain";
import { isMockGuardianId } from "@/lib/dev/mock-guardian-auth";
import { getSupabaseAuthUserIdOnly } from "@/lib/supabase/server-user";
import { getMatchRequestsForTraveler } from "@/lib/traveler-match-requests.server";
import {
  enrichMatchRowsForRequestsPage,
  matchToTimelineStatus,
  mergeEnrichmentWithGuardianFallback,
  type RequestPageRequestType,
} from "@/lib/traveler-requests-page-enrichment.server";
import { requestStatusChipClass, type RequestTimelineStatus } from "@/lib/mypage-status-badge";
import { MypageGuardianProfileSheetTrigger } from "@/components/mypage/mypage-guardian-profile-sheet-trigger";
import { listPublicGuardiansMerged } from "@/lib/guardian-public-merged.server";
import {
  getLatestApprovedPostsForGuardiansMergedBatch,
  listApprovedPostsByIdsMerged,
} from "@/lib/posts-public-merged.server";
import {
  collectRepresentativePostIds,
  postContextFromGuardianRepresentativeWithFallback,
  representativePostLinesForSheetPreviewWithFallback,
  resolveRepresentativeContentPost,
} from "@/lib/guardian-representative-post-context";
import { guardianProfileImageUrls } from "@/lib/guardian-profile-images";
import { FILL_IMAGE_AVATAR_COVER } from "@/lib/ui/fill-image";
import { Compass } from "lucide-react";

function requestTypeFromTheme(themeSlug: string): RequestPageRequestType {
  if (themeSlug.includes("night")) return "half_day";
  if (themeSlug.includes("safe")) return "consult";
  return "day";
}

const INTEREST_LABEL_KEY: Record<BookingInterestId, string> = {
  k_pop: "requestsMoodInterestKPop",
  k_drama: "requestsMoodInterestKDrama",
  k_movie: "requestsMoodInterestKMovie",
  food: "requestsMoodInterestFood",
  shopping: "requestsMoodInterestShopping",
  local_support: "requestsMoodInterestLocalSupport",
};

const SUPPORT_LABEL_KEY: Record<BookingSupportNeedId, string> = {
  transportation: "requestsMoodSupportTransportation",
  check_in: "requestsMoodSupportCheckIn",
  ordering: "requestsMoodSupportOrdering",
  local_tips: "requestsMoodSupportLocalTips",
  route_support: "requestsMoodSupportRouteSupport",
  practical_guidance: "requestsMoodSupportPracticalGuidance",
};

function formatDate(iso: string, locale: string) {
  const loc = locale === "ko" ? "ko-KR" : locale === "ja" ? "ja-JP" : "en-US";
  try {
    return new Intl.DateTimeFormat(loc, { dateStyle: "medium", timeStyle: "short" }).format(new Date(iso));
  } catch {
    return iso;
  }
}

function requestTypeLabel(t: Awaited<ReturnType<typeof getTranslations>>, type: RequestPageRequestType) {
  if (type === "half_day") return t("requestsRequestTypeHalfDay");
  if (type === "consult") return t("requestsRequestTypeConsult");
  return t("requestsRequestTypeDay");
}

function serviceLabel(t: Awaited<ReturnType<typeof getTranslations>>, code: ServiceTypeCode | null) {
  if (code === "arrival") return t("requestsServiceArrival");
  if (code === "k_route") return t("requestsServiceKRoute");
  if (code === "first_24h") return t("requestsServiceFirst24h");
  return null;
}

function moodLineFromIds(
  t: Awaited<ReturnType<typeof getTranslations>>,
  interests: BookingInterestId[],
  supports: BookingSupportNeedId[],
) {
  const parts: string[] = [];
  for (const id of interests) {
    const k = INTEREST_LABEL_KEY[id];
    if (k) parts.push(t(k as "requestsMoodInterestKPop"));
  }
  for (const id of supports) {
    const k = SUPPORT_LABEL_KEY[id];
    if (k) parts.push(t(k as "requestsMoodSupportTransportation"));
  }
  return parts.length ? parts.join(" · ") : null;
}

export async function generateMetadata() {
  const t = await getTranslations("TravelerHub");
  return { title: `${t("navRequests")} | ${BRAND.name}` };
}

type RequestCardModel = {
  id: string;
  status: RequestTimelineStatus;
  regionLine: string;
  requestType: RequestPageRequestType;
  serviceCode: ServiceTypeCode | null;
  themeSlug: string;
  titleLine: string;
  themeSubtitle: string | null;
  moodLine: string | null;
  noteSummary: string;
  guardian_user_id: string | null;
  guardian_name: string | null;
  requested_at: string;
  status_changed_at: string;
};

export default async function TravelerRequestsPage() {
  const t = await getTranslations("TravelerHub");
  const tThemes = await getTranslations("ExperienceThemes");
  const locale = await getLocale();
  const travelerId = await getSupabaseAuthUserIdOnly();
  const guardians = await listPublicGuardiansMerged();
  const useMock = !travelerId || isMockGuardianId(travelerId);
  const matchRows = travelerId && !useMock ? await getMatchRequestsForTraveler(travelerId) : [];
  const enrichMap = !useMock && matchRows.length > 0 ? await enrichMatchRowsForRequestsPage(matchRows) : new Map();

  const rows: RequestCardModel[] = useMock
    ? mockTravelerTripRequests.map((r) => {
        const themeRaw = tThemes.raw(r.theme_slug) as { title?: string; subtitle?: string } | undefined;
        const requestType = requestTypeFromTheme(r.theme_slug);
        return {
          id: r.id,
          status: r.status,
          regionLine: t(`region.${r.region_label_key}`),
          requestType,
          serviceCode: null,
          themeSlug: r.theme_slug,
          titleLine: themeRaw?.title ?? r.theme_slug,
          themeSubtitle: themeRaw?.subtitle ?? null,
          moodLine: null,
          noteSummary: r.note,
          guardian_user_id: r.guardian_user_id,
          guardian_name: r.guardian_name,
          requested_at: r.created_at,
          status_changed_at: r.created_at,
        };
      })
    : matchRows.map((m) => {
        const g = guardians.find((x) => x.user_id === m.guardian_user_id);
        const partial = enrichMap.get(m.id);
        const merged = mergeEnrichmentWithGuardianFallback(m, partial, g, {
          matchContext: t("requestsMatchContextFallback"),
        });
        const themeRaw = tThemes.raw(merged.theme_slug) as { title?: string; subtitle?: string } | undefined;
        const titleLine = themeRaw?.title ?? merged.theme_fallback_title ?? t("requestsThemeFallback");
        const themeSubtitle = themeRaw?.subtitle ?? null;
        const moodLine = moodLineFromIds(t, merged.mood_interests, merged.mood_supports);
        const regionLine = merged.region_label_key
          ? t(`region.${merged.region_label_key}`)
          : merged.region_display.trim() || t("requestsRegionUnknown");

        return {
          id: m.id,
          status: matchToTimelineStatus(m.status),
          regionLine,
          requestType: merged.request_type,
          serviceCode: merged.service_code,
          themeSlug: merged.theme_slug,
          titleLine,
          themeSubtitle,
          moodLine,
          noteSummary: merged.note_summary,
          guardian_user_id: m.guardian_user_id,
          guardian_name: m.guardian_display_name ?? g?.display_name ?? null,
          requested_at: merged.requested_at,
          status_changed_at: merged.status_changed_at,
        };
      });

  const usedGuardianIds = new Set(rows.map((r) => r.guardian_user_id).filter(Boolean) as string[]);
  const usedGuardians = guardians.filter((g) => usedGuardianIds.has(g.user_id));
  const repIds = collectRepresentativePostIds(usedGuardians);
  const repPosts = await listApprovedPostsByIdsMerged(repIds);
  const needFallbackUserIds = [
    ...new Set(usedGuardians.filter((g) => !resolveRepresentativeContentPost(g, repPosts)).map((g) => g.user_id)),
  ];
  const fallbackByUserId = await getLatestApprovedPostsForGuardiansMergedBatch(needFallbackUserIds);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-text-strong text-xl font-semibold">{t("requestsTitle")}</h2>
        <p className="text-muted-foreground mt-2 text-sm">{t("requestsLead")}</p>
      </div>
      <ul className="space-y-4">
        {rows.map((r) => {
          const g = r.guardian_user_id ? guardians.find((x) => x.user_id === r.guardian_user_id) : null;
          const avatar = g ? guardianProfileImageUrls(g).avatar : null;
          const fb = g ? (fallbackByUserId.get(g.user_id) ?? null) : null;
          const repPostLines = g ? representativePostLinesForSheetPreviewWithFallback(g, repPosts, fb) : [];
          const repCtx = g ? postContextFromGuardianRepresentativeWithFallback(g, repPosts, fb) : null;
          const fromRep = g ? resolveRepresentativeContentPost(g, repPosts) != null : false;
          const representativePostsSource =
            !g || repPostLines.length === 0 ? undefined : !fromRep && fb ? ("recent_approved" as const) : ("curated" as const);
          const svc = serviceLabel(t, r.serviceCode);
          return (
            <li key={r.id}>
              <Card className="rounded-2xl border-border/60 py-0 shadow-[var(--shadow-sm)]">
                <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0 flex-1 space-y-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge
                        variant="outline"
                        className={`rounded-full text-[11px] font-semibold ${requestStatusChipClass(r.status)}`}
                      >
                        {t(`status.${r.status}`)}
                      </Badge>
                      <span className="text-muted-foreground text-xs font-medium">{r.regionLine}</span>
                    </div>

                    <div>
                      <p className="text-text-strong text-lg font-semibold leading-snug">{r.titleLine}</p>
                      {r.themeSubtitle ? (
                        <p className="text-muted-foreground mt-1 text-sm leading-relaxed">{r.themeSubtitle}</p>
                      ) : null}
                    </div>

                    <div className="text-muted-foreground flex flex-wrap gap-x-3 gap-y-1 text-xs">
                      <span className="font-medium text-foreground/90">{requestTypeLabel(t, r.requestType)}</span>
                      {svc ? <span>{svc}</span> : null}
                    </div>

                    {r.moodLine ? (
                      <p className="text-foreground/90 text-sm leading-relaxed">
                        <span className="text-muted-foreground font-medium">{t("requestsMoodSectionLabel")}: </span>
                        {r.moodLine}
                      </p>
                    ) : null}

                    <p className="text-foreground text-sm leading-relaxed">
                      <span className="text-muted-foreground font-medium">{t("requestsMemoSummaryLabel")}: </span>
                      {r.noteSummary || t("requestsMemoEmptyHint")}
                    </p>

                    <div className="flex items-center gap-2 rounded-lg border border-border/60 bg-muted/20 px-2.5 py-2">
                      {avatar ? (
                        <div className="relative size-8 shrink-0 overflow-hidden rounded-full border border-border/50 bg-muted">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={avatar} alt="" className={`absolute inset-0 ${FILL_IMAGE_AVATAR_COVER}`} />
                        </div>
                      ) : (
                        <div className="bg-muted-foreground/20 size-8 shrink-0 rounded-full" />
                      )}
                      <div className="min-w-0">
                        <p className="text-muted-foreground text-xs">{t("assignedGuardian")}</p>
                        <p className="truncate text-sm font-medium">{g?.display_name ?? r.guardian_name ?? t("noGuardianYet")}</p>
                      </div>
                    </div>

                    <div className="text-muted-foreground space-y-0.5 border-border/50 border-t pt-3 text-xs leading-relaxed">
                      <p>
                        <span className="font-medium text-foreground/80">{t("requestsRequestedAt")}: </span>
                        {formatDate(r.requested_at, locale)}
                      </p>
                      <p>
                        <span className="font-medium text-foreground/80">{t("requestsStatusUpdated")}: </span>
                        {formatDate(r.status_changed_at, locale)}
                      </p>
                    </div>
                  </div>
                  <div className="flex shrink-0 flex-col gap-2 sm:w-44">
                    {g ? (
                      <MypageGuardianProfileSheetTrigger
                        guardian={{
                          user_id: g.user_id,
                          display_name: g.display_name,
                          headline: g.headline,
                          primary_region_slug: g.primary_region_slug,
                          guardian_tier: g.guardian_tier,
                          photo_url: g.photo_url,
                          avatar_image_url: g.avatar_image_url,
                          list_card_image_url: g.list_card_image_url,
                          detail_hero_image_url: g.detail_hero_image_url,
                          languages: g.languages,
                          long_bio: g.long_bio,
                          review_count_display: g.review_count_display,
                          avg_traveler_rating: g.avg_traveler_rating,
                          expertise_tags: g.expertise_tags,
                          companion_style_slugs: g.companion_style_slugs,
                          ...(repPostLines.length > 0
                            ? { representativePosts: repPostLines, representativePostsSource }
                            : {}),
                        }}
                        triggerLabel={t("openGuardian")}
                        postContext={repCtx}
                      />
                    ) : null}
                    <Button asChild size="sm" className="rounded-xl">
                      <Link href="/guardians" className="inline-flex items-center gap-1.5">
                        <Compass className="size-4" aria-hidden />
                        {t("findGuardian")}
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
