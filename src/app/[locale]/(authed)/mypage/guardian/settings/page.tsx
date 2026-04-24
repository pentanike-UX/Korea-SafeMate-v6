import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { BRAND } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Bell, Shield, UserCircle2 } from "lucide-react";

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
    </div>
  );
}
