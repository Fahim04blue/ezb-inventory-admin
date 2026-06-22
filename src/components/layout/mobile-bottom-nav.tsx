"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, Boxes, LayoutDashboard, MoreHorizontal, ShoppingBag } from "lucide-react";

import { MobileMoreMenu } from "@/components/layout/mobile-more-menu";
import { cn } from "@/lib/utils";

type DashboardUser = {
  name: string | null;
  email: string;
};

const TABS = [
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
    match: (pathname: string) => pathname === "/dashboard",
  },
  {
    label: "Orders",
    href: "/sales/orders",
    icon: ShoppingBag,
    match: (pathname: string) => pathname.startsWith("/sales/orders"),
  },
  {
    label: "Stock",
    href: "/inventory/stock",
    icon: Boxes,
    match: (pathname: string) =>
      pathname.startsWith("/inventory/stock") ||
      pathname.startsWith("/inventory/stock-check") ||
      pathname.startsWith("/inventory/stock-movements"),
  },
  {
    label: "Reports",
    href: "/finance/reports",
    icon: BarChart3,
    match: (pathname: string) => pathname.startsWith("/finance/reports"),
  },
];

export function MobileBottomNav({ user }: { user: DashboardUser | null }) {
  const pathname = usePathname();
  const [moreOpen, setMoreOpen] = useState(false);
  const primaryRouteActive = TABS.some((tab) => tab.match(pathname));
  const itemClass =
    "flex min-w-0 flex-1 flex-col items-center justify-center gap-1 py-2 text-[10px] font-medium transition-colors";

  return (
    <nav className="fixed inset-x-3 bottom-[calc(0.5rem+env(safe-area-inset-bottom))] z-50 rounded-3xl border border-slate-200/90 bg-[#fffdf8]/95 shadow-[0_12px_36px_rgba(15,23,42,0.18)] backdrop-blur-xl md:hidden">
      <div className="mx-auto flex h-[68px] max-w-lg items-stretch px-2">
        {TABS.map(({ label, href, icon: Icon, match }) => {
          const active = match(pathname);
          return (
            <Link
              aria-current={active ? "page" : undefined}
              className={cn(itemClass, active ? "text-primary" : "text-slate-500")}
              href={href}
              key={href}
            >
              <span className={cn("flex h-8 w-9 items-center justify-center rounded-xl", active && "bg-emerald-50")}>
                <Icon className={cn("h-5 w-5", active && "stroke-[2.5]")} />
              </span>
              <span className="truncate">{label}</span>
            </Link>
          );
        })}

        <MobileMoreMenu
          onOpenChange={setMoreOpen}
          trigger={
            <button
              aria-label="Open more navigation"
              className={cn(
                itemClass,
                moreOpen || !primaryRouteActive ? "text-primary" : "text-slate-500",
              )}
              type="button"
            >
              <span className={cn("flex h-8 w-9 items-center justify-center rounded-xl", (moreOpen || !primaryRouteActive) && "bg-emerald-50")}>
                <MoreHorizontal className="h-5 w-5" />
              </span>
              <span>More</span>
            </button>
          }
          user={user}
        />
      </div>
    </nav>
  );
}
