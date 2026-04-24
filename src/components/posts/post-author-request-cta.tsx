"use client";

import { useTranslations } from "next-intl";
import {
  GuardianRequestOpenTrigger,
  type GuardianRequestOpenDetail,
} from "@/components/guardians/guardian-request-sheet";
import { cn } from "@/lib/utils";

/** 포스트 작성 가디언에게 요청 — 시트에 가디언·포스트 맥락을 한 번에 전달(전역 시트와 동일) */
export function PostAuthorRequestCta({
  openDetail,
  className,
}: {
  openDetail: GuardianRequestOpenDetail & { guardianUserId: string; postId: string; postTitle: string };
  className?: string;
}) {
  const t = useTranslations("GuardianRequest");
  return (
    <GuardianRequestOpenTrigger
      className={cn("h-11 w-full rounded-xl font-semibold", className)}
      openDetail={openDetail}
    >
      {t("openCta")}
    </GuardianRequestOpenTrigger>
  );
}
