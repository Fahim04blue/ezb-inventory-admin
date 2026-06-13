"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { LogoutButton } from "@/components/layout/logout-button";
import { NAV_GROUPS } from "@/components/layout/nav-items";
import { cn } from "@/lib/utils";

type DashboardUser = {
  name: string | null;
  email: string;
};

type AppSidebarProps = {
  user: DashboardUser | null;
};

export function AppSidebar({ user }: AppSidebarProps) {
  const pathname = usePathname();

  return (
    <aside className="hidden h-screen w-60 shrink-0 border-r border-border bg-card/95 lg:flex lg:flex-col">
      <div className="border-b border-border px-6 py-6">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">
          Essentials by Zatab
        </p>
        <h1 className="mt-2 text-lg font-semibold tracking-tight">
          Inventory Admin
        </h1>
      </div>

      <nav className="flex-1 space-y-6 overflow-y-auto px-4 py-6">
        {NAV_GROUPS.map((group) => (
          <div key={group.label}>
            <p className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              {group.label}
            </p>
            <div className="space-y-1">
              {group.items.map(({ href, icon: Icon, label, match }) => {
                const active = match(pathname);

                return (
                  <Link
                    key={href}
                    className={cn(
                      "flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-medium transition-colors",
                      active
                        ? "bg-primary !text-white"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground",
                    )}
                    href={href}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{label}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="border-t border-border p-4">
        <div className="rounded-2xl border border-border bg-background/80 p-4">
          <p className="text-sm font-medium">{user?.name || "Authenticated User"}</p>
          <p className="mt-1 truncate text-xs text-muted-foreground">
            {user?.email || "No user email"}
          </p>
          <LogoutButton className="mt-4" />
        </div>
      </div>
    </aside>
  );
}
