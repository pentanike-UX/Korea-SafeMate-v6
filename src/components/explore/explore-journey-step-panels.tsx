"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { mockContentPosts } from "@/data/mock";
import type { ContentPost } from "@/types/domain";
import type { LaunchAreaSlug } from "@/types/launch-area";
import { getPostHeroImageUrl, postHasRouteJourney } from "@/lib/content-post-route";
import {
  exploreCompareCardKeys,
  exploreTopPickBulletKeys,
  type ExploreFitLineKey,
} from "@/lib/explore-guardian-fit-line";
import { formatDecisionInterpretLine } from "@/lib/explore-decision-interpret";
import type { PublicGuardian } from "@/lib/guardian-public";
import { listCardActionButtonClass } from "@/components/ui/action-variants";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { TrustBadgeRow } from "@/components/forty-two/trust-badges";
import { GuardianProfilePreviewSheetTrigger } from "@/components/guardians/guardian-profile-preview-sheet-trigger";
import { GuardianRequestOpenTrigger } from "@/components/guardians/guardian-request-sheet";
import {
  postContextFromGuardianRepresentative,
  representativePostLinesForSheetPreview,
} from "@/lib/guardian-representative-post-context";
import { SaveGuardianButton } from "@/components/guardians/save-guardian-button";
import { PostPreviewSheetPanel } from "@/components/posts/post-preview-sheet";
import { publicGuardianToSheetPreview } from "@/lib/guardian-profile-sheet-preview";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { guardianProfileImageUrls, GUARDIAN_AVATAR_COVER_CLASS } from "@/lib/guardian-profile-images";
import { FILL_IMAGE_EXPLORE_TOP_PICK } from "@/lib/ui/fill-image";
import { postCompactThumbCoverClass } from "@/lib/post-image-crop";
import { GUARDIAN_TIER_ROLE_BADGE_CLASSNAME, guardianTierBadgeVariant } from "@/lib/guardian-tier-ui";
import type { LucideIcon } from "lucide-react";
import {
  CalendarDays,
  Camera,
  ChevronRight,
  Coffee,
  Compass,
  Heart,
  Landmark,
  Languages,
  MapPin,
  Moon,
  Sparkles,
  UserRound,
  Users,
  UsersRound,
  Wind,
  Zap,
} from "lucide-react";
import {
  EXPLORE_ARTIST_SUGGESTIONS,
  EXPLORE_WORK_SUGGESTIONS,
  GUARDIAN_STYLE_IDS,
  SCENE_MOOD_IDS,
  type GuardianStyleId,
  type PartySize,
  type SceneMoodId,
  type TripWhenPreset,
} from "./explore-journey-data";

type LangPref = "en" | "ko" | "ja" | "any";
type Pace = "calm" | "balanced" | "packed";

function selectCardClass(selected: boolean) {
  return cn(
    "rounded-2xl border p-4 text-left transition-all",
    selected
      ? "border-primary bg-primary/8 ring-primary/25 shadow-[var(--shadow-sm)] ring-2"
      : "border-border/80 bg-card hover:border-primary/30 hover:shadow-[var(--shadow-sm)]",
  );
}

