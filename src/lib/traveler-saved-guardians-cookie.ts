import { cookies } from "next/headers";

export const TRAVELER_SAVED_GUARDIANS_COOKIE = "fg_saved_guardians";
const MAX_IDS = 40;

export function parseSavedGuardianIds(raw: string | undefined): string[] {
  if (!raw?.trim()) return [];
  try {
    const v = JSON.parse(raw) as unknown;
    if (!Array.isArray(v)) return [];
    const ids = v.filter((x): x is string => typeof x === "string" && x.length > 0 && x.length < 128);
    return [...new Set(ids)].slice(0, MAX_IDS);
  } catch {
    return [];
  }
}

export async function getTravelerSavedGuardianIds(): Promise<string[]> {
  const jar = await cookies();
  return parseSavedGuardianIds(jar.get(TRAVELER_SAVED_GUARDIANS_COOKIE)?.value);
}

export function serializeSavedGuardianIds(ids: string[]): string {
  const unique = [...new Set(ids)].slice(0, MAX_IDS);
  return JSON.stringify(unique);
}
