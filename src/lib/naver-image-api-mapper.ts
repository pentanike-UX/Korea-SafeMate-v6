import type { NaverImageCandidate } from "@/types/domain";

/** `/api/naver/image-search` JSON `items` 한 행 */
export type NaverImageSearchApiItem = {
  title: string;
  url: string;
  thumbnail: string;
  width: number;
  height: number;
  source: string;
  score: number;
  link: string;
  sizewidth?: string;
  sizeheight?: string;
};

export function mapNaverImageSearchItemsToCandidates(items: NaverImageSearchApiItem[]): NaverImageCandidate[] {
  return items.map((i) => {
    const main = (i.url ?? i.link ?? "").trim();
    return {
      title: i.title,
      link: (i.link ?? i.url ?? "").trim() || main,
      url: i.url,
      thumbnail: i.thumbnail,
      sizewidth: i.sizewidth ?? "",
      sizeheight: i.sizeheight ?? "",
      width: i.width,
      height: i.height,
      source: "naver-image" as const,
      score: i.score,
    };
  });
}
