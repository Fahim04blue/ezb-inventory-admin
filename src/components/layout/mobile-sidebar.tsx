"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";

import { LogoutButton } from "@/components/layout/logout-button";
import { NAV_GROUPS } from "@/components/layout/nav-items";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

type DashboardUser = {
  name: string | null;
  email: string;
};

type MobileSidebarProps = {
  user: DashboardUser | null;
};

export function MobileSidebar({ user }: MobileSidebarProps) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <Sheet onOpenChange={setOpen} open={open}>
      <SheetTrigger asChild>
        <Button className="h-10 w-10 px-0 lg:hidden" variant="outline">
          <Menu className="h-5 w-5" />
        </Button>
      </SheetTrigger>
      <SheetContent className="flex h-full flex-col">
        <div className="flex items-center justify-between border-b border-border px-5 py-5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">
              Essentials by Zatab
            </p>
            <h2 className="mt-2 text-lg font-semibold tracking-tight">
              Inventory Admin
            </h2>
          </div>
          <Button
            className="h-10 w-10 px-0"
            onClick={() => setOpen(false)}
            type="button"
            variant="outline"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        <nav className="flex-1 space-y-6 overflow-y-auto px-4 py-5">
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
                        "flex items-center gap-3 rounded-2xl px-3 py-3 text-sm font-medium transition-colors",
                        active
                          ? "bg-primary !text-white"
                          : "text-muted-foreground hover:bg-muted hover:text-foreground",
                      )}
                      href={href}
                      onClick={() => setOpen(false)}
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
      </SheetContent>
    </Sheet>
  );
}
