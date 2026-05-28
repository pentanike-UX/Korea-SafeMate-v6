import type { ReactNode } from "react";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import {
  Bookmark,
  ChevronRight,
  Clock,
  Eye,
  Gift,
  Share2,
  Ticket,
  Users,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import type { TravelerActivityBundle } from "@/lib/traveler-activity-mypage.server";

const SOURCE_LABEL: Record<"single" | "trio" | "penta" | "admin-comp", string> = {
  single: "Single (₩990)",
  trio: "Trio pack",
  penta: "Penta pack",
  "admin-comp": "Comp",
};

type Locale = "ko" | "en" | "ja" | "th" | "vi";

export async function TravelerActivityHub({
  bundle,
  locale,
}: {
  bundle: TravelerActivityBundle;
  locale: Locale;
}) {
  const t = await getTranslations("TravelerHub");
  const { summary } = bundle;

  const VIEW_SOURCE_LABEL: Record<
    (typeof bundle.recentViews)[number]["source"],
    string
  > = {
    owner: t("routePassesViewSourceOwner"),
    "shared-invite": t("routePassesViewSourceSharedInvite"),
    ticket: t("routePassesViewSourceTicket"),
    "custom-self": t("routePassesViewSourceCustomSelf"),
  };

  function formatDateShort(iso: string): string {
    try {
      const l =
        locale === "ko"
          ? "ko-KR"
          : locale === "ja"
            ? "ja-JP"
            : locale === "th"
              ? "th-TH"
              : locale === "vi"
                ? "vi-VN"
                : "en-US";
      return new Intl.DateTimeFormat(l, {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }).format(new Date(iso));
    } catch {
      return iso;
    }
  }

  const jumpLinks = [
    { href: "#passes", label: t("activityJumpPasses") },
    { href: "#saved", label: t("activityJumpSaved") },
    { href: "#views", label: t("activityJumpViews") },
    { href: "#shared-out", label: t("activityJumpSharedOut") },
    { href: "#shared-in", label: t("activityJumpSharedIn") },
  ];

  return (
    <div className="space-y-8">
      {/* 요약 KPI */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <SummaryCard
          label={t("activitySummarySavedPosts")}
          value={summary.saved_posts_count}
          icon={<Bookmark className="size-4" aria-hidden />}
        />
        <SummaryCard
          label={t("activitySummaryGrants")}
          value={summary.active_grants_count}
          icon={<Clock className="size-4" aria-hidden />}
        />
        <SummaryCard
          label={t("activitySummaryTickets")}
          value={t("activitySummaryTicketsValue", {
            remain: summary.tickets_remaining,
            used: summary.tickets_used,
          })}
          icon={<Ticket className="size-4" aria-hidden />}
          valueClassName="text-lg sm:text-xl"
        />
        <SummaryCard
          label={t("activitySummarySharesSent")}
          value={t("activitySummarySharesSentValue", {
            total: summary.shares_sent_count,
            active: summary.shares_sent_active,
          })}
          icon={<Share2 className="size-4" aria-hidden />}
          valueClassName="text-lg sm:text-xl"
        />
        <SummaryCard
          label={t("activitySummarySharesReceived")}
          value={summary.shares_received_count}
          icon={<Gift className="size-4" aria-hidden />}
        />
        <SummaryCard
          label={t("activitySummaryViews")}
          value={summary.recent_views_count}
          icon={<Eye className="size-4" aria-hidden />}
        />
      </div>

      {/* 섹션 점프 */}
      <nav
        className="border-border/60 bg-muted/30 flex flex-wrap gap-2 rounded-2xl border p-2"
        aria-label={t("activityJumpNavLabel")}
      >
        {jumpLinks.map((l) => (
          <a
            key={l.href}
            href={l.href}
            className="hover:bg-background text-foreground rounded-xl px-3 py-2 text-xs font-semibold transition-colors"
          >
            {l.label}
          </a>
        ))}
      </nav>

      {/* 결제·패스 */}
      <ActivitySection
        id="passes"
        title={t("activitySectionPasses")}
        description={t("activitySectionPassesLead")}
        empty={bundle.grants.length === 0 && bundle.packs.length === 0}
        emptyMessage={t("routePassesEmptyBody")}
      >
        {bundle.grants.length > 0 ? (
          <ul className="space-y-2">
            {bundle.grants.map((g) => (
              <li key={g.grant_id}>
                <Link
                  href={`/routes/${g.route_id}`}
                  className="border-border/60 bg-card hover:border-[var(--brand-primary)]/40 flex items-start gap-3 rounded-2xl border p-4 transition-all"
                >
                  <span className="bg-[var(--brand-primary)]/10 text-[var(--brand-primary)] flex size-10 shrink-0 items-center justify-center rounded-xl">
                    <Clock className="size-5" aria-hidden />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-foreground truncate text-sm font-bold">
                      {g.route_title ?? g.route_id}
                    </p>
                    <p className="text-muted-foreground mt-0.5 flex flex-wrap gap-x-2 text-[11px]">
                      <span>{SOURCE_LABEL[g.source]}</span>
                      <span aria-hidden>·</span>
                      <span>{t("routePassesDaysRemaining", { d: g.days_remaining })}</span>
                      {g.active_invite_count > 0 ? (
                        <>
                          <span aria-hidden>·</span>
                          <span className="inline-flex items-center gap-1">
                            <Users className="size-3" aria-hidden />
                            {t("routePassesActiveInvites", { n: g.active_invite_count })}
                          </span>
                        </>
                      ) : null}
                    </p>
                  </div>
                  <ChevronRight className="text-muted-foreground size-4 shrink-0" aria-hidden />
                </Link>
              </li>
            ))}
          </ul>
        ) : null}
        {bundle.packs.length > 0 ? (
          <ul className="mt-3 space-y-2">
            {bundle.packs.map((p) => (
              <li
                key={p.pack_id}
                className="border-border/60 bg-card flex items-start gap-3 rounded-2xl border p-4"
              >
                <span className="bg-amber-400/15 text-amber-700 flex size-10 shrink-0 items-center justify-center rounded-xl dark:text-amber-300">
                  <Ticket className="size-5" aria-hidden />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-foreground text-sm font-bold">
                    {p.pack_size === 3 ? "Trio pack" : "Penta pack"}
                  </p>
                  <p className="text-muted-foreground mt-0.5 text-[11px]">
                    {t("activityPackUsage", {
                      used: p.tickets_used,
                      remain: p.tickets_remaining,
                      total: p.pack_size,
                    })}
                    <span aria-hidden> · </span>
                    {t("routePassesDaysRemaining", { d: p.days_remaining })}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        ) : null}
      </ActivitySection>

      {/* 저장 포스트 */}
      <ActivitySection
        id="saved"
        title={t("activitySectionSaved")}
        description={t("activitySectionSavedLead")}
        empty={bundle.savedPosts.length === 0}
        emptyMessage={t("savedPostsLead")}
        footer={
          bundle.savedPosts.length > 0 ? (
            <Link href="/mypage/saved-posts" className="text-[var(--brand-primary)] text-sm font-bold">
              {t("viewAll")} →
            </Link>
          ) : null
        }
      >
        <ul className="space-y-2">
          {bundle.savedPosts.map((p) => (
            <li key={p.post_id}>
              <div className="border-border/60 bg-card flex flex-col gap-2 rounded-2xl border p-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <p className="text-foreground font-semibold leading-snug">{p.title}</p>
                  <p className="text-muted-foreground mt-1 line-clamp-2 text-xs">{p.summary}</p>
                </div>
                <div className="flex shrink-0 flex-wrap gap-2">
                  <Link
                    href={`/posts/${p.post_id}`}
                    className="border-border/60 hover:bg-muted rounded-xl border px-3 py-2 text-xs font-semibold"
                  >
                    {t("readPost")}
                  </Link>
                  {p.related_route_id ? (
                    <Link
                      href={`/routes/${p.related_route_id}`}
                      className="bg-[var(--brand-primary)]/10 text-[var(--brand-primary)] rounded-xl px-3 py-2 text-xs font-semibold"
                    >
                      {t("activityOpenRoute")}
                    </Link>
                  ) : null}
                </div>
              </div>
            </li>
          ))}
        </ul>
      </ActivitySection>

      {/* 열람 이력 */}
      <ActivitySection
        id="views"
        title={t("activitySectionViews")}
        description={t("activitySectionViewsLead")}
        empty={bundle.recentViews.length === 0}
        emptyMessage={t("activitySectionViewsEmpty")}
      >
        <ul className="space-y-1.5">
          {bundle.recentViews.map((v) => {
            const postId = bundle.postIdByRouteId[v.route_id];
            return (
              <li
                key={v.view_id}
                className="border-border/40 bg-card/50 flex items-center gap-3 rounded-xl border px-3 py-2"
              >
                <Eye className="text-muted-foreground size-4 shrink-0" aria-hidden />
                <div className="min-w-0 flex-1">
                  <p className="text-foreground truncate text-sm font-medium">
                    {v.route_title ?? v.route_id.slice(0, 14) + "…"}
                  </p>
                  <p className="text-muted-foreground mt-0.5 flex flex-wrap gap-x-2 text-[11px]">
                    <span>{VIEW_SOURCE_LABEL[v.source]}</span>
                    <span aria-hidden>·</span>
                    <span>{formatDateShort(v.viewed_at)}</span>
                  </p>
                </div>
                <div className="flex shrink-0 gap-1.5">
                  <Link
                    href={`/routes/${v.route_id}`}
                    className="text-[var(--brand-primary)] text-xs font-semibold"
                  >
                    {t("activityOpenRoute")}
                  </Link>
                  {postId ? (
                    <Link href={`/posts/${postId}`} className="text-muted-foreground text-xs font-medium">
                      {t("readPost")}
                    </Link>
                  ) : null}
                </div>
              </li>
            );
          })}
        </ul>
      </ActivitySection>

      {/* 내가 공유 */}
      <ActivitySection
        id="shared-out"
        title={t("activitySectionSharedOut")}
        description={t("activitySectionSharedOutLead", { n: bundle.sharedOut.length })}
        empty={bundle.sharedOut.length === 0}
        emptyMessage={t("activitySectionSharedOutEmpty")}
      >
        <ul className="space-y-1.5">
          {bundle.sharedOut.map((i) => (
            <li
              key={i.invite_id}
              className="border-border/40 bg-card/50 flex items-center gap-3 rounded-xl border px-3 py-2"
            >
              <span className="bg-muted relative size-8 shrink-0 overflow-hidden rounded-full">
                {i.grantee_avatar_url ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img src={i.grantee_avatar_url} alt="" className="size-full object-cover" />
                ) : null}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-foreground truncate text-sm font-medium">
                  →{" "}
                  {i.is_redeemed
                    ? i.grantee_display_name
                    : t("activitySharePendingLink")}
                </p>
                <p className="text-muted-foreground mt-0.5 flex flex-wrap gap-x-2 text-[11px]">
                  <span className="truncate">{i.route_title ?? i.route_id}</span>
                  <span aria-hidden>·</span>
                  <span>{formatDateShort(i.created_at)}</span>
                </p>
              </div>
              <span
                className={
                  i.status === "active"
                    ? "rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300"
                    : "bg-muted text-muted-foreground rounded-full px-2 py-0.5 text-[10px]"
                }
              >
                {i.status === "active"
                  ? t("routePassesShareStatusActive")
                  : t("routePassesShareStatusRevoked")}
              </span>
            </li>
          ))}
        </ul>
      </ActivitySection>

      {/* 공유받음 */}
      <ActivitySection
        id="shared-in"
        title={t("activitySectionSharedIn")}
        description={t("activitySectionSharedInLead")}
        empty={bundle.sharedIn.length === 0}
        emptyMessage={t("activitySectionSharedInEmpty")}
      >
        <ul className="space-y-1.5">
          {bundle.sharedIn.map((i) => (
            <li
              key={i.invite_id}
              className="border-border/40 bg-card/50 flex items-center gap-3 rounded-xl border px-3 py-2"
            >
              <span className="bg-muted relative size-8 shrink-0 overflow-hidden rounded-full">
                {i.shared_by_avatar_url ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img src={i.shared_by_avatar_url} alt="" className="size-full object-cover" />
                ) : null}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-foreground truncate text-sm font-medium">
                  {i.shared_by_display_name}
                </p>
                <p className="text-muted-foreground mt-0.5 flex flex-wrap gap-x-2 text-[11px]">
                  <span className="truncate">{i.route_title ?? i.route_id}</span>
                  <span aria-hidden>·</span>
                  <span>{formatDateShort(i.created_at)}</span>
                </p>
              </div>
              <Link
                href={`/routes/${i.route_id}`}
                className="text-[var(--brand-primary)] shrink-0 text-xs font-semibold"
              >
                {t("activityOpenRoute")}
              </Link>
            </li>
          ))}
        </ul>
      </ActivitySection>
    </div>
  );
}

function SummaryCard({
  label,
  value,
  icon,
  valueClassName,
}: {
  label: string;
  value: string | number;
  icon: ReactNode;
  valueClassName?: string;
}) {
  return (
    <Card className="border-border/60 rounded-2xl shadow-[var(--shadow-sm)]">
      <CardContent className="p-5">
        <p className="text-muted-foreground flex items-center gap-2 text-[11px] font-bold tracking-wide uppercase">
          {icon}
          {label}
        </p>
        <p
          className={`text-foreground mt-2 font-semibold tabular-nums ${valueClassName ?? "text-3xl"}`}
        >
          {value}
        </p>
      </CardContent>
    </Card>
  );
}

function ActivitySection({
  id,
  title,
  description,
  empty,
  emptyMessage,
  children,
  footer,
}: {
  id: string;
  title: string;
  description: string;
  empty: boolean;
  emptyMessage: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-24">
      <header className="mb-4">
        <h2 className="text-foreground text-lg font-bold">{title}</h2>
        <p className="text-muted-foreground mt-1 text-sm leading-relaxed">{description}</p>
      </header>
      {empty ? (
        <p className="text-muted-foreground rounded-2xl border border-dashed px-4 py-8 text-center text-sm">
          {emptyMessage}
        </p>
      ) : (
        children
      )}
      {footer ? <div className="mt-3">{footer}</div> : null}
    </section>
  );
}
