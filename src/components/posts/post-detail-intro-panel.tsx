"use client";

import { useTranslations } from "next-intl";
import {
  POST_DETAIL_PARAGRAPH_STACK,
  POST_DETAIL_PROSE_P_MAIN,
  splitPostBodyParagraphs,
} from "@/lib/post-detail-body-split";
import { cn } from "@/lib/utils";

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
      <section className="border-border/40 max-w-[42rem] border-t pt-7 sm:pt-8">
        <p className="text-muted-foreground text-[10px] font-semibold tracking-[0.2em] uppercase">{t("detailIntroEyebrow")}</p>
        <div className={cn(POST_DETAIL_PARAGRAPH_STACK, "mt-4")}>
          {paras.map((block, i) => (
            <p key={i} className={POST_DETAIL_PROSE_P_MAIN}>
              {block}
            </p>
          ))}
        </div>
      </section>
    );
  }

  const p = primary.trim();
  const s = secondary?.trim() ?? "";

  const leadParas = p ? splitPostBodyParagraphs(p) : [];

  return (
    <section className="border-border/40 max-w-[42rem] border-t pt-7 sm:pt-8">
      <p className="text-muted-foreground text-[10px] font-semibold tracking-[0.2em] uppercase">{tRoute("introEyebrow")}</p>
      {leadParas.length > 0 ? (
        <div className={cn(POST_DETAIL_PARAGRAPH_STACK, "mt-4")}>
          {leadParas.map((block, i) => (
            <p key={i} className={cn(POST_DETAIL_PROSE_P_MAIN, "text-[15px] leading-[1.65] sm:text-base sm:leading-relaxed")}>
              {block}
            </p>
          ))}
        </div>
      ) : (
        <p className="text-muted-foreground mt-4 text-[15px] leading-relaxed whitespace-pre-line">{tRoute("introFallbackMinimal")}</p>
      )}
      {s ? (
        <aside className="border-border/50 text-muted-foreground mt-8 border-l-2 pl-4 text-sm leading-relaxed">
          <p className="text-[10px] font-semibold tracking-wide uppercase">{tRoute("introForWhoLabel")}</p>
          <div className={`mt-2 ${POST_DETAIL_PARAGRAPH_STACK}`}>
            {splitPostBodyParagraphs(s).map((block, i) => (
              <p key={i} className="text-foreground font-medium whitespace-pre-line">
                {block}
              </p>
            ))}
          </div>
        </aside>
      ) : null}
    </section>
  );
}
