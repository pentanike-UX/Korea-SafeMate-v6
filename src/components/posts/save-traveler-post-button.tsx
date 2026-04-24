"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Bookmark, Loader2 } from "lucide-react";

export function SaveTravelerPostButton({
  postId,
  className,
  showListLink = true,
}: {
  postId: string;
  className?: string;
  showListLink?: boolean;
}) {
  const t = useTranslations("Posts");
  const [loading, setLoading] = useState(false);
  const [hint, setHint] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const res = await fetch("/api/traveler/saved-posts", { credentials: "include" });
        const data = (await res.json()) as { ids?: string[] };
        if (!cancelled && Array.isArray(data.ids)) {
          setSaved(data.ids.includes(postId));
        }
      } catch {
        /* ignore */
      } finally {
        if (!cancelled) setHydrated(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [postId]);

  async function toggle() {
    setLoading(true);
    setHint(null);
    try {
      const res = await fetch("/api/traveler/saved-posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ post_id: postId, action: "toggle" }),
      });
      const data = (await res.json()) as { ids?: string[]; saved?: boolean; error?: string };
      if (!res.ok) {
        setHint(data.error ?? t("savePostError"));
        return;
      }
      const nextSaved = Boolean(data.saved);
      setSaved(nextSaved);
      setHint(nextSaved ? t("savePostAdded") : t("savePostRemoved"));
    } catch {
      setHint(t("savePostError"));
    } finally {
      setLoading(false);
    }
  }

  if (!hydrated) {
    return (
      <div className={className}>
        <Button type="button" variant="outline" size="sm" className="rounded-xl" disabled>
          <Loader2 className="size-4 animate-spin" aria-hidden />
        </Button>
      </div>
    );
  }

  return (
    <div className={`flex flex-col gap-2 ${className ?? ""}`}>
      <Button
        type="button"
        variant={saved ? "secondary" : "outline"}
        size="sm"
        className="rounded-xl font-semibold"
        disabled={loading}
        onClick={() => void toggle()}
      >
        {loading ? (
          <Loader2 className="size-4 animate-spin" aria-hidden />
        ) : (
          <Bookmark className={saved ? "size-4 fill-current" : "size-4"} strokeWidth={1.75} aria-hidden />
        )}
        <span>{saved ? t("savePostSaved") : t("savePost")}</span>
      </Button>
      {showListLink ? (
        <Button asChild variant="ghost" size="sm" className="text-[var(--link-color)] h-auto min-h-9 justify-start px-0 text-sm font-semibold">
          <Link href="/mypage/saved-posts" className="inline-flex items-center gap-2">
            <Bookmark className="size-4 shrink-0 opacity-90" aria-hidden />
            {t("savePostViewList")}
          </Link>
        </Button>
      ) : null}
      {hint ? <p className="text-muted-foreground text-xs leading-snug">{hint}</p> : null}
    </div>
  );
}
