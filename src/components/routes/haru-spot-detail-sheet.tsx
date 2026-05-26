"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { MapPin, Clock, ChevronLeft, ChevronRight, Camera, Lightbulb, AlertTriangle } from "lucide-react";
import type { HaruSpot, AppLocale } from "@/types/haru";
import type { LocaleMap } from "@/types/haru";
import { cn } from "@/lib/utils";
import { SpotSoundtrackHero } from "@/components/routes/spot-soundtrack-hero";
import { ArtistSpotlight } from "@/components/routes/artist-spotlight";
import { SpotTypeChips } from "@/components/route-posts/spot-type-chips";
import { SpotCommercePanel } from "@/components/route-posts/spot-commerce-panel";
import type { HaruRouteSpotType } from "@/types/domain";

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
  side = "right",
}: {
  spot: HaruSpot | null;
  locale: AppLocale;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** 데스크톱: "right" 슬라이드 인 / 모바일: "bottom" 하단 시트 */
  side?: "right" | "bottom";
}) {
  const t = useTranslations("TravelerHub");
  const [galleryIdx, setGalleryIdx] = useState(0);

  // 시트 열릴 때마다 갤러리 인덱스 초기화
  if (!open && galleryIdx !== 0) {
    // microtask 사용해 렌더 중 setState 회피
    queueMicrotask(() => setGalleryIdx(0));
  }

  // 모바일 전체화면 시트 — 폰 '뒤로가기'(history popstate)로 닫히게 연동.
  // onOpenChange는 부모에서 매 렌더 새 함수일 수 있어 ref로 고정(effect는 open에만 의존).
  const onOpenChangeRef = useRef(onOpenChange);
  useEffect(() => {
    onOpenChangeRef.current = onOpenChange;
  }, [onOpenChange]);
  useEffect(() => {
    if (!open || typeof window === "undefined") return;
    let closedByPop = false;
    window.history.pushState({ haruSpotSheet: true }, "");
    const onPop = () => {
      closedByPop = true;
      onOpenChangeRef.current(false);
    };
    window.addEventListener("popstate", onPop);
    return () => {
      window.removeEventListener("popstate", onPop);
      // UI로 닫은 경우에만 우리가 넣은 history 항목을 정리(중복 pop 방지).
      if (!closedByPop && window.history.state?.haruSpotSheet) {
        window.history.back();
      }
    };
  }, [open]);

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
        side={side}
        showCloseButton={false}
        className={cn(
          "flex w-full flex-col gap-0 overflow-hidden p-0",
          // 데스크톱: 우측 슬라이드. 화면 절반 미만으로 제한해 지도가 살아있게.
          "data-[side=right]:w-full data-[side=right]:sm:max-w-[440px] data-[side=right]:md:max-w-[440px] data-[side=right]:lg:max-w-[480px] data-[side=right]:xl:max-w-[520px]",
          // 모바일 bottom sheet: 90vh + 핸들바
          "data-[side=bottom]:max-h-[90vh] data-[side=bottom]:rounded-t-3xl",
        )}
        aria-label={name}
      >
        {/* 모바일 bottom sheet 핸들바 */}
        {side === "bottom" ? (
          <div className="flex shrink-0 justify-center pt-2 pb-1" aria-hidden>
            <span className="bg-muted-foreground/30 h-1 w-10 rounded-full" />
          </div>
        ) : null}

        {/* ── 헤더 (sticky) — 모바일 전체화면에서 뒤로가기 화살표로 닫음 ── */}
        <div className="flex shrink-0 items-center gap-2 border-b border-border/50 bg-card px-2 py-2.5 sm:gap-3 sm:px-4 sm:py-3.5">
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="flex size-10 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            aria-label={t("spotDetailCloseAria")}
          >
            <ChevronLeft className="size-5" />
          </button>
          <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-2xl dark:bg-emerald-950/40">
            {spot.catalog.category_emoji}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-bold text-foreground">{name}</p>
            <p className="flex min-w-0 items-center gap-1 text-[11px] text-muted-foreground">
              <Clock className="size-3 shrink-0" aria-hidden />
              <span className="shrink-0">{t("spotDetailStayLabel", { m: spot.stay_min })}</span>
              {spot.catalog.address ? (
                <>
                  <span aria-hidden className="mx-1 shrink-0 opacity-50">
                    ·
                  </span>
                  <MapPin className="size-3 shrink-0" aria-hidden />
                  <span className="truncate">{spot.catalog.address}</span>
                </>
              ) : null}
            </p>
          </div>
        </div>

        {/* ── 본문 (scroll) ────────────────────────────────────────── */}
        <div className="flex flex-1 flex-col gap-5 overflow-y-auto px-4 py-5 sm:px-5 lg:px-7 lg:py-7 lg:gap-6">
          {/* 갤러리 — 데스크탑에서는 16/10 비율로 더 시원하게 */}
          <div
            className="relative w-full shrink-0 aspect-[4/3] lg:aspect-[16/10] overflow-hidden rounded-2xl bg-muted"
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
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 600px, (max-width: 1280px) 780px, 1080px"
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

          {/* 스팟 역할 칩 (scene/photo/buy/rest/...) — 복수 가능 */}
          {spot.spot_types && spot.spot_types.length > 0 ? (
            <SpotTypeChips spotTypes={spot.spot_types as HaruRouteSpotType[]} />
          ) : null}

          {/* 사운드트랙 영웅 — 이 스팟의 메인 곡 한 곡 큐레이션 (C 패턴) */}
          {spot.soundtrack ? <SpotSoundtrackHero spot={spot} locale={locale} /> : null}

          {/* 하루이 노트 (짧은 메모) */}
          {note ? (
            <p className="text-sm leading-relaxed text-foreground/90">{note}</p>
          ) : null}

          {/* 결제 가능 스팟 패널 (commerce.is_commerce_spot=true 일 때만 노출) */}
          {spot.commerce ? <SpotCommercePanel commerce={spot.commerce} /> : null}

          {/* Artist Spotlight — 트랙 라이브러리 + 공식 영상 + 외부 링크 (B 패턴) */}
          {spot.artists && spot.artists.length > 0 ? (
            <ArtistSpotlight artists={spot.artists} />
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
