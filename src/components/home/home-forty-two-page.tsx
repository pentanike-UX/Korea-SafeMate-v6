import { getLocale, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { mockContentPosts, mockTravelerReviewsHomeSpotlight } from "@/data/mock";
import { Card, CardContent } from "@/components/ui/card";
import { TextActionLink } from "@/components/ui/text-action";
import { HomeHeroCarousel } from "@/components/home/home-hero-carousel";
import { getHomeHeroScopeNoteSecondaryFromSm } from "@/lib/home/hero-scope-note-policy.server";
import { HomeDualCtaSection } from "@/components/home/home-dual-cta-section";
import { HomeExploreBundle } from "@/components/home/home-explore-bundle";
import { FileText, Info, Languages, MessageCircle, ShieldCheck, Star, Zap } from "lucide-react";

const POSTS_PREVIEW = 4;

export async function HomeFortyTwoPage() {
  const t = await getTranslations("Home");
  const tHub = await getTranslations("TravelerHub");
  const tFooter = await getTranslations("Footer");
  const locale = await getLocale();
  const isKo = locale === "ko";
  const scopeNoteSecondaryFromSm = getHomeHeroScopeNoteSecondaryFromSm();

  const seoulPosts = mockContentPosts
    .filter((p) => p.status === "approved" && p.region_slug === "seoul")
    .sort((a, b) => b.popular_score - a.popular_score)
    .slice(0, POSTS_PREVIEW);

  const reviews = mockTravelerReviewsHomeSpotlight();

  const trustItems = [
    ["trust42CardVerified", "trust42CardVerifiedDesc", ShieldCheck],
    ["trust42CardLanguage", "trust42CardLanguageDesc", Languages],
    ["trust42CardReviews", "trust42CardReviewsDesc", MessageCircle],
    ["trust42CardFast", "trust42CardFastDesc", Zap],
  ] as const;

  return (
    <div className="bg-[var(--bg-page)]">
      <HomeHeroCarousel scopeNoteSecondaryFromSm={scopeNoteSecondaryFromSm} />

      <div className="border-border/40 bg-[var(--bg-surface-subtle)] border-b">
        <div className="mx-auto flex min-h-11 max-w-6xl items-center justify-center gap-2 px-4 py-2 text-center text-sm sm:px-6">
          <Info className="text-muted-foreground/70 size-3.5 shrink-0" aria-hidden />
          <p className="text-muted-foreground text-sm leading-snug">{tFooter("disclaimerShort")}</p>
        </div>
      </div>

      <HomeExploreBundle />

      {/* 신뢰 + 후기 — 설득 우선, 한 블록으로 압축 */}
      <section className="border-border/50 border-y bg-card" aria-labelledby="home-credibility-heading">
        <div className="mx-auto max-w-6xl px-4 py-10 sm:px-5 sm:py-14 md:py-16">
          <div className="mb-8 max-w-2xl sm:mb-9">
            <h2 id="home-credibility-heading" className="text-text-strong text-xl font-semibold tracking-tight sm:text-2xl md:text-3xl">
              {t("credibilityTitle")}
            </h2>
            <p className="text-muted-foreground mt-2 text-sm leading-relaxed sm:text-[15px]">{t("credibilityLead")}</p>
          </div>
          <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] lg:items-start lg:gap-10">
            <div className="grid grid-cols-2 gap-2 sm:gap-3">
              {trustItems.map(([title, body, Icon]) => (
                <Card key={title} className="border-border/60 rounded-[var(--radius-md)] border bg-[var(--bg-surface-subtle)] shadow-none">
                  <CardContent className="p-3 sm:p-4">
                    <span className="text-[var(--brand-trust-blue)] mb-2 flex size-8 items-center justify-center rounded-[var(--radius-sm)] bg-[var(--brand-trust-blue-soft)] sm:mb-2.5 sm:size-9">
                      <Icon className="size-4 sm:size-[18px]" strokeWidth={1.75} aria-hidden />
                    </span>
                    <h3 className="text-foreground text-sm font-semibold leading-tight">{t(title)}</h3>
                    <p className="text-muted-foreground mt-1 text-xs leading-relaxed sm:text-[13px]">{t(body)}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
            <div className="flex flex-col gap-4">
              <div className="grid gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3">
                {reviews.map((r) => {
                  const text = isKo ? (r.comment ?? "") : (r.comment_en ?? r.comment ?? "");
                  const timeLabel =
                    locale === "ko"
                      ? r.time_label_ko
                      : locale === "ja"
                        ? (r.time_label_ja ?? r.time_label_en ?? r.time_label_ko)
                        : r.time_label_en;
                  const who = r.reviewer_display_name ?? tHub("reviewsAnonymous");
                  const meta = [who, timeLabel].filter(Boolean).join(" · ");
                  return (
                    <Card key={r.id} className="border-border/70 rounded-[var(--radius-md)] border bg-card/95">
                      <CardContent className="flex flex-col gap-2.5 p-4 sm:p-5">
                        <div className="flex items-center gap-0.5 text-amber-500">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star key={i} className={i < r.rating ? "size-3.5 fill-current sm:size-4" : "size-3.5 fill-current opacity-20 sm:size-4"} aria-hidden />
                          ))}
                        </div>
                        <p className="text-foreground text-sm leading-relaxed">&ldquo;{text}&rdquo;</p>
                        <p className="text-muted-foreground text-[11px] font-medium sm:text-xs">{meta}</p>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
              <div className="flex justify-end">
                <TextActionLink href="/about#traveler-voices" className="text-sm sm:text-[15px]">
                  {t("credibilityReviewsMore")}
                </TextActionLink>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 루트·포스트 증거 — CTA 전에 콘텐츠 신뢰 */}
      <section className="bg-muted/30" aria-labelledby="home-posts-heading">
        <div className="mx-auto max-w-6xl px-4 py-10 sm:px-5 sm:py-14 md:py-16">
          <div className="mb-6 flex flex-col gap-3 sm:mb-8 sm:flex-row sm:items-end sm:justify-between">
            <div className="max-w-xl">
              <h2 id="home-posts-heading" className="text-text-strong text-xl font-semibold tracking-tight sm:text-2xl md:text-3xl">
                {t("postsSectionTitle")}
              </h2>
              <p className="text-muted-foreground mt-2 text-sm leading-relaxed">{t("postsSectionLead")}</p>
            </div>
            <TextActionLink href="/posts" className="shrink-0 self-start sm:self-end">
              {t("postsCta")}
            </TextActionLink>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-4">
            {seoulPosts.map((p) => (
              <Link
                key={p.id}
                href={`/posts/${p.id}`}
                className="border-border/80 bg-card group rounded-[var(--radius-md)] border p-4 shadow-[var(--shadow-sm)] transition-all active:scale-[0.99] sm:p-5 hover:border-[color-mix(in_srgb,var(--brand-trust-blue)_35%,var(--border))] hover:shadow-[var(--shadow-md)]"
              >
                <p className="text-muted-foreground flex items-center gap-1.5 text-[10px] font-semibold tracking-widest uppercase">
                  <FileText className="size-3 text-[var(--brand-trust-blue)]" aria-hidden />
                  {p.tags.slice(0, 2).join(" · ")}
                </p>
                <h3 className="text-foreground mt-2 font-semibold leading-snug group-hover:text-[var(--link-color)]">{p.title}</h3>
                <p className="text-muted-foreground mt-2 line-clamp-2 text-sm">{p.summary}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <HomeDualCtaSection />
    </div>
  );
}
