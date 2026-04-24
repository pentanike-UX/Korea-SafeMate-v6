import type { GuardianProfile } from "@/types/domain";
import { getGuardianSeedBundle } from "./guardian-seed-bundle";

/** UI·목업 전역에서 쓰는 가디언 목록 — `guardians-seed` 단일 소스. */
export const mockGuardians: GuardianProfile[] = getGuardianSeedBundle().guardians;
