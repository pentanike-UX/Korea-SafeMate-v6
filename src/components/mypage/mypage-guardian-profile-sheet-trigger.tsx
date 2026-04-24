/**
 * 마이페이지용 별칭. `postContext`는 `representative_post_ids`가 승인 포스트 카탈로그에서 해석될 때 등
 * `ContentPost` 기반 맥락을 줄 수 있는 화면에서만 넘기면 된다.
 * 매칭 목록처럼 포스트와 무관한 맥락에서는 생략(의도적 빈 상태).
 *
 * @deprecated 가능하면 `@/components/guardians/guardian-profile-preview-sheet-trigger` 직접 사용.
 */
export {
  GuardianProfilePreviewSheetTrigger as MypageGuardianProfileSheetTrigger,
  type GuardianProfileSheetPreview,
} from "@/components/guardians/guardian-profile-preview-sheet-trigger";
