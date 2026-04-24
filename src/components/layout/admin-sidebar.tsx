"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BRAND } from "@/lib/constants";
import { cn } from "@/lib/utils";
import {
  CalendarCheck,
  Coins,
  LayoutDashboard,
  MailPlus,
  Newspaper,
  Settings,
  Shield,
  Star,
  Users,
} from "lucide-react";

type NavItem = { href: string; label: string; icon: typeof LayoutDashboard };

type NavGroup = {
  label: string;
  description?: string;
  items: NavItem[];
};

const buildGroups = (showSuper: boolean): NavGroup[] => {
  const core: NavGroup[] = [
    {
      label: "Overview",
      items: [{ href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard }],
    },
    {
      label: "Operations",
      description: "Matching and lifecycle",
      items: [
        { href: "/admin/matches", label: "Matches", icon: CalendarCheck },
        { href: "/admin/users", label: "Users", icon: Users },
      ],
    },
    {
      label: "Guardian program",
      description: "Trust, tiers, reviews",
      items: [
        { href: "/admin/guardians", label: "Guardians", icon: Users },
        { href: "/admin/reviews", label: "Reviews", icon: Star },
      ],
    },
    {
      label: "Content",
      description: "Moderation queue",
      items: [{ href: "/admin/posts", label: "Posts", icon: Newspaper }],
    },
    {
      label: "Economy",
      description: "Ledger policy & adjustments",
      items: [{ href: "/admin/points", label: "Points", icon: Coins }],
    },
  ];

  if (!showSuper) return core;

  return [
    ...core,
    {
      label: "Super admin",
      description: "Staff & platform",
      items: [
        { href: "/admin/managers", label: "Managers", icon: Shield },
        { href: "/admin/managers/invite", label: "Invite manager", icon: MailPlus },
        { href: "/admin/settings/security", label: "Security", icon: Settings },
        { href: "/admin/settings/policies", label: "Policies", icon: Settings },
      ],
    },
  ];
};

function NavLink({
  href,
  label,
  icon: Icon,
  active,
}: {
  href: string;
  label: string;
  icon: typeof LayoutDashboard;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "group flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
        active ? "bg-foreground/5 text-foreground font-medium" : "text-muted-foreground hover:bg-muted/80 hover:text-foreground",
      )}
    >
      <Icon
        className={cn(
          "size-4 shrink-0 transition-colors",
          active ? "text-foreground" : "text-muted-foreground group-hover:text-foreground",
        )}
      />
      {label}
    </Link>
  );
}

export function AdminSidebar({ showSuperAdmin = false }: { showSuperAdmin?: boolean }) {
  const pathname = usePathname();
  const groups = buildGroups(showSuperAdmin);

  return (
    <aside className="bg-background flex w-full flex-col border-b md:sticky md:top-0 md:h-screen md:w-60 md:shrink-0 md:border-r md:border-b-0">
      <div className="flex h-14 items-center gap-3 border-b px-4 md:h-[4.25rem]">
        <span className="bg-foreground text-background flex size-9 items-center justify-center rounded-md text-[11px] font-bold tracking-tight">
          Ops
        </span>
        <div className="min-w-0">
          <p className="text-foreground truncate text-sm font-semibold tracking-tight">Console</p>
          <p className="text-muted-foreground truncate text-[11px]">{BRAND.name}</p>
        </div>
      </div>

      <nav className="flex flex-row gap-4 overflow-x-auto px-2 py-3 md:flex-1 md:flex-col md:gap-0 md:overflow-y-auto md:px-3 md:py-4">
        {groups.map((group) => (
          <div key={group.label} className="flex min-w-[200px] flex-col gap-1 md:min-w-0 md:pb-5">
            <div className="px-3 pb-1">
              <p className="text-muted-foreground text-[10px] font-bold tracking-widest uppercase">{group.label}</p>
              {group.description ? (
                <p className="text-muted-foreground/80 mt-0.5 hidden text-[10px] leading-snug md:block">{group.description}</p>
              ) : null}
            </div>
            <div className="flex flex-col gap-0.5">
              {group.items.map(({ href, label, icon }) => {
                const active =
                  href === "/admin/dashboard"
                    ? pathname === "/admin/dashboard" || pathname === "/admin"
                    : pathname === href || pathname.startsWith(`${href}/`);
                return <NavLink key={href} href={href} label={label} icon={icon} active={active} />;
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="text-muted-foreground hidden border-t p-4 text-[11px] leading-relaxed md:block">
        Role-gated via edge proxy · admin layout is separate from traveler chrome.
      </div>
    </aside>
  );
}
