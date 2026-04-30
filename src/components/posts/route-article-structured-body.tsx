"use client";

import { useTranslations } from "next-intl";
import type { RouteArticleParsed } from "@/lib/post-detail-structured-parse";
import {
  GuardianSignatureQuote,
  PostInfoNarrativeStack,
  PostInfoRouteBeforeNote,
  PostInfoRouteClosingPanel,
  PostInfoRouteSummaryStrip,
} from "@/components/posts/post-info-blocks";

export function RouteArticleStructuredBody({ parsed }: { parsed: RouteArticleParsed }) {
  const t = useTranslations("Posts.routeArticleBlock");

  return (
    <article className="route-editorial-doc space-y-8 sm:space-y-10">
      {parsed.routeSummary ? (
        <PostInfoRouteSummaryStrip label={t("routeSummary")}>{parsed.routeSummary}</PostInfoRouteSummaryStrip>
      ) : null}

      {parsed.beforeYouGo ? (
        <PostInfoRouteBeforeNote label={t("beforeYouGo")}>{parsed.beforeYouGo}</PostInfoRouteBeforeNote>
      ) : null}

      {parsed.narrative ? <PostInfoNarrativeStack text={parsed.narrative} /> : null}

      {parsed.routeClosing ? (
        <PostInfoRouteClosingPanel label={t("routeClosing")}>{parsed.routeClosing}</PostInfoRouteClosingPanel>
      ) : null}

      {parsed.guardianLine ? (
        <GuardianSignatureQuote label={t("guardianQuote")} badge={t("guardianBadge")}>
          {parsed.guardianLine}
        </GuardianSignatureQuote>
      ) : null}
    </article>
  );
}
