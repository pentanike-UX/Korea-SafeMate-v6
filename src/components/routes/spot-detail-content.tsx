"use client";

import Image from "next/image";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { MapPin, Clock, ChevronLeft, ChevronRight, Camera, Lightbulb, AlertTriangle } from "lucide-react";
import type { HaruSpot, AppLocale, LocaleMap } from "@/types/haru";
import { cn } from "@/lib/utils";
import { SpotSoundtrackHero } from "@/components/routes/spot-soundtrack-hero";
import { ArtistSpotlight } from "@/components/routes/artist-spotlight";
import { SpotTypeChips } from "@/components/route-posts/spot-type-chips";
import { SpotCommercePanel } from "@/components/route-posts/spot-commerce-panel";
import type { HaruRouteSpotType } from "@/types/domain";

/**
 * 스팟 상세 본문 — 갤러리·노트·블록들.
 * Sheet 내부에서도 쓰이고, 데스크톱 Route Cockpit 좌측 패널에서 인라인으로도 쓰인다.
 */
export function SpotDetailContent({
  spot,
  locale,
  onClose,
  className,
}: {
  spot: HaruSpot;
  locale: AppLocale;
  onClose: () => void;
  className?: string;
}) {
  const t = useTranslations("TravelerHub");
  const [galleryIdx, setGalleryIdx] = useState(0);

  const name = pickLocale(spot.catalog.name, locale) ?? "Spot";
  const note = pickLocale(spot.guardian_note, locale);
  const whyHere = pickLocale(spot.details?.why_here, locale);
  const whatToDo = pickLocale(spot.details?.what_to_do, locale);
  const photoTip = pickLocale(spot.details?.photo_tip, locale);
  const caution = pickLocale(spot.details?.caution, locale);
  const gallery = spot.details?.gallery_image_urls ?? [];

  return (
    <div className={cn("flex h-full flex-col gap-0 overflow-hidden", className)}>
      {/* 헤더 */}
      <div className="border-border/50 bg-card flex shrink-0 items-center gap-2 border-b px-2 py-2.5 sm:gap-3 sm:px-4 sm:py-3.5">
        <button
          type="button"
          onClick={onClose}
          className="text-muted-foreground hover:bg-muted hover:text-foreground flex size-10 shrink-0 items-center justify-center rounded-full transition-colors"
          aria-label={t("spotDetailCloseAria")}
        >
          <ChevronLeft className="size-5" />
        </button>
        <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-2xl dark:bg-emerald-950/40">
          {spot.catalog.category_emoji}
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-foreground truncate text-sm font-bold">{name}</p>
          <p className="text-muted-foreground flex min-w-0 items-center gap-1 text-[11px]">
            <Clock className="size-3 shrink-0" aria-hidden />
            <span className="shrink-0">{t("spotDetailStayLabel", { m: spot.stay_min })}</span>
            {spot.catalog.address ? (
              <>
                <span aria-hidden className="mx-1 shrink-0 opacity-50">·</span>
                <MapPin className="size-3 shrink-0" aria-hidden />
                <span className="truncate">{spot.catalog.address}</span>
              </>
            ) : null}
          </p>
        </div>
      </div>

      {/* 본문 */}
      <div className="flex flex-1 flex-col gap-5 overflow-y-auto px-4 py-5 sm:px-5 lg:gap-6">
        {/* 갤러리 */}
        <div
          className="bg-muted relative aspect-[4/3] w-full shrink-0 overflow-hidden rounded-2xl lg:aspect-[16/10]"
          role="img"
          aria-label={t("spotDetailGalleryAria")}
        >
          {gallery.length > 0 ? (
            <>
              <Image
                src={gallery[galleryIdx]!}
                alt={`${name} ${galleryIdx + 1}/${gallery.length}`}
                fill
                className="object-cover"
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 600px, 780px"
              />
              {gallery.length > 1 ? (
                <>
                  <button
                    type="button"
                    onClick={() => setGalleryIdx((i) => (i - 1 + gallery.length) % gallery.length)}
                    className="absolute left-2 top-1/2 flex size-8 -translate-y-1/2 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-sm hover:bg-black/60"
                    aria-label="prev"
                  >
                    <ChevronLeft className="size-5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setGalleryIdx((i) => (i + 1) % gallery.length)}
                    className="absolute right-2 top-1/2 flex size-8 -translate-y-1/2 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-sm hover:bg-black/60"
                    aria-label="next"
                  >
                    <ChevronRight className="size-5" />
                  </button>
                  <span className="absolute bottom-2 right-2 rounded-full bg-black/60 px-2 py-0.5 text-[11px] font-bold text-white">
                    {galleryIdx + 1} / {gallery.length}
                  </span>
                </>
              ) : null}
            </>
          ) : (
            <div className="text-muted-foreground flex h-full flex-col items-center justify-center gap-2">
              <span className="text-5xl" aria-hidden>
                {spot.catalog.category_emoji}
              </span>
              <p className="text-xs">{t("spotDetailGalleryEmpty")}</p>
            </div>
          )}
        </div>

        {spot.spot_types && spot.spot_types.length > 0 ? (
          <SpotTypeChips spotTypes={spot.spot_types as HaruRouteSpotType[]} />
        ) : null}

        {spot.soundtrack ? <SpotSoundtrackHero spot={spot} locale={locale} /> : null}

        {note ? <p className="text-foreground/90 text-sm leading-relaxed">{note}</p> : null}

        {spot.commerce ? <SpotCommercePanel commerce={spot.commerce} /> : null}

        {spot.artists && spot.artists.length > 0 ? <ArtistSpotlight artists={spot.artists} /> : null}

        {whyHere ? (
          <DetailBlock
            icon={<Lightbulb className="size-4" />}
            label={t("spotDetailLabelWhyHere")}
            accentClass="text-emerald-700 dark:text-emerald-300"
          >
            {whyHere}
          </DetailBlock>
        ) : null}

        {whatToDo ? (
          <DetailBlock
            icon={<MapPin className="size-4" />}
            label={t("spotDetailLabelWhatToDo")}
            accentClass="text-[var(--brand-primary)]"
          >
            {whatToDo}
          </DetailBlock>
        ) : null}

        {photoTip ? (
          <DetailBlock
            icon={<Camera className="size-4" />}
            label={t("spotDetailLabelPhotoTip")}
            accentClass="text-violet-700 dark:text-violet-300"
          >
            {photoTip}
          </DetailBlock>
        ) : null}

        {caution ? (
          <DetailBlock
            icon={<AlertTriangle className="size-4" />}
            label={t("spotDetailLabelCaution")}
            accentClass="text-amber-700 dark:text-amber-400"
            boxedClass="border-amber-400/40 bg-amber-50/40 dark:bg-amber-950/15"
          >
            {caution}
          </DetailBlock>
        ) : null}
      </div>
    </div>
  );
}

function DetailBlock({
  icon,
  label,
  accentClass,
  boxedClass,
  children,
}: {
  icon: React.ReactNode;
  label: string;
  accentClass?: string;
  boxedClass?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={cn("border-border/40 bg-card/50 rounded-2xl border p-3.5", boxedClass)}>
      <p
        className={cn(
          "mb-1.5 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider",
          accentClass ?? "text-primary",
        )}
      >
        {icon}
        {label}
      </p>
      <p className="text-foreground/90 whitespace-pre-line text-sm leading-relaxed">{children}</p>
    </div>
  );
}

function pickLocale(map: LocaleMap | undefined, locale: AppLocale): string | undefined {
  if (!map) return undefined;
  const order: AppLocale[] = [locale, "en", "ko", "th", "vi"];
  for (const l of order) {
    const v = map[l];
    if (v) return v;
  }
  return undefined;
}
