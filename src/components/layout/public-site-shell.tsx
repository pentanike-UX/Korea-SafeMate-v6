import { GuardianRequestSheetGlobal } from "@/components/guardians/guardian-request-sheet";
import { GuardianInquirySheetGlobal } from "@/components/guardians/guardian-inquiry-sheet";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { MobileBottomTabBar } from "@/components/layout/mobile-bottom-tab-bar";

export function PublicSiteShell({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SiteHeader />
      <main className="min-w-0 flex-1 overflow-x-clip">{children}</main>
      <SiteFooter />
      <MobileBottomTabBar />
      <GuardianRequestSheetGlobal />
      <GuardianInquirySheetGlobal />
    </>
  );
}
