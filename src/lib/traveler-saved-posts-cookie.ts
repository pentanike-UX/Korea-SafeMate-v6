import { cookies } from "next/headers";

export const TRAVELER_SAVED_POSTS_COOKIE = "fg_saved_posts";
const MAX_IDS = 80;

export function parseSavedPostIds(raw: string | undefined): string[] {
  if (!raw?.trim()) return [];
  try {
    const v = JSON.parse(raw) as unknown;
    if (!Array.isArray(v)) return [];
    const ids = v.filter((x): x is string => typeof x === "string" && x.length > 0 && x.length < 256);
    return [...new Set(ids)].slice(0, MAX_IDS);
  } catch {
    return [];
  }
}

export async function getTravelerSavedPostIds(): Promise<string[]> {
  const jar = await cookies();
  return parseSavedPostIds(jar.get(TRAVELER_SAVED_POSTS_COOKIE)?.value);
}

export function serializeSavedPostIds(ids: string[]): string {
  const unique = [...new Set(ids)].slice(0, MAX_IDS);
  return JSON.stringify(unique);
}