export function ExploreTripSetupStep({
  days,
  setDays,
  tripWhenPreset,
  setTripWhenPreset,
  tripCustomDate,
  setTripCustomDate,
  partySize,
  setPartySize,
  pace,
  setPace,
  langPref,
  setLangPref,
}: {
  days: string;
  setDays: (d: string) => void;
  tripWhenPreset: TripWhenPreset | null;
  setTripWhenPreset: (v: TripWhenPreset | null) => void;
  tripCustomDate: string;
  setTripCustomDate: (v: string) => void;
  partySize: PartySize;
  setPartySize: (v: PartySize) => void;
  pace: Pace;
  setPace: (v: Pace) => void;
  langPref: LangPref;
  setLangPref: (v: LangPref) => void;
}) {
  const t = useTranslations("ExploreJourney");
  const [langSheetOpen, setLangSheetOpen] = useState(false);

  const whenOptions: { id: TripWhenPreset; icon: typeof CalendarDays }[] = [
    { id: "weekend", icon: CalendarDays },
    { id: "next_week", icon: CalendarDays },
    { id: "two_weeks", icon: CalendarDays },
    { id: "flex", icon: Compass },
  ];

  const partyOptions: { id: PartySize; icon: LucideIcon }[] = [
    { id: "solo", icon: UserRound },
    { id: "two", icon: Users },
    { id: "small", icon: UsersRound },
    { id: "group", icon: Users },
  ];

  const paceOptions: { id: Pace; icon: typeof Coffee }[] = [
    { id: "calm", icon: Coffee },
    { id: "balanced", icon: Sparkles },
    { id: "packed", icon: Zap },
  ];

  const langPrimary: { id: LangPref; flag: string }[] = [
    { id: "ko", flag: "KO" },
    { id: "en", flag: "EN" },
    { id: "ja", flag: "JA" },
    { id: "any", flag: "∞" },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div>
        <p className="text-primary text-[11px] font-semibold tracking-[0.18em] uppercase">{t("tripSetupEyebrow")}</p>
        <h2 className="text-text-strong mt-2 text-xl font-semibold sm:text-2xl">{t("tripSetupTitle")}</h2>
        <p className="text-muted-foreground mt-2 max-w-xl text-sm leading-relaxed">{t("tripSetupSubtitle")}</p>
      </div>

      <Card className="border-border/70 overflow-hidden rounded-[1.35rem] shadow-[var(--shadow-sm)]">
        <CardContent className="space-y-10 p-5 sm:p-8">
          {/* When */}
          <section className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="bg-primary/10 text-primary flex size-9 items-center justify-center rounded-xl">
                <CalendarDays className="size-[18px]" strokeWidth={1.75} />
              </div>
              <div>
                <h3 className="text-foreground font-semibold">{t("tripWhenSection")}</h3>
                <p className="text-muted-foreground text-xs">{t("tripWhenHint")}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {whenOptions.map(({ id, icon: Icon }) => {
                const selected = tripWhenPreset === id;
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setTripWhenPreset(selected ? null : id)}
                    className={selectCardClass(selected)}
                  >
                    <Icon className="text-muted-foreground mb-2 size-5" strokeWidth={1.5} />
                    <p className="text-foreground text-sm font-semibold">{t(`tripWhen_${id}` as "tripWhen_weekend")}</p>
                  </button>
                );
              })}
            </div>
            <div className="border-border/60 bg-muted/25 rounded-2xl border border-dashed p-4">
              <label htmlFor="explore-trip-date" className="text-muted-foreground text-xs font-medium">
                {t("tripDateOptional")}
              </label>
              <input
                id="explore-trip-date"
                type="date"
                value={tripCustomDate}
                onChange={(e) => setTripCustomDate(e.target.value)}
                className="border-input bg-background text-foreground mt-2 w-full max-w-xs rounded-xl border px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
              />
            </div>
          </section>

          {/* Trip length */}
          <section className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="bg-primary/10 text-primary flex size-9 items-center justify-center rounded-xl">
                <MapPin className="size-[18px]" strokeWidth={1.75} />
              </div>
              <h3 className="text-foreground font-semibold">{t("tripLengthSection")}</h3>
            </div>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
              {(["1", "2", "3"] as const).map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => setDays(d)}
                  className={selectCardClass(days === d)}
                >
                  <p className="text-foreground font-semibold">{t(`tripDays${d}` as "tripDays1")}</p>
                  <p className="text-muted-foreground mt-1 text-xs">{t(`tripDaysHint_${d}` as "tripDaysHint_1")}</p>
                </button>
              ))}
            </div>
          </section>

          {/* Party */}
          <section className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="bg-primary/10 text-primary flex size-9 items-center justify-center rounded-xl">
                <UsersRound className="size-[18px]" strokeWidth={1.75} />
              </div>
              <h3 className="text-foreground font-semibold">{t("partySection")}</h3>
            </div>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {partyOptions.map(({ id, icon: Icon }) => (
                <button key={id} type="button" onClick={() => setPartySize(id)} className={selectCardClass(partySize === id)}>
                  <Icon className="text-primary mb-2 size-6" strokeWidth={1.5} />
                  <p className="text-foreground text-sm font-semibold">{t(`party_${id}` as "party_solo")}</p>
                  <p className="text-muted-foreground mt-0.5 text-[11px] leading-snug">{t(`party_${id}_hint` as "party_solo_hint")}</p>
                </button>
              ))}
            </div>
          </section>

          {/* Pace */}
          <section className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="bg-primary/10 text-primary flex size-9 items-center justify-center rounded-xl">
                <Compass className="size-[18px]" strokeWidth={1.75} />
              </div>
              <h3 className="text-foreground font-semibold">{t("paceSection")}</h3>
            </div>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
              {paceOptions.map(({ id, icon: Icon }) => (
                <button key={id} type="button" onClick={() => setPace(id)} className={selectCardClass(pace === id)}>
                  <div className="mb-2 flex items-center gap-2">
                    <Icon className="text-muted-foreground size-5" strokeWidth={1.5} />
                    <span className="text-foreground font-semibold">
                      {id === "calm" ? t("paceCalm") : id === "balanced" ? t("paceBalanced") : t("pacePacked")}
                    </span>
                  </div>
                  <p className="text-muted-foreground text-xs leading-relaxed">{t(`paceHint_${id}` as "paceHint_calm")}</p>
                </button>
              ))}
            </div>
          </section>

          {/* Language */}
          <section className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <div className="bg-primary/10 text-primary flex size-9 items-center justify-center rounded-xl">
                  <Languages className="size-[18px]" strokeWidth={1.75} />
                </div>
                <h3 className="text-foreground font-semibold">{t("langSection")}</h3>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="sm:hidden rounded-full text-xs"
                onClick={() => setLangSheetOpen(true)}
              >
                {t("langMore")}
                <ChevronRight className="size-3.5 opacity-70" />
              </Button>
            </div>
            <Sheet open={langSheetOpen} onOpenChange={setLangSheetOpen}>
              <SheetContent side="bottom" className="rounded-t-3xl">
                <SheetHeader>
                  <SheetTitle>{t("langSheetTitle")}</SheetTitle>
                </SheetHeader>
                <p className="text-muted-foreground mt-3 text-sm leading-relaxed">{t("langMoreHint")}</p>
                <p className="text-muted-foreground mt-2 text-xs">{t("langMoreFootnote")}</p>
              </SheetContent>
            </Sheet>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {langPrimary.map(({ id, flag }) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setLangPref(id)}
                  className={cn(selectCardClass(langPref === id), "flex flex-col items-start")}
                >
                  <span className="text-muted-foreground font-mono text-[10px] font-bold tracking-wider">{flag}</span>
                  <span className="text-foreground mt-1 text-sm font-semibold">
                    {id === "any" ? t("langAny") : id.toUpperCase()}
                  </span>
                </button>
              ))}
            </div>
            <div className="hidden sm:block">
              <button
                type="button"
                onClick={() => setLangSheetOpen(true)}
                className="text-primary text-xs font-semibold underline decoration-[color-mix(in_srgb,var(--brand-primary)_40%,transparent)] decoration-2 underline-offset-[5px] transition-colors hover:decoration-[var(--brand-primary)]"
              >
                {t("langMore")}
              </button>
              <p className="text-muted-foreground mt-2 text-xs leading-relaxed">{t("langMoreHint")}</p>
            </div>
          </section>
        </CardContent>
      </Card>
    </div>
  );
}

