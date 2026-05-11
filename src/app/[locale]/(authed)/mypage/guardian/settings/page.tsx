import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { BRAND } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AiReplyToggle } from "@/components/guardian/settings/ai-reply-toggle";
import { Bell, Bot, Shield, UserCircle2 } from "lucide-react";

export async function generateMetadata() {
  const t = await getTranslations("TravelerHub");
  return { title: `${t("guardianNavSettings")} | ${BRAND.name}` };
}

export default async function MypageGuardianSettingsPage() {
  const t = await getTranslations("TravelerHub");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-text-strong text-2xl font-semibold tracking-tight">{t("guardianNavSettings")}</h1>
        <p className="text-muted-foreground mt-2 text-sm leading-relaxed">
          계정/알림/운영 기본값을 관리합니다. 이 화면은 가디언 운영 워크스페이스 전용 설정 영역입니다.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="rounded-2xl border-border/60 py-0 shadow-[var(--shadow-sm)]">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <UserCircle2 className="size-4 text-primary" aria-hidden />
              계정 정보
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <p className="text-muted-foreground">로그인 계정 정보와 기본 프로필 설정을 확인합니다.</p>
            <Button asChild variant="outline" size="sm" className="rounded-xl">
              <Link href="/mypage/profile">기본 계정 설정 열기</Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-border/60 py-0 shadow-[var(--shadow-sm)]">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <Bell className="size-4 text-primary" aria-hidden />
              알림
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <p className="text-muted-foreground">신규 매칭 요청/검토 필요 알림은 헤더 점과 배지로 우선 안내됩니다.</p>
            <Button asChild variant="outline" size="sm" className="rounded-xl">
              <Link href="/mypage/guardian/matches">매칭 관리로 이동</Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-border/60 py-0 shadow-[var(--shadow-sm)]">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <Shield className="size-4 text-primary" aria-hidden />
              운영 정책
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <p className="text-muted-foreground">포인트/콘텐츠 운영 정책을 확인하고 작업 우선순위를 점검합니다.</p>
            <Button asChild variant="outline" size="sm" className="rounded-xl">
              <Link href="/mypage/guardian/points">포인트 정책 확인</Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* AI 자동답변 설정 카드 */}
      <Card className="rounded-2xl border-violet-200/60 bg-violet-50/30 py-0 shadow-[var(--shadow-sm)] dark:border-violet-900/40 dark:bg-violet-950/10">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <Bot className="size-4 text-violet-500" aria-hidden />
            AI 채팅 어시스턴트
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          <p className="text-muted-foreground leading-relaxed">
            여행자가 문의를 보내면 AI가 즉시 초안 답변을 전송합니다.
            가디언이 직접 답변할 시간을 확보하거나 바쁠 때 활성화하세요.
          </p>
          <div className="rounded-xl border border-border/60 bg-card p-4">
            <AiReplyToggle />
          </div>
          <ul className="space-y-1 text-[12px] text-muted-foreground">
            <li className="flex items-start gap-1.5">
              <span className="mt-0.5 text-violet-500">•</span>
              AI 답변은 채팅창에서 가디언 로그인 시에만{" "}
              <span className="inline-flex items-center gap-0.5 rounded bg-violet-100 px-1 py-0.5 text-[10px] font-bold text-violet-600 dark:bg-violet-950/40 dark:text-violet-400">
                AI
              </span>{" "}
              배지로 표시됩니다
            </li>
            <li className="flex items-start gap-1.5">
              <span className="mt-0.5 text-violet-500">•</span>
              여행자에게는 일반 답변과 동일하게 보입니다
            </li>
            <li className="flex items-start gap-1.5">
              <span className="mt-0.5 text-violet-500">•</span>
              모든 AI 답변은 대화 기록에 저장됩니다
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
