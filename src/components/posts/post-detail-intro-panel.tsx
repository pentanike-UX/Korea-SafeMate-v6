"use client";

import { useTranslations } from "next-intl";
import { Card, CardContent } from "@/components/ui/card";
import {
  POST_DETAIL_PARAGRAPH_STACK,
  POST_DETAIL_PROSE_P_MAIN,
  splitPostBodyParagraphs,
} from "@/lib/post-detail-body-split";
export function PostDetailIntroPanel({
  variant,
  primary,
  secondary,
}: {
  variant: "article" | "route";
  primary: string;
  /** e.g. recommended traveler types joined */
  secondary?: string | null;
}) {
  const t = useTranslations("Posts");
  const tRoute = useTranslations("RoutePosts");

  if (variant === "article") {
    const p = primary.trim();
    if (!p) return null;
    const paras = splitPostBodyParagraphs(p);
    return (
      <Card className="border-border/60 rounded-2xl border bg-white/90 shadow-[var(--shadow-sm)]">
        <CardContent className="space-y-4 p-5 sm:p-6">
          <p className="text-primary text-[10px] font-bold tracking-[0.2em] uppercase">{t("detailIntroEyebrow")}</p>
          <div className={POST_DETAIL_PARAGRAPH_STACK}>
            {paras.map((block, i) => (
              <p key={i} className={POST_DETAIL_PROSE_P_MAIN}>
                {block}
              </p>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const p = primary.trim();
  const s = secondary?.trim() ?? "";

  const leadParas = p ? splitPostBodyParagraphs(p) : [];

  return (
    <Card className="border-border/60 rounded-2xl border bg-white/90 shadow-[var(--shadow-sm)]">
      <CardContent className="space-y-4 p-5 sm:p-6">
        {/* route는 하루이 귀속 표현 제거 — 하루웨이 자체 소개 아이브로우 사용 */}
        <p className="text-primary text-[10px] font-bold tracking-[0.2em] uppercase">
          {tRoute("introEyebrow")}
        </p>
        {leadParas.length > 0 ? (
          <div className={POST_DETAIL_PARAGRAPH_STACK}>
            {leadParas.map((block, i) => (
              <p key={i} className={POST_DETAIL_PROSE_P_MAIN}>
                {block}
              </p>
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground text-sm leading-relaxed whitespace-pre-line">
            {tRoute("introFallbackMinimal")}
          </p>
        )}
        {s ? (
          <div className="border-border/50 rounded-xl border bg-muted/20 px-3 py-2.5">
            <p className="text-muted-foreground text-[10px] font-bold tracking-wide uppercase">{tRoute("introForWhoLabel")}</p>
            <div className={`mt-2 ${POST_DETAIL_PARAGRAPH_STACK}`}>
              {splitPostBodyParagraphs(s).map((block, i) => (
                <p key={i} className="text-foreground text-sm font-medium leading-relaxed whitespace-pre-line">
                  {block}
                </p>
              ))}
            </div>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