const SCENE_ICONS: Record<SceneMoodId, typeof Moon> = {
  scene_neon: Moon,
  scene_hanok: Landmark,
  scene_cafe: Coffee,
  scene_photo: Camera,
  scene_quiet: Wind,
  scene_romantic: Heart,
};

const STYLE_ICONS: Record<GuardianStyleId, LucideIcon> = {
  style_calm: Coffee,
  style_planner: Compass,
  style_energetic: Zap,
  style_trendy: Sparkles,
  style_flexible: UsersRound,
  style_no_match_test: UsersRound,
};

export function ExploreTasteBuilderStep(props: {
  workQuery: string;
  setWorkQuery: (v: string) => void;
  workTokens: string[];
  addWorkToken: (v: string) => void;
  removeWorkToken: (v: string) => void;
  artistQuery: string;
  setArtistQuery: (v: string) => void;
  artistTokens: string[];
  addArtistToken: (v: string) => void;
  removeArtistToken: (v: string) => void;
  sceneMoods: SceneMoodId[];
  toggleSceneMood: (id: SceneMoodId) => void;
  guardianStylePrefs: GuardianStyleId[];
  toggleGuardianStyle: (id: GuardianStyleId) => void;
  locale: string;
}) {
  const t = useTranslations("ExploreJourney");
  const {
    workQuery,
    setWorkQuery,
    workTokens,
    addWorkToken,
    removeWorkToken,
    artistQuery,
    setArtistQuery,
    artistTokens,
    addArtistToken,
    removeArtistToken,
    sceneMoods,
    toggleSceneMood,
    guardianStylePrefs,
    toggleGuardianStyle,
    locale,
  } = props;

  const workList = EXPLORE_WORK_SUGGESTIONS[locale] ?? EXPLORE_WORK_SUGGESTIONS.en;
  const artistList = EXPLORE_ARTIST_SUGGESTIONS[locale] ?? EXPLORE_ARTIST_SUGGESTIONS.en;

  const workFiltered = useMemo(() => {
    const q = workQuery.trim().toLowerCase();
    if (!q) return workList.slice(0, 6);
    return workList.filter((w) => w.toLowerCase().includes(q)).slice(0, 8);
  }, [workList, workQuery]);

  const artistFiltered = useMemo(() => {
    const q = artistQuery.trim().toLowerCase();
    if (!q) return artistList.slice(0, 6);
    return artistList.filter((w) => w.toLowerCase().includes(q)).slice(0, 8);
  }, [artistList, artistQuery]);

  function tryAddWork() {
    const q = workQuery.trim();
    if (q && !workTokens.includes(q)) addWorkToken(q);
    setWorkQuery("");
  }

  function tryAddArtist() {
    const q = artistQuery.trim();
    if (q && !artistTokens.includes(q)) addArtistToken(q);
    setArtistQuery("");
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div>
        <p className="text-primary text-[11px] font-semibold tracking-[0.18em] uppercase">{t("tasteBuilderEyebrow")}</p>
        <h2 className="text-text-strong mt-2 text-xl font-semibold sm:text-2xl">{t("tasteBuilderTitle")}</h2>
        <p className="text-muted-foreground mt-2 max-w-xl text-sm leading-relaxed">{t("tasteBuilderSubtitle")}</p>
      </div>

      <Card className="border-border/70 overflow-hidden rounded-[1.35rem] shadow-[var(--shadow-sm)]">
        <CardContent className="space-y-10 p-5 sm:p-8">
          {/* Works */}
          <section className="space-y-3">
            <h3 className="text-foreground font-semibold">{t("tasteWorksSection")}</h3>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Input
                value={workQuery}
                onChange={(e) => setWorkQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), tryAddWork())}
                placeholder={t("tasteWorksPlaceholder")}
                className="h-11 flex-1 rounded-xl"
              />
              <Button type="button" className="rounded-xl sm:w-auto" onClick={tryAddWork}>
                {t("tasteAdd")}
              </Button>
            </div>
            {workTokens.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {workTokens.map((w) => (
                  <button
                    key={w}
                    type="button"
                    onClick={() => removeWorkToken(w)}
                    className="bg-primary/12 text-primary border-primary/20 hover:bg-primary/18 rounded-full border px-3 py-1 text-xs font-medium transition-colors"
                  >
                    {w} ×
                  </button>
                ))}
              </div>
            ) : null}
            <p className="text-muted-foreground text-[11px] font-medium uppercase tracking-wide">{t("tasteSuggestions")}</p>
            <div className="flex flex-wrap gap-2">
              {workFiltered.map((w) => (
                <button
                  key={w}
                  type="button"
                  disabled={workTokens.includes(w)}
                  onClick={() => addWorkToken(w)}
                  className={cn(
                    "rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
                    workTokens.includes(w)
                      ? "border-transparent bg-muted text-muted-foreground cursor-default"
                      : "border-border/80 bg-card cursor-pointer hover:border-primary/40 hover:bg-muted/50",
                  )}
                >
                  {w}
                </button>
              ))}
            </div>
          </section>

          {/* Artists */}
          <section className="space-y-3">
            <h3 className="text-foreground font-semibold">{t("tasteArtistsSection")}</h3>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Input
                value={artistQuery}
                onChange={(e) => setArtistQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), tryAddArtist())}
                placeholder={t("tasteArtistsPlaceholder")}
                className="h-11 flex-1 rounded-xl"
              />
              <Button type="button" className="rounded-xl sm:w-auto" onClick={tryAddArtist}>
                {t("tasteAdd")}
              </Button>
            </div>
            {artistTokens.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {artistTokens.map((w) => (
                  <button
                    key={w}
                    type="button"
                    onClick={() => removeArtistToken(w)}
                    className="bg-primary/12 text-primary border-primary/20 hover:bg-primary/18 rounded-full border px-3 py-1 text-xs font-medium transition-colors"
                  >
                    {w} ×
                  </button>
                ))}
              </div>
            ) : null}
            <div className="flex flex-wrap gap-2">
              {artistFiltered.map((w) => (
                <button
                  key={w}
                  type="button"
                  disabled={artistTokens.includes(w)}
                  onClick={() => addArtistToken(w)}
                  className={cn(
                    "rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
                    artistTokens.includes(w)
                      ? "border-transparent bg-muted text-muted-foreground cursor-default"
                      : "border-border/80 bg-card cursor-pointer hover:border-primary/40 hover:bg-muted/50",
                  )}
                >
                  {w}
                </button>
              ))}
            </div>
          </section>

          {/* Scene moods */}
          <section className="space-y-4">
            <h3 className="text-foreground font-semibold">{t("tasteSceneSection")}</h3>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {SCENE_MOOD_IDS.map((id) => {
                const Icon = SCENE_ICONS[id];
                const on = sceneMoods.includes(id);
                return (
                  <button key={id} type="button" onClick={() => toggleSceneMood(id)} className={selectCardClass(on)}>
                    <Icon className="text-muted-foreground mb-2 size-5" strokeWidth={1.5} />
                    <p className="text-foreground text-sm font-semibold">{t(`moodScene_${id.replace(/^scene_/, "")}` as "moodScene_neon")}</p>
                    <p className="text-muted-foreground mt-1 text-xs leading-relaxed">
                      {t(`moodScene_${id.replace(/^scene_/, "")}_hint` as "moodScene_neon_hint")}
                    </p>
                  </button>
                );
              })}
            </div>
          </section>

          {/* Guardian style */}
          <section className="space-y-4">
            <h3 className="text-foreground font-semibold">{t("tasteGuardianStyleSection")}</h3>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {GUARDIAN_STYLE_IDS.map((id) => {
                const Icon = STYLE_ICONS[id];
                const on = guardianStylePrefs.includes(id);
                return (
                  <button key={id} type="button" onClick={() => toggleGuardianStyle(id)} className={selectCardClass(on)}>
                    <Icon className="text-primary mb-2 size-5" strokeWidth={1.5} />
                    <p className="text-foreground text-sm font-semibold">{t(`moodStyle_${id.replace(/^style_/, "")}` as "moodStyle_calm")}</p>
                    <p className="text-muted-foreground mt-1 text-xs leading-relaxed">
                      {t(`moodStyle_${id.replace(/^style_/, "")}_hint` as "moodStyle_calm_hint")}
                    </p>
                  </button>
                );
              })}
            </div>
          </section>
        </CardContent>
      </Card>
    </div>
  );
}

