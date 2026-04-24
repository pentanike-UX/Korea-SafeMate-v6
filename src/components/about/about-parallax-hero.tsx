"use client";

import Image from "next/image";
import { useRef } from "react";
import { useAboutParallaxShift } from "@/components/about/use-about-parallax";
import { FILL_IMAGE_MARKETING_HERO_FULLBLEED } from "@/lib/ui/fill-image";
import { cn } from "@/lib/utils";

type Props = {
  imageSrc: string;
  imageAlt: string;
  priority?: boolean;
  overlayClassName?: string;
  parallaxMax?: number;
  className?: string;
  children: React.ReactNode;
};

export function AboutParallaxHero({
  imageSrc,
  imageAlt,
  priority,
  overlayClassName,
  parallaxMax = 64,
  className,
  children,
}: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const shift = useAboutParallaxShift(ref, parallaxMax);

  return (
    <div ref={ref} className={cn("relative isolate min-h-[min(100dvh,52rem)] overflow-hidden", className)}>
      <div className="absolute inset-0 -z-10" aria-hidden>
        <div
          className="absolute inset-[-14%] will-change-transform motion-reduce:transform-none"
          style={{ transform: `translate3d(0, ${shift}px, 0)` }}
        >
          <Image
            src={imageSrc}
            alt={imageAlt}
            fill
            priority={priority}
            className={FILL_IMAGE_MARKETING_HERO_FULLBLEED}
            sizes="100vw"
          />
        </div>
        <div
          className={cn(
            "absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-[var(--bg-page)]",
            overlayClassName,
          )}
        />
      </div>
      {children}
    </div>
  );
}
