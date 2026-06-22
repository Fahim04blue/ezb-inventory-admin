"use client";

import { MobileMoreMenu } from "@/components/layout/mobile-more-menu";

type DashboardUser = {
  name: string | null;
  email: string;
};

type MobileSidebarProps = {
  user: DashboardUser | null;
};

export function MobileSidebar({ user }: MobileSidebarProps) {
  const initial = (user?.name || user?.email || "U").trim().charAt(0).toUpperCase();

  return (
    <MobileMoreMenu
      trigger={
        <button
          aria-label="Open account and navigation menu"
          className="flex h-11 w-11 items-center justify-center rounded-full bg-slate-900 text-sm font-semibold text-white shadow-sm lg:hidden"
          type="button"
        >
          {initial}
        </button>
      }
      user={user}
    />
  );
}