function guardianLangsLine(g: PublicGuardian): string {
  return g.languages.map((l) => l.language_code.toUpperCase()).join(" · ");
}

function translateExploreFitLine(t: ReturnType<typeof useTranslations<"ExploreJourney">>, key: ExploreFitLineKey): string {
  switch (key) {
    case "fitLineKpop":
      return t("fitLineKpop");
    case "fitLineGwanghwamun":
      return t("fitLineGwanghwamun");
    case "fitLineFirstVisit":
      return t("fitLineFirstVisit");
    case "fitLinePhoto":
      return t("fitLinePhoto");
    case "fitLineWalking":
    default:
      return t("fitLineWalking");
  }
}

/** 결과 화면용 소형 포스트 카드 — 시트로 미리보기 */
function ExploreJourneyPostCompactCard({
  post,
  routeBadgeLabel,
}: {
  post: ContentPost;
  routeBadgeLabel: string;
}) {
  const [open, setOpen] = useState(false);
  const [side, setSide] = useState<"right" | "bottom">("bottom");
  const cover = getPostHeroImageUrl(post);
  const isRoute = postHasRouteJourney(post);

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)");
    const sync = () => setSide(mq.matches ? "right" : "bottom");
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="border-border/60 bg-muted/15 group flex w-full max-w-full gap-2.5 overflow-hidden rounded-xl border text-left transition-colors hover:border-primary/25 hover:bg-muted/25"
      >
        <div className="relative h-[4.25rem] w-[5.25rem] shrink-0 overflow-hidden bg-muted sm:h-[4.5rem] sm:w-[5.75rem]">
          {cover ? (
            <Image
              src={cover}
              alt=""
              fill
              className={cn(postCompactThumbCoverClass(post), "transition-transform duration-300 group-hover:scale-[1.03]")}
              sizes="96px"
            />
          ) : null}
        </div>
        <div className="flex min-w-0 flex-1 flex-col justify-center py-1.5 pr-2">
          {isRoute ? (
            <Badge variant="outline" className="mb-0.5 w-fit rounded-full px-1.5 py-0 text-[9px] font-semibold">
              {routeBadgeLabel}
            </Badge>
          ) : null}
          <p className="text-foreground line-clamp-2 text-xs font-semibold leading-snug">{post.title}</p>
        </div>
      </button>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side={side} className={side === "right" ? "sm:max-w-md" : "max-h-[86vh] rounded-t-2xl"}>
          <PostPreviewSheetPanel post={post} onNavigate={() => setOpen(false)} />
        </SheetContent>
      </Sheet>
    </>
  );
}

