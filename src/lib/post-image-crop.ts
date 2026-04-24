import type { ContentPost } from "@/types/domain";
import {
  FILL_IMAGE_POST_HERO_MIXED,
  FILL_IMAGE_POST_HERO_SCENE,
  FILL_IMAGE_POST_HERO_SUBJECT,
  FILL_IMAGE_POST_LIST_MIXED,
  FILL_IMAGE_POST_LIST_SCENE,
  FILL_IMAGE_POST_LIST_SUBJECT,
  FILL_IMAGE_POST_THUMB_MIXED,
  FILL_IMAGE_POST_THUMB_SQUARE,
  FILL_IMAGE_ROUTE_SPOT_MIXED,
  FILL_IMAGE_ROUTE_SPOT_SCENE,
  FILL_IMAGE_ROUTE_SPOT_SUBJECT,
} from "@/lib/ui/fill-image";

/** 인물·콘텐츠 팬덤에 가까운 포스트 — 히어로/시트에서 얼굴·상체 우선 (hero_subject 없을 때 추정) */
const SUBJECT_FORWARD_KINDS: ContentPost["kind"][] = ["k_content", "hot_place", "food"];

/** 크롭 분기에 쓰는 최소 필드 — 전체 `ContentPost` 또는 시트 아이템 일부 */
export type PostImageCropInput = {
  kind?: ContentPost["kind"];
  hero_subject?: ContentPost["hero_subject"] | null;
};

export function postUsesSubjectForwardCrop(kind: ContentPost["kind"]): boolean {
  return SUBJECT_FORWARD_KINDS.includes(kind);
}

export type PostCropSubjectMode = "subject" | "scene" | "mixed";

/**
 * `hero_subject`가 있으면 최우선. 없으면 기존 `kind` 휴리스틱. kind도 없으면 장면형.
 */
export function resolvePostCropSubjectMode(input: PostImageCropInput): PostCropSubjectMode {
  const hs = input.hero_subject;
  if (hs === "person") return "subject";
  if (hs === "place") return "scene";
  if (hs === "mixed") return "mixed";
  if (input.kind != null) return postUsesSubjectForwardCrop(input.kind) ? "subject" : "scene";
  return "scene";
}

/** 포스트 상세·시트 상단 와이드 히어로 */
export function postHeroCoverClass(post: PostImageCropInput): string {
  switch (resolvePostCropSubjectMode(post)) {
    case "subject":
      return FILL_IMAGE_POST_HERO_SUBJECT;
    case "mixed":
      return FILL_IMAGE_POST_HERO_MIXED;
    default:
      return FILL_IMAGE_POST_HERO_SCENE;
  }
}

/** 포스트 목록·라우트 카드 16:10 영역 */
export function postListCardCoverClass(post: PostImageCropInput): string {
  switch (resolvePostCropSubjectMode(post)) {
    case "subject":
      return FILL_IMAGE_POST_LIST_SUBJECT;
    case "mixed":
      return FILL_IMAGE_POST_LIST_MIXED;
    default:
      return FILL_IMAGE_POST_LIST_SCENE;
  }
}

/** 탐색·시트 등 작은 직사각/정사각 썸네일 */
export function postCompactThumbCoverClass(post: PostImageCropInput): string {
  switch (resolvePostCropSubjectMode(post)) {
    case "subject":
      return "h-full w-full object-cover object-[center_32%]";
    case "mixed":
      return FILL_IMAGE_POST_THUMB_MIXED;
    default:
      return "h-full w-full object-cover object-[center_48%]";
  }
}

/** 루트 포스트 스팟 본문 이미지 — 장소 vs 인물 섞임 */
export function routeSpotImageCoverClass(post: PostImageCropInput): string {
  switch (resolvePostCropSubjectMode(post)) {
    case "subject":
      return FILL_IMAGE_ROUTE_SPOT_SUBJECT;
    case "mixed":
      return FILL_IMAGE_ROUTE_SPOT_MIXED;
    default:
      return FILL_IMAGE_ROUTE_SPOT_SCENE;
  }
}

/**
 * 시트 리스트 썸네일 — kind·hero_subject 둘 다 없으면 정사각 혼합 기본.
 * kind만 있으면 기존과 동일하게 동작.
 */
export function sheetRelatedPostThumbCoverClass(input?: PostImageCropInput | null): string {
  if (input == null) return FILL_IMAGE_POST_THUMB_SQUARE;
  if (input.kind == null && input.hero_subject == null) return FILL_IMAGE_POST_THUMB_SQUARE;
  return postCompactThumbCoverClass(input);
}
