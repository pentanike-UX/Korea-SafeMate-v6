import { GuardianOnboardingClient } from "@/components/guardian/onboarding/guardian-onboarding-client";
import { BRAND } from "@/lib/constants";

export const metadata = {
  title: `Guardian onboarding | ${BRAND.name}`,
};

export default function GuardianOnboardingPage() {
  return <GuardianOnboardingClient />;
}
