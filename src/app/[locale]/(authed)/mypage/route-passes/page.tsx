import { redirect } from "next/navigation";

/** 레거시 URL → 이용·결제 기록 허브로 통합 */
export default function RoutePassesRedirectPage() {
  redirect("/mypage/activity#passes");
}
