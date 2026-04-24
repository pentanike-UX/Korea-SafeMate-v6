import { GuardianRequestSheetGlobal } from "@/components/guardians/guardian-request-sheet";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";

export function PublicSiteShell({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SiteHeader />
      <main className="flex-1">{children}</main>
      <SiteFooter />
      <GuardianRequestSheetGlobal />
    </>
  );
}
