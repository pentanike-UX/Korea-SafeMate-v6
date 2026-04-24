import type { ContentPost } from "@/types/domain";

/** 프리뷰 시트·리스트·서버 포스트 사이드에서 요청 시트로 넘길 포스트 맥락 (순수 함수, RSC에서 호출 가능) */
export function postContextFromContentPost(p: ContentPost): {
  postId: string;
  postTitle: string;
  postSummary: string;
  postContextKind: "route" | "post";
} {
  const postContextKind: "route" | "post" =
    p.post_format === "route" || p.has_route ? "route" : "post";
  return {
    postId: p.id,
    postTitle: p.title,
    postSummary: p.summary?.trim() ?? "",
    postContextKind,
  };
}
