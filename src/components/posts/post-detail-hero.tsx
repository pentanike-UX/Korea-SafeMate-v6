"use client";

import Image from "next/image";
import { useTranslations } from "next-intl";
import type { ContentPost } from "@/types/domain";
import { PostSampleBadge } from "@/components/posts/post-sample-badge";
import { SaveTravelerPostButton } from "@/components/posts/save-traveler-post-button";
import { Badge } from "@/components/ui/badge";
import { postHeroCoverClass } from "@/lib/post-image-crop";
import { cn } from "@/lib/utils";
import type { PostTypeLabelKey } from "@/lib/post-detail-type-label";
import { Calendar, Heart, MapPin } from "lucide-react";

function heroGradient(post: Pick<ContentPost, "title" | "kind">) {
  const hue = post.title.length * 17 + post.kind.length * 40;
  return `linear-gradient(145deg, hsl(${hue % 360} 45% 92%) 0%, hsl(${(hue + 50) % 360} 40% 85%) 50%, #fff 100%)`;
}

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
>;

export function PostDetailHero({
  post,
  coverUrl,
  coverAlt,
  typeLabelKey,
  postId,
}: {
  post: HeroPost;
  coverUrl: string;
  coverAlt: string;
  typeLabelKey: PostTypeLabelKey;
  /** 있으면 메타 줄 오른쪽에 저장 액션 */
  postId?: string;
}) {
  const t = useTranslations("Posts");
  const date = new Date(post.created_at).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  /** 실용 팁·루트형 공통 — 동일 쉘·오버레이·메타 그리드 */
  const imageShell =
    "relative aspect-[16/9] min-h-[min(52vw,260px)] max-h-[min(52vh,520px)] overflow-hidden sm:min-h-[280px] sm:max-h-[min(58vh,580px)] lg:aspect-[2.12/1] lg:min-h-[300px] lg:max-h-[min(62vh,620px)]";

  const imageTreatment = cn(postHeroCoverClass(post), "opacity-[0.48] mix-blend-multiply");

  const washGradient = "absolute inset-0 bg-gradient-to-t from-white via-white/65 to-white/25";

  return (
    <header className="relative mx-auto max-w-6xl px-4 sm:px-6">
      <div
        className="border-border/60 relative overflow-hidden rounded-[1.75rem] border shadow-[var(--shadow-md)]"
        style={{ background: heroGradient(post) }}
      >
        <div className={imageShell}>
          <Image src={coverUrl} alt={coverAlt} fill className={imageTreatment} sizes="100vw" priority />
          <div className={washGradient} />
          <div className="absolute right-0 bottom-0 left-0 space-y-3 p-6 sm:p-10">
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
                <div className="shrink-0 sm:ml-auto">
                  <SaveTravelerPostButton postId={postId} showListLink={false} className="w-full sm:w-auto sm:min-w-[9rem]" />
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
