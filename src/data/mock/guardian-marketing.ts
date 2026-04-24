import type { GuardianMarketingProfile } from "@/types/guardian-marketing";

/**
 * 레거시 마케팅 오버레이. 시드 가디언은 `lib/guardian-public`의 기본 마케팅 생성으로 처리합니다.
 * (제거 시 `mergePublicGuardian`만 남기면 됩니다.)
 */
export const mockGuardianMarketingById: Record<string, GuardianMarketingProfile> = {};
