import { PublicSiteShell } from "@/components/layout/public-site-shell";

export default function AuthedLocaleLayout({ children }: { children: React.ReactNode }) {
  return <PublicSiteShell>{children}</PublicSiteShell>;
}
