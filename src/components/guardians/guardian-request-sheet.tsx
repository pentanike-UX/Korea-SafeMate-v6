"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState, type ComponentProps, type ReactNode } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { mockRegions } from "@/data/mock";
import {
  buildGuardianIntakePayload,
  type GuardianIntakeFormInput,
  type GuardianRequestKind,
} from "@/lib/guardian-request-intake-payload";
import { LANGUAGE_OPTIONS } from "@/lib/booking-wizard-config";
import type { TravelerUserType } from "@/types/domain";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { GUARDIAN_AVATAR_COVER_CLASS } from "@/lib/guardian-profile-images";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

export const GUARDIAN_REQUEST_OPEN_EVENT = "safemate:open-guardian-request";

/** Page-scoped defaults for 요청하기 when no guardianUserId is sent in the open event (single global host). */
export const GUARDIAN_REQUEST_DEFAULTS_EVENT = "safemate:guardian-request-defaults";

/** Optional guardian override (e.g. preview sheet / listing) so 요청하기 stays in-sheet without /book. */
export type GuardianRequestOpenDetail = {
  postId?: string;
  postTitle?: string;
  /** 카드·프리뷰에서 보던 요약 — 요청 패널·부킹 특이사항으로 전달 */
  postSummary?: string;
  /** 루트형 포스트는 배지 등 미묘한 위계용(선택) */
  postContextKind?: "route" | "post";
  guardianUserId?: string;
  displayName?: string;
  headline?: string;
  avatarUrl?: string;
  suggestedRegionSlug?: string | null;
};

export { postContextFromContentPost } from "@/lib/guardian-request-post-context";

export const FALLBACK_GUARDIAN_REQUEST_AVATAR = "/images/hero/seoul2_MyLoveFromTheStar_NSeoulTower.jpg";

type GuardianIdentityOverride = {
  guardianUserId: string;
  displayName: string;
  headline: string;
  avatarUrl: string;
  suggestedRegionSlug: string | null;
};

export function GuardianRequestOpenTrigger({
  className,
  variant = "default",
  size = "lg",
  children,
  postContext,
  openDetail,
}: {
  className?: string;
  variant?: ComponentProps<typeof Button>["variant"];
  size?: ComponentProps<typeof Button>["size"];
  children: ReactNode;
  /** @deprecated use openDetail */
  postContext?: GuardianRequestOpenDetail | null;
  openDetail?: GuardianRequestOpenDetail | null;
}) {
  const detail = { ...(postContext ?? {}), ...(openDetail ?? {}) };
  return (
    <Button
      type="button"
      variant={variant}
      size={size}
      className={className}
      onClick={() =>
        window.dispatchEvent(
          new CustomEvent<GuardianRequestOpenDetail>(GUARDIAN_REQUEST_OPEN_EVENT, {
            detail,
          }),
        )
      }
    >
      {children}
    </Button>
  );
}

export type GuardianRequestSheetHostProps = {
  guardianUserId: string;
  displayName: string;
  headline: string;
  avatarUrl: string;
  suggestedRegionSlug?: string | null;
};

