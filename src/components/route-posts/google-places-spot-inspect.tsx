"use client";

import { ExternalLink } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import type { RouteSpot } from "@/types/domain";
import { buildGoogleMapsSpotUrl, type GoogleMapsSpotLinkKind } from "@/lib/google-maps-spot-link";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

function statusTranslationKey(kind: GoogleMapsSpotLinkKind): string {
  switch (kind) {
    case "place_id":
      return "googleMapsStatusPlaceId";
    case "coordinates":
      return "googleMapsStatusCoords";
    case "text_search":
      return "googleMapsStatusTextSearch";
    default:
      return "googleMapsStatusDisconnected";
  }
}

/** 슈퍼관리자 전용 — 스팟 카드 안에서 Google Maps로 빠르게 검수 */
export function GooglePlacesSpotInspectRow({
  spot,
  className,
  postId,
  canBindPlaceId = false,
}: {
  spot: RouteSpot;
  className?: string;
  postId?: string;
  canBindPlaceId?: boolean;
}) {
  const t = useTranslations("RoutePosts");
  const { href, kind } = buildGoogleMapsSpotUrl(spot);
  const [binding, setBinding] = useState(false);
  const [bindNote, setBindNote] = useState<string | null>(null);

  async function handleBindPlaceId() {
    if (!postId || binding) return;
    setBinding(true);
    setBindNote(null);
    try {
      const res = await fetch(`/api/admin/content-posts/${postId}/google-place-bind`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ spotId: spot.id }),
      });
      if (!res.ok) {
        const j = (await res.json().catch(() => null)) as { error?: string } | null;
        setBindNote(`${t("googleMapsBindFailed")} (${j?.error ?? res.status})`);
        return;
      }
      setBindNote(t("googleMapsBindDone"));
      window.setTimeout(() => window.location.reload(), 350);
    } catch {
      setBindNote(t("googleMapsBindFailed"));
    } finally {
      setBinding(false);
    }
  }

  return (
    <div
      className={cn(
        "flex flex-col gap-1.5 rounded-lg border border-violet-500/25 bg-violet-500/[0.06] px-3 py-2 dark:bg-violet-950/20 sm:flex-row sm:items-center sm:justify-between sm:gap-3",
        className,
      )}
    >
      <div className="flex min-w-0 flex-wrap items-center gap-2">
        {href ? (
          <Button variant="secondary" size="sm" className="shrink-0 gap-1.5 text-xs font-semibold" asChild>
            <a href={href} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="size-3.5 opacity-80" aria-hidden />
              {t("googleMapsOpenButton")}
            </a>
          </Button>
        ) : (
          <Button type="button" variant="secondary" size="sm" className="shrink-0 gap-1.5 text-xs font-semibold" disabled>
            <ExternalLink className="size-3.5 opacity-80" aria-hidden />
            {t("googleMapsOpenButton")}
          </Button>
        )}
        <span className="text-muted-foreground text-[11px] leading-snug sm:text-xs">{t(statusTranslationKey(kind))}</span>
        {canBindPlaceId && postId ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-7 px-2.5 text-[11px] font-semibold"
            onClick={handleBindPlaceId}
            disabled={binding}
          >
            {binding ? t("googleMapsBindSaving") : t("googleMapsBindButton")}
          </Button>
        ) : null}
      </div>
      {bindNote ? <p className="text-muted-foreground text-[10px] sm:text-[11px]">{bindNote}</p> : null}
    </div>
  );
}

/** 디버그 패널 — Google 바인딩 필드 (슈퍼관리자·패널 오픈 시만 상위에서 렌더) */
export function GooglePlacesSpotDebugBlock({ spot }: { spot: RouteSpot }) {
  const t = useTranslations("RoutePosts");
  const g = spot.google;
  const photos = g?.photos ?? [];
  const loc = g?.location;

  return (
    <div className="border-border/50 space-y-2 rounded-lg border bg-muted/30 px-3 py-2.5 text-[11px] leading-relaxed">
      <p className="text-muted-foreground font-semibold tracking-wide uppercase">{t("googleMapsDebugHeading")}</p>
      <dl className="grid gap-1.5 font-mono text-[10px] text-foreground/90 sm:text-[11px]">
        <div className="flex flex-col gap-0.5 sm:flex-row sm:gap-2">
          <dt className="text-muted-foreground shrink-0 font-sans font-medium">{t("googleMapsDebugRealPlaceName")}</dt>
          <dd className="min-w-0 break-all">{spot.real_place_name?.trim() || "—"}</dd>
        </div>
        <div className="flex flex-col gap-0.5 sm:flex-row sm:gap-2">
          <dt className="text-muted-foreground shrink-0 font-sans font-medium">{t("googleMapsDebugPlaceId")}</dt>
          <dd className="min-w-0 break-all">{g?.placeId?.trim() || "—"}</dd>
        </div>
        <div className="flex flex-col gap-0.5 sm:flex-row sm:gap-2">
          <dt className="text-muted-foreground shrink-0 font-sans font-medium">{t("googleMapsDebugDisplayName")}</dt>
          <dd className="min-w-0 break-all">{g?.displayName?.trim() || "—"}</dd>
        </div>
        <div className="flex flex-col gap-0.5 sm:flex-row sm:gap-2">
          <dt className="text-muted-foreground shrink-0 font-sans font-medium">{t("googleMapsDebugFormattedAddress")}</dt>
          <dd className="min-w-0 break-all">{g?.formattedAddress?.trim() || "—"}</dd>
        </div>
        <div className="flex flex-col gap-0.5 sm:flex-row sm:gap-2">
          <dt className="text-muted-foreground shrink-0 font-sans font-medium">{t("googleMapsDebugLocation")}</dt>
          <dd className="min-w-0 break-all">
            {loc && Number.isFinite(loc.lat) && Number.isFinite(loc.lng)
              ? `${loc.lat}, ${loc.lng}`
              : "—"}
          </dd>
        </div>
        <div className="flex flex-col gap-0.5 sm:flex-row sm:gap-2">
          <dt className="text-muted-foreground shrink-0 font-sans font-medium">{t("googleMapsDebugPhotosCount")}</dt>
          <dd>{photos.length}</dd>
        </div>
      </dl>
    </div>
  );
}
