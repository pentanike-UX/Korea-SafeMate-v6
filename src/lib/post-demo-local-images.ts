import {
  POST_LOCAL_IMAGE_POOL_GANGNAM,
  POST_LOCAL_IMAGE_POOL_GWANGHWAMUN,
} from "@/data/post-local-images-manifest.gen";
import type { PostVisualBucket } from "@/lib/post-local-images";

/** 데모용 — 외부 URL 없이 `/mock/posts/*` 풀에서만 선택 */
export function demoPickLocal(bucket: PostVisualBucket, salt: number): string {
  const pool = bucket === "gangnam" ? POST_LOCAL_IMAGE_POOL_GANGNAM : POST_LOCAL_IMAGE_POOL_GWANGHWAMUN;
  const i = ((salt % pool.length) + pool.length) % pool.length;
  return pool[i]!;
}

export function demoPickLocals(bucket: PostVisualBucket, salt: number, count: number): string[] {
  const out: string[] = [];
  for (let k = 0; k < count; k++) {
    out.push(demoPickLocal(bucket, salt + k * 11));
  }
  return out;
}

export function hashStringToInt(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (h * 31 + s.charCodeAt(i)) | 0;
  }
  return h;
}
