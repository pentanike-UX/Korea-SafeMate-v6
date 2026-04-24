"use client";

import { useEffect, useState } from "react";
import { usePathname } from "@/i18n/navigation";

/**
 * Home hero is a dark full-bleed surface; below it the page is light.
 * Returns whether the sticky header should use light-on-dark styling.
 */
export function useHomeHeaderContrast(): "dark" | "light" {
  const pathname = usePathname();
  const isHome = pathname === "/";
  const [mode, setMode] = useState<"dark" | "light">(() => (isHome ? "dark" : "light"));

  useEffect(() => {
    if (!isHome) {
      setMode("light");
      return;
    }

    const el = document.getElementById("home-hero-root");
    if (!el) {
      setMode("dark");
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const e = entries[0];
        if (!e) return;
        const ratio = e.intersectionRatio;
        const dark = e.isIntersecting && ratio >= 0.06;
        setMode(dark ? "dark" : "light");
      },
      {
        root: null,
        rootMargin: "-52px 0px 0px 0px",
        threshold: [0, 0.02, 0.04, 0.06, 0.1, 0.15, 0.25, 0.4, 0.6, 0.85, 1],
      },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [isHome]);

  return isHome ? mode : "light";
}
