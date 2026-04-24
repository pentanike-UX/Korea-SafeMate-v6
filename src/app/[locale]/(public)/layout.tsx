import { PublicSiteShell } from "@/components/layout/public-site-shell";

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return <PublicSiteShell>{children}</PublicSiteShell>;
}
