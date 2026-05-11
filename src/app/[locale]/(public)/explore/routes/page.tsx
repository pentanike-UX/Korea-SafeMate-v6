/**
 * /explore/routes — /posts 로 영구 리다이렉트.
 * 두 페이지가 동일한 목록 UI를 공유하도록 통일. (2026-05-11)
 */
import { redirect } from "next/navigation";

export default function ExploreRoutesPage() {
  redirect("/posts");
}
