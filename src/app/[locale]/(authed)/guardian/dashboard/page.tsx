import { redirect } from "@/i18n/navigation";
import { getLocale } from "next-intl/server";

/**
 * 레거시 mock 대시보드(/guardian/dashboard) → 실제 DB 기반 워크스페이스로 리다이렉트.
 * mock 데이터(mg14)가 실사용자에게 노출되던 문제 해소. /mypage/guardian/* 가 대체재.
 */
export default async function LegacyGuardianDashboardRedirect() {
  redirect({ href: "/mypage/guardian/posts", locale: await getLocale() });
}
