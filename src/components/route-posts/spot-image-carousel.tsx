"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { SpotGallerySlide } from "@/lib/spot-image-gallery";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

function CarouselSlideImg({
  slide,
  loading,
  onFailed,
}: {
  slide: SpotGallerySlide;
  loading: "lazy" | "eager";
  onFailed: () => void;
}) {
  const [tryIdx, setTryIdx] = useState(0);
  const src = slide.tryUrls[tryIdx];

  const handleError = useCallback(() => {
    if (tryIdx < slide.tryUrls.length - 1) {
      setTryIdx((i) => i + 1);
    } else {
      onFailed();
    }
  }, [tryIdx, slide.tryUrls.length, onFailed]);

  if (slide.tryUrls.length === 0) {
    return null;
  }

  if (!src) {
    return null;
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={slide.alt}
      loading={loading}
      onError={handleError}
      className="h-full w-full object-cover"
      draggable={false}
    />
  );
}

/**
 * 스팟 이미지 캐러셀 — 최대 10장, 스와이프·좌우 버튼·카운터
 * 부모에서 `key`를 바꾸면 깨진 슬라이드 제거 상태가 초기화됩니다.
 */
export function SpotImageCarousel({
  slides,
  className,
}: {
  slides: SpotGallerySlide[];
  className?: string;
}) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);
  const [droppedFirstUrls, setDroppedFirstUrls] = useState<Set<string>>(() => new Set());

  const visibleSlides = useMemo(
    () =>
      slides.filter((s) => s.tryUrls.length > 0 && !droppedFirstUrls.has(s.tryUrls[0] ?? "")),
    [slides, droppedFirstUrls],
  );

  const count = visibleSlides.length;
  const showControls = count > 1;
  const safeIndex = Math.min(index, Math.max(0, count - 1));

  const scrollToIdx = useCallback((i: number) => {
    const el = scrollerRef.current;
    if (!el) return;
    const w = el.clientWidth;
    el.scrollTo({ left: i * w, behavior: "smooth" });
    setIndex(i);
  }, []);

  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;
    const onScroll = () => {
      const w = el.clientWidth || 1;
      const i = Math.round(el.scrollLeft / w);
      setIndex(Math.max(0, Math.min(i, count - 1)));
    };
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, [count]);

  const removeSlideByFirstUrl = useCallback((firstUrl: string) => {
    if (!firstUrl) return;
    setDroppedFirstUrls((prev) => new Set(prev).add(firstUrl));
    setIndex(0);
    requestAnimationFrame(() => {
      scrollerRef.current?.scrollTo({ left: 0, behavior: "auto" });
    });
  }, []);

  if (visibleSlides.length === 0) {
    return (
      <div
        className={cn(
          "flex aspect-[16/10] items-center justify-center rounded-xl border border-dashed border-border/40 bg-muted/30 text-xs text-muted-foreground",
          className,
        )}
      >
        이미지를 불러오지 못했습니다
      </div>
    );
  }

  const currentCaption = visibleSlides[safeIndex]?.caption ?? visibleSlides[safeIndex]?.title;

  return (
    <div className={cn("space-y-2", className)}>
      <div className="relative overflow-hidden rounded-xl border border-border/50 bg-muted/20">
        <div
          ref={scrollerRef}
          className={cn(
            "flex aspect-[16/10] w-full snap-x snap-mandatory overflow-x-auto scroll-smooth [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
            showControls ? "touch-pan-x" : "",
          )}
        >
          {visibleSlides.map((slide, i) => (
            <div
              key={`${slide.tryUrls[0] ?? "s"}-${i}`}
              className="relative w-full min-w-full shrink-0 snap-center snap-always"
            >
              <CarouselSlideImg
                slide={slide}
                loading={i === 0 ? "eager" : "lazy"}
                onFailed={() => removeSlideByFirstUrl(slide.tryUrls[0] ?? "")}
              />
            </div>
          ))}
        </div>

        {showControls ? (
          <>
            <button
              type="button"
              aria-label="이전 이미지"
              onClick={() => scrollToIdx(Math.max(0, safeIndex - 1))}
              className="absolute top-1/2 left-1.5 z-10 hidden -translate-y-1/2 rounded-full border border-border/50 bg-background/90 p-1.5 text-foreground shadow-sm sm:inline-flex"
            >
              <ChevronLeft className="size-4" />
            </button>
            <button
              type="button"
              aria-label="다음 이미지"
              onClick={() => scrollToIdx(Math.min(count - 1, safeIndex + 1))}
              className="absolute top-1/2 right-1.5 z-10 hidden -translate-y-1/2 rounded-full border border-border/50 bg-background/90 p-1.5 text-foreground shadow-sm sm:inline-flex"
            >
              <ChevronRight className="size-4" />
            </button>
            <div className="absolute bottom-2 right-2 z-10 rounded-full bg-background/80 px-2 py-0.5 text-[10px] font-medium tabular-nums text-foreground/90 shadow-sm backdrop-blur-sm">
              {safeIndex + 1} / {count}
            </div>
          </>
        ) : null}
      </div>

      {currentCaption ? (
        <p className="line-clamp-2 text-center text-[10px] text-muted-foreground leading-snug">{currentCaption}</p>
      ) : null}
    </div>
  );
}
