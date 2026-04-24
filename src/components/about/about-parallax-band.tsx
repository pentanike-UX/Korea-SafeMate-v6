"use client";

import Image from "next/image";
import { useRef } from "react";
import { useAboutParallaxShift } from "@/components/about/use-about-parallax";
import { cn } from "@/lib/utils";
import { FILL_IMAGE_COVER_CENTER } from "@/lib/ui/fill-image";

type Props = {
  imageSrc: string;
  imageAlt: string;
  parallaxMax?: number;
  minHeightClass?: string;
  overlayClassName?: string;
  className?: string;
  children: React.ReactNode;
};

/** 시네마틱·중간 히어로용 — 데스크톱에서만 패럴렉스 */
export function AboutParallaxBand({
  imageSrc,
  imageAlt,
  parallaxMax = 40,
  minHeightClass = "min-h-[22rem] md:min-h-[28rem]",
  overlayClassName,
  className,
  children,
}: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const shift = useAboutParallaxShift(ref, parallaxMax);

  return (
    <div ref={ref} className={cn("relative isolate overflow-hidden", minHeightClass, className)}>
      <div className="absolute inset-0 -z-10" aria-hidden>
        <div
          className="absolute inset-[-12%] will-change-transform motion-reduce:transform-none"
          style={{ transform: `translate3d(0, ${shift}px, 0)` }}
        >
          <Image src={imageSrc} alt={imageAlt} fill className={FILL_IMAGE_COVER_CENTER} sizes="100vw" />
        </div>
        <div className={cn("absolute inset-0 bg-gradient-to-r from-black/75 via-black/55 to-black/70", overlayClassName)} />
      </div>
      {children}
    </div>
  );
}