export function GuardianRequestSheetHost({
  guardianUserId,
  displayName,
  headline,
  avatarUrl,
  suggestedRegionSlug,
  useWindowDefaults = false,
}: GuardianRequestSheetHostProps & { useWindowDefaults?: boolean }) {
  const t = useTranslations("GuardianRequest");
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [postCtx, setPostCtx] = useState<GuardianRequestOpenDetail | null>(null);
  const [identityOverride, setIdentityOverride] = useState<GuardianIdentityOverride | null>(null);
  const [baseIdentity, setBaseIdentity] = useState<GuardianRequestSheetHostProps | null>(null);
  const [side, setSide] = useState<"right" | "bottom">("bottom");

  const effectiveBase: GuardianRequestSheetHostProps = useWindowDefaults
    ? (baseIdentity ?? {
        guardianUserId: "",
        displayName: "",
        headline: "",
        avatarUrl: FALLBACK_GUARDIAN_REQUEST_AVATAR,
        suggestedRegionSlug: null,
      })
    : {
        guardianUserId,
        displayName,
        headline,
        avatarUrl,
        suggestedRegionSlug: suggestedRegionSlug ?? null,
      };

  const effectiveRef = useRef(effectiveBase);
  effectiveRef.current = effectiveBase;

  const [requestKind, setRequestKind] = useState<GuardianRequestKind>("full_day");
  const [regionSlug, setRegionSlug] = useState(() =>
    mockRegions.some((r) => r.slug === (effectiveBase.suggestedRegionSlug ?? ""))
      ? effectiveBase.suggestedRegionSlug!
      : "seoul",
  );
  const [preferredDate, setPreferredDate] = useState("");
  const [mood, setMood] = useState("");
  const [details, setDetails] = useState("");
  const [guestName, setGuestName] = useState("");
  const [guestEmail, setGuestEmail] = useState("");
  const [travelerUserType, setTravelerUserType] = useState<TravelerUserType>("foreign_traveler");
  const [preferredLanguage, setPreferredLanguage] = useState("English");
  const [travelerCount, setTravelerCount] = useState(1);
  const [agreeScope, setAgreeScope] = useState(false);
  const [agreeReview, setAgreeReview] = useState(false);
  const [agreeNoChat, setAgreeNoChat] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)");
    const sync = () => setSide(mq.matches ? "right" : "bottom");
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    if (!useWindowDefaults) return;
    const fn = (e: Event) => {
      const d = (e as CustomEvent<GuardianRequestSheetHostProps | null>).detail;
      setBaseIdentity(d);
    };
    window.addEventListener(GUARDIAN_REQUEST_DEFAULTS_EVENT, fn);
    return () => window.removeEventListener(GUARDIAN_REQUEST_DEFAULTS_EVENT, fn);
  }, [useWindowDefaults]);

  useEffect(() => {
    if (!useWindowDefaults || !baseIdentity) return;
    const slug = baseIdentity.suggestedRegionSlug;
    setRegionSlug(mockRegions.some((r) => r.slug === (slug ?? "")) ? slug! : "seoul");
  }, [useWindowDefaults, baseIdentity?.guardianUserId, baseIdentity?.suggestedRegionSlug]);

  const onOpenEvent = useCallback((e: Event) => {
    const d = (e as CustomEvent<GuardianRequestOpenDetail>).detail ?? {};
    setPostCtx(
      d.postId && d.postTitle
        ? {
            postId: d.postId,
            postTitle: d.postTitle,
            postSummary: d.postSummary,
            postContextKind: d.postContextKind,
          }
        : null,
    );
    if (d.guardianUserId) {
      setIdentityOverride({
        guardianUserId: d.guardianUserId,
        displayName: d.displayName ?? d.guardianUserId,
        headline: d.headline ?? "",
        avatarUrl: d.avatarUrl?.trim() ? d.avatarUrl : FALLBACK_GUARDIAN_REQUEST_AVATAR,
        suggestedRegionSlug:
          d.suggestedRegionSlug != null && mockRegions.some((r) => r.slug === d.suggestedRegionSlug)
            ? d.suggestedRegionSlug
            : null,
      });
      if (d.suggestedRegionSlug && mockRegions.some((r) => r.slug === d.suggestedRegionSlug)) {
        setRegionSlug(d.suggestedRegionSlug);
      }
    } else {
      setIdentityOverride(null);
      const b = effectiveRef.current;
      setRegionSlug(
        mockRegions.some((r) => r.slug === (b.suggestedRegionSlug ?? "")) ? b.suggestedRegionSlug! : "seoul",
      );
    }
    setOpen(true);
  }, []);

  useEffect(() => {
    window.addEventListener(GUARDIAN_REQUEST_OPEN_EVENT, onOpenEvent);
    return () => window.removeEventListener(GUARDIAN_REQUEST_OPEN_EVENT, onOpenEvent);
  }, [onOpenEvent]);

  const resetForClose = () => {
    setError(null);
    setPostCtx(null);
    setIdentityOverride(null);
  };

  const activeGuardianUserId = identityOverride?.guardianUserId ?? effectiveBase.guardianUserId;
  const activeDisplayName = identityOverride?.displayName ?? effectiveBase.displayName;
  const activeHeadline = identityOverride?.headline ?? effectiveBase.headline;
  const activeAvatarUrl = identityOverride?.avatarUrl ?? effectiveBase.avatarUrl;

  const kindLabel = (k: GuardianRequestKind) => {
    if (k === "half_day") return t("kindHalf");
    if (k === "full_day") return t("kindDay");
    if (k === "full_itinerary") return t("kindItinerary");
    return t("kindInquiry");
  };

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!activeGuardianUserId.trim()) {
      setError(t("errorSubmit"));
      return;
    }
    if (!guestName.trim() || !guestEmail.trim()) {
      setError(t("errorContact"));
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(guestEmail.trim())) {
      setError(t("errorEmail"));
      return;
    }
    if (!agreeScope || !agreeReview || !agreeNoChat) {
      setError(t("errorAgreements"));
      return;
    }
    if (!regionSlug) {
      setError(t("errorRegion"));
      return;
    }

    const input: GuardianIntakeFormInput = {
      requestKind,
      regionSlug,
      preferredDate,
      mood,
      details,
      guestName,
      guestEmail,
      travelerUserType,
      preferredLanguage,
      travelerCount,
      guardianUserId: activeGuardianUserId,
      guardianDisplayName: activeDisplayName,
      relatedPost:
        postCtx?.postId && postCtx.postTitle
          ? {
              id: postCtx.postId,
              title: postCtx.postTitle,
              summary: postCtx.postSummary?.trim() || undefined,
            }
          : null,
    };

    const payload = buildGuardianIntakePayload(input, kindLabel(requestKind), {
      scope: agreeScope,
      admin_review: agreeReview,
      no_immediate_chat: agreeNoChat,
    });

    setSubmitting(true);
    try {
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = (await res.json()) as { id?: string; saved?: boolean; error?: string };
      if (!res.ok) throw new Error(data.error ?? t("errorSubmit"));
      const id = data.id ?? "unknown";
      try {
        sessionStorage.setItem(
          "ksm_booking_success",
          JSON.stringify({ id, payload, saved: Boolean(data.saved) }),
        );
      } catch {
        /* ignore */
      }
      setOpen(false);
      resetForClose();
      router.push(`/book/success?id=${encodeURIComponent(id)}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("errorSubmit"));
    } finally {
      setSubmitting(false);
    }
  }

  const kinds: GuardianRequestKind[] = ["half_day", "full_day", "full_itinerary", "inquiry"];

  return (
    <Sheet
      open={open}
      onOpenChange={(v) => {
        setOpen(v);
        if (!v) resetForClose();
      }}
    >
      <SheetContent
        side={side}
        className={cn(
          "flex w-full flex-col gap-0 overflow-hidden p-0",
          side === "right" ? "sm:max-w-lg" : "max-h-[92vh] rounded-t-2xl",
        )}
      >
        <SheetHeader className="border-border/60 shrink-0 space-y-3 border-b px-5 py-4 sm:px-6">
          <div className="flex items-start gap-3">
            <div className="border-border/50 relative size-14 shrink-0 overflow-hidden rounded-xl border bg-muted">
              <Image src={activeAvatarUrl} alt="" fill className={GUARDIAN_AVATAR_COVER_CLASS} sizes="56px" />
            </div>
            <div className="min-w-0 flex-1 text-left">
              <SheetTitle className="text-left text-base leading-snug sm:text-lg">{activeDisplayName}</SheetTitle>
              <p className="text-muted-foreground mt-1 line-clamp-2 text-sm leading-relaxed">{activeHeadline}</p>
            </div>
          </div>
          {postCtx?.postTitle ? (
            <div className="bg-primary/6 space-y-1.5 rounded-lg px-3 py-2.5 text-xs leading-relaxed">
              <div className="flex flex-wrap items-center gap-2">
                {postCtx.postContextKind === "route" ? (
                  <Badge variant="outline" className="rounded-full text-[10px] font-semibold">
                    {t("postContextRouteBadge")}
                  </Badge>
                ) : null}
                <p className="text-foreground min-w-0 flex-1 font-medium leading-snug">
                  <span className="text-primary font-semibold">{t("postContextPrefix")}</span> {postCtx.postTitle}
                </p>
              </div>
              {postCtx.postSummary?.trim() ? (
                <p className="text-muted-foreground line-clamp-3 text-[13px] leading-relaxed">{postCtx.postSummary.trim()}</p>
              ) : null}
            </div>
          ) : null}
        </SheetHeader>

        <p className="text-muted-foreground border-border/60 border-b px-5 py-3 text-sm leading-relaxed sm:px-6">{t("sheetIntroLead")}</p>

        <form onSubmit={onSubmit} className="flex min-h-0 flex-1 flex-col">
          <div className="min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-contain px-5 py-4 sm:px-6">
            <div>
              <p className="text-foreground text-sm font-semibold">{t("fieldRequestKind")}</p>
              <div className="mt-2 grid gap-2 sm:grid-cols-2">
                {kinds.map((k) => (
                  <label
                    key={k}
                    className={cn(
                      "flex cursor-pointer items-center gap-2 rounded-xl border px-3 py-2.5 text-sm transition-colors",
                      requestKind === k ? "border-primary bg-primary/5 ring-1 ring-primary/20" : "border-border/80 hover:bg-muted/50",
                    )}
                  >
                    <input
                      type="radio"
                      name="requestKind"
                      className="accent-primary"
                      checked={requestKind === k}
                      onChange={() => setRequestKind(k)}
                    />
                    <span>{kindLabel(k)}</span>
                  </label>
                ))}
              </div>
              <p className="text-muted-foreground text-xs leading-relaxed">{t("fieldRequestKindHelp")}</p>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="gr-region">{t("fieldRegion")}</Label>
              <Select value={regionSlug} onValueChange={(v) => v && setRegionSlug(v)}>
                <SelectTrigger id="gr-region" className="rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {mockRegions.map((r) => (
                    <SelectItem key={r.slug} value={r.slug}>
                      {r.name_ko ? `${r.name_ko} · ${r.name}` : r.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="gr-date">{t("fieldDate")}</Label>
              <Input
                id="gr-date"
                type="date"
                value={preferredDate}
                onChange={(e) => setPreferredDate(e.target.value)}
                className="rounded-xl"
              />
              <p className="text-muted-foreground text-xs leading-relaxed">{t("helperDate")}</p>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="gr-mood">{t("fieldMood")}</Label>
              <Input
                id="gr-mood"
                value={mood}
                onChange={(e) => setMood(e.target.value)}
                placeholder={t("moodPlaceholder")}
                className="rounded-xl"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="gr-details">{t("fieldDetails")}</Label>
              <Textarea
                id="gr-details"
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                rows={3}
                placeholder={t("detailsPlaceholder")}
                className="rounded-xl"
              />
              <p className="text-muted-foreground text-xs leading-relaxed">{t("helperDetails")}</p>
            </div>

            <div className="grid gap-2 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label>{t("fieldUserType")}</Label>
                <Select
                  value={travelerUserType}
                  onValueChange={(v) => v && setTravelerUserType(v as TravelerUserType)}
                >
                  <SelectTrigger className="rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="foreign_traveler">{t("userTypeForeign")}</SelectItem>
                    <SelectItem value="korean_traveler">{t("userTypeKorean")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="gr-count">{t("fieldPartySize")}</Label>
                <Input
                  id="gr-count"
                  type="number"
                  min={1}
                  max={8}
                  value={travelerCount}
                  onChange={(e) => setTravelerCount(Number(e.target.value) || 1)}
                  className="rounded-xl"
                />
              </div>
            </div>

            <div className="grid gap-2">
              <Label>{t("fieldLanguage")}</Label>
              <Select value={preferredLanguage} onValueChange={(v) => v && setPreferredLanguage(v)}>
                <SelectTrigger className="rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {LANGUAGE_OPTIONS.map((o) => (
                    <SelectItem key={o.value} value={o.value}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="gr-name">{t("fieldName")}</Label>
                <Input
                  id="gr-name"
                  value={guestName}
                  onChange={(e) => setGuestName(e.target.value)}
                  autoComplete="name"
                  className="rounded-xl"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="gr-email">{t("fieldEmail")}</Label>
                <Input
                  id="gr-email"
                  type="email"
                  value={guestEmail}
                  onChange={(e) => setGuestEmail(e.target.value)}
                  autoComplete="email"
                  className="rounded-xl"
                />
              </div>
            </div>

            <div className="border-border/60 space-y-2 rounded-xl border bg-muted/30 p-3 text-sm">
              <label className="flex cursor-pointer gap-2">
                <input type="checkbox" checked={agreeScope} onChange={(e) => setAgreeScope(e.target.checked)} className="mt-0.5 accent-primary" />
                <span>{t("agreeScope")}</span>
              </label>
              <label className="flex cursor-pointer gap-2">
                <input type="checkbox" checked={agreeReview} onChange={(e) => setAgreeReview(e.target.checked)} className="mt-0.5 accent-primary" />
                <span>{t("agreeReview")}</span>
              </label>
              <label className="flex cursor-pointer gap-2">
                <input type="checkbox" checked={agreeNoChat} onChange={(e) => setAgreeNoChat(e.target.checked)} className="mt-0.5 accent-primary" />
                <span>{t("agreeNoChat")}</span>
              </label>
            </div>

            {error ? (
              <p className="text-destructive bg-destructive/10 rounded-lg px-3 py-2 text-sm" role="alert">
                {error}
              </p>
            ) : null}
          </div>

          <div className="border-border/60 shrink-0 space-y-2 border-t bg-background px-5 py-4 sm:px-6">
            <Button type="submit" disabled={submitting} className="h-12 w-full rounded-2xl text-base font-semibold">
              {submitting ? <Loader2 className="size-5 animate-spin" aria-hidden /> : t("submit")}
            </Button>
            <p className="text-muted-foreground text-center text-[11px] leading-relaxed">{t("footerNote")}</p>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}

/** Mount once in the site shell; pages publish defaults via `GuardianRequestDefaultsPublisher`. */
export function GuardianRequestSheetGlobal() {
  return (
    <GuardianRequestSheetHost
      useWindowDefaults
      guardianUserId=""
      displayName=""
      headline=""
      avatarUrl={FALLBACK_GUARDIAN_REQUEST_AVATAR}
      suggestedRegionSlug={null}
    />
  );
}
