"use client";

import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";

/** 요청 시트 안내 — 포스트 사이드바·루트 하단 CTA 등 동일 문구 */
export function GuardianRequestIntakeBullets({ className }: { className?: string }) {
  const tReq = useTranslations("GuardianRequest");
  return (
    <ul className={cn("text-muted-foreground list-inside list-disc space-y-1 text-xs leading-relaxed", className)}>
      <li>{tReq("asideBulletHalfFull")}</li>
      <li>{tReq("asideBulletRegion")}</li>
      <li>{tReq("asideBulletTheme")}</li>
      <li>{tReq("asideBulletFlexible")}</li>
    </ul>
  );
}
