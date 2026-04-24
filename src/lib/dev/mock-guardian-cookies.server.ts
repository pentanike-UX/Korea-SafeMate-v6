import { cookies } from "next/headers";
import { isMockGuardianId, MOCK_GUARDIAN_COOKIE_NAME } from "@/lib/dev/mock-guardian-auth";

export async function getMockGuardianIdFromCookies(): Promise<string | null> {
  const jar = await cookies();
  const raw = jar.get(MOCK_GUARDIAN_COOKIE_NAME)?.value ?? null;
  return isMockGuardianId(raw) ? raw : null;
}
