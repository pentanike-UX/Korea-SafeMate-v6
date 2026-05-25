"use client";

import Image from "next/image";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import type { ContentPost } from "@/types/domain";
import { PostSampleBadge } from "@/components/posts/post-sample-badge";
import { SaveTravelerPostButton } from "@/components/posts/save-traveler-post-button";
import { Badge } from "@/components/ui/badge";
import { postHeroCoverClass } from "@/lib/post-image-crop";
import { cn } from "@/lib/utils";
import type { PostTypeLabelKey } from "@/lib/post-detail-type-label";
import { ArrowRight, Calendar, Heart, MapPin } from "lucide-react";

type HeroPost = Pick<
  ContentPost,
  | "title"
  | "summary"
  | "kind"
  | "hero_subject"
  | "tags"
  | "is_sample"
  | "region_slug"
  | "helpful_rating"
  | "created_at"
  | "author_user_id"
>;

export function PostDetailHero({
  post,
  coverUrl,
  coverAlt,
  typeLabelKey,
  postId,
  isRoute,
}: {
  post: HeroPost;
  coverUrl: string;
  coverAlt: string;
  typeLabelKey: PostTypeLabelKey;
  /** 있으면 메타 줄 오른쪽에 저장 액션 */
  postId?: string;
  /** 루트 포스트 여부 — 요청 CTA 표시 */
  isRoute?: boolean;
}) {
  const t = useTranslations("Posts");
  const date = new Date(post.created_at).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  const imageTreatment = cn(postHeroCoverClass(post), "opacity-90 dark:opacity-55");

  const washGradient = "absolute inset-0 bg-gradient-to-t from-background via-background/75 to-background/20";

  return (
    <header className="relative mx-auto max-w-6xl px-4 sm:px-6">
      {/* 콘텐츠가 정상 흐름(mt-auto)으로 들어가 긴 제목도 잘리지 않음. 이미지는 배경 레이어. */}
      <div className="border-border/60 bg-muted relative flex min-h-[min(56vw,260px)] flex-col overflow-hidden rounded-[1.75rem] border shadow-[var(--shadow-md)] sm:min-h-[300px] lg:min-h-[340px]">
        <div className="absolute inset-0">
          <Image src={coverUrl} alt={coverAlt} fill className={imageTreatment} sizes="100vw" priority />
          <div className={washGradient} />
        </div>
        <div className="relative mt-auto space-y-3 p-6 sm:p-10">
            <div className="flex flex-wrap items-center gap-2">
              {post.is_sample ? <PostSampleBadge /> : null}
              <Badge variant="default" className="rounded-full bg-primary/90 font-semibold text-primary-foreground">
                {t(typeLabelKey)}
              </Badge>
              {post.tags.map((tag) => (
                <Badge key={tag} variant="secondary" className="rounded-full font-medium">
                  {tag}
                </Badge>
              ))}
            </div>
            <h1 className="text-text-strong max-w-4xl text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
              {post.title}
            </h1>
            <p className="text-muted-foreground max-w-2xl text-base leading-relaxed sm:text-lg">{post.summary}</p>
            <div className="flex flex-col gap-3 pt-1 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between sm:gap-x-4 sm:gap-y-2">
              <div className="text-muted-foreground flex min-w-0 flex-wrap items-center gap-x-3 gap-y-2 text-sm">
                <span className="inline-flex items-center gap-1.5">
                  <Calendar className="size-4 shrink-0" aria-hidden />
                  {date}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <MapPin className="size-4 shrink-0" aria-hidden />
                  <span className="capitalize">{t(`region.${post.region_slug}` as "region.seoul")}</span>
                </span>
                {post.helpful_rating != null ? (
                  <span className="inline-flex items-center gap-1.5">
                    <Heart className="size-4 fill-rose-400/90 text-rose-400/90" aria-hidden />
                    {t("helpfulShort", { rating: post.helpful_rating.toFixed(1) })}
                  </span>
                ) : null}
              </div>
              {postId ? (
                <div className="flex shrink-0 flex-wrap items-center gap-2 sm:ml-auto">
                  <SaveTravelerPostButton postId={postId} showListLink={false} />
                  {isRoute ? (
                    <Link
                      href={`/guardians/${post.author_user_id}#request`}
                      className="inline-flex items-center gap-1.5 rounded-[var(--radius-md)] bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-sm transition-all hover:opacity-90 active:scale-[0.98]"
                    >
                      이 하루로 요청하기
                      <ArrowRight className="size-3.5" aria-hidden />
                    </Link>
                  ) : null}
                </div>
              ) : null}
            </div>
          </div>
        </div>
    </header>
  );
}