export function ExploreResultsDashboard(props: {
  comingSoonArea: boolean;
  results: { guardians: PublicGuardian[]; posts: ContentPost[] };
  region: LaunchAreaSlug | "";
  theme: string;
  days: string;
  partySize: PartySize;
  pace: Pace;
  langPref: LangPref;
  tripWhenPreset: TripWhenPreset | null;
  tripCustomDate: string;
  workTokens: string[];
  artistTokens: string[];
  sceneMoods: SceneMoodId[];
  guardianStylePrefs: GuardianStyleId[];
  onEditConditions: () => void;
  onReRecommend: () => void;
  resultsSpinDisabled: boolean;
}) {
  const t = useTranslations("ExploreJourney");
  const tLaunch = useTranslations("LaunchAreas");
  const tThemes = useTranslations("ExperienceThemes");
  const tG = useTranslations("GuardiansDiscover");
  const tHub = useTranslations("TravelerHub");
  const tTier = useTranslations("GuardianTier");
  const tStyles = useTranslations("CompanionStyles");
  const [postsSheetOpen, setPostsSheetOpen] = useState(false);

  const { comingSoonArea, results, region, theme, pace, days, partySize, onEditConditions, onReRecommend, resultsSpinDisabled } =
    props;

  const featured = results.guardians[0];
  const more = results.guardians.slice(1);
  const topPosts = results.posts.slice(0, 3);
  const extraPosts = results.posts.slice(3);
  const featuredRepCtx = featured ? postContextFromGuardianRepresentative(featured, mockContentPosts) : null;

  const interpretLine = useMemo(
    () => formatDecisionInterpretLine(t, tLaunch, tThemes, { region, theme, days, partySize, pace }),
    [t, tLaunch, tThemes, region, theme, days, partySize, pace],
  );

  const basisBulletKeys = useMemo(() => exploreTopPickBulletKeys(region, theme, pace), [region, theme, pace]);

  const themeTitleForUi = useMemo(() => {
    if (!theme) return t("dashThemeAny");
    try {
      return (tThemes.raw(theme) as { title: string }).title;
    } catch (err) {
      return t("dashThemeAny");
    }
  }, [t, tThemes, theme]);

  return (
    <div className="animate-in fade-in space-y-8 duration-300">
      {comingSoonArea ? (
        <Card className="border-dashed rounded-[1.35rem]">
          <CardContent className="p-8 text-center">
            <p className="text-muted-foreground text-sm leading-relaxed">{t("comingSoonRegion")}</p>
            <Button asChild className={cn(listCardActionButtonClass, "mt-6 px-6")}>
              <Link href="/guardians">{tG("browseGuardiansDirectory")}</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          {results.guardians.length === 0 ? (
            <div className="border-border/60 rounded-[1.35rem] border border-dashed bg-muted/10 p-10 text-center">
              <p className="text-foreground text-sm font-semibold">{tG("empty")}</p>
              <p className="text-muted-foreground mt-2 text-sm leading-relaxed">{tG("emptyBody")}</p>
              <div className="mt-5 flex flex-col items-stretch justify-center gap-2 min-[360px]:flex-row min-[360px]:flex-wrap min-[360px]:items-center min-[360px]:gap-2.5">
                <Button type="button" variant="outline" className={listCardActionButtonClass} onClick={onEditConditions}>
                  {t("editConditions")}
                </Button>
                <Button type="button" variant="ghost" className={listCardActionButtonClass} onClick={onReRecommend}>
                  {t("reset")}
                </Button>
                <Button asChild className={listCardActionButtonClass}>
                  <Link href="/guardians">{t("btnGuardiansFirst")}</Link>
                </Button>
              </div>
            </div>
          ) : (
            <>
              {/* Featured */}
              {featured ? (
                <section className="space-y-3">
                  <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
                    <h3 className="text-text-strong text-xl font-bold tracking-tight">{t("dashFeaturedTitle")}</h3>
                    <p className="text-primary text-xs font-semibold">{t("dashTopPickHint")}</p>
                  </div>
                  <Card className="border-primary/40 from-primary/[0.11] ring-primary/20 overflow-hidden rounded-[1.5rem] border-2 bg-gradient-to-br to-card shadow-[var(--shadow-xl)] ring-2">
                    <CardContent className="p-0">
                      <div className="flex flex-col lg:flex-row">
                        <div className="relative aspect-[3/4] w-full min-h-0 overflow-hidden bg-muted max-[1023px]:max-h-[min(88vw,26rem)] sm:aspect-[5/4] lg:aspect-auto lg:min-h-[320px] lg:max-w-[320px] lg:shrink-0">
                          <Image
                            src={guardianProfileImageUrls(featured).landscape}
                            alt=""
                            fill
                            className={FILL_IMAGE_EXPLORE_TOP_PICK}
                            sizes="(max-width:1024px) 100vw, 320px"
                          />
                          <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-1/3 bg-gradient-to-b from-transparent to-card/60" />
                          <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
                            <Badge className="rounded-full bg-amber-500 px-2.5 py-1 text-[10px] font-bold text-white shadow-md">
                              {t("dashRankBadge")}
                            </Badge>
                            <Badge className="rounded-full bg-card/95 text-[10px] font-bold text-[var(--brand-primary)] shadow-sm backdrop-blur-sm">
                              {t("dashMatchBadge")}
                            </Badge>
                          </div>
                        </div>
                        <div className="flex flex-1 flex-col justify-center gap-5 p-5 sm:p-7">
                          <div>
                            <span className="text-text-strong text-xl font-bold tracking-tight">{featured.display_name}</span>
                            <div className="border-border/50 mt-3 flex flex-wrap gap-2 border-b pb-3">
                              <Badge
                                variant={guardianTierBadgeVariant(featured.guardian_tier)}
                                className={cn(GUARDIAN_TIER_ROLE_BADGE_CLASSNAME)}
                              >
                                {tTier(featured.guardian_tier)}
                              </Badge>
                              <Badge variant="outline" className="rounded-full text-[10px] font-medium">
                                {(() => {
                                  try {
                                    return (tLaunch.raw(featured.launch_area_slug) as { name: string }).name;
                                  } catch {
                                    return featured.launch_area_slug;
                                  }
                                })()}
                              </Badge>
                              <Badge variant="outline" className="rounded-full font-mono text-[10px] font-medium">
                                {guardianLangsLine(featured)}
                              </Badge>
                              {featured.companion_style_slugs.slice(0, 2).map((slug) => (
                                <Badge key={slug} variant="secondary" className="rounded-full text-[10px] font-medium">
                                  {tStyles(slug)}
                                </Badge>
                              ))}
                            </div>
                            <p className="text-muted-foreground mt-3 text-[11px] leading-relaxed">
                              {t("dashCardMatchLine", {
                                area: (() => {
                                  try {
                                    return (tLaunch.raw(featured.launch_area_slug) as { name: string }).name;
                                  } catch {
                                    return featured.launch_area_slug;
                                  }
                                })(),
                                theme: themeTitleForUi,
                                langs: guardianLangsLine(featured),
                              })}
                            </p>
                            <div className="border-primary/25 bg-primary/5 mt-4 rounded-xl border px-3 py-3 sm:px-4 sm:py-3.5">
                              <p className="text-primary text-[10px] font-bold tracking-wide uppercase">{t("dashTopWhyTitle")}</p>
                              <ul className="mt-2 space-y-2">
                                {basisBulletKeys.map((key) => (
                                  <li key={key} className="text-foreground flex gap-2 text-sm font-medium leading-snug">
                                    <span className="text-primary shrink-0 font-bold" aria-hidden>
                                      ·
                                    </span>
                                    <span>{translateExploreFitLine(t, key)}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                            <TrustBadgeRow ids={featured.trust_badge_ids} className="mt-3" size="sm" />
                            <p className="text-muted-foreground mt-2 text-[11px] leading-relaxed">{t("dashTrustMetaNote")}</p>
                          </div>
                          <div className="flex flex-col gap-2">
                            <GuardianRequestOpenTrigger
                              size="lg"
                              className={cn(listCardActionButtonClass, "w-full shadow-[var(--shadow-brand)]")}
                              openDetail={{
                                guardianUserId: featured.user_id,
                                displayName: featured.display_name,
                                headline: featured.headline,
                                avatarUrl: guardianProfileImageUrls(featured).avatar,
                                suggestedRegionSlug: featured.primary_region_slug,
                                ...(featuredRepCtx ?? {}),
                              }}
                            >
                              {t("dashCtaRequest")}
                            </GuardianRequestOpenTrigger>
                            <div className="grid grid-cols-2 gap-2 sm:max-w-sm">
                              <GuardianProfilePreviewSheetTrigger
                                guardian={publicGuardianToSheetPreview(
                                  featured,
                                  representativePostLinesForSheetPreview(featured, mockContentPosts),
                                )}
                                triggerLabel={t("dashCtaDetail")}
                                triggerVariant="outline"
                                className={cn(listCardActionButtonClass, "w-full border-border/80")}
                                size="default"
                                postContext={featuredRepCtx}
                              />
                              <div className={cn("[&_button]:w-full", "[&_button]:min-h-10 [&_button]:h-10 [&_button]:rounded-xl [&_button]:text-xs [&_button]:font-semibold sm:[&_button]:text-sm")}>
                                <SaveGuardianButton guardianUserId={featured.user_id} compact />
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </section>
              ) : null}

              <Card className="border-border/55 rounded-[1.2rem] border bg-muted/25 shadow-none">
                <CardContent className="flex flex-col gap-4 p-4 sm:flex-row sm:items-start sm:justify-between sm:gap-6 sm:p-5">
                  <div className="min-w-0 flex-1 space-y-3">
                    <div>
                      <p className="text-muted-foreground text-[10px] font-bold tracking-[0.18em] uppercase">{t("decisionSummaryEyebrow")}</p>
                      <p className="text-text-strong mt-1.5 text-base font-bold sm:text-lg">
                        {results.posts.length > 0
                          ? t("decisionSummaryHeadlineWithPosts", { g: results.guardians.length, p: results.posts.length })
                          : t("decisionSummaryHeadline", { g: results.guardians.length })}
                      </p>
                      <p className="text-foreground mt-2 text-sm font-medium leading-relaxed">{interpretLine}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground text-[10px] font-bold tracking-wide uppercase">{t("decisionBasisTitle")}</p>
                      <ul className="text-muted-foreground mt-2 list-inside list-disc space-y-1 text-sm leading-relaxed">
                        {basisBulletKeys.map((key) => (
                          <li key={key} className="marker:text-primary">
                            {translateExploreFitLine(t, key)}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <p className="text-muted-foreground text-xs leading-relaxed">{t("dashDecisionHelperShort")}</p>
                  </div>
                  <div className="flex w-full shrink-0 flex-col gap-2 sm:w-auto sm:min-w-[10.5rem]">
                    <Button
                      type="button"
                      variant="default"
                      size="sm"
                      className={cn(listCardActionButtonClass, "h-10 w-full")}
                      onClick={onEditConditions}
                    >
                      {t("editConditions")}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className={cn(listCardActionButtonClass, "h-10 w-full")}
                      disabled={resultsSpinDisabled}
                      onClick={onReRecommend}
                    >
                      {t("reRecommend")}
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {more.length > 0 ? (
                <section className="space-y-3">
                  <h3 className="text-muted-foreground text-xs font-bold tracking-wide uppercase">{t("dashCompareSectionTitle")}</h3>
                  <p className="text-foreground -mt-1 text-sm font-semibold">{t("dashCompareSectionLead")}</p>
                  <div className="grid gap-3 sm:grid-cols-2 sm:gap-4">
                    {more.map((g, idx) => {
                      const repCtx = postContextFromGuardianRepresentative(g, mockContentPosts);
                      const rankN = idx + 2;
                      const compareKeys = exploreCompareCardKeys(region, theme, pace, rankN as 2 | 3);
                      return (
                        <Card
                          key={g.user_id}
                          className="overflow-hidden rounded-xl border-border/55 bg-card/90 py-0 shadow-none ring-1 ring-border/35"
                        >
                          <CardContent className="p-4">
                            <div className="flex gap-3">
                              <div className="relative size-16 min-h-0 min-w-0 shrink-0 overflow-hidden rounded-lg sm:size-[4.5rem]">
                                <Image
                                  src={guardianProfileImageUrls(g).avatar}
                                  alt=""
                                  fill
                                  className={GUARDIAN_AVATAR_COVER_CLASS}
                                  sizes="72px"
                                />
                                <div className="absolute top-0.5 left-0.5">
                                  <Badge className="rounded bg-foreground/85 px-1 py-0 text-[8px] font-bold text-background">
                                    {t("dashRankN", { n: rankN })}
                                  </Badge>
                                </div>
                              </div>
                              <div className="min-w-0 flex-1 space-y-2">
                                <span className="text-foreground line-clamp-1 text-sm font-semibold">{g.display_name}</span>
                                <div className="text-muted-foreground flex flex-wrap gap-1 text-[10px]">
                                  <Badge
                                    variant={guardianTierBadgeVariant(g.guardian_tier)}
                                    className={cn(GUARDIAN_TIER_ROLE_BADGE_CLASSNAME, "h-5 px-1.5 text-[9px]")}
                                  >
                                    {tTier(g.guardian_tier)}
                                  </Badge>
                                  <span className="text-border">·</span>
                                  <span>
                                    {(() => {
                                      try {
                                        return (tLaunch.raw(g.launch_area_slug) as { name: string }).name;
                                      } catch {
                                        return g.launch_area_slug;
                                      }
                                    })()}
                                  </span>
                                  <span className="text-border">·</span>
                                  <span className="font-mono">{guardianLangsLine(g)}</span>
                                </div>
                                <div className="space-y-1.5 border-border/40 border-t pt-2 text-xs">
                                  <div>
                                    <p className="text-muted-foreground text-[9px] font-bold tracking-wide uppercase">
                                      {t("compareStrengthLabel")}
                                    </p>
                                    <p className="text-foreground font-medium leading-snug">{translateExploreFitLine(t, compareKeys.strength)}</p>
                                  </div>
                                  <div>
                                    <p className="text-muted-foreground text-[9px] font-bold tracking-wide uppercase">
                                      {t("compareReasonLabel")}
                                    </p>
                                    <p className="text-foreground leading-snug">{translateExploreFitLine(t, compareKeys.reason)}</p>
                                  </div>
                                  <div>
                                    <p className="text-muted-foreground text-[9px] font-bold tracking-wide uppercase">
                                      {t("compareDiffLabel")}
                                    </p>
                                    <p className="text-muted-foreground leading-snug">{translateExploreFitLine(t, compareKeys.diff)}</p>
                                  </div>
                                </div>
                                <TrustBadgeRow ids={g.trust_badge_ids} className="pt-0.5" size="sm" />
                                <div className="flex flex-col gap-1.5 pt-1">
                                  <GuardianRequestOpenTrigger
                                    size="sm"
                                    className={cn(listCardActionButtonClass, "h-9 w-full font-semibold")}
                                    openDetail={{
                                      guardianUserId: g.user_id,
                                      displayName: g.display_name,
                                      headline: g.headline,
                                      avatarUrl: guardianProfileImageUrls(g).avatar,
                                      suggestedRegionSlug: g.primary_region_slug,
                                      ...(repCtx ?? {}),
                                    }}
                                  >
                                    {t("dashCtaRequest")}
                                  </GuardianRequestOpenTrigger>
                                  <div className="grid grid-cols-2 gap-1.5">
                                    <GuardianProfilePreviewSheetTrigger
                                      guardian={publicGuardianToSheetPreview(
                                        g,
                                        representativePostLinesForSheetPreview(g, mockContentPosts),
                                      )}
                                      triggerLabel={t("dashCtaDetail")}
                                      triggerVariant="outline"
                                      size="sm"
                                      className={cn(listCardActionButtonClass, "h-9 w-full text-xs")}
                                      postContext={repCtx}
                                    />
                                    <div className="[&_button]:h-9 [&_button]:min-h-9 [&_button]:w-full [&_button]:rounded-xl [&_button]:text-[11px] [&_button]:font-semibold">
                                      <SaveGuardianButton guardianUserId={g.user_id} compact />
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                </section>
              ) : null}
            </>
          )}

          {/* 포스트는 보조 증거 — 가디언 아래 소형 카드 + 시트 */}
          {results.posts.length > 0 ? (
            <section className="border-border/40 space-y-3 rounded-[1.15rem] border border-dashed bg-muted/5 px-4 py-5 sm:px-5 opacity-[0.96]">
              <div>
                <h3 className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">{t("postsSecondaryEyebrow")}</h3>
                <p className="text-foreground mt-1 text-sm font-semibold">{t("postsSecondaryTitle")}</p>
                <p className="text-muted-foreground mt-1 text-xs leading-relaxed">{t("postsSecondaryLead")}</p>
              </div>
              <div className="grid gap-2 sm:grid-cols-3">
                {topPosts.map((p) => (
                  <ExploreJourneyPostCompactCard key={p.id} post={p} routeBadgeLabel={t("dashRouteBadge")} />
                ))}
              </div>
              {extraPosts.length > 0 ? (
                <>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="w-full rounded-xl text-xs font-semibold sm:w-auto"
                    onClick={() => setPostsSheetOpen(true)}
                  >
                    {t("postsSeeAll", { count: results.posts.length })}
                  </Button>
                  <Sheet open={postsSheetOpen} onOpenChange={setPostsSheetOpen}>
                    <SheetContent side="bottom" className="max-h-[88vh] rounded-t-2xl">
                      <SheetHeader>
                        <SheetTitle>{t("postsSheetTitle")}</SheetTitle>
                      </SheetHeader>
                      <ul className="mt-4 max-h-[min(60vh,28rem)] space-y-2 overflow-y-auto px-1 pb-4">
                        {results.posts.map((p) => (
                          <li key={p.id}>
                            <Link
                              href={`/posts/${p.id}`}
                              className="border-border/60 hover:bg-muted/40 flex items-start gap-3 rounded-xl border bg-card p-3 text-left transition-colors"
                              onClick={() => setPostsSheetOpen(false)}
                            >
                              <div className="relative h-14 w-[4.5rem] shrink-0 overflow-hidden rounded-lg bg-muted">
                                {getPostHeroImageUrl(p) ? (
                                  <Image src={getPostHeroImageUrl(p)} alt="" fill className={postCompactThumbCoverClass(p)} sizes="80px" />
                                ) : null}
                              </div>
                              <span className="min-w-0 flex-1">
                                <span className="text-foreground line-clamp-2 text-sm font-semibold leading-snug">{p.title}</span>
                                <span className="text-primary mt-1 block text-xs font-medium">{tHub("readPost")} →</span>
                              </span>
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </SheetContent>
                  </Sheet>
                </>
              ) : null}
            </section>
          ) : null}
        </>
      )}
    </div>
  );
}
