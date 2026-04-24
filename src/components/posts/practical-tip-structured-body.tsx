import { getTranslations } from "next-intl/server";
import type { PracticalTipParsed } from "@/lib/post-detail-structured-parse";
import {
  GuardianSignatureQuote,
  PostInfoActionNote,
  PostInfoChecklist,
  PostInfoContextCard,
  PostInfoKeyNote,
  PostInfoSummaryPanel,
  PostInfoTipCards,
  PostInfoWarningNote,
} from "@/components/posts/post-info-blocks";

export async function PracticalTipStructuredBody({ parsed }: { parsed: PracticalTipParsed }) {
  const t = await getTranslations("Posts.infoBlock");

  return (
    <div className="space-y-6 sm:space-y-8">
      {parsed.situation ? (
        <PostInfoContextCard label={t("situation")}>{parsed.situation}</PostInfoContextCard>
      ) : null}

      {parsed.conclusion ? <PostInfoKeyNote label={t("conclusion")}>{parsed.conclusion}</PostInfoKeyNote> : null}

      {parsed.coreTips.length > 0 ? <PostInfoTipCards label={t("coreTips")} tips={parsed.coreTips} /> : null}

      {parsed.checklist.length > 0 ? <PostInfoChecklist label={t("checklist")} items={parsed.checklist} /> : null}

      {parsed.fieldTips ? (
        <PostInfoActionNote label={t("fieldTips")}>{parsed.fieldTips}</PostInfoActionNote>
      ) : null}

      {parsed.mistakes ? (
        <PostInfoWarningNote label={t("mistakes")}>{parsed.mistakes}</PostInfoWarningNote>
      ) : null}

      {parsed.summary ? (
        <PostInfoSummaryPanel label={t("summary")}>{parsed.summary}</PostInfoSummaryPanel>
      ) : null}

      {parsed.guardianLine ? (
        <GuardianSignatureQuote label={t("guardianQuote")} badge={t("guardianBadge")}>
          {parsed.guardianLine}
        </GuardianSignatureQuote>
      ) : null}
    </div>
  );
}
