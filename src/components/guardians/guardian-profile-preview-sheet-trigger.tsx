"use client";

import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import {
  guardianProfileImageUrls,
  GUARDIAN_AVATAR_COVER_CLASS,
  GUARDIAN_PROFILE_HERO_COVER_CLASS,
} from "@/lib/guardian-profile-images";
import type { GuardianProfileSheetPreview } from "@/lib/guardian-profile-sheet-preview";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import {
  GUARDIAN_REQUEST_OPEN_EVENT,
  type GuardianRequestOpenDetail,
} from "@/components/guardians/guardian-request-sheet";
import { Badge } from "@/components/ui/badge";
import { regionDisplayLabelFromSlug } from "@/lib/mypage/region-label-i18n";
import { cn } from "@/lib/utils";
import { Star } from "lucide-react";

export type { GuardianProfileSheetPreview };

export type GuardianPreviewPostContext = Pick<
  GuardianRequestOpenDetail,
  "postId" | "postTitle" | "postSummary" | "postContextKind"
>;

export function GuardianProfilePreviewPanel({
  guardian,
  onClose,
  postContext,
  workspaceSelf,
}: {
  guardian: GuardianProfileSheetPreview;
  onClose: () => void;
  postContext?: GuardianPreviewPostContext | null;
  /** Guardian workspace: no request CTA; optional link to public profile only as explicit exit. */
  workspaceSelf?: boolean;
}) {
  const t = useTranslations("TravelerHub");
  const tReq = useTranslations("GuardianRequest");
  const tGd = useTranslations("GuardianDetail");
  const locale = useLocale();
  const imgs = guardianProfileImageUrls(guardian);
  const isKo = locale === "ko";
  const longBio = guardian.long_bio ? (isKo ? guardian.long_bio.ko : guardian.long_bio.en) : "";
  const languageList = guardian.languages?.map((l) => l.language_code).filter(Boolean) ?? [];
  const repPosts = guardian.representativePosts?.slice(0, 3) ?? [];

  return (
    <>
      <SheetHeader>
        <SheetTitle>{guardian.display_name}</SheetTitle>
      </SheetHeader>
      <div className="space-y-4 overflow-y-auto px-4 pb-4 sm:px-6 sm:pb-6">
        <div className="border-border/60 relative aspect-[16/9] overflow-hidden rounded-xl border bg-muted">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={imgs.landscape}
            alt=""
            className={cn("absolute inset-0 size-full min-h-0 min-w-0", GUARDIAN_PROFILE_HERO_COVER_CLASS)}
          />
        </div>
        <div className="flex items-start gap-3">
          <div className="border-border/60 relative size-12 shrink-0 overflow-hidden rounded-full border bg-muted">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={imgs.avatar}
              alt=""
              className={cn("absolute inset-0 size-full min-h-0 min-w-0", GUARDIAN_AVATAR_COVER_CLASS)}
            />
          </div>
          <div className="min-w-0">
            <p className="text-foreground text-sm font-semibold">{guardian.display_name}</p>
            {guardian.headline ? <p className="text-muted-foreground mt-1 text-sm leading-relaxed">{guardian.headline}</p> : null}
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {guardian.primary_region_slug ? (
            <Badge variant="outline">
              {regionDisplayLabelFromSlug(guardian.primary_region_slug, (k) => t(k))}
            </Badge>
          ) : null}
          {guardian.guardian_tier ? <Badge variant="secondary">{guardian.guardian_tier}</Badge> : null}
          {languageList.length > 0 ? (
            <Badge variant="outline">
              {t("guardianPreviewLanguages")} {languageList.join(", ")}
            </Badge>
          ) : null}
          {guardian.avg_traveler_rating != null ? (
            <Badge variant="outline" className="inline-flex items-center gap-1">
              <Star className="size-3 fill-amber-400 text-amber-400" aria-hidden />
              {guardian.avg_traveler_rating.toFixed(1)}
              {guardian.review_count_display ? ` (${guardian.review_count_display})` : ""}
            </Badge>
          ) : null}
        </div>
        {longBio ? <p className="text-muted-foreground text-sm leading-relaxed">{longBio.split("\n\n")[0]}</p> : null}
        {guardian.expertise_tags && guardian.expertise_tags.length > 0 ? (
          <div>
            <p className="text-muted-foreground mb-1 text-xs font-semibold uppercase">{tGd("expertiseTitle")}</p>
            <div className="flex flex-wrap gap-1.5">
              {guardian.expertise_tags.slice(0, 5).map((tag) => (
                <Badge key={tag} variant="outline">
                  {tag}
                </Badge>
              ))}
            </div>
          </div>
        ) : null}
        {postContext?.postId ? (
          <div className="border-border/60 bg-muted/15 space-y-1 rounded-xl border px-3 py-2.5">
            <p className="text-foreground text-sm font-semibold leading-snug">{postContext.postTitle}</p>
            {postContext.postSummary?.trim() ? (
              <p className="text-muted-foreground line-clamp-3 text-xs leading-relaxed">{postContext.postSummary.trim()}</p>
            ) : null}
            {postContext.postContextKind === "route" ? (
              <p className="text-primary text-[10px] font-bold uppercase tracking-wide">{tReq("postContextRouteBadge")}</p>
            ) : null}
          </div>
        ) : null}
        {repPosts.length > 0 ? (
          <div className="space-y-2">
            <div>
              <p className="text-muted-foreground text-xs font-semibold uppercase">{t("guardianPreviewRepPosts")}</p>
              {guardian.representativePostsSource === "recent_approved" ? (
                <p className="text-muted-foreground mt-1 text-[11px] leading-relaxed">{t("guardianPreviewRepPostsRecentHint")}</p>
              ) : null}
            </div>
            <ul className="space-y-1.5">
              {repPosts.map((p) => (
                <li key={p.id} className="rounded-lg border border-border/60 bg-muted/15 px-3 py-2">
                  <p className="text-sm font-medium">{p.title}</p>
                  <p className="text-muted-foreground mt-0.5 line-clamp-1 text-xs">{p.summary}</p>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
        <div className="flex flex-col gap-2 pt-1 sm:flex-row sm:flex-wrap">
          <Button asChild variant={workspaceSelf ? "outline" : "default"} className="rounded-xl font-semibold">
            <Link href={`/guardians/${guardian.user_id}`} onClick={onClose}>
              {workspaceSelf ? t("workspaceGuardianOpenPublic") : t("openGuardian")}
            </Link>
          </Button>
          {workspaceSelf ? null : (
            <Button
              type="button"
              variant="outline"
              className="rounded-xl font-semibold"
              onClick={() => {
                onClose();
                const detail: GuardianRequestOpenDetail = {
                  guardianUserId: guardian.user_id,
                  displayName: guardian.display_name,
                  headline: guardian.headline?.trim() || "",
                  avatarUrl: imgs.avatar,
                  suggestedRegionSlug: guardian.primary_region_slug ?? null,
                  ...(postContext?.postId
                    ? {
                        postId: postContext.postId,
                        postTitle: postContext.postTitle,
                        postSummary: postContext.postSummary,
                        postContextKind: postContext.postContextKind,
                      }
                    : {}),
                };
                window.requestAnimationFrame(() =>
                  window.dispatchEvent(
                    new CustomEvent<GuardianRequestOpenDetail>(GUARDIAN_REQUEST_OPEN_EVENT, { detail }),
                  ),
                );
              }}
            >
              {tReq("openCta")}
            </Button>
          )}
        </div>
      </div>
    </>
  );
}

/**
 * Public + mypage: opens guardian preview in sheet; full profile / booking only after explicit choice.
 *
 * `postContext`: 프리뷰·요청 시트에 같은 포스트 맥락을 이어 줄 때만(포스트 상세·대표 포스트 해석 가능한 목록 등).
 * 생략 시 요청 CTA는 가디언 정보만으로 열린다.
 */
export function GuardianProfilePreviewSheetTrigger({
  guardian,
  triggerLabel,
  triggerVariant = "outline",
  className,
  size = "default",
  postContext,
}: {
  guardian: GuardianProfileSheetPreview;
  triggerLabel: string;
  triggerVariant?: "outline" | "ghost" | "default";
  className?: string;
  size?: "default" | "sm" | "lg";
  postContext?: GuardianPreviewPostContext | null;
}) {
  const [open, setOpen] = useState(false);
  const [side, setSide] = useState<"right" | "bottom">("bottom");

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)");
    const sync = () => setSide(mq.matches ? "right" : "bottom");
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <Button
        type="button"
        size={size}
        variant={triggerVariant}
        className={cn("rounded-xl font-semibold", className)}
        onClick={() => setOpen(true)}
      >
        {triggerLabel}
      </Button>
      <SheetContent side={side} className={side === "right" ? "sm:max-w-md" : "max-h-[86vh] rounded-t-2xl"}>
        <GuardianProfilePreviewPanel guardian={guardian} onClose={() => setOpen(false)} postContext={postContext} />
      </SheetContent>
    </Sheet>
  );
}
