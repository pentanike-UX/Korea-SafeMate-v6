"use client";

import Image from "next/image";
import { useTranslations } from "next-intl";
import { MessageCircle, Sparkles, Clock, Calendar, MapPin } from "lucide-react";
import { GUARDIAN_INQUIRY_OPEN_EVENT, type GuardianInquiryOpenDetail } from "@/components/guardians/guardian-inquiry-sheet";
import { cn } from "@/lib/utils";

/**
 * 매칭 성공 직후 — 가디언 매칭 임팩트 카드.
 * 데모: 박도윤(또는 다른 큐레이션된 가디언)이 자동 답변을 보낸 것처럼 노출하고,
 *       채팅 직행 CTA + 다음 단계 미니 타임라인을 함께 제공.
 */
export function MatchedGuardianHeroCard({
  guardianUserId,
  guardianDisplayName,
  guardianHeadline,
  guardianAvatarUrl,
}: {
  guardianUserId: string;
  guardianDisplayName: string;
  guardianHeadline?: string;
  guardianAvatarUrl?: string;
}) {
  const t = useTranslations("BookingSuccess");

  const handleOpenChat = () => {
    window.dispatchEvent(
      new CustomEvent<GuardianInquiryOpenDetail>(GUARDIAN_INQUIRY_OPEN_EVENT, {
        detail: {
          guardianUserId,
          displayName: guardianDisplayName,
          headline: guardianHeadline,
          avatarUrl: guardianAvatarUrl,
        },
      }),
    );
  };

  return (
    <div className="mx-auto max-w-2xl">
      {/* 매칭 헤더 */}
      <div className="relative overflow-hidden rounded-3xl border border-emerald-200/60 bg-gradient-to-br from-emerald-50 via-card to-card p-6 shadow-[var(--shadow-md)] dark:border-emerald-700/30 dark:from-emerald-950/30">
        {/* 글로우 효과 */}
        <div className="pointer-events-none absolute -top-12 -right-12 size-40 rounded-full bg-emerald-400/20 blur-3xl" aria-hidden />

        <div className="relative flex items-start gap-4">
          {/* 가디언 아바타 */}
          <div className="relative size-16 shrink-0 overflow-hidden rounded-2xl border-2 border-white shadow-md sm:size-20">
            {guardianAvatarUrl ? (
              <Image src={guardianAvatarUrl} alt={guardianDisplayName} fill className="object-cover" sizes="80px" />
            ) : (
              <div className="flex h-full items-center justify-center bg-emerald-100 text-2xl font-bold text-emerald-700">
                {guardianDisplayName.slice(0, 1)}
              </div>
            )}
            {/* online dot */}
            <span className="absolute right-1 bottom-1 size-3 rounded-full border-2 border-white bg-emerald-500" aria-hidden />
          </div>

          <div className="min-w-0 flex-1">
            <p className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-700 dark:bg-emerald-500/25 dark:text-emerald-300">
              <Sparkles className="size-3" aria-hidden /> Matched
            </p>
            <h1 className="mt-2 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              {t("matchedHeading", { name: guardianDisplayName })}
            </h1>
            {guardianHeadline ? (
              <p className="mt-1 text-sm text-muted-foreground">{guardianHeadline}</p>
            ) : null}
          </div>
        </div>

        <p className="mt-4 text-sm leading-relaxed text-foreground/80">
          {t("matchedSubline", { name: guardianDisplayName })}
        </p>

        {/* 가짜 자동 답변 미리보기 */}
        <div className="mt-5 rounded-2xl border border-emerald-200/60 bg-card p-3.5 shadow-sm dark:border-emerald-700/30">
          <div className="mb-1.5 flex items-center gap-1.5">
            <span className="inline-flex items-center gap-1 rounded-full bg-violet-500/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-violet-700 dark:text-violet-300">
              <Sparkles className="size-3" aria-hidden />
              {t("autoReplyBadge")}
            </span>
            <span className="text-[10px] font-medium text-muted-foreground">{guardianDisplayName}</span>
          </div>
          <p className="text-sm leading-relaxed text-foreground/90">{t("autoReplyExample")}</p>
        </div>

        {/* CTA */}
        <button
          type="button"
          onClick={handleOpenChat}
          className="mt-5 inline-flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-[var(--brand-primary)] text-base font-semibold text-[var(--text-on-brand)] shadow-[var(--shadow-brand)] transition-all hover:opacity-95 hover:scale-[1.01] active:scale-[0.99]"
        >
          <MessageCircle className="size-5" aria-hidden />
          {t("chatNowCta", { name: guardianDisplayName })}
        </button>
      </div>

      {/* 다음 단계 미니 타임라인 */}
      <div className="mt-6">
        <p className="mb-3 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
          {t("nextStepsHeading")}
        </p>
        <ol className="space-y-3">
          <NextStepRow
            icon={<MessageCircle className="size-4" />}
            iconClass="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300"
            active
            title={t("nextStep1Title")}
            body={t("nextStep1Body")}
          />
          <NextStepRow
            icon={<Clock className="size-4" />}
            iconClass="bg-muted text-muted-foreground"
            title={t("nextStep2Title")}
            body={t("nextStep2Body", { name: guardianDisplayName })}
          />
          <NextStepRow
            icon={<Calendar className="size-4" />}
            iconClass="bg-muted text-muted-foreground"
            title={t("nextStep3Title")}
            body={t("nextStep3Body")}
          />
        </ol>
      </div>
    </div>
  );
}

function NextStepRow({
  icon,
  iconClass,
  title,
  body,
  active,
}: {
  icon: React.ReactNode;
  iconClass?: string;
  title: string;
  body: string;
  active?: boolean;
}) {
  return (
    <li
      className={cn(
        "flex items-start gap-3 rounded-2xl border p-3.5 transition-colors",
        active
          ? "border-emerald-200/60 bg-emerald-50/30 dark:border-emerald-700/30 dark:bg-emerald-950/15"
          : "border-border/40 bg-card/50",
      )}
    >
      <span className={cn("flex size-9 shrink-0 items-center justify-center rounded-xl", iconClass)}>{icon}</span>
      <div className="min-w-0 flex-1">
        <p className={cn("text-sm font-semibold", active ? "text-foreground" : "text-foreground/85")}>{title}</p>
        <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">{body}</p>
      </div>
      {active ? <MapPin className="size-4 shrink-0 text-emerald-600 dark:text-emerald-400" aria-hidden /> : null}
    </li>
  );
}
