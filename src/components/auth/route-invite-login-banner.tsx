import { Gift } from "lucide-react";
import { getTranslations } from "next-intl/server";

/** 초대 링크로 로그인 페이지에 온 경우 — 결제가 아닌 무료 공유임을 먼저 안내. */
export async function RouteInviteLoginBanner({ routeTitle }: { routeTitle: string | null }) {
  const t = await getTranslations("Auth");
  return (
    <div
      className="mb-5 flex gap-3 rounded-[var(--radius-md)] border border-primary/25 bg-primary/5 px-4 py-3.5 text-left"
      role="status"
    >
      <Gift className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden />
      <div className="min-w-0 space-y-1">
        <p className="text-sm font-semibold text-foreground">{t("routeInviteLoginTitle")}</p>
        <p className="text-muted-foreground text-sm leading-relaxed">
          {routeTitle
            ? t("routeInviteLoginBodyWithTitle", { title: routeTitle })
            : t("routeInviteLoginBody")}
        </p>
      </div>
    </div>
  );
}
