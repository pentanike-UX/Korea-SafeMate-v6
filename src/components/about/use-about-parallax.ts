"use client";

import { useEffect, useState, type RefObject } from "react";

/**
 * 섹션 배경에만 가벼운 패럴렉스. 모바일·prefers-reduced-motion 에서는 비활성.
 */
export function useAboutParallaxShift(
  containerRef: RefObject<HTMLElement | null>,
  maxShiftPx: number,
): number {
  const [shift, setShift] = useState(0);

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const narrow = window.matchMedia("(max-width: 1023px)").matches;
    if (reduce || narrow) return;

    const onScroll = () => {
      const el = containerRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const vh = window.innerHeight;
      const range = rect.height + vh;
      const t = Math.min(1, Math.max(0, (vh - rect.top) / range));
      setShift((t - 0.5) * 2 * maxShiftPx);
    };

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [containerRef, maxShiftPx]);

  return shift;
}
