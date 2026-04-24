/** 가디언 운영 화면 — 마이페이지 허브 LNB와 동일한 베이스 경로 */
export const GUARDIAN_WORKSPACE = {
  posts: "/mypage/guardian/posts",
  postsNew: "/mypage/guardian/posts/new",
  postEdit: (id: string) => `/mypage/guardian/posts/${id}/edit`,
  postPreview: (id: string, token: string) =>
    `/mypage/guardian/posts/${id}/preview?t=${encodeURIComponent(token)}`,
  matches: "/mypage/guardian/matches",
  points: "/mypage/guardian/points",
  settings: "/mypage/guardian/settings",
  profileEdit: "/mypage/guardian/profile/edit",
} as const;
