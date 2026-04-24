import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import type { ContentPost } from "@/types/domain";
import { getPostHeroImageAlt, getPostHeroImageUrl } from "@/lib/content-post-route";
import { resolveRelatedReasonKey } from "@/lib/post-related-reason";
import { resolvePostTypeLabelKey } from "@/lib/post-detail-type-label";
import { RelatedPostsBrowseSheet } from "@/components/posts/related-posts-browse-sheet";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { ChevronRight } from "lucide-react";

const INLINE_CARD_COUNT = 6;

export async function PostDetailRelatedSection({
  current,
  related,
}: {
  current: ContentPost;
  related: ContentPost[];
}) {
  const t = await getTranslations("Posts");
  if (related.length === 0) return null;

  const sheetItems = related.map((r) => ({
    id: r.id,
    title: r.title,
    summary: r.summary,
    imageUrl: getPostHeroImageUrl(r),
    kind: r.kind,
    hero_subject: r.hero_subject,
  }));

  const gridItems = related.slice(0, INLINE_CARD_COUNT);

  return (
    <section className="border-border/50 border-t bg-card/90" aria-labelledby="post-related-heading">
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <h2 id="post-related-heading" className="text-text-strong text-xl font-semibold">
            {t("relatedTitle")}
          </h2>
          <RelatedPostsBrowseSheet
            items={sheetItems}
            sheetTitle={t("relatedBrowseSheetTitle")}
            triggerLabel={t("relatedBrowseTrigger")}
          />
        </div>

        <ul className="mt-8 grid list-none gap-4 p-0 sm:grid-cols-2 lg:grid-cols-3">
          {gridItems.map((rel) => {
            const reasonKey = resolveRelatedReasonKey(current, rel);
            const typeKey = resolvePostTypeLabelKey(rel);
            const thumb = getPostHeroImageUrl(rel);
            const thumbAlt = getPostHeroImageAlt(rel);

            return (
              <li key={rel.id}>
                <Link
                  href={`/posts/${rel.id}`}
                  className={cn(
                    "border-border/60 bg-card/95 group flex h-full flex-col overflow-hidden rounded-2xl border shadow-[var(--shadow-sm)] transition-colors",
                    "hover:border-primary/35 hover:bg-card focus-visible:ring-ring focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none",
                  )}
                >
                  <div className="border-border/50 relative aspect-[16/10] w-full shrink-0 overflow-hidden border-b bg-muted">
                    <Image
                      src={thumb}
                      alt={thumbAlt}
                      fill
                      className="object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                      sizes="(max-width:1024px) 100vw, 33vw"
                    />
                  </div>
                  <div className="flex min-h-0 flex-1 flex-col gap-2 p-4 sm:p-5">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="secondary" className="rounded-full text-xs font-semibold">
                        {t(typeKey)}
                      </Badge>
                      {reasonKey ? (
                        <span className="text-muted-foreground text-[11px] font-medium">{t(reasonKey)}</span>
                      ) : null}
                    </div>
                    <p className="text-text-strong group-hover:text-primary line-clamp-2 text-base font-semibold leading-snug tracking-tight">
                      {rel.title}
                    </p>
                    <p className="text-muted-foreground line-clamp-2 min-h-10 text-sm leading-relaxed">{rel.summary}</p>
                    <span className="text-primary mt-auto inline-flex items-center gap-1 text-sm font-semibold">
                      {t("relatedCardRead")}
                      <ChevronRight className="size-4 transition-transform group-hover:translate-x-0.5" aria-hidden />
                    </span>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
