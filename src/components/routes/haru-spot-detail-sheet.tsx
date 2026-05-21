"use client";

import Image from "next/image";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { MapPin, Clock, X, ChevronLeft, ChevronRight, Camera, Lightbulb, AlertTriangle } from "lucide-react";
import type { HaruSpot, AppLocale } from "@/types/haru";
import type { LocaleMap } from "@/types/haru";
import { cn } from "@/lib/utils";

/**
 * 하루루트의 스팟 카드를 탭했을 때 슬라이드 인되는 상세 시트.
 * 하루웨이의 "하루 흐름" 섹션에서 노출하던 풍부 콘텐츠 (갤러리·왜 여기·여기서 할 것·포토 팁·주의)를
 * 동일한 데이터 모델로 재활용한다.
 *
 * 인수 후 데이터 모델 통합 시 spot_catalog가 details 필드를 갖게 되면
 * 양쪽 페이지가 같은 컴포넌트로 그릴 수 있도록 분리 작성.
 */
export function HaruSpotDetailSheet({
  spot,
  locale,
  open,
  onOpenChange,
}: {
  spot: HaruSpot | null;
  locale: AppLocale;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const t = useTranslations("TravelerHub");
  const [galleryIdx, setGalleryIdx] = useState(0);

  // 시트 열릴 때마다 갤러리 인덱스 초기화
  if (!open && galleryIdx !== 0) {
    // microtask 사용해 렌더 중 setState 회피
    queueMicrotask(() => setGalleryIdx(0));
  }

  if (!spot) return null;

  const name = pickLocale(spot.catalog.name, locale) ?? "Spot";
  const note = pickLocale(spot.guardian_note, locale);
  const whyHere = pickLocale(spot.details?.why_here, locale);
  const whatToDo = pickLocale(spot.details?.what_to_do, locale);
  const photoTip = pickLocale(spot.details?.photo_tip, locale);
  const caution = pickLocale(spot.details?.caution, locale);
  const gallery = spot.details?.gallery_image_urls ?? [];

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        showCloseButton={false}
        className="flex w-full flex-col gap-0 overflow-hidden p-0 sm:max-w-[480px]"
        aria-label={name}
      >
        {/* ── 헤더 (sticky) ───────────────────────────────────────── */}
        <div className="flex shrink-0 items-center gap-3 border-b border-border/50 bg-card px-4 py-3.5">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-2xl dark:bg-emerald-950/40">
            {spot.catalog.category_emoji}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-bold text-foreground">{name}</p>
            <p className="flex items-center gap-1 text-[11px] text-muted-foreground">
              <Clock className="size-3" aria-hidden />
              {t("spotDetailStayLabel", { m: spot.stay_min })}
              {spot.catalog.address ? (
                <>
                  <span aria-hidden className="mx-1 opacity-50">
                    ·
                  </span>
                  <MapPin className="size-3" aria-hidden />
                  <span className="truncate">{spot.catalog.address}</span>
                </>
              ) : null}
            </p>
          </div>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="ml-auto flex size-7 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            aria-label={t("spotDetailCloseAria")}
          >
            <X className="size-4" />
          </button>
        </div>

        {/* ── 본문 (scroll) ────────────────────────────────────────── */}
        <div className="flex flex-1 flex-col gap-5 overflow-y-auto px-4 py-5 sm:px-5">
          {/* 갤러리 */}
          <div
            className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-muted"
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
                  sizes="(max-width: 640px) 100vw, 480px"
                />
                {gallery.length > 1 ? (
                  <>
                    <button
                      type="button"
                      onClick={() => setGalleryIdx((i) => (i - 1 + gallery.length) % gallery.length)}
                      className="absolute left-2 top-1/2 -translate-y-1/2 flex size-8 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-sm hover:bg-black/60"
                      aria-label="prev"
                    >
                      <ChevronLeft className="size-5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setGalleryIdx((i) => (i + 1) % gallery.length)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 flex size-8 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-sm hover:bg-black/60"
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
              <div className="flex h-full flex-col items-center justify-center gap-2 text-muted-foreground">
                <span className="text-5xl" aria-hidden>
                  {spot.catalog.category_emoji}
                </span>
                <p className="text-xs">{t("spotDetailGalleryEmpty")}</p>
              </div>
            )}
          </div>

          {/* 가디언 노트 (짧은 메모) */}
          {note ? (
            <p className="text-sm leading-relaxed text-foreground/90">{note}</p>
          ) : null}

          {/* 왜 여기냐면 */}
          {whyHere ? (
            <DetailBlock
              icon={<Lightbulb className="size-4" />}
              label={t("spotDetailLabelWhyHere")}
              accentClass="text-emerald-700 dark:text-emerald-300"
            >
              {whyHere}
            </DetailBlock>
          ) : null}

          {/* 여기서 할 것 */}
          {whatToDo ? (
            <DetailBlock
              icon={<MapPin className="size-4" />}
              label={t("spotDetailLabelWhatToDo")}
              accentClass="text-[var(--brand-primary)]"
            >
              {whatToDo}
            </DetailBlock>
          ) : null}

          {/* 포토 팁 */}
          {photoTip ? (
            <DetailBlock
              icon={<Camera className="size-4" />}
              label={t("spotDetailLabelPhotoTip")}
              accentClass="text-violet-700 dark:text-violet-300"
            >
              {photoTip}
            </DetailBlock>
          ) : null}

          {/* 주의 */}
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
      </SheetContent>
    </Sheet>
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
    <div className={cn("rounded-2xl border border-border/40 bg-card/50 p-3.5", boxedClass)}>
      <p className={cn("mb-1.5 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider", accentClass ?? "text-primary")}>
        {icon}
        {label}
      </p>
      <p className="text-sm leading-relaxed text-foreground/90 whitespace-pre-line">{children}</p>
    </div>
  );
}

/** locale → en → ko → th → vi 폴백 */
function pickLocale(map: LocaleMap | undefined, locale: AppLocale): string | undefined {
  if (!map) return undefined;
  const order: AppLocale[] = [locale, "en", "ko", "th", "vi"];
  for (const l of order) {
    const v = map[l];
    if (v) return v;
  }
  return undefined;
}
