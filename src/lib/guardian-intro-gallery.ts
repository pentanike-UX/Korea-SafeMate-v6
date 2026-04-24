import introGalleriesSeed from "@/data/mock/guardian-intro-galleries.json";

/**
 * 빌드에 포함된 시드/커밋된 JSON 맵.
 * 로컬에서 JSON만 수정한 경우 재빌드 전까지 번들 값이 유지됩니다.
 * 공개 상세는 `intro_gallery_image_urls` DB 우선(`guardian-intro-gallery-db.server.ts`).
 */
export function getIntroGalleriesSeedMap(): Record<string, string[]> {
  return introGalleriesSeed as Record<string, string[]>;
}

/** 히어로와 동일 URL은 소개 갤러리에서 제외(반복 방지). */
export function filterIntroGalleryExcludingHero(heroLandscapeUrl: string, urls: string[] | undefined): string[] {
  if (!urls?.length) return [];
  const hero = heroLandscapeUrl.trim();
  return urls.map((u) => u.trim()).filter((u) => u && u !== hero);
}
