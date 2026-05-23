/**
 * T17 — Traveler Settings
 * IA §4.3 T17 · 릴리즈 [P]
 * 계정·언어·알림·저장 항목·약관 허브. 로그아웃은 헤더 계정 메뉴가 전역 처리.
 */
import { getLocale, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { BRAND } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LanguageSwitcher } from "@/components/i18n/language-switcher";
import { Bell, Bookmark, FileText, Globe, UserCircle2 } from "lucide-react";

export async function generateMetadata() {
  const t = await getTranslations("TravelerHub");
  return { title: `${t("navSettings")} | ${BRAND.name}` };
}

export default async function MypageSettingsPage() {
  const locale = await getLocale();
  const isKo = locale === "ko";
  const t = await getTranslations("TravelerHub");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-text-strong text-2xl font-semibold tracking-tight">{t("navSettings")}</h1>
        <p className="text-muted-foreground mt-2 text-sm leading-relaxed">
          {isKo
            ? "계정·언어·알림 기본값과 저장한 항목을 관리합니다."
            : "Manage your account, language, notifications, and saved items."}
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* 계정 */}
        <Card className="rounded-2xl border-border/60 py-0 shadow-[var(--shadow-sm)]">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <UserCircle2 className="size-4 text-primary" aria-hidden />
              {isKo ? "계정 정보" : "Account"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <p className="text-muted-foreground">
              {isKo ? "프로필·기본 정보를 확인하고 수정합니다." : "View and edit your profile and basic info."}
            </p>
            <Button asChild variant="outline" size="sm" className="rounded-xl">
              <Link href="/mypage/profile">{isKo ? "프로필 열기" : "Open profile"}</Link>
            </Button>
          </CardContent>
        </Card>

        {/* 언어 */}
        <Card className="rounded-2xl border-border/60 py-0 shadow-[var(--shadow-sm)]">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <Globe className="size-4 text-primary" aria-hidden />
              {isKo ? "언어" : "Language"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <p className="text-muted-foreground">
              {isKo ? "표시 언어를 선택하세요." : "Choose your display language."}
            </p>
            <LanguageSwitcher />
          </CardContent>
        </Card>

        {/* 알림 */}
        <Card className="rounded-2xl border-border/60 py-0 shadow-[var(--shadow-sm)]">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <Bell className="size-4 text-primary" aria-hidden />
              {isKo ? "알림" : "Notifications"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <p className="text-muted-foreground">
              {isKo
                ? "새 메시지·매칭 소식은 헤더 배지로 우선 안내됩니다."
                : "New messages and matches are surfaced via header badges."}
            </p>
            <div className="flex flex-wrap gap-2">
              <Button asChild variant="outline" size="sm" className="rounded-xl">
                <Link href="/mypage/messages">{isKo ? "메시지" : "Messages"}</Link>
              </Button>
              <Button asChild variant="outline" size="sm" className="rounded-xl">
                <Link href="/mypage/matches">{isKo ? "매칭" : "Matches"}</Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* 저장 항목 */}
        <Card className="rounded-2xl border-border/60 py-0 shadow-[var(--shadow-sm)]">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <Bookmark className="size-4 text-primary" aria-hidden />
              {isKo ? "저장한 항목" : "Saved items"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <p className="text-muted-foreground">
              {isKo ? "저장한 하루이와 하루웨이를 모아봅니다." : "Your saved haruee and posts."}
            </p>
            <div className="flex flex-wrap gap-2">
              <Button asChild variant="outline" size="sm" className="rounded-xl">
                <Link href="/mypage/saved-guardians">{isKo ? "저장한 하루이" : "Saved haruee"}</Link>
              </Button>
              <Button asChild variant="outline" size="sm" className="rounded-xl">
                <Link href="/mypage/saved-posts">{isKo ? "저장한 하루웨이" : "Saved posts"}</Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* 약관·고객지원 */}
        <Card className="rounded-2xl border-border/60 py-0 shadow-[var(--shadow-sm)] lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <FileText className="size-4 text-primary" aria-hidden />
              {isKo ? "약관 · 고객지원" : "Legal & Support"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex flex-wrap gap-2">
              <Button asChild variant="outline" size="sm" className="rounded-xl">
                <Link href="/faq">{isKo ? "자주 묻는 질문" : "FAQ"}</Link>
              </Button>
              <Button asChild variant="outline" size="sm" className="rounded-xl">
                <Link href="/legal/terms">{isKo ? "이용약관" : "Terms"}</Link>
              </Button>
              <Button asChild variant="outline" size="sm" className="rounded-xl">
                <Link href="/legal/privacy">{isKo ? "개인정보처리방침" : "Privacy"}</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
