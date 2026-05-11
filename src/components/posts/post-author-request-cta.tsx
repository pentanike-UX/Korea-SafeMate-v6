"use client";

import { useCallback } from "react";
import { useTranslations } from "next-intl";
import {
  GuardianRequestOpenTrigger,
  type GuardianRequestOpenDetail,
} from "@/components/guardians/guardian-request-sheet";
import {
  GUARDIAN_INQUIRY_OPEN_EVENT,
  type GuardianInquiryOpenDetail,
} from "@/components/guardians/guardian-inquiry-sheet";
import { cn } from "@/lib/utils";
import { MessageCircle, ClipboardList } from "lucide-react";

/** 포스트 작성 가디언에게 두 가지 CTA를 함께 표시:
 *  - 문의하기: 즉각 간단 문의 (문의 시트)
 *  - 요청하기: 시간이 필요한 맞춤 의뢰 (기존 요청 시트)
 */
export function PostAuthorRequestCta({
  openDetail,
  className,
}: {
  openDetail: GuardianRequestOpenDetail & { guardianUserId: string; postId: string; postTitle: string };
  className?: string;
}) {
  const t = useTranslations("GuardianRequest");

  const handleInquiry = useCallback(() => {
    window.dispatchEvent(
      new CustomEvent<GuardianInquiryOpenDetail>(GUARDIAN_INQUIRY_OPEN_EVENT, {
        detail: {
          guardianUserId: openDetail.guardianUserId,
          displayName: openDetail.displayName,
          headline: openDetail.headline,
          avatarUrl: openDetail.avatarUrl,
        },
      }),
    );
  }, [openDetail]);

  return (
    <div className={cn("flex flex-col gap-2.5", className)}>
      {/* 문의하기 — 온라인·즉각 간단 문의 */}
      <button
        type="button"
        onClick={handleInquiry}
        className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-emerald-500/50 bg-emerald-50 font-semibold text-emerald-700 text-sm transition-colors hover:bg-emerald-100 dark:bg-emerald-950/30 dark:text-emerald-400 dark:hover:bg-emerald-950/50"
      >
        <MessageCircle className="size-4" aria-hidden />
        지금 문의하기
      </button>
      <p className="text-center text-[11px] text-muted-foreground">지금 바로 답변 받을 수 있어요</p>

      {/* 요청하기 — 날짜·인원·예산 포함 맞춤 의뢰 */}
      <GuardianRequestOpenTrigger
        className={cn("inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl font-semibold text-sm", "bg-primary text-primary-foreground hover:bg-primary/90 transition-colors")}
        openDetail={openDetail}
      >
        <ClipboardList className="size-4" aria-hidden />
        {t("openCta")}
      </GuardianRequestOpenTrigger>
      <p className="text-center text-[11px] text-muted-foreground">날짜·인원·예산을 함께 보내는 맞춤 의뢰</p>
    </div>
  );
}
