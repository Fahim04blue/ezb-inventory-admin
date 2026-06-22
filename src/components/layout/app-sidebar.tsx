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
    <aside className="fixed inset-y-0 left-0 z-30 hidden h-dvh w-64 shrink-0 flex-col border-r border-border bg-card/95 lg:flex">
      <div className="shrink-0 border-b border-border px-5 py-5">
        <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-muted-foreground">
          Essentials by Zatab
        </p>
        <h1 className="mt-1.5 text-base font-semibold tracking-tight">
          Inventory Admin
        </h1>
      </div>

      <nav className="flex-1 space-y-5 overflow-y-auto px-3 py-4 custom-scrollbar">
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
                      "flex h-9 items-center gap-3 rounded-lg px-3 text-[13px] font-medium transition-colors",
                      active
                        ? "bg-primary !text-white"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground",
                    )}
                    href={href}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    <span className="truncate">{label}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="shrink-0 border-t border-border p-3">
        <div className="rounded-lg border border-border bg-background/80 p-3">
          <p className="text-sm font-medium truncate">{user?.name || "Authenticated User"}</p>
          <p className="truncate text-xs text-muted-foreground">
            {user?.email || "No user email"}
          </p>
          <LogoutButton className="mt-3 h-8 w-full text-xs" />
        </div>
      </div>
    </aside>
  );
}
